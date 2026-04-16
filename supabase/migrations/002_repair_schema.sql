-- ============================================================
-- Onsra v1 — Schema repair migration
--
-- Remote state coming in:
--   • uuid-ossp extension: EXISTS
--   • songs table: EXISTS (wrong schema, from old project, no owner_id)
--   • All other Onsra tables: DO NOT EXIST
--
-- Strategy: create ALL tables first, then add ALL policies.
-- This avoids forward-reference errors on cross-table policies.
-- ============================================================

-- ─── 1. Drop ALL old project tables ────────────────────────
-- The old project may have any of these with incompatible schemas.
-- CASCADE removes all dependent objects (indexes, policies, FKs).
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.ai_tone_memory   CASCADE;
DROP TABLE IF EXISTS public.collaborators    CASCADE;
DROP TABLE IF EXISTS public.setlist_songs    CASCADE;
DROP TABLE IF EXISTS public.setlists         CASCADE;
DROP TABLE IF EXISTS public.songs            CASCADE;
DROP TABLE IF EXISTS public.profiles         CASCADE;

-- ─── 2. Create all tables ───────────────────────────────────

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name       TEXT,
  primary_instrument TEXT    NOT NULL DEFAULT 'guitarist',
  instruments        TEXT[]  NOT NULL DEFAULT '{"guitarist"}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Songs
CREATE TABLE public.songs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  artist           TEXT,
  lyrics_raw       TEXT,
  chord_chart_json JSONB,
  key              TEXT,
  bpm              INTEGER CHECK (bpm > 0 AND bpm < 1000),
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setlists
CREATE TABLE IF NOT EXISTS public.setlists (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setlist Songs (join table — depends on songs + setlists)
CREATE TABLE IF NOT EXISTS public.setlist_songs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setlist_id UUID REFERENCES public.setlists(id) ON DELETE CASCADE NOT NULL,
  song_id    UUID REFERENCES public.songs(id)    ON DELETE CASCADE NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setlist_id, song_id)
);

-- Collaborators (depends on setlists)
CREATE TABLE IF NOT EXISTS public.collaborators (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setlist_id   UUID REFERENCES public.setlists(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id)       ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  cursor_color TEXT NOT NULL DEFAULT '#7C6CF7',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setlist_id, user_id)
);

-- AI Tone Memory
CREATE TABLE IF NOT EXISTS public.ai_tone_memory (
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  instrument       TEXT  NOT NULL DEFAULT 'guitarist',
  amp_model        TEXT,
  preferences_json JSONB NOT NULL DEFAULT '{}',
  rejections_json  JSONB NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name      TEXT NOT NULL,
  properties_json JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_songs_owner             ON public.songs(owner_id);
CREATE INDEX IF NOT EXISTS idx_songs_updated           ON public.songs(updated_at);
CREATE INDEX IF NOT EXISTS idx_setlists_owner          ON public.setlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist   ON public.setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_setlist   ON public.collaborators(setlist_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user      ON public.collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_event_date
  ON public.analytics_events(user_id, event_name, created_at);

-- ─── 4. Enable RLS on all tables ────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tone_memory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ─── 5. Policies — profiles ──────────────────────────────────
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── 6. Policies — songs ────────────────────────────────────
CREATE POLICY "Owners can CRUD own songs"
  ON public.songs FOR ALL
  USING (auth.uid() = owner_id);

-- Requires setlist_songs + collaborators (both now exist)
CREATE POLICY "Collaborators can read songs in shared setlists"
  ON public.songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.setlist_songs ss
      JOIN public.collaborators c ON c.setlist_id = ss.setlist_id
      WHERE ss.song_id = songs.id AND c.user_id = auth.uid()
    )
  );

-- ─── 7. Policies — setlists ─────────────────────────────────
CREATE POLICY "Owners can CRUD own setlists"
  ON public.setlists FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Collaborators can read shared setlists"
  ON public.setlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE setlist_id = setlists.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can update shared setlists"
  ON public.setlists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE setlist_id = setlists.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

-- ─── 8. Policies — setlist_songs ────────────────────────────
CREATE POLICY "Owners and editors can manage setlist songs"
  ON public.setlist_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id AND (
        s.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.collaborators
          WHERE setlist_id = s.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- ─── 9. Policies — collaborators ────────────────────────────
CREATE POLICY "Collaborators can read collaborator list"
  ON public.collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE id = setlist_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.collaborators c2
          WHERE c2.setlist_id = setlist_id AND c2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners can manage collaborators"
  ON public.collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE id = setlist_id AND owner_id = auth.uid()
    )
  );

-- ─── 10. Policies — ai_tone_memory & analytics ───────────────
CREATE POLICY "Users can read/write own tone memory"
  ON public.ai_tone_memory FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role only for analytics"
  ON public.analytics_events FOR ALL
  USING (false);

-- ─── 11. Trigger — auto-create profile on signup ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 12. Realtime ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlist_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaborators;

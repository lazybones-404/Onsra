-- =============================================================================
-- Onsra v1 — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── Users ────────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created automatically by trigger below.
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  instrument       TEXT NOT NULL DEFAULT 'guitarist',
  display_name     TEXT,
  analytics_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Songs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.songs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  artist          TEXT NOT NULL DEFAULT '',
  song_key        TEXT NOT NULL DEFAULT 'C',
  mode            TEXT NOT NULL DEFAULT 'major' CHECK (mode IN ('major', 'minor')),
  tuning          TEXT NOT NULL DEFAULT 'standard',
  capo            INTEGER NOT NULL DEFAULT 0,
  tempo           INTEGER CHECK (tempo > 0 AND tempo <= 300),
  time_sig        TEXT NOT NULL DEFAULT '4/4',
  lyrics          TEXT,
  chord_chart     TEXT,
  tone_profile_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_user_id    ON public.songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_updated_at ON public.songs(updated_at);

-- ─── Setlists ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.setlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'New Setlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setlists_user_id ON public.setlists(user_id);

-- ─── Setlist Songs (junction) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.setlist_songs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_id      UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id         UUID NOT NULL REFERENCES public.songs(id)    ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,
  override_tuning TEXT,
  override_tempo  INTEGER CHECK (override_tempo > 0 AND override_tempo <= 300)
);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist ON public.setlist_songs(setlist_id);

-- ─── Tone Profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tone_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Tone',
  instrument    TEXT NOT NULL DEFAULT 'guitarist',
  amp_model     TEXT,
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tone_profiles_user_id ON public.tone_profiles(user_id);

-- ─── Practice Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.practice_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  song_key         TEXT,
  tuning           TEXT,
  streak_count     INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_log_user_id ON public.practice_log(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_log_date    ON public.practice_log(date);

-- ─── AI Tone Memory ───────────────────────────────────────────────────────────
-- One row per user — upserted by the ai-query Edge Function after each session.
CREATE TABLE IF NOT EXISTS public.ai_tone_memory (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument       TEXT NOT NULL DEFAULT 'guitarist',
  amp_model        TEXT,
  preferences_json JSONB NOT NULL DEFAULT '{}',
  rejections_json  JSONB NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Analytics Events (Mixpanel server-side mirror) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name      TEXT NOT NULL,
  properties_json JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_event
  ON public.analytics_events(user_id, event_name, created_at);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_setlists_updated_at
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tone_profiles_updated_at
  BEFORE UPDATE ON public.tone_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ai_tone_memory_updated_at
  BEFORE UPDATE ON public.ai_tone_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- NEW USER TRIGGER
-- Auto-creates a public.users row when auth.users gains a new entry.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- ─── users ────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ─── songs ────────────────────────────────────────────────────────────────────
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_all_own" ON public.songs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── setlists ─────────────────────────────────────────────────────────────────
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setlists_all_own" ON public.setlists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── setlist_songs ────────────────────────────────────────────────────────────
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

-- Access is permitted when the parent setlist belongs to the authenticated user
CREATE POLICY "setlist_songs_all_own" ON public.setlist_songs
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM public.setlists WHERE id = setlist_id
    )
  );

-- ─── tone_profiles ────────────────────────────────────────────────────────────
ALTER TABLE public.tone_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tone_profiles_all_own" ON public.tone_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── practice_log ─────────────────────────────────────────────────────────────
ALTER TABLE public.practice_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice_log_all_own" ON public.practice_log
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ai_tone_memory ───────────────────────────────────────────────────────────
ALTER TABLE public.ai_tone_memory ENABLE ROW LEVEL SECURITY;

-- Users can read their own memory; INSERT/UPDATE is done by Edge Function (service role)
CREATE POLICY "ai_tone_memory_select_own" ON public.ai_tone_memory
  FOR SELECT USING (auth.uid() = user_id);

-- ─── analytics_events ─────────────────────────────────────────────────────────
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events; no SELECT (read via service role in Edge Functions only)
CREATE POLICY "analytics_events_insert_own" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

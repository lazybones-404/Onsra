/**
 * SQLite local database — songs, setlists, tone profiles, practice log.
 *
 * Uses expo-sqlite v15+ async API.
 * All records include `created_at`, `updated_at`, and `synced_at` timestamps.
 * `user_id` is nullable — populated after the user creates an account.
 * Sync strategy: records where `updated_at > synced_at` are pushed to Supabase on reconnect.
 */
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('onsra.db');
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ─── Songs ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS songs (
      id              TEXT PRIMARY KEY,
      user_id         TEXT,
      title           TEXT NOT NULL DEFAULT '',
      artist          TEXT NOT NULL DEFAULT '',
      song_key        TEXT NOT NULL DEFAULT 'C',
      mode            TEXT NOT NULL DEFAULT 'major',
      tuning          TEXT NOT NULL DEFAULT 'standard',
      capo            INTEGER NOT NULL DEFAULT 0,
      tempo           INTEGER,
      time_sig        TEXT NOT NULL DEFAULT '4/4',
      lyrics          TEXT,
      chord_chart     TEXT,
      tone_profile_id TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL,
      synced_at       TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
    CREATE INDEX IF NOT EXISTS idx_songs_updated_at ON songs(updated_at);

    -- ─── Setlists ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS setlists (
      id         TEXT PRIMARY KEY,
      user_id    TEXT,
      name       TEXT NOT NULL DEFAULT 'New Setlist',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_setlists_user_id ON setlists(user_id);

    -- ─── Setlist Songs (junction) ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS setlist_songs (
      id               TEXT PRIMARY KEY,
      setlist_id       TEXT NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
      song_id          TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
      position         INTEGER NOT NULL DEFAULT 0,
      override_tuning  TEXT,
      override_tempo   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist ON setlist_songs(setlist_id);

    -- ─── Tone Profiles ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tone_profiles (
      id            TEXT PRIMARY KEY,
      user_id       TEXT,
      name          TEXT NOT NULL DEFAULT 'My Tone',
      instrument    TEXT NOT NULL DEFAULT 'guitarist',
      amp_model     TEXT,
      settings_json TEXT NOT NULL DEFAULT '{}',
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      synced_at     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tone_profiles_user_id ON tone_profiles(user_id);

    -- ─── Practice Log ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS practice_log (
      id               TEXT PRIMARY KEY,
      user_id          TEXT,
      date             TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      notes            TEXT,
      song_key         TEXT,
      tuning           TEXT,
      streak_count     INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_practice_log_user_id ON practice_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_practice_log_date ON practice_log(date);
  `);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns a RFC 4122 UUID v4 — compatible with Supabase's UUID primary keys. */
export function generateId(): string {
  return Crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

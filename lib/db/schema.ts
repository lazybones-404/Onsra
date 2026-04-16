/**
 * Local SQLite database — offline-first data layer.
 *
 * All musician data (songs, setlists, practice logs) lives here first.
 * Supabase sync happens when the user is signed in and connected.
 */

import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Ensure initializeDatabase() has been called.');
  }
  return _db;
}

export async function initializeDatabase(): Promise<void> {
  if (_db) return;

  _db = await SQLite.openDatabaseAsync('onsra.db', {
    enableChangeListener: true,
  });

  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      lyrics_raw TEXT,
      chord_chart_json TEXT,
      song_key TEXT,
      bpm INTEGER,
      duration_seconds INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS setlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS setlist_songs (
      id TEXT PRIMARY KEY,
      setlist_id TEXT NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
      song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE(setlist_id, song_id)
    );

    CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist ON setlist_songs(setlist_id);
    CREATE INDEX IF NOT EXISTS idx_songs_updated ON songs(updated_at);
    CREATE INDEX IF NOT EXISTS idx_setlists_updated ON setlists(updated_at);
  `);
}

// ─── Song queries ─────────────────────────────────────────────────────────────

export interface LocalSong {
  id: string;
  title: string;
  artist: string | null;
  lyrics_raw: string | null;
  chord_chart_json: string | null;
  song_key: string | null;
  bpm: number | null;
  duration_seconds: number | null;
  created_at: number;
  updated_at: number;
  synced_at: number | null;
}

export async function getAllSongs(): Promise<LocalSong[]> {
  return getDatabase().getAllAsync<LocalSong>('SELECT * FROM songs ORDER BY updated_at DESC');
}

export async function getSong(id: string): Promise<LocalSong | null> {
  return getDatabase().getFirstAsync<LocalSong>('SELECT * FROM songs WHERE id = ?', [id]);
}

export async function upsertSong(song: Omit<LocalSong, 'synced_at'>): Promise<void> {
  await getDatabase().runAsync(
    `INSERT OR REPLACE INTO songs
      (id, title, artist, lyrics_raw, chord_chart_json, song_key, bpm, duration_seconds, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      song.id,
      song.title,
      song.artist,
      song.lyrics_raw,
      song.chord_chart_json,
      song.song_key,
      song.bpm,
      song.duration_seconds,
      song.created_at,
      song.updated_at,
    ]
  );
}

export async function deleteSong(id: string): Promise<void> {
  await getDatabase().runAsync('DELETE FROM songs WHERE id = ?', [id]);
}

// ─── Setlist queries ──────────────────────────────────────────────────────────

export interface LocalSetlist {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  synced_at: number | null;
}

export async function getAllSetlists(): Promise<LocalSetlist[]> {
  return getDatabase().getAllAsync<LocalSetlist>(
    'SELECT * FROM setlists ORDER BY updated_at DESC'
  );
}

export async function upsertSetlist(setlist: Omit<LocalSetlist, 'synced_at'>): Promise<void> {
  await getDatabase().runAsync(
    `INSERT OR REPLACE INTO setlists (id, name, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [setlist.id, setlist.name, setlist.description, setlist.created_at, setlist.updated_at]
  );
}

export async function deleteSetlist(id: string): Promise<void> {
  await getDatabase().runAsync('DELETE FROM setlists WHERE id = ?', [id]);
}

export async function getSetlistSongs(setlistId: string): Promise<LocalSong[]> {
  return getDatabase().getAllAsync<LocalSong>(
    `SELECT s.* FROM songs s
     JOIN setlist_songs ss ON s.id = ss.song_id
     WHERE ss.setlist_id = ?
     ORDER BY ss.position ASC`,
    [setlistId]
  );
}

export async function addSongToSetlist(
  setlistId: string,
  songId: string,
  position: number
): Promise<void> {
  const id = `${setlistId}_${songId}`;
  await getDatabase().runAsync(
    `INSERT OR IGNORE INTO setlist_songs (id, setlist_id, song_id, position, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, setlistId, songId, position, Date.now()]
  );
}

export async function removeSongFromSetlist(setlistId: string, songId: string): Promise<void> {
  await getDatabase().runAsync(
    'DELETE FROM setlist_songs WHERE setlist_id = ? AND song_id = ?',
    [setlistId, songId]
  );
}

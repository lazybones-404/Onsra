import { getDatabase, generateId, nowISO } from '@/lib/storage/database';
import { getSupabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/user-store';

export interface Song {
  id: string;
  user_id: string | null;
  title: string;
  artist: string;
  song_key: string;
  mode: 'major' | 'minor';
  tuning: string;
  capo: number;
  tempo: number | null;
  time_sig: string;
  lyrics: string | null;
  chord_chart: string | null;
  tone_profile_id: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export type SongInsert = Pick<Song, 'title' | 'artist'> & Partial<Omit<Song, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'synced_at'>>;

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDatabase();
  return db.getAllAsync<Song>('SELECT * FROM songs ORDER BY updated_at DESC');
}

export async function getSong(id: string): Promise<Song | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Song>('SELECT * FROM songs WHERE id = ?', [id]);
}

export async function createSong(data: SongInsert): Promise<Song> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();
  const userId = useUserStore.getState().user?.id ?? null;

  await db.runAsync(
    `INSERT INTO songs
       (id, user_id, title, artist, song_key, mode, tuning, capo, tempo, time_sig, lyrics, chord_chart, tone_profile_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId,
    data.title, data.artist,
    data.song_key ?? 'C', data.mode ?? 'major',
    data.tuning ?? 'standard', data.capo ?? 0,
    data.tempo ?? null, data.time_sig ?? '4/4',
    data.lyrics ?? null, data.chord_chart ?? null,
    data.tone_profile_id ?? null,
    now, now,
  );
  return (await getSong(id))!;
}

export async function updateSong(id: string, data: Partial<SongInsert>): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const allowed = ['title', 'artist', 'song_key', 'mode', 'tuning', 'capo', 'tempo', 'time_sig', 'lyrics', 'chord_chart', 'tone_profile_id'] as const;
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] ?? null);
    }
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);
  // @ts-ignore SQLite bind params type mismatch with dynamic arrays
  await db.runAsync(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM songs WHERE id = ?', [id]);
}

export async function syncSongs(): Promise<void> {
  const user = useUserStore.getState().user;
  if (!user) return;
  const db = await getDatabase();
  const unsynced = await db.getAllAsync<Song>(
    'SELECT * FROM songs WHERE synced_at IS NULL OR updated_at > synced_at',
  );
  if (unsynced.length === 0) return;
  const supabase = getSupabase();
  const now = nowISO();
  for (const song of unsynced) {
    // @ts-ignore Supabase type inference resolves to never for complex schemas
    const { error } = await supabase.from('songs').upsert({
      id: song.id, user_id: user.id, title: song.title, artist: song.artist,
      song_key: song.song_key, mode: song.mode, tuning: song.tuning, capo: song.capo,
      tempo: song.tempo, time_sig: song.time_sig, lyrics: song.lyrics,
      chord_chart: song.chord_chart, tone_profile_id: song.tone_profile_id,
    } as never);
    if (!error) {
      await db.runAsync('UPDATE songs SET synced_at = ? WHERE id = ?', [now, song.id]);
    }
  }
}

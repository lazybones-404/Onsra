import { getDatabase, generateId, nowISO } from '@/lib/storage/database';
import { useUserStore } from '@/store/user-store';

export interface Setlist {
  id: string;
  user_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface SetlistEntry {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  override_tuning: string | null;
  override_tempo: number | null;
  title?: string;
  artist?: string;
  song_key?: string;
  tuning?: string;
}

export async function getAllSetlists(): Promise<Setlist[]> {
  const db = await getDatabase();
  return db.getAllAsync<Setlist>('SELECT * FROM setlists ORDER BY updated_at DESC');
}

export async function getSetlist(id: string): Promise<Setlist | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Setlist>('SELECT * FROM setlists WHERE id = ?', [id]);
}

export async function getSetlistEntries(setlistId: string): Promise<SetlistEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<SetlistEntry>(
    `SELECT ss.*, s.title, s.artist, s.song_key, s.tuning
     FROM setlist_songs ss
     LEFT JOIN songs s ON ss.song_id = s.id
     WHERE ss.setlist_id = ?
     ORDER BY ss.position ASC`,
    [setlistId],
  );
}

export async function createSetlist(name: string): Promise<Setlist> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();
  const userId = useUserStore.getState().user?.id ?? null;
  await db.runAsync(
    'INSERT INTO setlists (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, name, now, now],
  );
  return (await getSetlist(id))!;
}

export async function updateSetlistName(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE setlists SET name = ?, updated_at = ? WHERE id = ?', [name, nowISO(), id]);
}

export async function deleteSetlist(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM setlists WHERE id = ?', [id]);
}

export async function addSongToSetlist(setlistId: string, songId: string): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getAllAsync<SetlistEntry>(
    'SELECT * FROM setlist_songs WHERE setlist_id = ?',
    [setlistId],
  );
  const position = existing.length;
  await db.runAsync(
    'INSERT INTO setlist_songs (id, setlist_id, song_id, position) VALUES (?, ?, ?, ?)',
    [generateId(), setlistId, songId, position],
  );
  await db.runAsync('UPDATE setlists SET updated_at = ? WHERE id = ?', [nowISO(), setlistId]);
}

export async function removeSongFromSetlist(entryId: string, setlistId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM setlist_songs WHERE id = ?', [entryId]);
  await reindexSetlist(setlistId);
  await db.runAsync('UPDATE setlists SET updated_at = ? WHERE id = ?', [nowISO(), setlistId]);
}

export async function moveEntryUp(entryId: string, setlistId: string): Promise<void> {
  const db = await getDatabase();
  const entries = await getSetlistEntries(setlistId);
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx <= 0) return;
  await swapPositions(db, entries[idx].id, entries[idx - 1].id);
  await db.runAsync('UPDATE setlists SET updated_at = ? WHERE id = ?', [nowISO(), setlistId]);
}

export async function moveEntryDown(entryId: string, setlistId: string): Promise<void> {
  const db = await getDatabase();
  const entries = await getSetlistEntries(setlistId);
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1 || idx >= entries.length - 1) return;
  await swapPositions(db, entries[idx].id, entries[idx + 1].id);
  await db.runAsync('UPDATE setlists SET updated_at = ? WHERE id = ?', [nowISO(), setlistId]);
}

async function swapPositions(db: Awaited<ReturnType<typeof getDatabase>>, id1: string, id2: string): Promise<void> {
  const a = await db.getFirstAsync<SetlistEntry>('SELECT position FROM setlist_songs WHERE id = ?', [id1]);
  const b = await db.getFirstAsync<SetlistEntry>('SELECT position FROM setlist_songs WHERE id = ?', [id2]);
  if (!a || !b) return;
  await db.runAsync('UPDATE setlist_songs SET position = ? WHERE id = ?', [b.position, id1]);
  await db.runAsync('UPDATE setlist_songs SET position = ? WHERE id = ?', [a.position, id2]);
}

async function reindexSetlist(setlistId: string): Promise<void> {
  const db = await getDatabase();
  const entries = await db.getAllAsync<SetlistEntry>(
    'SELECT id FROM setlist_songs WHERE setlist_id = ? ORDER BY position ASC',
    [setlistId],
  );
  for (let i = 0; i < entries.length; i++) {
    await db.runAsync('UPDATE setlist_songs SET position = ? WHERE id = ?', [i, entries[i].id]);
  }
}

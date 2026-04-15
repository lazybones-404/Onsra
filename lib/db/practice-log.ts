import { getDatabase, generateId, nowISO } from '@/lib/storage/database';
import { useUserStore } from '@/store/user-store';

export interface PracticeLogEntry {
  id: string;
  user_id: string | null;
  date: string;
  duration_minutes: number;
  notes: string | null;
  song_key: string | null;
  tuning: string | null;
  streak_count: number;
  created_at: string;
}

export async function getAllLogEntries(): Promise<PracticeLogEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<PracticeLogEntry>(
    'SELECT * FROM practice_log ORDER BY date DESC',
  );
}

export async function getLogEntry(id: string): Promise<PracticeLogEntry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<PracticeLogEntry>('SELECT * FROM practice_log WHERE id = ?', [id]);
}

export async function createLogEntry(data: {
  date: string;
  duration_minutes: number;
  notes?: string;
  song_key?: string;
  tuning?: string;
}): Promise<PracticeLogEntry> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  const userId = useUserStore.getState().user?.id ?? null;

  const streak = await computeStreak(data.date);

  await db.runAsync(
    `INSERT INTO practice_log
       (id, user_id, date, duration_minutes, notes, song_key, tuning, streak_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data.date, data.duration_minutes, data.notes ?? null,
      data.song_key ?? null, data.tuning ?? null, streak, now],
  );
  return (await getLogEntry(id))!;
}

export async function deleteLogEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM practice_log WHERE id = ?', [id]);
}

export async function getCurrentStreak(): Promise<number> {
  const db = await getDatabase();
  const entries = await db.getAllAsync<PracticeLogEntry>(
    'SELECT date FROM practice_log ORDER BY date DESC',
  );
  if (entries.length === 0) return 0;

  const today = todayString();
  let streak = 0;
  let cursor = new Date(today);

  for (const entry of entries) {
    const entryDate = entry.date.slice(0, 10);
    const cursorStr = cursor.toISOString().slice(0, 10);
    if (entryDate === cursorStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (entryDate < cursorStr) {
      break;
    }
  }
  return streak;
}

async function computeStreak(date: string): Promise<number> {
  const db = await getDatabase();
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  const prev = await db.getFirstAsync<PracticeLogEntry>(
    'SELECT streak_count FROM practice_log WHERE date = ? ORDER BY created_at DESC',
    [yStr],
  );

  return (prev?.streak_count ?? 0) + 1;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

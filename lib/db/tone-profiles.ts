import { getDatabase, generateId, nowISO } from '@/lib/storage/database';
import { getSupabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/user-store';

export interface ToneProfile {
  id: string;
  user_id: string | null;
  name: string;
  instrument: string;
  amp_model: string | null;
  settings_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export async function getAllToneProfiles(): Promise<ToneProfile[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ToneProfile>('SELECT * FROM tone_profiles ORDER BY updated_at DESC');
  return rows.map(parseProfile);
}

export async function getToneProfile(id: string): Promise<ToneProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ToneProfile>('SELECT * FROM tone_profiles WHERE id = ?', [id]);
  return row ? parseProfile(row) : null;
}

export async function createToneProfile(data: {
  name: string;
  instrument: string;
  amp_model?: string;
  settings_json?: Record<string, unknown>;
}): Promise<ToneProfile> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();
  const userId = useUserStore.getState().user?.id ?? null;

  await db.runAsync(
    `INSERT INTO tone_profiles (id, user_id, name, instrument, amp_model, settings_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, data.name, data.instrument, data.amp_model ?? null, JSON.stringify(data.settings_json ?? {}), now, now,
  );

  return (await getToneProfile(id))!;
}

export async function updateToneProfile(
  id: string,
  data: Partial<Pick<ToneProfile, 'name' | 'amp_model' | 'settings_json'>>,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.amp_model !== undefined) { fields.push('amp_model = ?'); values.push(data.amp_model); }
  if (data.settings_json !== undefined) { fields.push('settings_json = ?'); values.push(JSON.stringify(data.settings_json)); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);

  // @ts-ignore SQLite bind params type mismatch with dynamic arrays
  await db.runAsync(`UPDATE tone_profiles SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteToneProfile(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tone_profiles WHERE id = ?', [id]);
}

/** Push unsynced tone profiles to Supabase. */
export async function syncToneProfiles(): Promise<void> {
  const user = useUserStore.getState().user;
  if (!user) return;

  const db = await getDatabase();
  const unsynced = await db.getAllAsync<ToneProfile>(
    'SELECT * FROM tone_profiles WHERE synced_at IS NULL OR updated_at > synced_at',
  );

  if (unsynced.length === 0) return;

  const supabase = getSupabase();
  const now = nowISO();

  for (const profile of unsynced) {
    const row = parseProfile(profile);
    // @ts-ignore Supabase type inference resolves to never for complex schemas
    const { error } = await supabase.from('tone_profiles').upsert({
      id: row.id,
      user_id: user.id,
      name: row.name,
      instrument: row.instrument,
      amp_model: row.amp_model,
      settings_json: row.settings_json,
    } as never);
    if (!error) {
      await db.runAsync('UPDATE tone_profiles SET synced_at = ? WHERE id = ?', [now, row.id]);
    }
  }
}

function parseProfile(row: ToneProfile): ToneProfile {
  return {
    ...row,
    settings_json: typeof row.settings_json === 'string'
      ? JSON.parse(row.settings_json || '{}')
      : (row.settings_json ?? {}),
  };
}

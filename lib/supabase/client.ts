import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Storage } from '@/lib/storage/mmkv';
import type { Database } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient<Database> | null = null;

const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      return Storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      Storage.setString(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      Storage.delete(key);
    } catch {}
  },
};

export function initializeSupabase(): void {
  if (_client) return;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[Supabase] Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
    return;
  }

  _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: mmkvStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.');
  }
  return _client;
}

export function getSupabaseSafe(): SupabaseClient<Database> | null {
  return _client;
}

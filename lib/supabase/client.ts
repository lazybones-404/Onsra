/**
 * Supabase client — lazy initialized after MMKV storage is ready.
 *
 * Auth sessions are persisted to MMKV (encrypted) rather than AsyncStorage.
 * This means sessions survive app restarts and are protected at rest.
 *
 * Initialization order enforced by _layout.tsx:
 *   initializeStorage() → initializeSupabase() → getDatabase()
 *
 * Usage:
 *   import { getSupabase } from '@/lib/supabase/client';
 *   const { data, error } = await getSupabase().auth.signInWithPassword(...)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Storage } from '@/lib/storage/mmkv';
import type { Database } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient<Database> | null = null;

/**
 * MMKV-backed storage adapter for Supabase auth session persistence.
 * Supabase stores the session JWT under its own internal key.
 * We proxy reads/writes through encrypted MMKV.
 */
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

/**
 * Initializes the Supabase client. Must be called after initializeStorage().
 * Idempotent — safe to call multiple times.
 */
export function initializeSupabase(): void {
  if (_client) return;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[Supabase] Missing environment variables. ' +
      'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env'
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

/**
 * Returns the initialized Supabase client.
 * Throws if called before initializeSupabase().
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    throw new Error(
      'Supabase client not initialized. Ensure initializeSupabase() has been called in _layout.tsx.'
    );
  }
  return _client;
}

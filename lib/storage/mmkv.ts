/**
 * MMKV storage singleton — lazy, securely initialized.
 *
 * On first launch a random 128-bit key is generated via expo-crypto
 * and stored in the device keychain via expo-secure-store. Subsequent
 * launches retrieve the same key, ensuring data persists across restarts
 * while remaining unreadable if the device storage is extracted.
 *
 * initializeStorage() MUST be awaited in the app root (_layout.tsx)
 * before any Storage helper is called. The app renders a loading gate
 * until initialization completes.
 *
 * Requires a native build (expo run:ios / expo run:android / eas build).
 * expo-secure-store is not available in Expo Go.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createMMKV, type MMKV } from 'react-native-mmkv';

const SECURE_STORE_KEY = 'onsra_mmkv_enc_key';

// Fallback key: exactly 32 chars → AES-256 (used in dev/CI when SecureStore unavailable)
const FALLBACK_ENC_KEY = 'onsra-v1-fallback-dev-build-2025';

let _storage: MMKV | null = null;

function getStorage(): MMKV {
  if (!_storage) {
    throw new Error(
      'MMKV not initialized. Ensure initializeStorage() has resolved before calling Storage helpers.'
    );
  }
  return _storage;
}

/**
 * Initializes the MMKV instance with a device-specific AES-256 encryption key.
 * Idempotent — safe to call multiple times; only runs once per app lifecycle.
 * Call this at the top of the app root and await before rendering any screens.
 *
 * Key format: UUID with hyphens stripped → 32 hex chars → AES-256.
 * Legacy 36-char keys (full UUID) are normalised automatically.
 */
export async function initializeStorage(): Promise<void> {
  if (_storage) return;

  let encryptionKey: string;

  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) {
      // Normalise legacy 36-char UUID keys (strip hyphens → 32 chars)
      encryptionKey = stored.replace(/-/g, '').substring(0, 32);
    } else {
      // First launch — generate a 32-char device-specific key and persist it
      const newKey = Crypto.randomUUID().replace(/-/g, '');
      await SecureStore.setItemAsync(SECURE_STORE_KEY, newKey);
      encryptionKey = newKey;
    }
  } catch {
    // SecureStore unavailable (development builds on emulator, CI, etc.)
    encryptionKey = FALLBACK_ENC_KEY;
  }

  _storage = createMMKV({ id: 'onsra-prefs', encryptionKey, encryptionType: 'AES-256' });
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const Storage = {
  getString(key: string): string | undefined {
    return getStorage().getString(key);
  },
  setString(key: string, value: string): void {
    getStorage().set(key, value);
  },
  getBoolean(key: string): boolean {
    return getStorage().getBoolean(key) ?? false;
  },
  setBoolean(key: string, value: boolean): void {
    getStorage().set(key, value);
  },
  getNumber(key: string): number | undefined {
    return getStorage().getNumber(key);
  },
  setNumber(key: string, value: number): void {
    getStorage().set(key, value);
  },
  delete(key: string): void {
    getStorage().remove(key);
  },
  clear(): void {
    getStorage().clearAll();
  },
};

// ─── Storage keys (single source of truth) ────────────────────────────────────

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ACTIVE_INSTRUMENT: 'active_instrument',
  REFERENCE_PITCH: 'reference_pitch',
  METRONOME_BPM: 'metronome_bpm',
  TUNER_DISPLAY_MODE: 'tuner_display_mode',
  THEME: 'theme',
  // Analytics & consent
  ANALYTICS_CONSENT_SHOWN: 'analytics_consent_shown',
  ANALYTICS_OPT_IN: 'analytics_opt_in',
  // Notifications
  NOTIFICATION_OPT_IN: 'notification_opt_in',
  // Auth session (used by Supabase MMKV adapter)
  SUPABASE_SESSION: 'supabase_session',
  // Ads
  AD_FREE_TRIAL_START: 'ad_free_trial_start',
  // Account prompt shown once after first tuning session
  ACCOUNT_PROMPT_DISMISSED: 'account_prompt_dismissed',
} as const;

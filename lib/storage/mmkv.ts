/**
 * MMKV storage singleton — lazy, securely initialized.
 *
 * On first launch a random 128-bit key is generated via expo-crypto
 * and stored in the device keychain via expo-secure-store. Subsequent
 * launches retrieve the same key, ensuring data persists across restarts
 * while remaining unreadable if the device storage is extracted.
 *
 * initializeStorage() MUST be awaited in the app root (_layout.tsx)
 * before any Storage helper is called.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createMMKV, type MMKV } from 'react-native-mmkv';

const SECURE_STORE_KEY = 'onsra_mmkv_enc_key';
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

export async function initializeStorage(): Promise<void> {
  if (_storage) return;

  let encryptionKey: string;

  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) {
      encryptionKey = stored.replace(/-/g, '').substring(0, 32);
    } else {
      const newKey = Crypto.randomUUID().replace(/-/g, '');
      await SecureStore.setItemAsync(SECURE_STORE_KEY, newKey);
      encryptionKey = newKey;
    }
  } catch {
    encryptionKey = FALLBACK_ENC_KEY;
  }

  _storage = createMMKV({ id: 'onsra-prefs', encryptionKey, encryptionType: 'AES-256' });
}

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

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  PRIMARY_INSTRUMENT: 'primary_instrument',
  INSTRUMENTS: 'instruments',
  REFERENCE_PITCH: 'reference_pitch',
  METRONOME_BPM: 'metronome_bpm',
  METRONOME_SOUND: 'metronome_sound',
  ANALYTICS_OPT_IN: 'analytics_opt_in',
} as const;

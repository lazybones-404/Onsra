/**
 * User store — account details and sync status.
 * Populated on login via Supabase Auth.
 * When null, the app is running in guest/offline mode.
 */
import { create } from 'zustand';
import { InstrumentId } from '@/constants/instruments';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  analyticsOptIn: boolean;
  /** Matches the `instrument` column in Supabase `users` table. Synced from local MMKV on signup. */
  instrument: InstrumentId;
}

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface UserState {
  user: UserProfile | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  /** Compressed tone memory summary from Supabase (updated after each AI session) */
  toneMemorySummary: string | null;

  // ─── Actions ──────────────────────────────────────────────────
  setUser: (user: UserProfile | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (iso: string) => void;
  setToneMemorySummary: (summary: string) => void;
  signOut: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  syncStatus: 'idle',
  lastSyncedAt: null,
  toneMemorySummary: null,

  setUser: (user) => set({ user }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
  setToneMemorySummary: (summary) => set({ toneMemorySummary: summary }),
  signOut: () =>
    set({ user: null, syncStatus: 'idle', lastSyncedAt: null, toneMemorySummary: null }),
}));

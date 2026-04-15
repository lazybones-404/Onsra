/**
 * Session store — active song / setlist context.
 * Cleared on app close (not persisted).
 * The setlist auto-configures tuning, key, and tone profile per song
 * by writing into this store when the user swipes to a new song.
 */
import { create } from 'zustand';

interface SessionState {
  // ─── Active song context ──────────────────────────────────────
  activeSongId: string | null;
  activeSongKey: string | null;
  activeSongMode: 'major' | 'minor';
  activeTuning: string;
  activeCapo: number;
  activeToneProfileId: string | null;

  // ─── Active setlist context ───────────────────────────────────
  activeSetlistId: string | null;
  activeSetlistPosition: number;

  // ─── Actions ─────────────────────────────────────────────────
  setActiveSong: (songId: string | null) => void;
  setActiveSongKey: (key: string, mode: 'major' | 'minor') => void;
  setActiveTuning: (tuning: string) => void;
  setActiveCapo: (capo: number) => void;
  setActiveToneProfileId: (id: string | null) => void;
  setActiveSetlist: (setlistId: string | null, position?: number) => void;
  advanceSetlistPosition: () => void;
  clearSession: () => void;
}

const DEFAULT_STATE = {
  activeSongId: null,
  activeSongKey: null,
  activeSongMode: 'major' as const,
  activeTuning: 'standard',
  activeCapo: 0,
  activeToneProfileId: null,
  activeSetlistId: null,
  activeSetlistPosition: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...DEFAULT_STATE,

  setActiveSong: (songId) => set({ activeSongId: songId }),
  setActiveSongKey: (key, mode) => set({ activeSongKey: key, activeSongMode: mode }),
  setActiveTuning: (tuning) => set({ activeTuning: tuning }),
  setActiveCapo: (capo) => set({ activeCapo: capo }),
  setActiveToneProfileId: (id) => set({ activeToneProfileId: id }),
  setActiveSetlist: (setlistId, position = 0) =>
    set({ activeSetlistId: setlistId, activeSetlistPosition: position }),
  advanceSetlistPosition: () =>
    set({ activeSetlistPosition: get().activeSetlistPosition + 1 }),
  clearSession: () => set(DEFAULT_STATE),
}));

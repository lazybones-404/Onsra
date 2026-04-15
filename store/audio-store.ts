/**
 * Audio store — high-frequency real-time state.
 * Updates 20–60× per second from native audio modules.
 * Zustand is used here because it handles frequent updates without
 * re-rendering the whole component tree (unlike React Context).
 *
 * NOTE: Pitch detection and metronome scheduling run on the native audio
 * thread. This store only holds the output values sent to the JS thread.
 *
 * User preferences (referencePitch, tunerDisplayMode, bpm) are persisted
 * to MMKV so they survive app restarts. Reads happen at store creation
 * time — after initializeStorage() has resolved in _layout.tsx.
 */
import { create } from 'zustand';

import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

export type TunerDisplayMode = 'needle' | 'strobe';

function loadNumber(key: string, fallback: number): number {
  try {
    return Storage.getNumber(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadString<T extends string>(key: string, fallback: T): T {
  try {
    return (Storage.getString(key) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

interface AudioState {
  // ─── Tuner ──────────────────────────────────────────────────
  /** Current detected frequency in Hz. null = no signal. */
  pitchHz: number | null;
  /** Nearest note name, e.g. 'A', 'C#' */
  noteName: string | null;
  /** Cents deviation from nearest note (-50 to +50) */
  centsOffset: number;
  /** Whether the tuner mic is active */
  tunerActive: boolean;
  /** Current tuner display mode — persisted to MMKV */
  tunerDisplayMode: TunerDisplayMode;
  /** Reference pitch in Hz (default A=440) — persisted to MMKV */
  referencePitch: number;
  /** Whether polyphonic detection is enabled */
  polyphonicMode: boolean;

  // ─── Metronome ───────────────────────────────────────────────
  /** Current BPM — persisted to MMKV (last used BPM restored on next session) */
  bpm: number;
  /** Whether the metronome is running */
  metronomeActive: boolean;
  /** Current beat index within the bar (0-based) */
  currentBeat: number;
  /** Beats per bar (numerator of time signature) */
  beatsPerBar: number;
  /** Note value of one beat (4 = quarter, 8 = eighth, etc.) */
  beatUnit: number;

  // ─── Actions ─────────────────────────────────────────────────
  setPitch: (hz: number | null, note: string | null, cents: number) => void;
  setTunerActive: (active: boolean) => void;
  setTunerDisplayMode: (mode: TunerDisplayMode) => void;
  setReferencePitch: (hz: number) => void;
  setPolyphonicMode: (enabled: boolean) => void;
  setBpm: (bpm: number) => void;
  setMetronomeActive: (active: boolean) => void;
  setCurrentBeat: (beat: number) => void;
  setTimeSignature: (beats: number, unit: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  pitchHz: null,
  noteName: null,
  centsOffset: 0,
  tunerActive: false,
  tunerDisplayMode: loadString<TunerDisplayMode>(STORAGE_KEYS.TUNER_DISPLAY_MODE, 'needle'),
  referencePitch: loadNumber(STORAGE_KEYS.REFERENCE_PITCH, 440),
  polyphonicMode: true,

  bpm: loadNumber(STORAGE_KEYS.METRONOME_BPM, 120),
  metronomeActive: false,
  currentBeat: 0,
  beatsPerBar: 4,
  beatUnit: 4,

  setPitch: (hz, note, cents) => set({ pitchHz: hz, noteName: note, centsOffset: cents }),
  setTunerActive: (active) => set({ tunerActive: active }),

  setTunerDisplayMode: (mode) => {
    try { Storage.setString(STORAGE_KEYS.TUNER_DISPLAY_MODE, mode); } catch {}
    set({ tunerDisplayMode: mode });
  },

  setReferencePitch: (hz) => {
    try { Storage.setNumber(STORAGE_KEYS.REFERENCE_PITCH, hz); } catch {}
    set({ referencePitch: hz });
  },

  setPolyphonicMode: (enabled) => set({ polyphonicMode: enabled }),

  setBpm: (bpm) => {
    try { Storage.setNumber(STORAGE_KEYS.METRONOME_BPM, bpm); } catch {}
    set({ bpm });
  },

  setMetronomeActive: (active) => set({ metronomeActive: active }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setTimeSignature: (beats, unit) => set({ beatsPerBar: beats, beatUnit: unit }),
}));

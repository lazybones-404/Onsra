import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

export type MetronomeSound = 'tick' | 'hihat' | 'kick' | 'rimshot';
export type TimeSignature = '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8';

export interface TempoTrainer {
  enabled: boolean;
  startBpm: number;
  targetBpm: number;
  durationMinutes: number;
  mode: 'increase' | 'decrease';
}

interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  sound: MetronomeSound;
  timeSignature: TimeSignature;
  currentBeat: number;
  tempoTrainer: TempoTrainer;

  setBpm: (bpm: number) => void;
  setPlaying: (playing: boolean) => void;
  setSound: (sound: MetronomeSound) => void;
  setTimeSignature: (sig: TimeSignature) => void;
  setCurrentBeat: (beat: number) => void;
  setTempoTrainer: (trainer: Partial<TempoTrainer>) => void;
  loadFromStorage: () => void;
}

const DEFAULT_BPM = 120;
const DEFAULT_SOUND: MetronomeSound = 'tick';
const DEFAULT_TIME_SIG: TimeSignature = '4/4';

export const useMetronomeStore = create<MetronomeState>((set) => ({
  bpm: DEFAULT_BPM,
  isPlaying: false,
  sound: DEFAULT_SOUND,
  timeSignature: DEFAULT_TIME_SIG,
  currentBeat: 0,
  tempoTrainer: {
    enabled: false,
    startBpm: 80,
    targetBpm: 120,
    durationMinutes: 5,
    mode: 'increase',
  },

  setBpm: (bpm) => {
    const clamped = Math.max(20, Math.min(300, Math.round(bpm)));
    Storage.setNumber(STORAGE_KEYS.METRONOME_BPM, clamped);
    set({ bpm: clamped });
  },

  setPlaying: (playing) => set({ isPlaying: playing, currentBeat: 0 }),

  setSound: (sound) => {
    Storage.setString(STORAGE_KEYS.METRONOME_SOUND, sound);
    set({ sound });
  },

  setTimeSignature: (sig) => set({ timeSignature: sig, currentBeat: 0 }),

  setCurrentBeat: (beat) => set({ currentBeat: beat }),

  setTempoTrainer: (trainer) =>
    set((state) => ({ tempoTrainer: { ...state.tempoTrainer, ...trainer } })),

  loadFromStorage: () => {
    const bpm = Storage.getNumber(STORAGE_KEYS.METRONOME_BPM) ?? DEFAULT_BPM;
    const sound = (Storage.getString(STORAGE_KEYS.METRONOME_SOUND) as MetronomeSound) ?? DEFAULT_SOUND;
    set({ bpm, sound });
  },
}));

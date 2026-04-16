import { create } from 'zustand';

export interface PitchResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  probability: number;
}

interface AudioState {
  micActive: boolean;
  micPermission: boolean;
  pitchResult: PitchResult | null;
  referencePitch: number;

  setMicActive: (active: boolean) => void;
  setMicPermission: (granted: boolean) => void;
  setPitchResult: (result: PitchResult | null) => void;
  setReferencePitch: (hz: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  micActive: false,
  micPermission: false,
  pitchResult: null,
  referencePitch: 440,

  setMicActive: (active) => set({ micActive: active }),
  setMicPermission: (granted) => set({ micPermission: granted }),
  setPitchResult: (result) => set({ pitchResult: result }),
  setReferencePitch: (hz) => set({ referencePitch: hz }),
}));

import { create } from 'zustand';
import type { InstrumentId } from '@/constants/instruments';
import type { Tuning } from '@/constants/tunings';
import { getDefaultTuning } from '@/constants/tunings';
import { useUserStore } from './user-store';

interface InstrumentState {
  activeInstrument: InstrumentId;
  activeTuning: Tuning;
  selectedStringIndex: number;

  setActiveInstrument: (instrument: InstrumentId) => void;
  setActiveTuning: (tuning: Tuning) => void;
  setSelectedStringIndex: (index: number) => void;
}

export const useInstrumentStore = create<InstrumentState>((set, get) => ({
  activeInstrument: useUserStore.getState().primaryInstrument,
  activeTuning: getDefaultTuning(useUserStore.getState().primaryInstrument),
  selectedStringIndex: 0,

  setActiveInstrument: (instrument) => {
    set({
      activeInstrument: instrument,
      activeTuning: getDefaultTuning(instrument),
      selectedStringIndex: 0,
    });
  },

  setActiveTuning: (tuning) => set({ activeTuning: tuning }),

  setSelectedStringIndex: (index) => set({ selectedStringIndex: index }),
}));

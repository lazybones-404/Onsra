/**
 * Instrument store — persisted to MMKV.
 * Tracks which instrument the user selected during onboarding.
 * All Pillar 1-3 features read from this to personalise language,
 * diagrams, amp models, and tone advice.
 */
import { create } from 'zustand';
import { DEFAULT_INSTRUMENT, InstrumentId } from '@/constants/instruments';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

interface InstrumentState {
  instrument: InstrumentId;
  setInstrument: (id: InstrumentId) => void;
}

function loadPersistedInstrument(): InstrumentId {
  try {
    return (Storage.getString(STORAGE_KEYS.ACTIVE_INSTRUMENT) as InstrumentId) ?? DEFAULT_INSTRUMENT;
  } catch {
    return DEFAULT_INSTRUMENT;
  }
}

export const useInstrumentStore = create<InstrumentState>((set) => ({
  instrument: loadPersistedInstrument(),

  setInstrument: (id) => {
    try {
      Storage.setString(STORAGE_KEYS.ACTIVE_INSTRUMENT, id);
    } catch {}
    set({ instrument: id });
  },
}));

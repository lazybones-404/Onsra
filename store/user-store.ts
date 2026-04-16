import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';
import { DEFAULT_INSTRUMENT, type InstrumentId } from '@/constants/instruments';

interface UserState {
  isOnboarded: boolean;
  primaryInstrument: InstrumentId;
  instruments: InstrumentId[];

  setOnboarded: (value: boolean) => void;
  setPrimaryInstrument: (instrument: InstrumentId) => void;
  setInstruments: (instruments: InstrumentId[]) => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isOnboarded: false,
  primaryInstrument: DEFAULT_INSTRUMENT,
  instruments: [DEFAULT_INSTRUMENT],

  setOnboarded: (value) => {
    Storage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE, value);
    set({ isOnboarded: value });
  },

  setPrimaryInstrument: (instrument) => {
    Storage.setString(STORAGE_KEYS.PRIMARY_INSTRUMENT, instrument);
    set({ primaryInstrument: instrument });
  },

  setInstruments: (instruments) => {
    Storage.setString(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    set({ instruments });
  },

  loadFromStorage: () => {
    const onboarded = Storage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE);
    const primaryRaw = Storage.getString(STORAGE_KEYS.PRIMARY_INSTRUMENT);
    const instrumentsRaw = Storage.getString(STORAGE_KEYS.INSTRUMENTS);

    const primaryInstrument = (primaryRaw as InstrumentId) ?? DEFAULT_INSTRUMENT;
    let instruments: InstrumentId[] = [primaryInstrument];

    try {
      if (instrumentsRaw) {
        instruments = JSON.parse(instrumentsRaw) as InstrumentId[];
      }
    } catch {}

    set({ isOnboarded: onboarded, primaryInstrument, instruments });
  },
}));

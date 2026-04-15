export type InstrumentId =
  | 'guitarist'
  | 'bassist'
  | 'drummer'
  | 'vocalist'
  | 'keys'
  | 'songwriter'
  | 'producer';

export interface Instrument {
  id: InstrumentId;
  label: string;
  description: string;
  /** SF Symbol name (iOS) */
  iosIcon: string;
  /** Material Icon name (Android / web) */
  androidIcon: string;
}

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitarist',
    label: 'Guitarist',
    description: 'Electric, acoustic, classical & more',
    iosIcon: 'music.note',
    androidIcon: 'music-note',
  },
  {
    id: 'bassist',
    label: 'Bassist',
    description: 'Bass guitar, upright bass',
    iosIcon: 'waveform',
    androidIcon: 'graphic-eq',
  },
  {
    id: 'drummer',
    label: 'Drummer',
    description: 'Kit, cajon, hand percussion',
    iosIcon: 'circle.grid.3x3',
    androidIcon: 'grain',
  },
  {
    id: 'vocalist',
    label: 'Vocalist',
    description: 'Lead & backing vocals',
    iosIcon: 'mic',
    androidIcon: 'mic',
  },
  {
    id: 'keys',
    label: 'Keys',
    description: 'Piano, synth, organ',
    iosIcon: 'pianokeys',
    androidIcon: 'piano',
  },
  {
    id: 'songwriter',
    label: 'Songwriter',
    description: 'Lyrics, chords, composition',
    iosIcon: 'pencil.and.outline',
    androidIcon: 'edit-note',
  },
  {
    id: 'producer',
    label: 'Producer',
    description: 'Beatmaker, samples, stem splitter',
    iosIcon: 'slider.horizontal.3',
    androidIcon: 'tune',
  },
];

export const DEFAULT_INSTRUMENT: InstrumentId = 'guitarist';

export function getInstrument(id: InstrumentId): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}

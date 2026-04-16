export type InstrumentId =
  | 'guitarist'
  | 'bassist'
  | 'drummer'
  | 'vocalist'
  | 'violinist'
  | 'keys';

export interface Instrument {
  id: InstrumentId;
  label: string;
  description: string;
  emoji: string;
  iosIcon: string;
  androidIcon: string;
  tools: ToolId[];
}

export type ToolId =
  | 'tuner'
  | 'chord-id'
  | 'signal-chain-ai'
  | 'key-scale'
  | 'metronome'
  | 'drum-tuner'
  | 'pitch-display';

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitarist',
    label: 'Guitarist',
    description: 'Electric, acoustic & classical guitar',
    emoji: '🎸',
    iosIcon: 'music.note',
    androidIcon: 'music-note',
    tools: ['tuner', 'chord-id', 'signal-chain-ai', 'key-scale'],
  },
  {
    id: 'bassist',
    label: 'Bassist',
    description: 'Bass guitar & upright bass',
    emoji: '🎵',
    iosIcon: 'waveform',
    androidIcon: 'graphic-eq',
    tools: ['tuner'],
  },
  {
    id: 'drummer',
    label: 'Drummer',
    description: 'Kit, cajon & hand percussion',
    emoji: '🥁',
    iosIcon: 'circle.grid.3x3',
    androidIcon: 'grain',
    tools: ['metronome', 'drum-tuner'],
  },
  {
    id: 'vocalist',
    label: 'Vocalist',
    description: 'Lead & backing vocals',
    emoji: '🎤',
    iosIcon: 'mic',
    androidIcon: 'mic',
    tools: ['pitch-display'],
  },
  {
    id: 'violinist',
    label: 'Violinist',
    description: 'Violin, viola & fiddle',
    emoji: '🎻',
    iosIcon: 'music.quarternote.3',
    androidIcon: 'music-note',
    tools: ['tuner'],
  },
  {
    id: 'keys',
    label: 'Keys',
    description: 'Piano, synth & organ',
    emoji: '🎹',
    iosIcon: 'pianokeys',
    androidIcon: 'piano',
    tools: ['tuner'],
  },
];

export const DEFAULT_INSTRUMENT: InstrumentId = 'guitarist';

export function getInstrument(id: InstrumentId): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}

export const TOOL_LABELS: Record<ToolId, string> = {
  tuner: 'Tuner',
  'chord-id': 'Chord ID',
  'signal-chain-ai': 'Signal Chain AI',
  'key-scale': 'Key & Scale',
  metronome: 'Metronome',
  'drum-tuner': 'Drum Tuner',
  'pitch-display': 'Pitch Display',
};

export const TOOL_ICONS: Record<ToolId, string> = {
  tuner: 'tune',
  'chord-id': 'piano',
  'signal-chain-ai': 'chat',
  'key-scale': 'account-tree',
  metronome: 'timer',
  'drum-tuner': 'graphic-eq',
  'pitch-display': 'mic',
};

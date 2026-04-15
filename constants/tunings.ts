import type { InstrumentId } from './instruments';

export interface StringNote {
  note: string;
  octave: number;
  /** Open string frequency in Hz */
  hz: number;
}

export interface Tuning {
  id: string;
  name: string;
  strings: StringNote[];
  instruments: InstrumentId[];
}

function note(n: string, octave: number, hz: number): StringNote {
  return { note: n, octave, hz };
}

export const TUNINGS: Tuning[] = [
  // ─── Guitar ──────────────────────────────────────────────────
  {
    id: 'guitar-standard',
    name: 'Standard (EADGBe)',
    instruments: ['guitarist'],
    strings: [
      note('E', 2, 82.41),
      note('A', 2, 110.0),
      note('D', 3, 146.83),
      note('G', 3, 196.0),
      note('B', 3, 246.94),
      note('E', 4, 329.63),
    ],
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D (DADGBe)',
    instruments: ['guitarist'],
    strings: [
      note('D', 2, 73.42),
      note('A', 2, 110.0),
      note('D', 3, 146.83),
      note('G', 3, 196.0),
      note('B', 3, 246.94),
      note('E', 4, 329.63),
    ],
  },
  {
    id: 'guitar-half-down',
    name: 'Half Step Down (Eb)',
    instruments: ['guitarist'],
    strings: [
      note('Eb', 2, 77.78),
      note('Ab', 2, 103.83),
      note('Db', 3, 138.59),
      note('Gb', 3, 185.0),
      note('Bb', 3, 233.08),
      note('Eb', 4, 311.13),
    ],
  },
  {
    id: 'guitar-whole-down',
    name: 'Full Step Down (D)',
    instruments: ['guitarist'],
    strings: [
      note('D', 2, 73.42),
      note('G', 2, 98.0),
      note('C', 3, 130.81),
      note('F', 3, 174.61),
      note('A', 3, 220.0),
      note('D', 4, 293.66),
    ],
  },
  {
    id: 'guitar-open-g',
    name: 'Open G (DGDGBd)',
    instruments: ['guitarist'],
    strings: [
      note('D', 2, 73.42),
      note('G', 2, 98.0),
      note('D', 3, 146.83),
      note('G', 3, 196.0),
      note('B', 3, 246.94),
      note('D', 4, 293.66),
    ],
  },
  {
    id: 'guitar-open-d',
    name: 'Open D (DADf#Ad)',
    instruments: ['guitarist'],
    strings: [
      note('D', 2, 73.42),
      note('A', 2, 110.0),
      note('D', 3, 146.83),
      note('F#', 3, 185.0),
      note('A', 3, 220.0),
      note('D', 4, 293.66),
    ],
  },
  {
    id: 'guitar-open-e',
    name: 'Open E (EBE G#Be)',
    instruments: ['guitarist'],
    strings: [
      note('E', 2, 82.41),
      note('B', 2, 123.47),
      note('E', 3, 164.81),
      note('G#', 3, 207.65),
      note('B', 3, 246.94),
      note('E', 4, 329.63),
    ],
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD',
    instruments: ['guitarist'],
    strings: [
      note('D', 2, 73.42),
      note('A', 2, 110.0),
      note('D', 3, 146.83),
      note('G', 3, 196.0),
      note('A', 3, 220.0),
      note('D', 4, 293.66),
    ],
  },
  {
    id: 'guitar-drop-c',
    name: 'Drop C (CGCFAd)',
    instruments: ['guitarist'],
    strings: [
      note('C', 2, 65.41),
      note('G', 2, 98.0),
      note('C', 3, 130.81),
      note('F', 3, 174.61),
      note('A', 3, 220.0),
      note('D', 4, 293.66),
    ],
  },
  // ─── Bass ─────────────────────────────────────────────────────
  {
    id: 'bass-standard',
    name: 'Standard (EADG)',
    instruments: ['bassist'],
    strings: [
      note('E', 1, 41.2),
      note('A', 1, 55.0),
      note('D', 2, 73.42),
      note('G', 2, 98.0),
    ],
  },
  {
    id: 'bass-drop-d',
    name: 'Drop D (DADG)',
    instruments: ['bassist'],
    strings: [
      note('D', 1, 36.71),
      note('A', 1, 55.0),
      note('D', 2, 73.42),
      note('G', 2, 98.0),
    ],
  },
  {
    id: 'bass-5string',
    name: '5-String (BEADG)',
    instruments: ['bassist'],
    strings: [
      note('B', 0, 30.87),
      note('E', 1, 41.2),
      note('A', 1, 55.0),
      note('D', 2, 73.42),
      note('G', 2, 98.0),
    ],
  },
  {
    id: 'bass-half-down',
    name: 'Half Step Down (Eb)',
    instruments: ['bassist'],
    strings: [
      note('Eb', 1, 38.89),
      note('Ab', 1, 51.91),
      note('Db', 2, 69.3),
      note('Gb', 2, 92.5),
    ],
  },
  // ─── Vocalist (reference pitches) ─────────────────────────────
  {
    id: 'vocal-reference',
    name: 'Vocal Reference (A=440)',
    instruments: ['vocalist'],
    strings: [
      note('C', 3, 130.81),
      note('D', 3, 146.83),
      note('E', 3, 164.81),
      note('F', 3, 174.61),
      note('G', 3, 196.0),
      note('A', 3, 220.0),
    ],
  },
  // ─── Ukulele (for songwriters) ─────────────────────────────────
  {
    id: 'ukulele-standard',
    name: 'Ukulele Standard (GCEA)',
    instruments: ['songwriter'],
    strings: [
      note('G', 4, 392.0),
      note('C', 4, 261.63),
      note('E', 4, 329.63),
      note('A', 4, 440.0),
    ],
  },
];

export function getTuningsForInstrument(instrument: InstrumentId): Tuning[] {
  const filtered = TUNINGS.filter((t) => t.instruments.includes(instrument));
  return filtered.length > 0 ? filtered : TUNINGS.slice(0, 1);
}

export function getDefaultTuning(instrument: InstrumentId): Tuning {
  return getTuningsForInstrument(instrument)[0];
}

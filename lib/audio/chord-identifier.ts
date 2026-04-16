/**
 * Chord identifier — maps detected pitch to note name, then identifies
 * chord quality from multiple recent detections.
 *
 * Strategy: Collect N pitch readings over a window, extract unique note classes
 * (ignoring octave), then match against known chord templates.
 *
 * Limitation: YIN detects one pitch at a time. Full polyphonic chord detection
 * from a single mic requires FFT-based harmonic analysis. This implementation
 * works best for single-note identification and is most reliable on strummed
 * chords where the root note is prominent.
 */

import { frequencyToNote } from './yin';

export interface ChordResult {
  root: string;
  quality: string;
  name: string;
  confidence: number;
  notes: string[];
}

// Chord templates: root-relative semitone intervals
const CHORD_TEMPLATES: { quality: string; intervals: number[] }[] = [
  { quality: 'major', intervals: [0, 4, 7] },
  { quality: 'minor', intervals: [0, 3, 7] },
  { quality: 'dominant 7th', intervals: [0, 4, 7, 10] },
  { quality: 'major 7th', intervals: [0, 4, 7, 11] },
  { quality: 'minor 7th', intervals: [0, 3, 7, 10] },
  { quality: 'suspended 2nd', intervals: [0, 2, 7] },
  { quality: 'suspended 4th', intervals: [0, 5, 7] },
  { quality: 'diminished', intervals: [0, 3, 6] },
  { quality: 'augmented', intervals: [0, 4, 8] },
  { quality: 'power chord', intervals: [0, 7] },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToSemitone(note: string): number {
  return NOTE_NAMES.indexOf(note);
}

function normalize(note: string): string {
  const flat: Record<string, string> = {
    Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
  };
  return flat[note] ?? note;
}

/** Identify a chord from a set of note names (e.g. ['E', 'G#', 'B']) */
export function identifyChord(notes: string[]): ChordResult | null {
  if (notes.length < 2) return null;

  const normalized = [...new Set(notes.map(normalize))];
  const semitones = normalized.map(noteToSemitone).filter((s) => s >= 0);

  let bestMatch: ChordResult | null = null;
  let bestScore = 0;

  for (const root of semitones) {
    const relativeIntervals = semitones
      .map((s) => ((s - root + 12) % 12))
      .sort((a, b) => a - b);

    for (const template of CHORD_TEMPLATES) {
      const matchCount = template.intervals.filter((i) =>
        relativeIntervals.includes(i)
      ).length;
      const score = matchCount / template.intervals.length;

      if (score > bestScore) {
        bestScore = score;
        const rootName = NOTE_NAMES[root];
        bestMatch = {
          root: rootName,
          quality: template.quality,
          name: `${rootName} ${template.quality === 'major' ? '' : template.quality}`.trim(),
          confidence: score,
          notes: normalized,
        };
      }
    }
  }

  return bestScore >= 0.65 ? bestMatch : null;
}

/** Rolling buffer to collect multiple pitch readings and attempt chord ID */
export class ChordDetector {
  private noteHistory: { note: string; timestamp: number }[] = [];
  private windowMs: number;

  constructor(windowMs = 2000) {
    this.windowMs = windowMs;
  }

  addNote(frequency: number, referencePitch = 440): void {
    const noteInfo = frequencyToNote(frequency, referencePitch);
    const now = Date.now();

    this.noteHistory.push({ note: noteInfo.note, timestamp: now });
    this.noteHistory = this.noteHistory.filter((n) => now - n.timestamp < this.windowMs);
  }

  detect(): ChordResult | null {
    const recentNotes = [...new Set(this.noteHistory.map((n) => n.note))];
    return identifyChord(recentNotes);
  }

  clear(): void {
    this.noteHistory = [];
  }
}

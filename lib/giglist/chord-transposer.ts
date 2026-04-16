/**
 * Chord transposer — shifts all chords in a chord chart by N semitones.
 * Also computes capo position equivalents for guitarists.
 */

import type { ChordChartEntry } from '@/lib/supabase/types';

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_MAP: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
};

function normalizeNote(note: string): string {
  return FLAT_MAP[note] ?? note;
}

/** Parse a chord name into root + suffix (e.g. "Am7" → ["A", "m7"]) */
function parseChord(chord: string): [string, string] | null {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return null;
  return [normalizeNote(match[1]), match[2]];
}

/** Transpose a single chord by N semitones */
function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const [root, suffix] = parsed;
  const idx = CHROMATIC.indexOf(root);
  if (idx < 0) return chord;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx] + suffix;
}

/** Transpose all chords in a chart by N semitones */
export function transposeChart(
  chart: ChordChartEntry[],
  semitones: number
): ChordChartEntry[] {
  return chart.map((entry) => ({
    ...entry,
    chord: entry.chord ? transposeChord(entry.chord, semitones) : null,
  }));
}

/** Transpose a song key string */
export function transposeKey(key: string | null, semitones: number): string | null {
  if (!key) return null;
  const parsed = parseChord(key);
  if (!parsed) return key;
  const [root, suffix] = parsed;
  const idx = CHROMATIC.indexOf(root);
  if (idx < 0) return key;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx] + suffix;
}

/** Calculate the equivalent capo position for a given semitone shift */
export function capoEquivalent(semitones: number): { capo: number; key: string } | null {
  if (semitones <= 0) return null;
  const capo = semitones % 12;
  return {
    capo,
    key: `Play in original key with capo on fret ${capo}`,
  };
}

/** Generate all transposition options (−6 to +6 semitones) */
export function getTransposeOptions(
  currentKey: string | null
): { semitones: number; label: string; capo: number | null }[] {
  return Array.from({ length: 13 }, (_, i) => {
    const semitones = i - 6;
    const newKey = transposeKey(currentKey, semitones);
    const capoInfo = capoEquivalent(semitones);
    return {
      semitones,
      label: semitones === 0 ? `Original (${newKey ?? '?'})` : `${semitones > 0 ? '+' : ''}${semitones} (${newKey ?? '?'})`,
      capo: capoInfo?.capo ?? null,
    };
  });
}

/**
 * Key detector — accumulates detected notes over a session and estimates
 * the most likely musical key using the Krumhansl-Schmuckler key-finding algorithm.
 *
 * This is a statistical approach: the longer you play, the more accurate it gets.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Krumhansl-Kessler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface KeyResult {
  key: string;
  mode: 'major' | 'minor';
  confidence: number;
  diatonicNotes: string[];
  diatonicChords: string[];
}

function correlation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - meanA) * (b[i] - meanB);
    denA += (a[i] - meanA) ** 2;
    denB += (b[i] - meanB) ** 2;
  }
  return num / Math.sqrt(denA * denB) || 0;
}

function rotate<T>(arr: T[], n: number): T[] {
  return [...arr.slice(n), ...arr.slice(0, n)];
}

const DIATONIC_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const MAJOR_CHORD_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const MINOR_CHORD_QUALITIES = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

export class KeyDetector {
  private noteCounts: number[] = new Array(12).fill(0);
  private totalNotes = 0;

  addNote(noteName: string): void {
    const idx = NOTE_NAMES.indexOf(noteName);
    if (idx >= 0) {
      this.noteCounts[idx]++;
      this.totalNotes++;
    }
  }

  detect(): KeyResult | null {
    if (this.totalNotes < 8) return null;

    let bestKey = '';
    let bestMode: 'major' | 'minor' = 'major';
    let bestCorr = -Infinity;

    for (let root = 0; root < 12; root++) {
      const rotatedCounts = rotate(this.noteCounts, root);

      const majorCorr = correlation(rotatedCounts, MAJOR_PROFILE);
      const minorCorr = correlation(rotatedCounts, MINOR_PROFILE);

      if (majorCorr > bestCorr) {
        bestCorr = majorCorr;
        bestKey = NOTE_NAMES[root];
        bestMode = 'major';
      }
      if (minorCorr > bestCorr) {
        bestCorr = minorCorr;
        bestKey = NOTE_NAMES[root];
        bestMode = 'minor';
      }
    }

    if (!bestKey) return null;

    const rootIdx = NOTE_NAMES.indexOf(bestKey);
    const intervals = DIATONIC_INTERVALS[bestMode];
    const qualities = bestMode === 'major' ? MAJOR_CHORD_QUALITIES : MINOR_CHORD_QUALITIES;

    const diatonicNotes = intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]);
    const diatonicChords = diatonicNotes.map((note, i) => {
      const q = qualities[i];
      return q === 'maj' ? note : q === 'min' ? `${note}m` : `${note}°`;
    });

    const maxCorr = 1;
    const confidence = Math.max(0, Math.min(1, (bestCorr + 1) / 2));

    return {
      key: bestKey,
      mode: bestMode,
      confidence,
      diatonicNotes,
      diatonicChords,
    };
  }

  reset(): void {
    this.noteCounts = new Array(12).fill(0);
    this.totalNotes = 0;
  }
}

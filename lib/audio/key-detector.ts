/**
 * Key detection — Krumhansl-Schmuckler algorithm.
 *
 * Accumulates a chroma profile (12-element vector of pitch class energy)
 * from detected frequencies, then correlates it against Krumhansl's
 * major and minor key profiles to find the best matching key.
 */

export type KeyMode = 'major' | 'minor';

export interface KeyResult {
  root: string;
  mode: KeyMode;
  confidence: number;
  /** Scale notes for the detected key */
  scaleNotes: string[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Krumhansl-Schmuckler key profiles (major and minor)
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Major scale intervals (semitones)
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
// Natural minor scale intervals
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export class KeyDetector {
  /** Chroma energy accumulator — one bucket per pitch class (C=0 … B=11) */
  private chroma = new Float32Array(12);
  private totalEnergy = 0;

  /** Feed a detected frequency into the chroma accumulator. */
  addFrequency(hz: number, weight = 1.0): void {
    if (hz <= 0) return;
    const pitchClass = frequencyToPitchClass(hz);
    this.chroma[pitchClass] += weight;
    this.totalEnergy += weight;
  }

  /** Detect the current key from accumulated chroma data. */
  detect(): KeyResult | null {
    if (this.totalEnergy < 10) return null;

    let bestCorr = -Infinity;
    let bestRoot = 0;
    let bestMode: KeyMode = 'major';

    for (let root = 0; root < 12; root++) {
      const majorCorr = correlate(this.chroma, KS_MAJOR, root);
      const minorCorr = correlate(this.chroma, KS_MINOR, root);

      if (majorCorr > bestCorr) {
        bestCorr = majorCorr;
        bestRoot = root;
        bestMode = 'major';
      }
      if (minorCorr > bestCorr) {
        bestCorr = minorCorr;
        bestRoot = root;
        bestMode = 'minor';
      }
    }

    const scaleIntervals = bestMode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
    const scaleNotes = scaleIntervals.map((i) => NOTE_NAMES[(bestRoot + i) % 12]);

    return {
      root: NOTE_NAMES[bestRoot],
      mode: bestMode,
      confidence: Math.min(1, Math.max(0, (bestCorr + 1) / 2)),
      scaleNotes,
    };
  }

  reset(): void {
    this.chroma.fill(0);
    this.totalEnergy = 0;
  }
}

// ─── Chord suggestions ────────────────────────────────────────────────────────

export interface ChordSuggestion {
  degree: string;
  chord: string;
  function: string;
}

export function getDiatonicChords(root: string, mode: KeyMode): ChordSuggestion[] {
  const rootIdx = NOTE_NAMES.indexOf(root as typeof NOTE_NAMES[number]);
  if (rootIdx === -1) return [];

  if (mode === 'major') {
    const degrees = [
      { semis: 0, quality: 'maj', degree: 'I', function: 'Tonic' },
      { semis: 2, quality: 'min', degree: 'ii', function: 'Supertonic' },
      { semis: 4, quality: 'min', degree: 'iii', function: 'Mediant' },
      { semis: 5, quality: 'maj', degree: 'IV', function: 'Subdominant' },
      { semis: 7, quality: 'maj', degree: 'V', function: 'Dominant' },
      { semis: 9, quality: 'min', degree: 'vi', function: 'Submediant' },
      { semis: 11, quality: 'dim', degree: 'vii°', function: 'Leading tone' },
    ];
    return degrees.map((d) => ({
      degree: d.degree,
      chord: `${NOTE_NAMES[(rootIdx + d.semis) % 12]}${d.quality === 'min' ? 'm' : d.quality === 'dim' ? 'dim' : ''}`,
      function: d.function,
    }));
  } else {
    const degrees = [
      { semis: 0, quality: 'min', degree: 'i', function: 'Tonic' },
      { semis: 2, quality: 'dim', degree: 'ii°', function: 'Supertonic' },
      { semis: 3, quality: 'maj', degree: 'III', function: 'Mediant' },
      { semis: 5, quality: 'min', degree: 'iv', function: 'Subdominant' },
      { semis: 7, quality: 'min', degree: 'v', function: 'Dominant' },
      { semis: 8, quality: 'maj', degree: 'VI', function: 'Submediant' },
      { semis: 10, quality: 'maj', degree: 'VII', function: 'Subtonic' },
    ];
    return degrees.map((d) => ({
      degree: d.degree,
      chord: `${NOTE_NAMES[(rootIdx + d.semis) % 12]}${d.quality === 'min' ? 'm' : d.quality === 'dim' ? 'dim' : ''}`,
      function: d.function,
    }));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frequencyToPitchClass(hz: number): number {
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  return ((midi % 12) + 12) % 12;
}

function correlate(chroma: Float32Array, profile: number[], root: number): number {
  const n = 12;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = chroma[(i + root) % n];
    const y = profile[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  return den === 0 ? 0 : num / den;
}

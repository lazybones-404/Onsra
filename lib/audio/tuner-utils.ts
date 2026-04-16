/**
 * Tuner-specific utilities.
 * Works alongside YIN for instrument-specific tuner logic.
 */

import type { StringNote } from '@/constants/tunings';

/** Cents deviation between a detected frequency and a target string frequency */
export function centsFromTarget(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0;
  return Math.round(1200 * Math.log2(detectedHz / targetHz));
}

/** Find the closest string in a tuning to a detected frequency */
export function findClosestString(
  detectedHz: number,
  strings: StringNote[]
): { index: number; cents: number } {
  let bestIndex = 0;
  let bestCents = Infinity;

  strings.forEach((s, i) => {
    const c = Math.abs(centsFromTarget(detectedHz, s.hz));
    if (c < bestCents) {
      bestCents = c;
      bestIndex = i;
    }
  });

  return {
    index: bestIndex,
    cents: centsFromTarget(detectedHz, strings[bestIndex].hz),
  };
}

/** Clamp cents to needle range (-50 to +50) */
export function clampCents(cents: number): number {
  return Math.max(-50, Math.min(50, cents));
}

/** Human-readable tuning status */
export function tuningStatus(cents: number): 'in-tune' | 'sharp' | 'flat' {
  if (Math.abs(cents) <= 5) return 'in-tune';
  return cents > 0 ? 'sharp' : 'flat';
}

export const STATUS_COLORS = {
  'in-tune': '#22C55E',
  sharp: '#EF4444',
  flat: '#3B82F6',
} as const;

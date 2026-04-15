/**
 * Metronome scheduler — lookahead pattern.
 *
 * Runs a setInterval loop every SCHEDULER_INTERVAL_MS milliseconds.
 * For each tick it looks LOOK_AHEAD_MS into the future and schedules
 * any beats that fall in that window via setTimeout.
 *
 * This two-level approach decouples the JS tick from the exact beat
 * time, giving sub-50ms accuracy without native audio clocks.
 *
 * Haptic feedback fires on each beat via expo-haptics.
 * Visual beat callbacks go to the Zustand audio store.
 */

import * as Haptics from 'expo-haptics';

const SCHEDULER_INTERVAL_MS = 25;
const LOOK_AHEAD_MS = 100;

export interface MetronomeConfig {
  bpm: number;
  beatsPerBar: number;
  onBeat: (beatIndex: number) => void;
  accentBeat?: boolean;
}

export class Metronome {
  private config: MetronomeConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private nextBeatTime: number = 0;
  private currentBeat: number = 0;

  constructor(config: MetronomeConfig) {
    this.config = config;
  }

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  updateConfig(config: Partial<MetronomeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    if (this.isRunning) this.stop();
    this.currentBeat = 0;
    this.nextBeatTime = performance.now();
    this.intervalId = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private schedule(): void {
    const now = performance.now();
    const beatDurationMs = (60 / this.config.bpm) * 1000;
    const deadline = now + LOOK_AHEAD_MS;

    while (this.nextBeatTime < deadline) {
      const beat = this.currentBeat;
      const delay = Math.max(0, this.nextBeatTime - now);

      setTimeout(() => this.fireBeat(beat), delay);

      this.currentBeat = (this.currentBeat + 1) % this.config.beatsPerBar;
      this.nextBeatTime += beatDurationMs;
    }
  }

  private fireBeat(beat: number): void {
    this.config.onBeat(beat);

    if (this.config.accentBeat !== false) {
      if (beat === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  }
}

// ─── Tap tempo helper ─────────────────────────────────────────────────────────

const MAX_TAP_HISTORY = 8;
const MAX_TAP_GAP_MS = 3000;

export class TapTempo {
  private taps: number[] = [];

  tap(): number | null {
    const now = performance.now();

    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > MAX_TAP_GAP_MS) {
      this.taps = [];
    }

    this.taps.push(now);
    if (this.taps.length > MAX_TAP_HISTORY) this.taps.shift();
    if (this.taps.length < 2) return null;

    const intervals: number[] = [];
    for (let i = 1; i < this.taps.length; i++) {
      intervals.push(this.taps[i] - this.taps[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60000 / avgInterval);
  }

  reset(): void {
    this.taps = [];
  }
}

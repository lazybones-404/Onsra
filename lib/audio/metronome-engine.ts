/**
 * Metronome engine — precise timing using setInterval with drift correction.
 * Uses expo-av for audio playback + expo-haptics as tactile fallback.
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useMetronomeStore } from '@/store/metronome-store';
import type { MetronomeSound, TimeSignature } from '@/store/metronome-store';

const SOUND_SOURCES: Record<MetronomeSound, number | null> = {
  tick: null,
  hihat: null,
  kick: null,
  rimshot: null,
};

/**
 * NOTE:
 * We intentionally do NOT require bundled audio assets here.
 * Metro requires static require() calls, and missing `.wav` assets would fail bundling.
 * For v1 builds without packaged click samples, we rely on haptics fallback.
 *
 * If/when you add click samples, wire them in via static `require('...')` calls.
 */

const BEATS_PER_SIG: Record<TimeSignature, number> = {
  '2/4': 2, '3/4': 3, '4/4': 4, '5/4': 5, '6/8': 6, '7/8': 7,
};

class MetronomeEngine {
  private clickSound: Audio.Sound | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private beatIndex = 0;
  private currentSound: MetronomeSound | null = null;
  private trainerInterval: ReturnType<typeof setInterval> | null = null;
  private audioAvailable = false;

  async loadSound(sound: MetronomeSound): Promise<void> {
    if (this.currentSound === sound && this.clickSound) return;
    this.currentSound = sound;

    const source = SOUND_SOURCES[sound];
    if (!source) {
      this.audioAvailable = false;
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'E',location:'lib/audio/metronome-engine.ts:loadSound',message:'Metronome sound missing, haptics fallback',data:{sound},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }

    try {
      if (this.clickSound) {
        await this.clickSound.unloadAsync();
        this.clickSound = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const { sound: s } = await Audio.Sound.createAsync(source, {
        shouldPlay: false,
        volume: 0.9,
      });
      this.clickSound = s;
      this.audioAvailable = true;
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'E',location:'lib/audio/metronome-engine.ts:loadSound',message:'Metronome sound loaded',data:{sound},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch {
      this.audioAvailable = false;
    }
  }

  async start(bpm: number, timeSignature: TimeSignature, sound: MetronomeSound): Promise<void> {
    this.stop();
    await this.loadSound(sound);
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'E',location:'lib/audio/metronome-engine.ts:start',message:'Metronome start',data:{bpm,timeSignature,sound,audioAvailable:this.audioAvailable},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const beatsInSig = BEATS_PER_SIG[timeSignature] ?? 4;
    const intervalMs = (60 / bpm) * 1000;
    this.beatIndex = 0;

    const tick = async () => {
      const { setCurrentBeat } = useMetronomeStore.getState();
      setCurrentBeat(this.beatIndex);
      await this.playClick(this.beatIndex === 0);
      this.beatIndex = (this.beatIndex + 1) % beatsInSig;
    };

    await tick();
    this.intervalId = setInterval(tick, intervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.trainerInterval !== null) {
      clearInterval(this.trainerInterval);
      this.trainerInterval = null;
    }
    this.beatIndex = 0;
    useMetronomeStore.getState().setCurrentBeat(0);
  }

  async startTempoTrainer(
    startBpm: number,
    targetBpm: number,
    durationMinutes: number,
    timeSignature: TimeSignature,
    sound: MetronomeSound
  ): Promise<void> {
    const totalMs = durationMinutes * 60 * 1000;
    const updateIntervalMs = 5000;
    const steps = totalMs / updateIntervalMs;
    const bpmDelta = (targetBpm - startBpm) / steps;

    await this.start(startBpm, timeSignature, sound);
    let currentBpm = startBpm;
    const startedAt = Date.now();

    this.trainerInterval = setInterval(() => {
      currentBpm += bpmDelta;
      const clamped = Math.max(20, Math.min(300, Math.round(currentBpm)));
      useMetronomeStore.getState().setBpm(clamped);
      this.updateBpm(clamped, timeSignature);

      if (Date.now() - startedAt >= totalMs) {
        this.stop();
        useMetronomeStore.getState().setPlaying(false);
      }
    }, updateIntervalMs);
  }

  updateBpm(bpm: number, timeSignature: TimeSignature): void {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);

    const beatsInSig = BEATS_PER_SIG[timeSignature] ?? 4;
    const intervalMs = (60 / bpm) * 1000;

    const tick = async () => {
      useMetronomeStore.getState().setCurrentBeat(this.beatIndex);
      await this.playClick(this.beatIndex === 0);
      this.beatIndex = (this.beatIndex + 1) % beatsInSig;
    };

    this.intervalId = setInterval(tick, intervalMs);
  }

  private async playClick(isAccent: boolean): Promise<void> {
    if (this.audioAvailable && this.clickSound) {
      try {
        await this.clickSound.setPositionAsync(0);
        await this.clickSound.setVolumeAsync(isAccent ? 1.0 : 0.7);
        await this.clickSound.playAsync();
      } catch {}
    } else {
      // Haptic fallback
      try {
        await Haptics.impactAsync(
          isAccent
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light
        );
      } catch {}
    }
  }

  async unload(): Promise<void> {
    this.stop();
    try {
      await this.clickSound?.unloadAsync();
      this.clickSound = null;
    } catch {}
  }
}

export const metronomeEngine = new MetronomeEngine();

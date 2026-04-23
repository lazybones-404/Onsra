/**
 * Mic Manager — singleton that owns the microphone audio stream.
 *
 * Runs a continuous record loop (150ms chunks) and publishes pitch
 * results to the Zustand audio store. All practice screens consume
 * pitch data from the store rather than starting their own recordings.
 *
 * Lifecycle:
 *   start()  → called by (tabs)/_layout when Practice tab gains focus
 *   stop()   → called by (tabs)/_layout when Practice tab loses focus
 */

import { Audio } from 'expo-av';
import { detectPitch, decodeWAVtoPCM, frequencyToNote } from './yin';
import { useAudioStore } from '@/store/audio-store';

const CHUNK_DURATION_MS = 150;
const SAMPLE_RATE = 22050;
const MIN_PROBABILITY = 0.7;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: SAMPLE_RATE,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: SAMPLE_RATE,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

class MicManager {
  private active = false;
  private referencePitch = 440;

  setReferencePitch(hz: number): void {
    this.referencePitch = hz;
  }

  async start(): Promise<void> {
    if (this.active) return;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start',message:'Mic permission result',data:{status},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (status !== 'granted') {
        useAudioStore.getState().setMicPermission(false);
        return;
      }

      useAudioStore.getState().setMicPermission(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.active = true;
      useAudioStore.getState().setMicActive(true);
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start',message:'Mic started',data:{chunkMs:CHUNK_DURATION_MS,sampleRate:SAMPLE_RATE},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      void this.recordLoop();
    } catch (err) {
      console.error('[MicManager] start error:', err);
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start.catch',message:'Mic start error',data:{name:(err as any)?.name,message:(err as any)?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
  }

  stop(): void {
    this.active = false;
    useAudioStore.getState().setMicActive(false);
    useAudioStore.getState().setPitchResult(null);
  }

  private async recordLoop(): Promise<void> {
    while (this.active) {
      let recording: Audio.Recording | null = null;
      try {
        recording = new Audio.Recording();
        await recording.prepareToRecordAsync(RECORDING_OPTIONS);
        await recording.startAsync();
        await sleep(CHUNK_DURATION_MS);
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        if (!uri || !this.active) continue;

        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const samples = decodeWAVtoPCM(buffer);

        if (!samples || samples.length < 1024) {
          useAudioStore.getState().setPitchResult(null);
          // #region agent log
          fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'C',location:'lib/audio/mic-manager.ts:recordLoop',message:'PCM decode too small/empty',data:{hasSamples:!!samples,len:samples?.length??0},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          continue;
        }

        const pitch = detectPitch(samples, SAMPLE_RATE);

        if (pitch && pitch.probability >= MIN_PROBABILITY) {
          const noteInfo = frequencyToNote(pitch.frequency, this.referencePitch);
          useAudioStore.getState().setPitchResult({
            frequency: pitch.frequency,
            note: noteInfo.note,
            octave: noteInfo.octave,
            cents: noteInfo.cents,
            probability: pitch.probability,
          });
          // #region agent log
          fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'C',location:'lib/audio/mic-manager.ts:recordLoop',message:'Pitch detected',data:{freq:Math.round(pitch.frequency),prob:Math.round(pitch.probability*100)/100,note:noteInfo.note,oct:noteInfo.octave,cents:Math.round(noteInfo.cents)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        } else {
          useAudioStore.getState().setPitchResult(null);
        }
      } catch {
        useAudioStore.getState().setPitchResult(null);
        await sleep(50);
      } finally {
        try {
          await recording?.stopAndUnloadAsync();
        } catch {}
      }
    }
  }
}

export const micManager = new MicManager();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

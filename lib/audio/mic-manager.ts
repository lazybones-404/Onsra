/**
 * Mic Manager — singleton that owns the microphone audio stream.
 *
 * Uses `react-native-audio-api` to receive real PCM float buffers on both
 * Android and iOS. This avoids Android container/codec issues from file-based
 * recording and makes pitch detection reliable.
 *
 * Lifecycle:
 *   start()  → called by (tabs)/_layout when Practice tab gains focus
 *   stop()   → called by (tabs)/_layout when Practice tab loses focus
 */

import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { detectPitch, frequencyToNote } from './yin';
import { useAudioStore } from '@/store/audio-store';

const SAMPLE_RATE = 22050;
const MIN_PROBABILITY = 0.7;

class MicManager {
  private active = false;
  private referencePitch = 440;
  private recorder: AudioRecorder | null = null;

  setReferencePitch(hz: number): void {
    this.referencePitch = hz;
  }

  async start(): Promise<void> {
    if (this.active) return;

    try {
      const permission = await AudioManager.requestRecordingPermissions();
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'post-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start',message:'Mic permission result (audio-api)',data:{permission},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (permission !== 'Granted') {
        useAudioStore.getState().setMicPermission(false);
        return;
      }

      useAudioStore.getState().setMicPermission(true);

      AudioManager.setAudioSessionOptions({
        iosCategory: 'record',
        iosMode: 'default',
        iosOptions: [],
      });

      const sessionOk = await AudioManager.setAudioSessionActivity(true);
      if (!sessionOk) {
        useAudioStore.getState().setPitchResult(null);
        useAudioStore.getState().setMicActive(false);
        return;
      }

      const recorder = new AudioRecorder();
      this.recorder = recorder;
      recorder.onAudioReady(
        {
          sampleRate: SAMPLE_RATE,
          bufferLength: Math.floor(SAMPLE_RATE * 0.15),
          channelCount: 1,
        },
        ({ buffer, numFrames }) => {
          if (!this.active) return;

          const ch0 = buffer.getChannelData(0);
          if (!ch0 || ch0.length < 1024 || numFrames < 1024) {
            useAudioStore.getState().setPitchResult(null);
            return;
          }

          const pitch = detectPitch(ch0 as unknown as Float32Array, SAMPLE_RATE);
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
            fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'post-fix',hypothesisId:'C',location:'lib/audio/mic-manager.ts:onAudioReady',message:'Pitch detected (audio-api)',data:{freq:Math.round(pitch.frequency),prob:Math.round(pitch.probability*100)/100,note:noteInfo.note,oct:noteInfo.octave,cents:Math.round(noteInfo.cents)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
          } else {
            useAudioStore.getState().setPitchResult(null);
          }
        }
      );

      this.active = true;
      useAudioStore.getState().setMicActive(true);
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'post-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start',message:'Mic started (audio-api)',data:{sampleRate:SAMPLE_RATE},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      const res = recorder.start();
      if (res.status === 'error') {
        useAudioStore.getState().setPitchResult(null);
        useAudioStore.getState().setMicActive(false);
        this.active = false;
        return;
      }
    } catch (err) {
      console.error('[MicManager] start error:', err);
      // #region agent log
      fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'post-fix',hypothesisId:'B',location:'lib/audio/mic-manager.ts:start.catch',message:'Mic start error (audio-api)',data:{name:(err as any)?.name,message:(err as any)?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
  }

  stop(): void {
    this.active = false;
    try {
      this.recorder?.clearOnAudioReady();
      this.recorder?.stop();
    } catch {}
    try {
      void AudioManager.setAudioSessionActivity(false);
    } catch {}
    this.recorder = null;
    useAudioStore.getState().setMicActive(false);
    useAudioStore.getState().setPitchResult(null);
  }
}

export const micManager = new MicManager();

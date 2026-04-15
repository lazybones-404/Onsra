/**
 * Tuner engine — manages the microphone recording loop and pitch detection.
 *
 * Uses expo-av Audio.Recording to capture short PCM WAV chunks,
 * decodes them, and runs YIN pitch detection on each chunk.
 * Results are reported via a callback to the Zustand audio store.
 */

import { Audio } from 'expo-av';

import { detectPitch, decodeWAVtoPCM, frequencyToNote } from './yin';

const CHUNK_DURATION_MS = 150;

export interface TunerResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  probability: number;
}

export type TunerCallback = (result: TunerResult | null) => void;

const IOS_RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 22050,
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

export class TunerEngine {
  private active = false;
  private callback: TunerCallback;
  private referencePitch: number;

  constructor(callback: TunerCallback, referencePitch = 440) {
    this.callback = callback;
    this.referencePitch = referencePitch;
  }

  setReferencePitch(hz: number): void {
    this.referencePitch = hz;
  }

  async start(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.active = true;
      void this.recordLoop();
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.active = false;
  }

  private async recordLoop(): Promise<void> {
    while (this.active) {
      let recording: Audio.Recording | null = null;
      try {
        recording = new Audio.Recording();
        await recording.prepareToRecordAsync(IOS_RECORDING_OPTIONS);
        await recording.startAsync();
        await sleep(CHUNK_DURATION_MS);
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        if (!uri || !this.active) continue;

        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const samples = decodeWAVtoPCM(buffer);

        if (!samples || samples.length < 1024) {
          this.callback(null);
          continue;
        }

        const pitch = detectPitch(samples, 22050);

        if (pitch && pitch.probability > 0.7) {
          const noteInfo = frequencyToNote(pitch.frequency, this.referencePitch);
          this.callback({
            frequency: pitch.frequency,
            note: noteInfo.note,
            octave: noteInfo.octave,
            cents: noteInfo.cents,
            probability: pitch.probability,
          });
        } else {
          this.callback(null);
        }
      } catch {
        this.callback(null);
        await sleep(50);
      } finally {
        try {
          await recording?.stopAndUnloadAsync();
        } catch {}
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

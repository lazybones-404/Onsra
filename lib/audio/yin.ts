/**
 * YIN pitch detection algorithm.
 * Cheveigné & Kawahara (2002) JASA 111(4):1917-1930.
 *
 * Accepts a Float32Array of mono PCM samples and the sample rate.
 * Returns the detected frequency in Hz and a probability score (0–1),
 * or null if no clear pitch is detected.
 */

export interface PitchResult {
  frequency: number;
  probability: number;
}

export interface NoteResult {
  note: string;
  octave: number;
  /** Cents deviation from the nearest equal-temperament note (-50 to +50) */
  cents: number;
  frequency: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// ─── YIN Core ────────────────────────────────────────────────────────────────

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  threshold = 0.1,
): PitchResult | null {
  const halfLen = Math.floor(buffer.length / 2);
  const yinBuffer = new Float32Array(halfLen);

  // Step 2: Difference function
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 3: Cumulative mean normalised difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
  }

  // Step 4: Absolute threshold — find first dip below threshold
  let tau = 2;
  let found = false;
  while (tau < halfLen - 1) {
    if (yinBuffer[tau] < threshold) {
      // Move to local minimum
      while (tau + 1 < halfLen && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      found = true;
      break;
    }
    tau++;
  }

  if (!found || yinBuffer[tau] >= threshold) return null;

  // Step 5: Parabolic interpolation for sub-sample accuracy
  const betterTau = parabolicInterpolation(yinBuffer, tau, halfLen);

  return {
    frequency: sampleRate / betterTau,
    probability: 1 - yinBuffer[tau],
  };
}

function parabolicInterpolation(buf: Float32Array, tau: number, len: number): number {
  if (tau === 0 || tau === len - 1) return tau;
  const s0 = buf[tau - 1];
  const s1 = buf[tau];
  const s2 = buf[tau + 1];
  const denom = 2 * (2 * s1 - s2 - s0);
  if (denom === 0) return tau;
  return tau + (s2 - s0) / denom;
}

// ─── Frequency → Note conversion ─────────────────────────────────────────────

export function frequencyToNote(frequency: number, referencePitch = 440): NoteResult {
  // MIDI note 69 = A4 = 440 Hz
  const midiNote = 12 * Math.log2(frequency / referencePitch) + 69;
  const rounded = Math.round(midiNote);
  const cents = Math.round((midiNote - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    frequency,
  };
}

// ─── WAV PCM decoder (for expo-av recording output) ──────────────────────────

/**
 * Decodes a WAV ArrayBuffer into a normalised Float32Array of mono samples.
 * Handles 16-bit PCM WAV files produced by expo-av.
 */
export function decodeWAVtoPCM(buffer: ArrayBuffer): Float32Array | null {
  try {
    const view = new DataView(buffer);
    if (buffer.byteLength < 44) return null;

    // Parse standard WAV header
    const numChannels = view.getUint16(22, true);
    const bitDepth = view.getUint16(34, true);

    // Locate the 'data' chunk (may not always start at offset 44)
    let offset = 12;
    while (offset + 8 < buffer.byteLength) {
      const id = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
      );
      const chunkSize = view.getUint32(offset + 4, true);
      if (id === 'data') {
        offset += 8;
        break;
      }
      offset += 8 + chunkSize;
    }

    if (offset >= buffer.byteLength) return null;

    const bytesPerSample = bitDepth / 8;
    const totalSamples = Math.floor((buffer.byteLength - offset) / (bytesPerSample * numChannels));
    const mono = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const byteOffset = offset + i * bytesPerSample * numChannels;
      if (bitDepth === 16) {
        mono[i] = view.getInt16(byteOffset, true) / 32768.0;
      } else if (bitDepth === 32) {
        mono[i] = view.getFloat32(byteOffset, true);
      }
    }

    return mono;
  } catch {
    return null;
  }
}

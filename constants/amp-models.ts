import type { InstrumentId } from './instruments';

export interface AmpModel {
  id: string;
  name: string;
  brand: string;
  /** Short characteristic description */
  character: string;
  instruments: InstrumentId[];
}

export const AMP_MODELS: AmpModel[] = [
  // ─── Guitar ──────────────────────────────────────────────────
  { id: 'fender-twin', name: 'Twin Reverb', brand: 'Fender', character: 'Clean, sparkly, American', instruments: ['guitarist'] },
  { id: 'fender-deluxe', name: 'Deluxe Reverb', brand: 'Fender', character: 'Warm clean, gentle breakup', instruments: ['guitarist'] },
  { id: 'marshall-jcm800', name: 'JCM800', brand: 'Marshall', character: 'Punchy British crunch', instruments: ['guitarist'] },
  { id: 'marshall-plexi', name: 'Super Lead Plexi', brand: 'Marshall', character: 'Classic vintage rock', instruments: ['guitarist'] },
  { id: 'vox-ac30', name: 'AC30', brand: 'Vox', character: 'Chime, jangle, British sparkle', instruments: ['guitarist'] },
  { id: 'mesa-dual-rect', name: 'Dual Rectifier', brand: 'Mesa/Boogie', character: 'Thick, modern high-gain', instruments: ['guitarist'] },
  { id: 'orange-rockerverb', name: 'Rockerverb 50', brand: 'Orange', character: 'Mid-forward, warm drive', instruments: ['guitarist'] },
  { id: 'bogner-ecstasy', name: 'Ecstasy', brand: 'Bogner', character: 'Touch-sensitive, boutique', instruments: ['guitarist'] },
  { id: 'friedman-be100', name: 'BE-100', brand: 'Friedman', character: 'Brown sound, tight modern', instruments: ['guitarist'] },
  { id: 'prs-archon', name: 'Archon 50', brand: 'PRS', character: 'Versatile, hi-fi clean & gain', instruments: ['guitarist'] },
  { id: 'helix-modeler', name: 'HX Stomp / Helix', brand: 'Line 6', character: 'Full modeler, any amp sound', instruments: ['guitarist'] },
  { id: 'kemper', name: 'Kemper Profiler', brand: 'Kemper', character: 'Exact profiled amps', instruments: ['guitarist'] },
  // ─── Bass ─────────────────────────────────────────────────────
  { id: 'ampeg-svt4', name: 'SVT-4 Pro', brand: 'Ampeg', character: 'Classic deep low end', instruments: ['bassist'] },
  { id: 'ampeg-b15', name: 'B-15 Portaflex', brand: 'Ampeg', character: 'Warm vintage tube thump', instruments: ['bassist'] },
  { id: 'fender-bassman', name: 'Bassman 100T', brand: 'Fender', character: 'Warm, punchy, vintage', instruments: ['bassist'] },
  { id: 'markbass-lm3', name: 'Little Mark III', brand: 'Markbass', character: 'Transparent, modern', instruments: ['bassist'] },
  { id: 'gk-700rb', name: '700RB-II', brand: 'Gallien-Krueger', character: 'Punchy, growly, hi-fi', instruments: ['bassist'] },
  { id: 'aguilar-db750', name: 'DB 750', brand: 'Aguilar', character: 'Fat, rich, powerful tube', instruments: ['bassist'] },
  { id: 'darkglass-alpha', name: 'Alpha·Omega', brand: 'Darkglass', character: 'Modern metal growl, articulate', instruments: ['bassist'] },
  // ─── Keys / Synth ─────────────────────────────────────────────
  { id: 'rhodes', name: 'Rhodes Mark I', brand: 'Rhodes', character: 'Warm electric piano, bell tone', instruments: ['keys'] },
  { id: 'wurlitzer', name: 'Wurlitzer 200', brand: 'Wurlitzer', character: 'Reedy, honky vintage', instruments: ['keys'] },
  { id: 'hammond-b3', name: 'Hammond B-3', brand: 'Hammond', character: 'Classic organ, Leslie cab', instruments: ['keys'] },
  { id: 'nord-stage', name: 'Nord Stage 4', brand: 'Nord', character: 'Stage-ready, versatile', instruments: ['keys'] },
  { id: 'moog-one', name: 'Moog One', brand: 'Moog', character: 'Rich polyphonic analogue', instruments: ['keys'] },
  { id: 'prophet-6', name: "Prophet-6", brand: 'Sequential', character: 'Warm analogue poly', instruments: ['keys'] },
  { id: 'keys-direct', name: 'Direct / DI', brand: 'Studio', character: 'Clean signal to desk', instruments: ['keys'] },
  // ─── Vocalist ─────────────────────────────────────────────────
  { id: 'sm58', name: 'SM58 Dynamic', brand: 'Shure', character: 'Live workhorse, mid-forward', instruments: ['vocalist'] },
  { id: 'u87', name: 'U87 Condenser', brand: 'Neumann', character: 'Studio standard, full-range', instruments: ['vocalist'] },
  { id: 'blue-yeti', name: 'Yeti / Spark', brand: 'Blue', character: 'Home studio USB', instruments: ['vocalist'] },
  // ─── Producer / Songwriter ────────────────────────────────────
  { id: 'studio-monitors', name: 'Studio Monitors', brand: 'Studio', character: 'Reference monitoring', instruments: ['producer', 'songwriter'] },
  { id: 'headphones', name: 'Headphone Mix', brand: 'Studio', character: 'Closed-back reference', instruments: ['producer', 'songwriter'] },
  { id: 'interface-di', name: 'Audio Interface DI', brand: 'Studio', character: 'Clean capture, neutral', instruments: ['producer', 'songwriter'] },
];

export function getAmpModelsForInstrument(instrument: InstrumentId): AmpModel[] {
  const filtered = AMP_MODELS.filter((m) => m.instruments.includes(instrument));
  return filtered.length > 0 ? filtered : AMP_MODELS.slice(0, 3);
}

export function getDefaultAmpModel(instrument: InstrumentId): AmpModel {
  return getAmpModelsForInstrument(instrument)[0];
}

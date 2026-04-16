/**
 * Analytics — Mixpanel event tracking.
 *
 * Privacy-first: events are only sent if the user has opted in.
 * No PII is tracked. Events capture feature usage for product decisions.
 */

import { Mixpanel } from 'mixpanel-react-native';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

const mixpanel = new Mixpanel(MIXPANEL_TOKEN, /* trackAutomaticEvents */ false);

export async function initializeMixpanel(): Promise<void> {
  if (!MIXPANEL_TOKEN) return;
  try {
    await mixpanel.init();
  } catch {}
}

// Event names
export const EVENTS = {
  // Practice
  TUNER_SESSION_START: 'tuner_session_start',
  CHORD_IDENTIFIED: 'chord_identified',
  SIGNAL_CHAIN_MESSAGE: 'signal_chain_message',
  METRONOME_START: 'metronome_start',
  DRUM_TUNER_AI_REQUEST: 'drum_tuner_ai_request',
  PITCH_DISPLAY_SESSION: 'pitch_display_session',

  // GigList
  SETLIST_CREATED: 'setlist_created',
  SONG_CREATED: 'song_created',
  CHORD_CHART_GENERATED: 'chord_chart_generated',
  COLLAB_SESSION_START: 'collab_session_start',
  SETLIST_TIMER_STARTED: 'setlist_timer_started',
  TRANSPOSE_USED: 'transpose_used',

  // Auth
  SIGNUP: 'signup',
  LOGIN: 'login',

  // Onboarding
  INSTRUMENT_SELECTED: 'instrument_selected',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

type EventName = (typeof EVENTS)[keyof typeof EVENTS];

function isOptedIn(): boolean {
  return Storage.getBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN);
}

export function track(event: EventName, properties?: Record<string, unknown>): void {
  if (!isOptedIn()) return;
  try {
    if (__DEV__) {
      console.log('[Analytics]', event, properties);
      return;
    }
    mixpanel.track(event, properties as Record<string, string> | undefined);
  } catch {}
}

export function setUser(userId: string, traits?: Record<string, unknown>): void {
  if (!isOptedIn()) return;
  try {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.getPeople().set(traits as Record<string, string>);
    }
  } catch {}
}

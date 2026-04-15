/**
 * Analytics — lightweight Mixpanel HTTP API wrapper.
 *
 * Uses Mixpanel's REST ingestion endpoint so no native module is required.
 * All tracking is gated on the user's ANALYTICS_OPT_IN preference and silently
 * no-ops if the token is absent or the network call fails.
 *
 * Usage:
 *   Analytics.track(EVENTS.ONBOARDING_COMPLETE, { instrument: 'guitar' });
 *   Analytics.setUser('user-uuid');
 *   Analytics.optIn(); // call after consent screen confirmation
 */
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const MIXPANEL_URL = 'https://api.mixpanel.com/track';

let _distinctId: string = 'anonymous';

// ─── Typed event catalogue ─────────────────────────────────────────────────

export const EVENTS = {
  // Onboarding
  CONSENT_SHOWN: 'consent_screen_shown',
  CONSENT_OPT_IN: 'consent_opted_in',
  CONSENT_OPT_OUT: 'consent_opted_out',
  INSTRUMENT_SELECTED: 'instrument_selected',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  // Auth
  AUTH_SCREEN_VIEWED: 'auth_screen_viewed',
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_OUT: 'signed_out',
  // Core features (wired in Phase 2+)
  TUNER_OPENED: 'tuner_opened',
  METRONOME_STARTED: 'metronome_started',
  TONE_QUERY_SENT: 'tone_query_sent',
  SONG_SAVED: 'song_saved',
  SETLIST_CREATED: 'setlist_created',
  PRACTICE_LOGGED: 'practice_logged',
  EXPORT_INITIATED: 'export_initiated',
  // Session
  SESSION_START: 'session_start',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ─── Public API ────────────────────────────────────────────────────────────

export const Analytics = {
  /** Call after sign in / sign up so subsequent events are tied to the user. */
  setUser(userId: string): void {
    _distinctId = userId;
  },

  /** Reset to anonymous on sign out. */
  resetUser(): void {
    _distinctId = 'anonymous';
  },

  /** Fire a single event. Silently skips if opted out or token missing. */
  async track(event: EventName, properties?: Record<string, unknown>): Promise<void> {
    if (!MIXPANEL_TOKEN) return;

    try {
      if (!Storage.getBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN)) return;
    } catch {
      return; // MMKV not yet ready
    }

    try {
      const payload = [
        {
          event,
          properties: {
            token: MIXPANEL_TOKEN,
            distinct_id: _distinctId,
            time: Math.floor(Date.now() / 1000),
            ...properties,
          },
        },
      ];

      await fetch(MIXPANEL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Never throw — analytics must not break the app
    }
  },

  /** Persist opt-in and update the MMKV flag. */
  optIn(): void {
    try {
      Storage.setBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN, true);
    } catch {}
  },

  /** Persist opt-out and update the MMKV flag. */
  optOut(): void {
    try {
      Storage.setBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN, false);
    } catch {}
  },

  isOptedIn(): boolean {
    try {
      return Storage.getBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN);
    } catch {
      return false;
    }
  },
};

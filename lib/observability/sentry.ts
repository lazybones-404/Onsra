/**
 * Sentry — crash reporting and performance monitoring.
 * DSN is read from EXPO_PUBLIC_SENTRY_DSN at build time.
 */

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initializeSentry(): void {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    tracesSampleRate: 0.2,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Sentry]', error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (__DEV__) {
    console.log(`[Sentry] (${level}):`, message);
    return;
  }
  Sentry.captureMessage(message, level);
}

export function setUserContext(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null);
}

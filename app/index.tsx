/**
 * Root routing gate.
 *
 * Launch flow:
 *   1. Consent not yet shown  → /consent  (analytics consent screen)
 *   2. Onboarding incomplete  → /onboarding
 *   3. Everything done        → /(tabs)
 */
import { Redirect } from 'expo-router';

import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

export default function RootIndex() {
  let consentShown = false;
  let onboardingComplete = false;

  try {
    consentShown = Storage.getBoolean(STORAGE_KEYS.ANALYTICS_CONSENT_SHOWN);
    onboardingComplete = Storage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE);
  } catch {
    // MMKV not yet available (first render before init guard fires) — show consent
  }

  if (!consentShown) return <Redirect href="/consent" />;
  if (!onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

/**
 * Ads — Google AdMob integration.
 *
 * Banner ad: shown on GigList screen (non-tool screens only).
 * Interstitial: shown on stem splitter (post-v1).
 *
 * Uses react-native-google-mobile-ads (already installed).
 * Ad unit IDs below are test IDs — replace with real ones before publishing.
 */

import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Test IDs for development (replace with real IDs in production)
export const AD_UNIT_IDS = {
  banner: {
    ios: TestIds.BANNER,
    android: TestIds.BANNER,
  },
  interstitial: {
    ios: TestIds.INTERSTITIAL,
    android: TestIds.INTERSTITIAL,
  },
};

export const BANNER_UNIT_ID = Platform.OS === 'ios' ? AD_UNIT_IDS.banner.ios : AD_UNIT_IDS.banner.android;
export const INTERSTITIAL_UNIT_ID = Platform.OS === 'ios' ? AD_UNIT_IDS.interstitial.ios : AD_UNIT_IDS.interstitial.android;

let initialized = false;

export async function initializeAds(): Promise<void> {
  if (initialized) return;
  try {
    await mobileAds().initialize();
    initialized = true;
  } catch (err) {
    console.warn('[Ads] Failed to initialize AdMob:', err);
  }
}

export { BannerAd, BannerAdSize };

// ─── Interstitial helper ─────────────────────────────────────────────────────

let interstitial: InterstitialAd | null = null;

export function loadInterstitial(): void {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
  interstitial.load();
}

export function showInterstitialIfLoaded(): void {
  try {
    if (interstitial?.loaded) {
      interstitial.show();
    }
  } catch {}
}

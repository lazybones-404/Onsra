/**
 * Ads — AdMob app-open ad with a 7-day ad-free trial.
 *
 * On first launch the trial start timestamp is written to MMKV. While the trial
 * is active, showAppOpenAd() returns immediately without showing an ad. After
 * the 7-day window, an app-open ad is loaded and shown on app foreground.
 *
 * Ad unit IDs:
 *   - Development: Google's official test IDs (TestIds.APP_OPEN)
 *   - Production:  Replace the strings below with real IDs from AdMob console
 *                  admob.google.com → Apps → [your app] → Ad units
 *
 * Requires a native build (EAS Build / expo run:ios|android).
 * The module is not available in Expo Go.
 */
import { Platform } from 'react-native';

import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Production ad unit IDs — replace with real values before shipping
const PROD_IOS_APP_OPEN_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
const PROD_ANDROID_APP_OPEN_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

// ─── Trial helpers ─────────────────────────────────────────────────────────

/**
 * Records the trial start timestamp on first call. Idempotent — safe to call
 * on every launch; only the first call sets the value.
 */
export function startAdFreeTrial(): void {
  try {
    if (!Storage.getNumber(STORAGE_KEYS.AD_FREE_TRIAL_START)) {
      Storage.setNumber(STORAGE_KEYS.AD_FREE_TRIAL_START, Date.now());
    }
  } catch {}
}

export function isAdFreeTrialActive(): boolean {
  try {
    const start = Storage.getNumber(STORAGE_KEYS.AD_FREE_TRIAL_START);
    if (!start) return false;
    return Date.now() - start < TRIAL_DURATION_MS;
  } catch {
    return true; // Fail safe — don't show ads if we can't read the flag
  }
}

// ─── AdMob initialisation & display ────────────────────────────────────────

/**
 * Initialises the AdMob SDK.
 * Must be called once during app startup (in _layout.tsx init chain).
 * Safe to call without awaiting — failure is silent.
 */
export async function initializeAds(): Promise<void> {
  try {
    // Dynamic import so the module is tree-shaken if not needed
    const MobileAds = (await import('react-native-google-mobile-ads')).default;
    await MobileAds().initialize();
  } catch {
    // Native module unavailable in Expo Go
  }
}

/**
 * Loads and shows an app-open ad.
 * Skips silently if: trial is active, ad fails to load, or module unavailable.
 */
export async function showAppOpenAd(): Promise<void> {
  if (isAdFreeTrialActive()) return;

  try {
    const { AppOpenAd, TestIds, AdEventType } = await import('react-native-google-mobile-ads');

    const adUnitId = __DEV__
      ? TestIds.APP_OPEN
      : Platform.select({
          ios: PROD_IOS_APP_OPEN_ID,
          android: PROD_ANDROID_APP_OPEN_ID,
          default: TestIds.APP_OPEN,
        })!;

    const ad = AppOpenAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

    await new Promise<void>((resolve, reject) => {
      ad.addAdEventListener(AdEventType.LOADED, () => resolve());
      ad.addAdEventListener(AdEventType.ERROR, reject);
      ad.load();
    });

    await ad.show();
  } catch {
    // Ad failed to load or native module unavailable — continue silently
  }
}

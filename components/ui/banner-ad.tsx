/**
 * BannerAd wrapper — shows an AdMob banner.
 * Renders nothing on error or during development if ads not configured.
 */

import { View } from 'react-native';
import { BannerAd, BannerAdSize, BANNER_UNIT_ID } from '@/lib/ads';
import { colors } from '@/constants/theme';

interface BannerAdViewProps {
  className?: string;
}

export function BannerAdView({ className }: BannerAdViewProps) {
  return (
    <View
      style={{ alignItems: 'center', backgroundColor: colors.background, paddingVertical: 4 }}
    >
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {
          // Silently fail — banner disappears when no ad is loaded
        }}
      />
    </View>
  );
}

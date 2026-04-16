import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '@/store/user-store';
import { useSessionStore } from '@/store/session-store';
import { colors } from '@/constants/theme';

export default function GatePage() {
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const isLoading = useSessionStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!isOnboarded) {
      router.replace('/onboarding' as never);
    } else {
      router.replace('/(tabs)/practice' as never);
    }
  }, [isOnboarded, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

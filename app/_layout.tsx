import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeStorage } from '@/lib/storage/mmkv';
import { initializeSupabase, getSupabaseSafe } from '@/lib/supabase/client';
import { initializeDatabase } from '@/lib/db/schema';
import { initializeAds } from '@/lib/ads';
import { initializeSentry, setUserContext } from '@/lib/observability/sentry';
import { initializeMixpanel } from '@/lib/analytics';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setSession = useSessionStore((s) => s.setSession);
  const setLoading = useSessionStore((s) => s.setLoading);
  const loadFromStorage = useUserStore((s) => s.loadFromStorage);

  useEffect(() => {
    async function bootstrap() {
      try {
        // Sentry first so any bootstrap errors are captured
        initializeSentry();

        await initializeStorage();
        initializeSupabase();
        await initializeDatabase();
        loadFromStorage();

        // Non-critical — don't let ad/analytics init crash the app
        initializeAds().catch(() => {});
        initializeMixpanel().catch(() => {});

        const supabase = getSupabaseSafe();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUserContext(session?.user?.id ?? null);

          supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUserContext(newSession?.user?.id ?? null);
          });
        }
      } catch (err) {
        console.error('[Bootstrap] initialization error:', err);
      } finally {
        setLoading(false);
        setReady(true);
      }
    }

    bootstrap();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

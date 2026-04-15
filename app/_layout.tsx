import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AccountPrompt } from '@/components/account-prompt';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeAds, startAdFreeTrial } from '@/lib/ads';
import { Analytics, EVENTS } from '@/lib/analytics';
import { getDatabase } from '@/lib/storage/database';
import { initializeStorage } from '@/lib/storage/mmkv';
import { loadSession } from '@/lib/supabase/auth';
import { getSupabase, initializeSupabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/user-store';

// Required by expo-auth-session to complete OAuth redirects back to the app
WebBrowser.maybeCompleteAuthSession();

// Initialise Sentry as early as possible.
// Add your DSN to .env as EXPO_PUBLIC_SENTRY_DSN to enable.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableNativeNagger: false,
  });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  // ─── Initialisation chain ────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      // 1. MMKV must come first — everything else reads from it
      await initializeStorage();
      // 2. Supabase client (uses MMKV for session persistence)
      initializeSupabase();
      // 3. SQLite schema
      await getDatabase();
      // 4. Restore any existing auth session
      await loadSession();
      // 5. Ads: record first-launch trial start, init AdMob SDK
      startAdFreeTrial();
      await initializeAds();
      // 6. Analytics: fire session_start (respects opt-in flag)
      Analytics.track(EVENTS.SESSION_START);

      setIsReady(true);
    }

    init().catch(() => {
      // Even on failure let the app render — helpers have their own fallbacks
      setIsReady(true);
    });
  }, []);

  // ─── Auth state listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    let sub: { unsubscribe: () => void } | null = null;
    try {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          useUserStore.getState().signOut();
          Analytics.resetUser();
        }
        // SIGNED_IN / TOKEN_REFRESHED: profile sync is handled by auth.ts functions
      });
      sub = data.subscription;
    } catch {}

    return () => sub?.unsubscribe();
  }, [isReady]);

  // ─── Loading gate ────────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D14', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C6CF7" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Routing gate — checks consent + onboarding status and redirects */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Analytics consent — shown on first launch */}
        <Stack.Screen name="consent" options={{ headerShown: false, animation: 'fade' }} />
        {/* Onboarding — instrument selector */}
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        {/* Auth — sign in / create account */}
        <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
        {/* Main app — 5-tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Song editor — push from Compose tab */}
        <Stack.Screen name="song-editor" options={{ headerShown: false }} />
        {/* Guides — push from More tab */}
        <Stack.Screen name="guide" options={{ headerShown: false }} />
        {/* Parameterised modals — ?type=ai-chat|export|account */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: '' }} />
      </Stack>

      {/* Global account-prompt bottom sheet (triggered by Phase 2 events) */}
      <AccountPrompt />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

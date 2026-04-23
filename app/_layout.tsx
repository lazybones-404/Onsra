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
        // #region agent log
        fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'A',location:'app/_layout.tsx:bootstrap',message:'Bootstrap start',data:{},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'A',location:'app/_layout.tsx:auth.getSession',message:'Supabase session loaded',data:{hasSession:!!session},timestamp:Date.now()})}).catch(()=>{});
          // #endregion

          supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUserContext(newSession?.user?.id ?? null);
          });
        }
      } catch (err) {
        console.error('[Bootstrap] initialization error:', err);
        // #region agent log
        fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'A',location:'app/_layout.tsx:catch',message:'Bootstrap error',data:{name:(err as any)?.name,message:(err as any)?.message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      } finally {
        setLoading(false);
        setReady(true);
        // #region agent log
        fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'A',location:'app/_layout.tsx:finally',message:'Bootstrap done',data:{},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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

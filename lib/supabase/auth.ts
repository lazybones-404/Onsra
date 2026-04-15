/**
 * Supabase auth helpers.
 *
 * Each function:
 *   1. Calls the relevant Supabase auth method.
 *   2. On success, fetches the user row from public.users and syncs it
 *      to the Zustand user-store so the rest of the app can read it.
 *   3. Returns { error: string | null } — never throws.
 *
 * Google Sign In notes:
 *   Enable the Google provider in:
 *   Supabase Dashboard → Authentication → Providers → Google
 *   and add your OAuth client IDs from Google Cloud Console.
 *
 * Apple Sign In notes:
 *   Requires iOS device / TestFlight build and Apple Developer account.
 *   Enable the Apple provider in:
 *   Supabase Dashboard → Authentication → Providers → Apple
 */
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { DEFAULT_INSTRUMENT, type InstrumentId } from '@/constants/instruments';
import { Analytics, EVENTS } from '@/lib/analytics';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';
import { useUserStore, type UserProfile } from '@/store/user-store';
import { getSupabase } from './client';
import type { Database } from './types';

type UsersRow = Database['public']['Tables']['users']['Row'];


export type AuthResult = { error: string | null };

// ─── Internal helpers ──────────────────────────────────────────────────────

/** Fetch the public.users row and push it into the Zustand store. */
async function syncProfileToStore(userId: string, email: string): Promise<void> {
  try {
    // Use select('*') so TypeScript can infer the full row type
    const result = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const data = result.data as UsersRow | null;

    const profile: UserProfile = {
      id: userId,
      email,
      displayName: data?.display_name ?? null,
      analyticsOptIn: data?.analytics_opt_in ?? false,
      instrument: (data?.instrument ?? DEFAULT_INSTRUMENT),
    };

    useUserStore.getState().setUser(profile);
    Analytics.setUser(userId);
  } catch {
    // Non-fatal — store stays null, user can retry
  }
}

/**
 * After sign-up the DB trigger creates the public.users row automatically.
 * We then UPDATE it with the instrument the user chose during onboarding.
 */
async function syncInstrumentToSupabase(userId: string): Promise<void> {
  try {
    const instrument = Storage.getString(STORAGE_KEYS.ACTIVE_INSTRUMENT) as InstrumentId | undefined;
    if (!instrument) return;
    // Supabase v2 TS generics fail to narrow the update type when a column uses
    // a string-literal union (InstrumentId). Runtime behaviour is correct.
    // @ts-ignore
    await getSupabase().from('users').update({ instrument }).eq('id', userId);
  } catch {}
}

// ─── Public auth API ───────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) await syncProfileToStore(data.user.id, data.user.email ?? email);
    Analytics.track(EVENTS.SIGN_IN_COMPLETED, { method: 'email' });
    return { error: null };
  } catch {
    return { error: 'Sign in failed. Check your connection and try again.' };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      // Wait a beat for the DB trigger to create the public.users row
      await new Promise((r) => setTimeout(r, 500));
      await syncInstrumentToSupabase(data.user.id);
      await syncProfileToStore(data.user.id, data.user.email ?? email);
      Analytics.track(EVENTS.SIGN_UP_COMPLETED, { method: 'email' });
    }
    return { error: null };
  } catch {
    return { error: 'Sign up failed. Check your connection and try again.' };
  }
}

export async function signInWithApple(): Promise<AuthResult> {
  if (Platform.OS !== 'ios') return { error: 'Apple Sign In is only available on iOS.' };

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) return { error: 'Apple did not return an identity token.' };

    const { data, error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) return { error: error.message };

    if (data.user) {
      await syncInstrumentToSupabase(data.user.id);
      await syncProfileToStore(data.user.id, data.user.email ?? '');
      Analytics.track(EVENTS.SIGN_IN_COMPLETED, { method: 'apple' });
    }

    return { error: null };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') return { error: null }; // User dismissed
    return { error: 'Apple Sign In failed. Try again.' };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectUri = makeRedirectUri({ scheme: 'onsra' });

    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });

    if (error || !data.url) return { error: error?.message ?? 'Google Sign In failed.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type === 'success' && result.url) {
      const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(result.url);
      if (exchangeError) return { error: exchangeError.message };

      const { data: { user } } = await getSupabase().auth.getUser();
      if (user) {
        await syncInstrumentToSupabase(user.id);
        await syncProfileToStore(user.id, user.email ?? '');
        Analytics.track(EVENTS.SIGN_IN_COMPLETED, { method: 'google' });
      }
    }

    return { error: null };
  } catch {
    return { error: 'Google Sign In failed. Try again.' };
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await getSupabase().auth.signOut();
  } catch {}
  useUserStore.getState().signOut();
  Analytics.resetUser();
  Analytics.track(EVENTS.SIGN_OUT);
}

/**
 * Restores an existing Supabase session from the MMKV storage adapter.
 * Called once on app startup (in _layout.tsx) — silent on failure.
 */
export async function loadSession(): Promise<void> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (session?.user) {
      await syncProfileToStore(session.user.id, session.user.email ?? '');
    }
  } catch {}
}

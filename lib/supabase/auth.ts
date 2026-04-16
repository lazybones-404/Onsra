import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { getSupabase } from './client';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  } catch {
    return { error: 'Sign in failed. Please try again.' };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await getSupabase().auth.signUp({ email, password });
    return { error: error?.message ?? null };
  } catch {
    return { error: 'Sign up failed. Please try again.' };
  }
}

export async function signInWithApple(): Promise<{ error: string | null }> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: 'Apple sign in failed — no identity token.' };
    }

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    return { error: error?.message ?? null };
  } catch (err: unknown) {
    if (err instanceof Error && err.message?.includes('canceled')) {
      return { error: null };
    }
    return { error: 'Apple sign in failed. Please try again.' };
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'onsra' });
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });

    if (error) return { error: error.message };
    if (!data.url) return { error: 'Could not start Google sign in.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type !== 'success') return { error: null };

    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      await getSupabase().auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }

    return { error: null };
  } catch {
    return { error: 'Google sign in failed. Please try again.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    await getSupabase().auth.signOut();
  } catch {}
}

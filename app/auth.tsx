/**
 * Auth screen — Sign in / Create account.
 *
 * Accessible from:
 *   • More tab → "Sign In / Create Account" row
 *   • AccountPrompt component (shown after first tuning session)
 *
 * Provider availability:
 *   • Email/password:  works immediately
 *   • Apple Sign In:   requires iOS device + Apple Developer setup
 *   • Google Sign In:  requires Google provider enabled in Supabase Dashboard
 *                      (Authentication → Providers → Google)
 */
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Analytics, EVENTS } from '@/lib/analytics';
import {
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/supabase/auth';

type Tab = 'signin' | 'signup';

const C = Colors.dark;

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  Analytics.track(EVENTS.AUTH_SCREEN_VIEWED, { tab });

  const handleEmailAuth = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    if (tab === 'signup') Analytics.track(EVENTS.SIGN_UP_STARTED, { method: 'email' });

    const fn = tab === 'signin' ? signInWithEmail : signUpWithEmail;
    const { error: authError } = await fn(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(authError);
    } else {
      router.back();
    }
  };

  const handleApple = async () => {
    setError(null);
    setLoading(true);
    const { error: authError } = await signInWithApple();
    setLoading(false);
    if (authError) setError(authError);
    else router.back();
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    setLoading(false);
    if (authError) setError(authError);
    else router.back();
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.wordmark}>ONSRA</Text>
            <Text style={styles.subtitle}>Save your progress, sync across devices</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, tab === 'signin' && styles.tabActive]}
              onPress={() => switchTab('signin')}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'signin' }}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'signup' && styles.tabActive]}
              onPress={() => switchTab('signup')}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'signup' }}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              returnKeyType="done"
              onSubmitEditing={handleEmailAuth}
              editable={!loading}
            />

            {/* Error */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Primary CTA */}
            <Pressable
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {tab === 'signin' ? 'Sign In →' : 'Create Account →'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialButtons}>
            {Platform.OS === 'ios' && (
              <Pressable
                style={[styles.btnSocial, loading && styles.btnDisabled]}
                onPress={handleApple}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Apple"
              >
                <Text style={styles.socialIcon}></Text>
                <Text style={styles.btnSocialText}>Continue with Apple</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.btnSocial, loading && styles.btnDisabled]}
              onPress={handleGoogle}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.btnSocialText}>Continue with Google</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footerNote}>
            By continuing you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>

          {/* Dismiss */}
          <Pressable style={styles.dismissBtn} onPress={() => router.back()}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
    color: C.accent,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: C.accentMuted,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
  },
  tabTextActive: {
    color: C.accent,
  },
  form: {
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  errorText: {
    color: C.danger,
    fontSize: 13,
    marginTop: 2,
  },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    minHeight: 50,
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  socialButtons: {
    gap: Spacing.sm,
  },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: C.border,
    gap: Spacing.sm,
    minHeight: 50,
  },
  socialIcon: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    width: 22,
    textAlign: 'center',
  },
  btnSocialText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
  footerLink: {
    color: C.accent,
    textDecorationLine: 'underline',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  dismissText: {
    color: C.muted,
    fontSize: 14,
  },
});

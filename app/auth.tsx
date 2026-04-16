import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import { track, EVENTS } from '@/lib/analytics';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error } = mode === 'signin'
      ? await signInWithEmail(email.trim(), password)
      : await signUpWithEmail(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      track(mode === 'signup' ? EVENTS.SIGNUP : EVENTS.LOGIN, { method: 'email' });
      router.replace('/(tabs)/practice' as never);
    }
  }

  async function handleApple() {
    setLoading(true);
    const { error } = await signInWithApple();
    setLoading(false);
    if (error) Alert.alert('Apple Sign In', error);
    else {
      track(EVENTS.LOGIN, { method: 'apple' });
      router.replace('/(tabs)/practice' as never);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) Alert.alert('Google Sign In', error);
    else {
      track(EVENTS.LOGIN, { method: 'google' });
      router.replace('/(tabs)/practice' as never);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
        >
          {/* Header */}
          <View className="mt-16 mb-10">
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
              <Text className="text-accent text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-4xl font-bold text-foreground">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text className="text-muted text-base mt-2">
              {mode === 'signin'
                ? 'Sign in to sync your data across devices'
                : 'Join to unlock band collaboration and cloud sync'}
            </Text>
          </View>

          {/* Mode toggle */}
          <View className="flex-row bg-surface rounded-xl p-1 mb-8">
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                className={[
                  'flex-1 py-2.5 rounded-lg items-center',
                  mode === m ? 'bg-accent' : '',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-semibold',
                    mode === m ? 'text-white' : 'text-muted',
                  ].join(' ')}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email field */}
          <View className="mb-4">
            <Text className="text-muted text-sm font-medium mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={colors.mutedDark}
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
            />
          </View>

          {/* Password field */}
          <View className="mb-6">
            <Text className="text-muted text-sm font-medium mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholderTextColor={colors.mutedDark}
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
            />
          </View>

          <Button
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={handleEmailAuth}
            loading={loading}
            size="lg"
          />

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted text-sm mx-4">or continue with</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Social auth */}
          <View className="gap-3">
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={{ height: 52 }}
                onPress={handleApple}
              />
            )}
            <Button
              title="Continue with Google"
              onPress={handleGoogle}
              variant="secondary"
              size="lg"
            />
          </View>

          {/* Skip */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/practice' as never)}
            className="mt-6 mb-10 items-center py-2"
          >
            <Text className="text-muted text-sm">
              Skip for now — use as guest
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';
import { signOut } from '@/lib/supabase/auth';
import { getInstrument } from '@/constants/instruments';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { TipJarSheet } from '@/components/settings/tip-jar-sheet';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';
import { colors } from '@/constants/theme';

interface SettingsRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, danger }: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center px-4 py-3.5 gap-4"
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? colors.danger : colors.muted}
      />
      <Text className={`flex-1 text-base ${danger ? 'text-danger' : 'text-foreground'}`}>
        {label}
      </Text>
      {value && (
        <Text className="text-muted text-sm mr-1">{value}</Text>
      )}
      {onPress && (
        <MaterialIcons name="chevron-right" size={18} color={colors.mutedDark} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const user = useSessionStore((s) => s.user);
  const { primaryInstrument } = useUserStore();
  const instrument = getInstrument(primaryInstrument);
  const [tipJarVisible, setTipJarVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => Storage.getBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN)
  );

  function toggleAnalytics(value: boolean) {
    Storage.setBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN, value);
    setAnalyticsEnabled(value);
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Text className="text-2xl font-bold text-foreground mt-4 mb-6">Settings</Text>

        {/* Account */}
        <Text className="text-label text-muted mb-2">Account</Text>
        <Card className="mb-5">
          {user ? (
            <>
              <View className="px-4 py-4 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-accent-muted items-center justify-center">
                  <Text className="text-accent font-bold text-base">
                    {(user.email ?? 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{user.email}</Text>
                  <Text className="text-muted text-sm">Signed in</Text>
                </View>
              </View>
              <Divider />
              <SettingsRow icon="logout" label="Sign Out" onPress={handleSignOut} danger />
            </>
          ) : (
            <SettingsRow
              icon="login"
              label="Sign In / Create Account"
              onPress={() => router.push('/auth')}
            />
          )}
        </Card>

        {/* Instrument */}
        <Text className="text-label text-muted mb-2">Instrument</Text>
        <Card className="mb-5">
          <SettingsRow
            icon="music-note"
            label="Primary Instrument"
            value={`${instrument.emoji} ${instrument.label}`}
            onPress={() => router.push('/onboarding')}
          />
        </Card>

        {/* Audio */}
        <Text className="text-label text-muted mb-2">Audio</Text>
        <Card className="mb-5">
          <SettingsRow
            icon="tune"
            label="Reference Pitch"
            value="A = 440 Hz"
            onPress={() => {}}
          />
        </Card>

        {/* Privacy */}
        <Text className="text-label text-muted mb-2">Privacy</Text>
        <Card className="mb-5">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-row items-center px-4 py-3.5 gap-4"
          >
            <MaterialIcons name="analytics" size={20} color={colors.muted} />
            <View className="flex-1">
              <Text className="text-foreground text-base">Usage Analytics</Text>
              <Text className="text-muted text-xs mt-0.5">
                Anonymous feature usage — no PII collected
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={toggleAnalytics}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </TouchableOpacity>
          <Divider />
          <SettingsRow icon="privacy-tip" label="Privacy Policy" onPress={() => {}} />
        </Card>

        {/* App */}
        <Text className="text-label text-muted mb-2">App</Text>
        <Card className="mb-5">
          <SettingsRow icon="info-outline" label="Version" value="1.0.0" />
          <Divider />
          <SettingsRow
            icon="volunteer-activism"
            label="Support Onsra (Tip Jar)"
            onPress={() => setTipJarVisible(true)}
          />
        </Card>
      </ScrollView>

      <TipJarSheet visible={tipJarVisible} onClose={() => setTipJarVisible(false)} />
    </SafeAreaView>
  );
}

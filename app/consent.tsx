/**
 * Analytics consent screen — shown once on first launch before any data is collected.
 * User choice is persisted to MMKV and the Analytics module is configured accordingly.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Analytics, EVENTS } from '@/lib/analytics';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';

const C = Colors.dark;

const WHAT_WE_COLLECT = [
  'Feature usage counts (e.g. "tuner opened")',
  'Crash reports and error traces',
  'App performance metrics',
];

export default function ConsentScreen() {
  Analytics.track(EVENTS.CONSENT_SHOWN);

  const handleChoice = (optIn: boolean) => {
    try {
      Storage.setBoolean(STORAGE_KEYS.ANALYTICS_OPT_IN, optIn);
      Storage.setBoolean(STORAGE_KEYS.ANALYTICS_CONSENT_SHOWN, true);
    } catch {}

    if (optIn) {
      Analytics.optIn();
      Analytics.track(EVENTS.CONSENT_OPT_IN);
    } else {
      Analytics.optOut();
    }

    const onboardingDone = (() => {
      try { return Storage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE); } catch { return false; }
    })();

    router.replace(onboardingDone ? '/(tabs)' : '/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📊</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Help improve Onsra</Text>
        <Text style={styles.body}>
          We'd like to collect anonymous usage data to understand how musicians use Onsra and make
          it better. We never collect personal information, audio recordings, or anything that
          identifies you.
        </Text>

        {/* What we collect */}
        <View style={styles.listCard}>
          <Text style={styles.listHeading}>What we collect</Text>
          {WHAT_WE_COLLECT.map((item) => (
            <View key={item} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItem}>{item}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        <View style={styles.actions}>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => handleChoice(true)}
            accessibilityRole="button"
            accessibilityLabel="Opt in to analytics"
          >
            <Text style={styles.btnPrimaryText}>Yes, help improve Onsra</Text>
          </Pressable>

          <Pressable
            style={styles.btnSecondary}
            onPress={() => handleChoice(false)}
            accessibilityRole="button"
            accessibilityLabel="Decline analytics"
          >
            <Text style={styles.btnSecondaryText}>No thanks</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          You can change this at any time in{' '}
          <Text style={styles.noteAccent}>More → Analytics Opt-Out</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 56,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  listCard: {
    backgroundColor: C.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  listHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: C.icon,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  listRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bullet: {
    color: C.accent,
    fontSize: 15,
    lineHeight: 21,
  },
  listItem: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  btnSecondaryText: {
    color: C.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  noteAccent: {
    color: C.accent,
  },
});

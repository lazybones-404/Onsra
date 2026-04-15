/**
 * Parameterized modal screen.
 *
 * Navigate to this screen with a `type` param to render the correct modal:
 *   router.push('/modal?type=ai-chat')
 *   router.push('/modal?type=export')
 *   router.push('/modal?type=account')
 *
 * Each modal type will be replaced with its full implementation in the
 * relevant build phase (AI chat → Phase 2, export → Phase 4, account → Phase 1).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ModalType = 'ai-chat' | 'export' | 'account';

const MODAL_CONFIG: Record<ModalType, { title: string; subtitle: string }> = {
  'ai-chat': {
    title: 'AI Assistant',
    subtitle: 'Tone advisor · Troubleshooter · Lyric co-writer',
  },
  'export': {
    title: 'Export',
    subtitle: 'Chord charts · Lyric sheets · Setlist PDF · Split sheet',
  },
  'account': {
    title: 'Account',
    subtitle: 'Sign in · Sync · Settings',
  },
};

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const { type } = useLocalSearchParams<{ type: ModalType }>();

  const config = (type && MODAL_CONFIG[type]) ?? {
    title: 'Onsra',
    subtitle: '',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <View style={[styles.handle, { backgroundColor: C.border }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: C.text }]}>{config.title}</Text>
        {config.subtitle ? (
          <Text style={[styles.subtitle, { color: C.muted }]}>{config.subtitle}</Text>
        ) : null}

        <View style={[styles.placeholder, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.placeholderText, { color: C.muted }]}>
            Coming in a future phase
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.closeButton, { backgroundColor: C.card }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Text style={[styles.closeText, { color: C.text }]}>Close</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  placeholder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 14,
  },
  closeButton: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

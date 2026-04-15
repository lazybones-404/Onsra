import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INSTRUMENTS, InstrumentId } from '@/constants/instruments';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';
import { useInstrumentStore } from '@/store/instrument-store';

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<InstrumentId | null>(null);
  const setInstrument = useInstrumentStore((s) => s.setInstrument);

  const handleStart = useCallback(() => {
    if (!selected) return;
    setInstrument(selected);
    try {
      Storage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    } catch {}
    router.replace('/(tabs)');
  }, [selected, setInstrument]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>ONSRA</Text>
        <Text style={styles.tagline}>The musician's suite</Text>
      </View>

      <Text style={styles.question}>What do you play?</Text>

      <FlatList
        data={INSTRUMENTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <Pressable
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.cardIcon}>{INSTRUMENT_EMOJI[item.id]}</Text>
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                {item.description}
              </Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={[styles.buttonText, !selected && styles.buttonTextDisabled]}>
            Get Started →
          </Text>
        </Pressable>
        <Text style={styles.freeLabel}>100% free · No paywall · No account needed yet</Text>
      </View>
    </SafeAreaView>
  );
}

/** Simple emoji stand-ins until custom icons ship. */
const INSTRUMENT_EMOJI: Record<InstrumentId, string> = {
  guitarist: '🎸',
  bassist: '🎵',
  drummer: '🥁',
  vocalist: '🎤',
  keys: '🎹',
  songwriter: '✏️',
  producer: '🎧',
};

const C = Colors.dark;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    color: C.accent,
  },
  tagline: {
    fontSize: 13,
    color: C.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  grid: {
    paddingHorizontal: Spacing.md,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
    gap: 4,
  },
  cardSelected: {
    borderColor: C.accent,
    backgroundColor: C.accentMuted,
  },
  cardIcon: {
    fontSize: 30,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: C.accent,
  },
  cardDescription: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },
  cardDescriptionSelected: {
    color: C.icon,
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  button: {
    backgroundColor: C.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: C.card,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: C.muted,
  },
  freeLabel: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ChordSuggestion } from '@/lib/audio/key-detector';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  chords: ChordSuggestion[];
  onAskAI?: (chord: string) => void;
}

const FUNCTION_COLORS: Record<string, string> = {
  Tonic: '#7C6CF7',
  Dominant: '#E5853A',
  Subdominant: '#3FAA8A',
  Supertonic: '#6B9AE0',
  Mediant: '#C06BB5',
  Submediant: '#5EB56C',
  Subtonic: '#D4874B',
  'Leading tone': '#A85252',
};

export function ChordSuggestionCard({ chords, onAskAI }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: C.muted }]}>DIATONIC CHORDS</Text>
      <View style={styles.grid}>
        {chords.map((chord) => {
          const dotColor = FUNCTION_COLORS[chord.function] ?? C.accent;
          return (
            <Pressable
              key={chord.degree}
              onPress={() => onAskAI?.(chord.chord)}
              style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
            >
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={[styles.degree, { color: C.muted }]}>{chord.degree}</Text>
              <Text style={[styles.chord, { color: C.text }]}>{chord.chord}</Text>
              <Text style={[styles.function_, { color: dotColor }]} numberOfLines={1}>
                {chord.function}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: '13%',
    minWidth: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
    flexGrow: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  degree: {
    fontSize: 10,
    fontWeight: '600',
  },
  chord: {
    fontSize: 14,
    fontWeight: '800',
  },
  function_: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
});

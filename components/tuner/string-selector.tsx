import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { StringNote } from '@/constants/tunings';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  strings: StringNote[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  targetFrequency?: number | null;
}

export function StringSelector({ strings, selectedIndex, onSelect, targetFrequency }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: C.muted }]}>STRING</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Chromatic mode (no string locked) */}
        <Pressable
          onPress={() => onSelect(null)}
          style={[
            styles.chip,
            { backgroundColor: C.surface, borderColor: C.border },
            selectedIndex === null && { borderColor: C.accent, backgroundColor: C.accentMuted },
          ]}
        >
          <Text style={[styles.chipLabel, { color: selectedIndex === null ? C.accent : C.muted }]}>
            CHR
          </Text>
        </Pressable>

        {strings.map((s, i) => {
          const selected = selectedIndex === i;
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(selected ? null : i)}
              style={[
                styles.chip,
                { backgroundColor: C.surface, borderColor: C.border },
                selected && { borderColor: C.accent, backgroundColor: C.accentMuted },
              ]}
            >
              <Text style={[styles.chipNote, { color: selected ? C.accent : C.text }]}>
                {s.note}
              </Text>
              <Text style={[styles.chipOctave, { color: selected ? C.accent : C.muted }]}>
                {s.octave}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedIndex !== null && strings[selectedIndex] && (
        <Text style={[styles.targetHz, { color: C.muted }]}>
          Target: {targetFrequency?.toFixed(1) ?? strings[selectedIndex].hz.toFixed(1)} Hz
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 44,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipNote: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  chipOctave: {
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 11,
  },
  targetHz: {
    fontSize: 12,
  },
});

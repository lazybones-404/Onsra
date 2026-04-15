import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AmpModel } from '@/constants/amp-models';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  ampModels: AmpModel[];
  selectedId: string | null;
  onSelect: (model: AmpModel) => void;
}

export function AmpModelPicker({ ampModels, selectedId, onSelect }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <View>
      <Text style={[styles.sectionLabel, { color: C.muted }]}>AMP / SIGNAL CHAIN</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ampModels.map((model) => {
          const selected = model.id === selectedId;
          return (
            <Pressable
              key={model.id}
              onPress={() => onSelect(model)}
              style={[
                styles.card,
                { backgroundColor: C.surface, borderColor: C.border },
                selected && { borderColor: C.accent, backgroundColor: C.accentMuted },
              ]}
            >
              <Text style={[styles.brand, { color: selected ? C.accent : C.muted }]}>
                {model.brand}
              </Text>
              <Text style={[styles.name, { color: selected ? C.accent : C.text }]} numberOfLines={1}>
                {model.name}
              </Text>
              <Text style={[styles.character, { color: C.muted }]} numberOfLines={2}>
                {model.character}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    width: 140,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  character: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { SetlistEntry } from '@/lib/db/setlists';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  entry: SetlistEntry;
  position: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function SetlistRow({ entry, position, total, onMoveUp, onMoveDown, onRemove }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      {/* Position number */}
      <View style={[styles.posNum, { backgroundColor: C.accentMuted }]}>
        <Text style={[styles.posNumText, { color: C.accent }]}>{position + 1}</Text>
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
          {entry.title ?? 'Unknown Song'}
        </Text>
        <View style={styles.metaRow}>
          {entry.song_key && (
            <Text style={[styles.meta, { color: C.muted }]}>{entry.song_key}</Text>
          )}
          {entry.override_tuning && (
            <Text style={[styles.meta, { color: C.accent }]}>Tuning: {entry.override_tuning}</Text>
          )}
          {entry.override_tempo && (
            <Text style={[styles.meta, { color: C.accent }]}>{entry.override_tempo} BPM</Text>
          )}
        </View>
      </View>

      {/* Reorder + remove */}
      <View style={styles.actions}>
        <Pressable
          onPress={onMoveUp}
          disabled={position === 0}
          style={[styles.arrowBtn, position === 0 && styles.disabled]}
        >
          <Text style={[styles.arrowText, { color: position === 0 ? C.border : C.muted }]}>↑</Text>
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={position === total - 1}
          style={[styles.arrowBtn, position === total - 1 && styles.disabled]}
        >
          <Text style={[styles.arrowText, { color: position === total - 1 ? C.border : C.muted }]}>↓</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Text style={[styles.removeText, { color: C.danger }]}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  posNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
  posNumText: {
    fontSize: 14,
    fontWeight: '800',
  },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowBtn: { padding: Spacing.xs + 2 },
  arrowText: { fontSize: 18, fontWeight: '600' },
  removeBtn: { padding: Spacing.xs + 2 },
  removeText: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.3 },
});

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Tuning } from '@/constants/tunings';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  visible: boolean;
  tunings: Tuning[];
  selectedId: string;
  onSelect: (tuning: Tuning) => void;
  onClose: () => void;
}

export function TuningPicker({ visible, tunings, selectedId, onSelect, onClose }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.handle, { backgroundColor: C.border }]} />
        <Text style={[styles.title, { color: C.text }]}>Select Tuning</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {tunings.map((tuning) => {
            const selected = tuning.id === selectedId;
            return (
              <Pressable
                key={tuning.id}
                onPress={() => { onSelect(tuning); onClose(); }}
                style={[
                  styles.row,
                  { borderBottomColor: C.border },
                  selected && { backgroundColor: C.accentMuted },
                ]}
              >
                <View style={styles.rowContent}>
                  <Text style={[styles.tuningName, { color: selected ? C.accent : C.text }]}>
                    {tuning.name}
                  </Text>
                  <Text style={[styles.tuningStrings, { color: C.muted }]}>
                    {tuning.strings.map((s) => s.note).join('  ')}
                  </Text>
                </View>
                {selected && (
                  <Text style={[styles.checkmark, { color: C.accent }]}>✓</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: C.card }]}
        >
          <Text style={[styles.closeBtnText, { color: C.text }]}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  tuningName: {
    fontSize: 15,
    fontWeight: '600',
  },
  tuningStrings: {
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    margin: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ToneProfile } from '@/lib/db/tone-profiles';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  profile: ToneProfile;
  onLoad: (profile: ToneProfile) => void;
  onDelete: (id: string) => void;
}

export function ToneProfileCard({ profile, onLoad, onDelete }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const handleDelete = () => {
    Alert.alert('Delete Tone Profile', `Delete "${profile.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(profile.id),
      },
    ]);
  };

  const dateStr = new Date(profile.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>{profile.name}</Text>
        {profile.amp_model && (
          <Text style={[styles.amp, { color: C.muted }]} numberOfLines={1}>{profile.amp_model}</Text>
        )}
        <Text style={[styles.date, { color: C.muted }]}>{dateStr}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onLoad(profile)}
          style={[styles.loadBtn, { backgroundColor: C.accentMuted }]}
        >
          <Text style={[styles.loadText, { color: C.accent }]}>Load</Text>
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={[styles.deleteText, { color: C.danger }]}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  amp: {
    fontSize: 12,
  },
  date: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  loadBtn: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  loadText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

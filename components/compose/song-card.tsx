import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Song } from '@/lib/db/songs';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  song: Song;
  onPress: (song: Song) => void;
  onDelete?: (id: string) => void;
}

export function SongCard({ song, onPress, onDelete }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const updated = new Date(song.updated_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Pressable
      onPress={() => onPress(song)}
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{song.title || 'Untitled'}</Text>
          {song.capo > 0 && (
            <View style={[styles.badge, { backgroundColor: C.accentMuted }]}>
              <Text style={[styles.badgeText, { color: C.accent }]}>Capo {song.capo}</Text>
            </View>
          )}
        </View>
        {song.artist ? (
          <Text style={[styles.artist, { color: C.muted }]} numberOfLines={1}>{song.artist}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: C.accent }]}>
            {song.song_key} {song.mode}
          </Text>
          <Text style={[styles.metaDot, { color: C.border }]}>·</Text>
          <Text style={[styles.meta, { color: C.muted }]}>{song.tuning}</Text>
          {song.tempo && (
            <>
              <Text style={[styles.metaDot, { color: C.border }]}>·</Text>
              <Text style={[styles.meta, { color: C.muted }]}>{song.tempo} BPM</Text>
            </>
          )}
          <Text style={[styles.metaDot, { color: C.border }]}>·</Text>
          <Text style={[styles.meta, { color: C.muted }]}>{updated}</Text>
        </View>
      </View>
      <Text style={[styles.chevron, { color: C.muted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  artist: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  meta: { fontSize: 12, fontWeight: '500' },
  metaDot: { fontSize: 12 },
  chevron: { fontSize: 22 },
});

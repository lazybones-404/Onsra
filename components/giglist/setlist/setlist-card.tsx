import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { LocalSetlist } from '@/lib/db/schema';
import { colors } from '@/constants/theme';

interface SetlistCardProps {
  setlist: LocalSetlist;
  songCount?: number;
  onPress: () => void;
  onDelete: () => void;
}

export function SetlistCard({ setlist, songCount = 0, onPress, onDelete }: SetlistCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="queue-music" size={24} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
            {setlist.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
            {songCount} song{songCount !== 1 ? 's' : ''} · {new Date(setlist.updated_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onDelete}
            style={{ padding: 6 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete-outline" size={20} color={colors.mutedDark} />
          </TouchableOpacity>
          <MaterialIcons name="chevron-right" size={20} color={colors.mutedDark} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

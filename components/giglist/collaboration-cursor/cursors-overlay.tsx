import { View, Text } from 'react-native';
import type { CollaboratorInfo } from '@/lib/collaboration/supabase-provider';

interface CursorsOverlayProps {
  collaborators: CollaboratorInfo[];
  currentUserId: string;
}

export function CursorsOverlay({ collaborators, currentUserId }: CursorsOverlayProps) {
  const others = collaborators.filter((c) => c.userId !== currentUserId && c.cursor !== null);

  if (others.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      {others.map((c) => (
        <View
          key={c.userId}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: `${c.color}20`,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: c.color,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: c.color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
              {c.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: c.color, fontSize: 12, fontWeight: '600' }}>
            {c.displayName}
          </Text>
        </View>
      ))}
    </View>
  );
}

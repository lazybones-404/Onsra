import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { StringNote } from '@/constants/tunings';
import { colors } from '@/constants/theme';

interface StringSelectorProps {
  strings: StringNote[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Optional per-string tuning status for visual feedback */
  statusMap?: Record<number, 'in-tune' | 'sharp' | 'flat' | null>;
}

const STATUS_BG: Record<string, string> = {
  'in-tune': colors.inTune,
  sharp: colors.sharp,
  flat: colors.flat,
};

export function StringSelector({
  strings,
  selectedIndex,
  onSelect,
  statusMap = {},
}: StringSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 4, paddingVertical: 4 }}
    >
      {strings.map((s, i) => {
        const isSelected = i === selectedIndex;
        const status = statusMap[i] ?? null;
        const accentColor = status ? STATUS_BG[status] : colors.accent;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(i)}
            activeOpacity={0.75}
          >
            <View
              style={{
                width: 52,
                height: 64,
                borderRadius: 14,
                backgroundColor: isSelected ? accentColor : colors.surface,
                borderWidth: isSelected ? 0 : 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* String line (visual metaphor) */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: i < 3 ? 3 - i * 0.5 + 1 : 1,
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.4)' : colors.border,
                }}
              />

              <Text
                style={{
                  color: isSelected ? '#fff' : colors.foreground,
                  fontSize: 16,
                  fontWeight: '700',
                  lineHeight: 20,
                }}
              >
                {s.note}
              </Text>
              <Text
                style={{
                  color: isSelected ? 'rgba(255,255,255,0.7)' : colors.muted,
                  fontSize: 11,
                  fontWeight: '500',
                  marginTop: 2,
                }}
              >
                {s.octave}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

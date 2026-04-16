import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MetronomeSound } from '@/store/metronome-store';
import { colors } from '@/constants/theme';

const SOUNDS: { id: MetronomeSound; label: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
  { id: 'tick', label: 'Tick', icon: 'timer', description: 'Classic mechanical click' },
  { id: 'hihat', label: 'Hi-hat', icon: 'graphic-eq', description: 'Crisp cymbal hit' },
  { id: 'kick', label: 'Kick', icon: 'circle', description: 'Bass drum thump' },
  { id: 'rimshot', label: 'Rimshot', icon: 'radio-button-checked', description: 'Snare rim click' },
];

interface SoundPickerProps {
  activeSound: MetronomeSound;
  onSelect: (sound: MetronomeSound) => void;
}

export function SoundPicker({ activeSound, onSelect }: SoundPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
    >
      {SOUNDS.map((s) => {
        const isActive = s.id === activeSound;
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => onSelect(s.id)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: isActive ? colors.accentMuted : colors.surface,
              borderWidth: 1,
              borderColor: isActive ? colors.accent : colors.border,
              alignItems: 'center',
              gap: 4,
              minWidth: 72,
            }}
          >
            <MaterialIcons
              name={s.icon}
              size={20}
              color={isActive ? colors.accent : colors.muted}
            />
            <Text style={{ color: isActive ? colors.accent : colors.foreground, fontSize: 12, fontWeight: '600' }}>
              {s.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Tuning, StringNote } from '@/constants/tunings';
import type { InstrumentId } from '@/constants/instruments';
import { colors } from '@/constants/theme';

const NOTE_OPTIONS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const OCTAVE_OPTIONS = [0, 1, 2, 3, 4, 5];

/** A4 = 440 Hz, MIDI note 69 */
function noteToHz(note: string, octave: number): number {
  const semitones: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
    E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
    Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  const midi = (octave + 1) * 12 + (semitones[note] ?? 9);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface CustomTuningModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (tuning: Tuning) => void;
  instrument: InstrumentId;
  stringCount?: number;
}

interface EditableString {
  note: string;
  octave: number;
}

export function CustomTuningModal({
  visible,
  onClose,
  onSave,
  instrument,
  stringCount = 6,
}: CustomTuningModalProps) {
  const [name, setName] = useState('');
  const [strings, setStrings] = useState<EditableString[]>(
    Array.from({ length: stringCount }, (_, i) => ({
      note: ['E', 'A', 'D', 'G', 'B', 'E'][i] ?? 'E',
      octave: [2, 2, 3, 3, 3, 4][i] ?? 3,
    }))
  );

  function updateString(index: number, field: 'note' | 'octave', value: string | number) {
    setStrings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for your custom tuning.');
      return;
    }

    const tuningStrings: StringNote[] = strings.map((s) => ({
      note: s.note,
      octave: s.octave,
      hz: noteToHz(s.note, s.octave),
    }));

    const tuning: Tuning = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      instruments: [instrument],
      strings: tuningStrings,
    };

    onSave(tuning);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
            Custom Tuning
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Tuning name */}
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Tuning Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. My Drop B"
            placeholderTextColor={colors.mutedDark}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              color: colors.foreground,
              fontSize: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          {/* Strings */}
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Strings (low to high)
          </Text>

          {strings.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 14, width: 20 }}>
                {i + 1}
              </Text>

              {/* Note picker (simple scroll view of options) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
                style={{ flex: 1 }}
              >
                {NOTE_OPTIONS.map((note) => (
                  <TouchableOpacity
                    key={note}
                    onPress={() => updateString(i, 'note', note)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: s.note === note ? colors.accent : colors.surface,
                      borderWidth: 1,
                      borderColor: s.note === note ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{ color: s.note === note ? '#fff' : colors.foreground, fontSize: 13, fontWeight: '600' }}>
                      {note}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Octave picker */}
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {OCTAVE_OPTIONS.map((oct) => (
                  <TouchableOpacity
                    key={oct}
                    onPress={() => updateString(i, 'octave', oct)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: s.octave === oct ? colors.accentMuted : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: s.octave === oct ? colors.accent : colors.muted, fontSize: 12, fontWeight: '700' }}>
                      {oct}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Save Tuning
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

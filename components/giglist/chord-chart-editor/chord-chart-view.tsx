/**
 * Chord chart view — renders lyrics with chords inline above words.
 * Tap a word to assign/remove a chord.
 * This is the read/edit view for song chord charts.
 */

import { View, Text, TouchableOpacity, TextInput, Modal, SafeAreaView, ScrollView } from 'react-native';
import { useState } from 'react';
import type { ChordChartEntry } from '@/lib/supabase/types';
import { colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface ChordChartViewProps {
  chart: ChordChartEntry[];
  editable?: boolean;
  onUpdate?: (chart: ChordChartEntry[]) => void;
  fontSize?: number;
}

const COMMON_CHORDS = [
  'A', 'Am', 'A7', 'Am7', 'Amaj7',
  'B', 'Bm', 'B7', 'Bm7',
  'C', 'Cm', 'C7', 'Cmaj7',
  'D', 'Dm', 'D7', 'Dm7',
  'E', 'Em', 'E7', 'Em7',
  'F', 'Fm', 'F7', 'Fmaj7',
  'G', 'Gm', 'G7', 'Gmaj7',
  'Bb', 'Eb', 'Ab', 'Db',
  'F#m', 'C#m', 'G#m',
  'Asus2', 'Dsus2', 'Esus4',
  'Aadd9', 'Cadd9', 'Gadd9',
];

interface ChordPickerModalProps {
  visible: boolean;
  currentChord: string | null;
  onSelect: (chord: string | null) => void;
  onClose: () => void;
}

function ChordPickerModal({ visible, currentChord, onSelect, onClose }: ChordPickerModalProps) {
  const [custom, setCustom] = useState('');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>Assign Chord</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Remove chord */}
          {currentChord && (
            <TouchableOpacity
              onPress={() => { onSelect(null); onClose(); }}
              style={{ padding: 12, borderRadius: 12, backgroundColor: `${colors.danger}20`, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' }}
            >
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Remove chord</Text>
            </TouchableOpacity>
          )}

          {/* Custom input */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="Custom (e.g. F#m7b5)"
              placeholderTextColor={colors.mutedDark}
              autoCapitalize="none"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                color: colors.foreground,
                fontSize: 15,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <TouchableOpacity
              onPress={() => { if (custom.trim()) { onSelect(custom.trim()); onClose(); } }}
              style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Common chords grid */}
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Common Chords</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {COMMON_CHORDS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => { onSelect(c); onClose(); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: currentChord === c ? colors.accent : colors.surface,
                  borderWidth: 1,
                  borderColor: currentChord === c ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: currentChord === c ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 14 }}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function ChordChartView({
  chart,
  editable = false,
  onUpdate,
  fontSize = 15,
}: ChordChartViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedEntry = selectedIndex !== null ? chart[selectedIndex] : null;

  function handleChordSelect(chord: string | null) {
    if (selectedIndex === null || !onUpdate) return;
    const updated = [...chart];
    updated[selectedIndex] = { ...updated[selectedIndex], chord };
    onUpdate(updated);
    setSelectedIndex(null);
  }

  // Group entries into lines
  const lines: ChordChartEntry[][] = [];
  let currentLine: ChordChartEntry[] = [];

  for (const entry of chart) {
    if (entry.lineBreak && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(entry);
  }
  if (currentLine.length > 0) lines.push(currentLine);

  if (chart.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>No chord chart yet. Use AI to generate one.</Text>
      </View>
    );
  }

  return (
    <View>
      {lines.map((line, lineIdx) => (
        <View
          key={lineIdx}
          style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}
        >
          {line.map((entry, entryIdx) => {
            const globalIdx = chart.indexOf(entry);
            const isSelected = editable && globalIdx === selectedIndex;

            return (
              <TouchableOpacity
                key={entryIdx}
                onPress={() => editable && setSelectedIndex(isSelected ? null : globalIdx)}
                disabled={!editable}
                style={{ marginRight: 6, marginBottom: 2 }}
              >
                <View style={{ minWidth: 24 }}>
                  {/* Chord above word */}
                  <Text
                    style={{
                      color: entry.chord ? colors.accent : 'transparent',
                      fontSize: fontSize - 2,
                      fontWeight: '700',
                      lineHeight: (fontSize - 2) * 1.4,
                      minHeight: (fontSize - 2) * 1.4,
                    }}
                  >
                    {entry.chord ?? '.'}
                  </Text>
                  {/* Word */}
                  <Text
                    style={{
                      color: isSelected ? colors.accent : colors.foreground,
                      fontSize,
                      lineHeight: fontSize * 1.5,
                      backgroundColor: isSelected ? `${colors.accent}18` : 'transparent',
                      borderRadius: 4,
                      paddingHorizontal: isSelected ? 2 : 0,
                    }}
                  >
                    {entry.word}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {editable && (
        <ChordPickerModal
          visible={selectedIndex !== null}
          currentChord={selectedEntry?.chord ?? null}
          onSelect={handleChordSelect}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </View>
  );
}

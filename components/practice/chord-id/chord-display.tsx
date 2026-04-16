import { View, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '@/store/audio-store';
import { ChordDetector, type ChordResult } from '@/lib/audio/chord-identifier';
import { KeyDetector, type KeyResult } from '@/lib/audio/key-detector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export function ChordDisplay() {
  const { pitchResult } = useAudioStore();
  const [chord, setChord] = useState<ChordResult | null>(null);
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [isListening, setIsListening] = useState(true);

  const chordDetector = useRef(new ChordDetector(2000));
  const keyDetector = useRef(new KeyDetector());

  useEffect(() => {
    if (!isListening || !pitchResult) return;

    chordDetector.current.addNote(pitchResult.frequency);
    keyDetector.current.addNote(pitchResult.note);

    const detectedChord = chordDetector.current.detect();
    const detectedKey = keyDetector.current.detect();

    if (detectedChord) setChord(detectedChord);
    if (detectedKey) setKeyResult(detectedKey);
  }, [pitchResult, isListening]);

  function handleReset() {
    chordDetector.current.clear();
    keyDetector.current.reset();
    setChord(null);
    setKeyResult(null);
  }

  return (
    <View className="gap-4">
      {/* Current note */}
      {pitchResult && (
        <Card className="p-4">
          <Text className="text-label text-muted mb-2">Current Note</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-foreground text-5xl font-bold">{pitchResult.note}</Text>
            <Text className="text-muted text-2xl">{pitchResult.octave}</Text>
            <Text className="text-muted text-base">{pitchResult.frequency.toFixed(1)} Hz</Text>
          </View>
        </Card>
      )}

      {/* Detected chord */}
      <Card className="p-4">
        <Text className="text-label text-muted mb-2">Detected Chord</Text>
        {chord ? (
          <View>
            <Text className="text-foreground text-3xl font-bold">{chord.name}</Text>
            <Text className="text-muted text-sm mt-1">
              Notes: {chord.notes.join(', ')} · {Math.round(chord.confidence * 100)}% confidence
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="hearing" size={18} color={colors.border} />
            <Text className="text-muted text-sm">Play multiple notes to detect a chord</Text>
          </View>
        )}
      </Card>

      {/* Detected key */}
      {keyResult && (
        <Card className="p-4">
          <Text className="text-label text-muted mb-2">Key / Scale</Text>
          <View className="flex-row items-baseline gap-2 mb-3">
            <Text className="text-foreground text-2xl font-bold">
              {keyResult.key} {keyResult.mode}
            </Text>
            <Text className="text-muted text-sm">
              ({Math.round(keyResult.confidence * 100)}% confidence)
            </Text>
          </View>
          <Text className="text-muted text-xs mb-1">Diatonic notes</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {keyResult.diatonicNotes.map((n) => (
              <View
                key={n}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: pitchResult?.note === n ? colors.accentMuted : colors.surfaceAlt,
                  borderWidth: pitchResult?.note === n ? 1 : 0,
                  borderColor: colors.accent,
                }}
              >
                <Text style={{ color: pitchResult?.note === n ? colors.accent : colors.muted, fontSize: 13, fontWeight: '600' }}>
                  {n}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-muted text-xs mb-1">Diatonic chords</Text>
          <View className="flex-row flex-wrap gap-2">
            {keyResult.diatonicChords.map((c) => (
              <View
                key={c}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceAlt }}
              >
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{c}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Controls */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setIsListening((v) => !v)}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: isListening ? colors.accentMuted : colors.surface,
            borderWidth: 1,
            borderColor: isListening ? colors.accent : colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <MaterialIcons name={isListening ? 'pause' : 'play-arrow'} size={18} color={isListening ? colors.accent : colors.muted} />
          <Text style={{ color: isListening ? colors.accent : colors.muted, fontWeight: '600' }}>
            {isListening ? 'Listening' : 'Paused'}
          </Text>
        </TouchableOpacity>
        <Button title="Reset" onPress={handleReset} variant="secondary" />
      </View>
    </View>
  );
}

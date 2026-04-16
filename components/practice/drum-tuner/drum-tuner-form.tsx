import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioStore } from '@/store/audio-store';
import { useSessionStore } from '@/store/session-store';
import { getSupabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';

type DrumPiece = 'snare' | 'kick' | 'tom1' | 'tom2' | 'tom3' | 'floor-tom';

const DRUM_PIECES: { id: DrumPiece; label: string; commonSizes: string[] }[] = [
  { id: 'snare', label: 'Snare', commonSizes: ['13"', '14"', '15"'] },
  { id: 'kick', label: 'Kick', commonSizes: ['18"', '20"', '22"', '24"'] },
  { id: 'tom1', label: 'Rack Tom 1', commonSizes: ['8"', '10"', '12"'] },
  { id: 'tom2', label: 'Rack Tom 2', commonSizes: ['10"', '12"', '13"'] },
  { id: 'tom3', label: 'Tom 3', commonSizes: ['12"', '13"', '14"'] },
  { id: 'floor-tom', label: 'Floor Tom', commonSizes: ['14"', '16"', '18"'] },
];

const HEAD_TYPES = ['Coated Ambassador', 'Clear Ambassador', 'Coated Vintage', 'Hydraulic', 'Pinstripe', 'Other'];

interface DrumSpec {
  piece: DrumPiece;
  diameter: string;
  depth: string;
  headType: string;
}

export function DrumTunerForm() {
  const [selectedPiece, setSelectedPiece] = useState<DrumPiece>('snare');
  const [spec, setSpec] = useState<Omit<DrumSpec, 'piece'>>({
    diameter: '14"',
    depth: '6.5"',
    headType: 'Coated Ambassador',
  });
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);

  const { pitchResult } = useAudioStore();
  const user = useSessionStore((s) => s.user);

  const drumInfo = DRUM_PIECES.find((d) => d.id === selectedPiece)!;

  async function handleGetGuide() {
    if (!user) return;
    setLoading(true);
    setGuide(null);

    const context = {
      drumPiece: selectedPiece,
      diameter: spec.diameter,
      depth: spec.depth,
      headType: spec.headType,
      detectedHz: pitchResult?.frequency ?? null,
    };

    const message = `Help me tune my ${selectedPiece} drum. Diameter: ${spec.diameter}, Depth: ${spec.depth}, Head: ${spec.headType}. ${
      pitchResult ? `Detected resonant frequency: ${pitchResult.frequency.toFixed(1)} Hz.` : 'No frequency detected yet.'
    }`;

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message, feature: 'drum-tuner-guide', context }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setGuide(fullText);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('[DrumTuner] AI error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
    >
      {/* Live frequency display */}
      <Card className="p-4 mb-5 flex-row items-center gap-3">
        <View className={`w-2.5 h-2.5 rounded-full ${pitchResult ? 'bg-success' : 'bg-muted-dark'}`} />
        {pitchResult ? (
          <View className="flex-1">
            <Text className="text-foreground font-bold text-lg">
              {pitchResult.frequency.toFixed(1)} Hz
            </Text>
            <Text className="text-muted text-xs">Tap the drum head to capture resonant frequency</Text>
          </View>
        ) : (
          <View className="flex-1">
            <Text className="text-muted text-sm">Tap your drum — mic will capture frequency</Text>
          </View>
        )}
      </Card>

      {/* Drum piece selector */}
      <Text className="text-label text-muted mb-3">Select Drum</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
        {DRUM_PIECES.map((d) => (
          <TouchableOpacity
            key={d.id}
            onPress={() => setSelectedPiece(d.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: selectedPiece === d.id ? colors.accentMuted : colors.surface,
              borderWidth: 1,
              borderColor: selectedPiece === d.id ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: selectedPiece === d.id ? colors.accent : colors.foreground, fontWeight: '600', fontSize: 13 }}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Diameter */}
      <Text className="text-label text-muted mb-3">Diameter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
        {drumInfo.commonSizes.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSpec((prev) => ({ ...prev, diameter: s }))}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: spec.diameter === s ? colors.accent : colors.surface,
              borderWidth: 1,
              borderColor: spec.diameter === s ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: spec.diameter === s ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 14 }}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
        <TextInput
          value={spec.diameter}
          onChangeText={(v) => setSpec((p) => ({ ...p, diameter: v }))}
          placeholder='Custom (e.g. 13")'
          placeholderTextColor={colors.mutedDark}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 9,
            color: colors.foreground,
            fontSize: 14,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 100,
          }}
        />
      </ScrollView>

      {/* Head type */}
      <Text className="text-label text-muted mb-3">Head Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 24 }}>
        {HEAD_TYPES.map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => setSpec((prev) => ({ ...prev, headType: h }))}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: spec.headType === h ? colors.accentMuted : colors.surface,
              borderWidth: 1,
              borderColor: spec.headType === h ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: spec.headType === h ? colors.accent : colors.muted, fontWeight: '600', fontSize: 12 }}>
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Get guide button */}
      {user ? (
        <Button
          title={loading ? 'Analysing...' : 'Get AI Tuning Guide'}
          onPress={handleGetGuide}
          loading={loading}
          size="lg"
        />
      ) : (
        <Card className="p-4 items-center gap-2">
          <MaterialIcons name="lock" size={20} color={colors.muted} />
          <Text className="text-muted text-sm text-center">Sign in to get an AI-generated tuning guide for your drum</Text>
        </Card>
      )}

      {/* AI guide output */}
      {guide && (
        <Card className="p-4 mt-5">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="auto-awesome" size={16} color={colors.accent} />
            <Text className="text-accent text-sm font-semibold">AI Tuning Guide</Text>
          </View>
          <Text className="text-foreground text-sm leading-relaxed">{guide}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

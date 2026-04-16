import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useInstrumentStore } from '@/store/instrument-store';
import { useAudioStore } from '@/store/audio-store';
import { INSTRUMENTS, TOOL_LABELS, TOOL_ICONS, type InstrumentId } from '@/constants/instruments';
import { Card } from '@/components/ui/card';
import { colors } from '@/constants/theme';

const INSTRUMENT_ROUTES: Record<InstrumentId, string> = {
  guitarist: '/practice/guitar',
  bassist: '/practice/bass',
  violinist: '/practice/violin',
  drummer: '/practice/drums',
  vocalist: '/practice/vocals',
  keys: '/practice/guitar',
};

export default function PracticeHub() {
  const { activeInstrument, setActiveInstrument } = useInstrumentStore();
  const { micActive, pitchResult } = useAudioStore();

  const currentInstrument = INSTRUMENTS.find((i) => i.id === activeInstrument) ?? INSTRUMENTS[0];
  const otherInstruments = INSTRUMENTS.filter((i) => i.id !== activeInstrument);

  function navigateToTool(toolId: string) {
    const route = INSTRUMENT_ROUTES[activeInstrument];
    router.push(`${route}?tool=${toolId}` as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <Text className="text-2xl font-bold text-foreground">Practice</Text>
          {/* Live mic indicator */}
          <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${micActive ? 'bg-success bg-opacity-10' : 'bg-surface'}`}>
            <View className={`w-2 h-2 rounded-full ${micActive ? 'bg-success' : 'bg-muted-dark'}`} />
            <Text className={`text-xs font-semibold ${micActive ? 'text-success' : 'text-muted'}`}>
              {micActive ? 'Listening' : 'Off'}
            </Text>
          </View>
        </View>

        {/* Current pitch reading */}
        {pitchResult && (
          <Card className="p-4 mb-5 flex-row items-center gap-3">
            <MaterialIcons name="music-note" size={20} color={colors.accent} />
            <View>
              <Text className="text-foreground font-bold text-lg">
                {pitchResult.note}{pitchResult.octave}
              </Text>
              <Text className="text-muted text-sm">
                {pitchResult.frequency.toFixed(1)} Hz · {pitchResult.cents > 0 ? '+' : ''}{pitchResult.cents}¢
              </Text>
            </View>
          </Card>
        )}

        {/* Active instrument */}
        <View className="mb-6">
          <Text className="text-label text-muted mb-3">Active Instrument</Text>
          <Card className="p-5 border border-accent">
            <View className="flex-row items-center gap-4">
              <Text className="text-4xl">{currentInstrument.emoji}</Text>
              <View className="flex-1">
                <Text className="text-foreground text-xl font-bold">{currentInstrument.label}</Text>
                <Text className="text-muted text-sm mt-0.5">{currentInstrument.description}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Tools for this instrument */}
        <View className="mb-6">
          <Text className="text-label text-muted mb-3">Tools</Text>
          <View className="gap-3">
            {currentInstrument.tools.map((toolId) => (
              <TouchableOpacity
                key={toolId}
                onPress={() => navigateToTool(toolId)}
                activeOpacity={0.8}
              >
                <Card className="p-4 flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-xl bg-accent-muted items-center justify-center">
                    <MaterialIcons
                      name={TOOL_ICONS[toolId] as keyof typeof MaterialIcons.glyphMap}
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{TOOL_LABELS[toolId]}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.mutedDark} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Switch instrument */}
        <View>
          <Text className="text-label text-muted mb-3">Switch Instrument</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {otherInstruments.map((inst) => (
              <TouchableOpacity
                key={inst.id}
                onPress={() => setActiveInstrument(inst.id)}
                activeOpacity={0.8}
              >
                <Card className="px-4 py-3 flex-row items-center gap-2">
                  <Text className="text-xl">{inst.emoji}</Text>
                  <Text className="text-foreground text-sm font-medium">{inst.label}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

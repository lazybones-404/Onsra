import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VocalPitchNeedle } from '@/components/practice/pitch-display/vocal-pitch-needle';
import { Card } from '@/components/ui/card';
import { colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function VocalsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      >
        {/* Live pitch needle */}
        <VocalPitchNeedle />

        {/* Tips */}
        <Card className="p-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="lightbulb-outline" size={16} color={colors.accent} />
            <Text className="text-accent text-sm font-semibold">Tips for accurate pitch detection</Text>
          </View>
          {[
            'Sing in a quiet room — background noise affects accuracy',
            'Sustain each note for 1-2 seconds',
            'Hold your phone 30–50cm from your mouth',
            'Avoid singing while listening to music in headphones',
          ].map((tip, i) => (
            <View key={i} className="flex-row gap-2 mt-2">
              <Text className="text-muted text-xs">·</Text>
              <Text className="text-muted text-xs flex-1">{tip}</Text>
            </View>
          ))}
        </Card>

        {/* Karaoke pitch bar - coming */}
        <Card className="p-4 mt-4 opacity-50">
          <View className="flex-row items-center gap-3">
            <MaterialIcons name="show-chart" size={20} color={colors.border} />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-foreground font-semibold">Karaoke Pitch Bar</Text>
                <View className="bg-surface-alt rounded-full px-2 py-0.5">
                  <Text className="text-muted-dark text-xs">Post-v1</Text>
                </View>
              </View>
              <Text className="text-muted text-sm mt-0.5">
                Follow a target melody line in real time
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

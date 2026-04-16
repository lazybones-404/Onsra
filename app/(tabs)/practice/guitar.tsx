import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { TunerScreen } from '@/components/practice/tuner/tuner-screen';
import { ChordDisplay } from '@/components/practice/chord-id/chord-display';
import { SignalChainChat } from '@/components/practice/signal-chain/signal-chain-chat';
import { useSessionStore } from '@/store/session-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

type Tab = 'tuner' | 'chord-id' | 'signal-chain' | 'key-scale';

const TABS: { id: Tab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'tuner', label: 'Tuner', icon: 'tune' },
  { id: 'chord-id', label: 'Chord ID', icon: 'piano' },
  { id: 'signal-chain', label: 'Signal Chain', icon: 'chat' },
  { id: 'key-scale', label: 'Key & Scale', icon: 'account-tree' },
];

export default function GuitarScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('tuner');
  const user = useSessionStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/* Tool tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 56 }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activeTab === tab.id ? colors.accent : colors.surface,
              }}
            >
              <MaterialIcons
                name={tab.icon}
                size={15}
                color={activeTab === tab.id ? '#fff' : colors.muted}
              />
              <Text
                style={{
                  color: activeTab === tab.id ? '#fff' : colors.muted,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tuner */}
      {activeTab === 'tuner' && <TunerScreen instrument="guitarist" />}

      {/* Chord ID */}
      {activeTab === 'chord-id' && (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        >
          <ChordDisplay />
        </ScrollView>
      )}

      {/* Signal Chain AI */}
      {activeTab === 'signal-chain' && (
        user ? (
          <SignalChainChat />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <MaterialIcons name="lock" size={48} color={colors.border} />
            <Text className="text-foreground text-lg font-semibold mt-4">Sign in required</Text>
            <Text className="text-muted text-sm mt-2 text-center">
              The Signal Chain AI requires an account to access the AI features.
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/auth' as never)}
              className="mt-6"
            />
          </View>
        )
      )}

      {/* Key & Scale — placeholder (detailed visualizer post-v1) */}
      {activeTab === 'key-scale' && (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        >
          <ChordDisplay />
          <View className="mt-4">
            <Card className="p-4 items-center gap-2 opacity-60">
              <MaterialIcons name="account-tree" size={28} color={colors.border} />
              <Text className="text-muted text-sm text-center">
                Fretboard scale visualizer — full version post-v1
              </Text>
            </Card>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

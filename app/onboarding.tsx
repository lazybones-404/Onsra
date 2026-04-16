import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/user-store';
import { useInstrumentStore } from '@/store/instrument-store';
import { INSTRUMENTS, type InstrumentId } from '@/constants/instruments';
import { Button } from '@/components/ui/button';
import { track, EVENTS } from '@/lib/analytics';

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<InstrumentId[]>([]);
  const setOnboarded = useUserStore((s) => s.setOnboarded);
  const setPrimaryInstrument = useUserStore((s) => s.setPrimaryInstrument);
  const setInstruments = useUserStore((s) => s.setInstruments);
  const setActiveInstrument = useInstrumentStore((s) => s.setActiveInstrument);

  function toggleInstrument(id: InstrumentId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    if (selected.length === 0) return;
    const primary = selected[0];
    setPrimaryInstrument(primary);
    setInstruments(selected);
    setActiveInstrument(primary);
    setOnboarded(true);
    track(EVENTS.ONBOARDING_COMPLETE, { primary_instrument: primary, all_instruments: selected });
    router.replace('/(tabs)/practice' as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="mt-16 mb-10">
          <Text className="text-5xl font-bold text-foreground tracking-tight">
            onsra
          </Text>
          <Text className="text-accent text-lg font-medium mt-1">
            The musician's suite
          </Text>
          <Text className="text-muted text-base mt-6 leading-relaxed">
            What do you play? Select all that apply — your primary instrument is shown first.
          </Text>
        </View>

        {/* Instrument grid */}
        <View className="flex-row flex-wrap gap-3">
          {INSTRUMENTS.map((instrument) => {
            const isSelected = selected.includes(instrument.id);
            const primaryIndex = selected.indexOf(instrument.id);
            const isPrimary = primaryIndex === 0;

            return (
              <TouchableOpacity
                key={instrument.id}
                onPress={() => toggleInstrument(instrument.id)}
                activeOpacity={0.8}
                className={[
                  'rounded-2xl p-4 border',
                  isSelected
                    ? isPrimary
                      ? 'bg-accent border-accent'
                      : 'bg-accent-muted border-accent'
                    : 'bg-surface border-border',
                  'w-[47%]',
                ].join(' ')}
              >
                <Text className="text-3xl mb-2">{instrument.emoji}</Text>
                <Text
                  className={[
                    'text-base font-semibold',
                    isSelected ? 'text-white' : 'text-foreground',
                  ].join(' ')}
                >
                  {instrument.label}
                </Text>
                <Text
                  className={[
                    'text-sm mt-0.5',
                    isSelected ? 'text-white opacity-80' : 'text-muted',
                  ].join(' ')}
                  numberOfLines={2}
                >
                  {instrument.description}
                </Text>
                {isPrimary && isSelected && (
                  <View className="mt-2 self-start bg-white bg-opacity-20 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-semibold">Primary</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hint */}
        {selected.length > 0 && (
          <Text className="text-muted text-sm text-center mt-6">
            First selected = primary instrument
          </Text>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View
        className="px-6 pb-8 pt-4 border-t border-border bg-background"
        style={{ paddingBottom: Platform.OS === 'ios' ? 32 : 24 }}
      >
        <Button
          title={selected.length === 0 ? 'Select an instrument' : `Continue as ${INSTRUMENTS.find(i => i.id === selected[0])?.label}`}
          onPress={handleContinue}
          disabled={selected.length === 0}
          size="lg"
        />
        <TouchableOpacity
          onPress={() => router.push('/auth')}
          className="mt-3 items-center py-2"
        >
          <Text className="text-muted text-sm">
            Already have an account?{' '}
            <Text className="text-accent font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

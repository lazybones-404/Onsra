import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMetronomeStore } from '@/store/metronome-store';
import { metronomeEngine } from '@/lib/audio/metronome-engine';
import { track, EVENTS } from '@/lib/analytics';
import { BpmWheel } from '@/components/practice/metronome/bpm-wheel';
import { BeatRow } from '@/components/practice/metronome/beat-row';
import { SoundPicker } from '@/components/practice/metronome/sound-picker';
import { DrumTunerForm } from '@/components/practice/drum-tuner/drum-tuner-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import type { TimeSignature } from '@/store/metronome-store';

type Tab = 'metronome' | 'drum-tuner';

const TIME_SIGS: TimeSignature[] = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];

const TAP_WINDOW_MS = 3000;

export default function DrumsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('metronome');
  const [showTrainer, setShowTrainer] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const {
    bpm, setBpm, isPlaying, setPlaying,
    sound, setSound, timeSignature, setTimeSignature,
    currentBeat, tempoTrainer, setTempoTrainer,
  } = useMetronomeStore();

  useEffect(() => {
    return () => {
      metronomeEngine.stop();
    };
  }, []);

  async function togglePlay() {
    if (isPlaying) {
      metronomeEngine.stop();
      setPlaying(false);
    } else {
      if (showTrainer && tempoTrainer.enabled) {
        await metronomeEngine.startTempoTrainer(
          tempoTrainer.startBpm,
          tempoTrainer.targetBpm,
          tempoTrainer.durationMinutes,
          timeSignature,
          sound
        );
        track(EVENTS.METRONOME_START, { mode: 'tempo_trainer', start_bpm: tempoTrainer.startBpm, target_bpm: tempoTrainer.targetBpm });
      } else {
        await metronomeEngine.start(bpm, timeSignature, sound);
        track(EVENTS.METRONOME_START, { mode: 'standard', bpm, time_signature: timeSignature, sound });
      }
      setPlaying(true);
    }
  }

  function handleBpmChange(newBpm: number) {
    setBpm(newBpm);
    if (isPlaying) {
      metronomeEngine.updateBpm(newBpm, timeSignature);
    }
  }

  function handleTap() {
    const now = Date.now();
    const recent = tapTimes.filter((t) => now - t < TAP_WINDOW_MS);
    const newTaps = [...recent, now];
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = newTaps.slice(1).map((t, i) => t - newTaps[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const tappedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(tappedBpm);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 16,
          paddingTop: 10,
          gap: 8,
        }}
      >
        {([
          { id: 'metronome' as Tab, label: 'Metronome', icon: 'timer' as const },
          { id: 'drum-tuner' as Tab, label: 'Drum Tuner', icon: 'graphic-eq' as const },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeTab === tab.id ? colors.accent : colors.surface,
              marginBottom: 10,
            }}
          >
            <MaterialIcons name={tab.icon} size={15} color={activeTab === tab.id ? '#fff' : colors.muted} />
            <Text style={{ color: activeTab === tab.id ? '#fff' : colors.muted, fontSize: 13, fontWeight: '600' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'metronome' && (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        >
          {/* BPM Wheel */}
          <View className="items-center mb-6">
            <BpmWheel bpm={bpm} onBpmChange={handleBpmChange} />
          </View>

          {/* Beat row */}
          <View className="items-center mb-6">
            <BeatRow
              timeSignature={timeSignature}
              currentBeat={currentBeat}
              isPlaying={isPlaying}
            />
          </View>

          {/* Play / Tap controls */}
          <View className="flex-row gap-3 mb-6">
            <Button
              title={isPlaying ? '⏹ Stop' : '▶ Start'}
              onPress={togglePlay}
              size="lg"
              className="flex-1"
            />
            <TouchableOpacity
              onPress={handleTap}
              style={{
                flex: 1,
                borderRadius: 14,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
                Tap
              </Text>
              {tapTimes.length >= 2 && (
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                  {tapTimes.length} taps
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Time signature */}
          <Text className="text-label text-muted mb-3">Time Signature</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 20 }}
          >
            {TIME_SIGS.map((sig) => (
              <TouchableOpacity
                key={sig}
                onPress={() => {
                  setTimeSignature(sig);
                  if (isPlaying) {
                    metronomeEngine.stop();
                    metronomeEngine.start(bpm, sig, sound);
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: timeSignature === sig ? colors.accent : colors.surface,
                  borderWidth: 1,
                  borderColor: timeSignature === sig ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: timeSignature === sig ? '#fff' : colors.foreground, fontWeight: '700', fontSize: 14 }}>
                  {sig}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sound picker */}
          <Text className="text-label text-muted mb-3">Click Sound</Text>
          <View className="mb-6">
            <SoundPicker
              activeSound={sound}
              onSelect={(s) => {
                setSound(s);
                metronomeEngine.loadSound(s);
              }}
            />
          </View>

          {/* Tempo trainer */}
          <TouchableOpacity onPress={() => setShowTrainer((v) => !v)}>
            <Card className="p-4 flex-row items-center gap-3 mb-4">
              <MaterialIcons name="trending-up" size={20} color={colors.accent} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Tempo Trainer</Text>
                <Text className="text-muted text-xs mt-0.5">Gradually increase or decrease BPM over time</Text>
              </View>
              <MaterialIcons name={showTrainer ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
            </Card>
          </TouchableOpacity>

          {showTrainer && (
            <Card className="p-4 mb-4 gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-muted text-xs mb-1">Start BPM</Text>
                  <Text className="text-foreground text-xl font-bold">{tempoTrainer.startBpm}</Text>
                  <View className="flex-row gap-2 mt-2">
                    {[60, 80, 100, 120].map((b) => (
                      <TouchableOpacity
                        key={b}
                        onPress={() => setTempoTrainer({ startBpm: b })}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: tempoTrainer.startBpm === b ? colors.accentMuted : colors.surfaceAlt }}
                      >
                        <Text style={{ color: tempoTrainer.startBpm === b ? colors.accent : colors.muted, fontSize: 12 }}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs mb-1">Target BPM</Text>
                  <Text className="text-foreground text-xl font-bold">{tempoTrainer.targetBpm}</Text>
                  <View className="flex-row gap-2 mt-2">
                    {[120, 140, 160, 180].map((b) => (
                      <TouchableOpacity
                        key={b}
                        onPress={() => setTempoTrainer({ targetBpm: b })}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: tempoTrainer.targetBpm === b ? colors.accentMuted : colors.surfaceAlt }}
                      >
                        <Text style={{ color: tempoTrainer.targetBpm === b ? colors.accent : colors.muted, fontSize: 12 }}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-muted text-xs mb-2">Duration</Text>
                <View className="flex-row gap-2">
                  {[3, 5, 10, 15].map((min) => (
                    <TouchableOpacity
                      key={min}
                      onPress={() => setTempoTrainer({ durationMinutes: min })}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                        backgroundColor: tempoTrainer.durationMinutes === min ? colors.accent : colors.surfaceAlt,
                      }}
                    >
                      <Text style={{ color: tempoTrainer.durationMinutes === min ? '#fff' : colors.muted, fontWeight: '600', fontSize: 13 }}>
                        {min}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Button
                title={isPlaying ? 'Stop Trainer' : 'Start Trainer'}
                onPress={togglePlay}
                variant={isPlaying ? 'danger' : 'primary'}
              />
            </Card>
          )}
        </ScrollView>
      )}

      {activeTab === 'drum-tuner' && <DrumTunerForm />}
    </SafeAreaView>
  );
}

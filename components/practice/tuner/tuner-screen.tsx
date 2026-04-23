/**
 * Shared tuner screen component.
 * Used by guitar, bass, and violin screens with instrument-specific tunings.
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioStore } from '@/store/audio-store';
import { useInstrumentStore } from '@/store/instrument-store';
import { getTuningsForInstrument, type Tuning } from '@/constants/tunings';
import { centsFromTarget, findClosestString, tuningStatus } from '@/lib/audio/tuner-utils';
import type { InstrumentId } from '@/constants/instruments';
import { NeedleDisplay } from './needle-display';
import { StringSelector } from './string-selector';
import { TuningPicker } from './tuning-picker';
import { CustomTuningModal } from './custom-tuning-modal';
import { Card } from '@/components/ui/card';
import { colors } from '@/constants/theme';

interface TunerScreenProps {
  instrument: InstrumentId;
}

export function TunerScreen({ instrument }: TunerScreenProps) {
  const { pitchResult, micActive } = useAudioStore();
  const { activeTuning, setActiveTuning, selectedStringIndex, setSelectedStringIndex } =
    useInstrumentStore();

  const [autoDetect, setAutoDetect] = useState(true);
  const [showTuningPicker, setShowTuningPicker] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTunings, setCustomTunings] = useState<Tuning[]>([]);

  const presetTunings = getTuningsForInstrument(instrument);
  const allTunings = [...presetTunings, ...customTunings];
  const targetString = activeTuning.strings[selectedStringIndex];

  // Auto-detect closest string when pitch is detected
  let displayCents: number | null = null;
  let displayNote = '';
  let displayOctave = 0;
  let displayFreq = 0;

  if (pitchResult) {
    displayNote = pitchResult.note;
    displayOctave = pitchResult.octave;
    displayFreq = pitchResult.frequency;

    if (autoDetect) {
      const closest = findClosestString(pitchResult.frequency, activeTuning.strings);
      if (closest.index !== selectedStringIndex) {
        // #region agent log
        fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'D',location:'components/practice/tuner/tuner-screen.tsx:autoDetect',message:'Auto-detect would change selected string (setState during render)',data:{from:selectedStringIndex,to:closest.index},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setSelectedStringIndex(closest.index);
      }
      displayCents = closest.cents;
    } else {
      displayCents = centsFromTarget(pitchResult.frequency, targetString.hz);
    }
  }

  // Build per-string status map for the string selector
  const statusMap: Record<number, 'in-tune' | 'sharp' | 'flat' | null> = {};
  if (pitchResult) {
    activeTuning.strings.forEach((s, i) => {
      const c = centsFromTarget(pitchResult.frequency, s.hz);
      statusMap[i] = Math.abs(c) < 30 ? tuningStatus(c) : null;
    });
  }

  function handleCustomSave(tuning: Tuning) {
    setCustomTunings((prev) => [...prev, tuning]);
    setActiveTuning(tuning);
  }

  return (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
    >
      {/* Tuning selector bar */}
      <TouchableOpacity
        onPress={() => setShowTuningPicker(true)}
        activeOpacity={0.8}
      >
        <Card className="p-3.5 flex-row items-center gap-3 mb-5">
          <MaterialIcons name="music-note" size={18} color={colors.accent} />
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-sm">{activeTuning.name}</Text>
            <Text className="text-muted text-xs mt-0.5">
              {activeTuning.strings.map((s) => s.note).join(' · ')}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={20} color={colors.muted} />
        </Card>
      </TouchableOpacity>

      {/* Needle display */}
      <NeedleDisplay
        cents={displayCents}
        note={displayNote || targetString.note}
        octave={displayNote ? displayOctave : targetString.octave}
        frequency={displayFreq || targetString.hz}
        targetNote={targetString.note}
        targetOctave={targetString.octave}
      />

      {/* String selector */}
      <View className="mt-6 mb-4">
        <Text className="text-label text-muted mb-3">Strings</Text>
        <StringSelector
          strings={activeTuning.strings}
          selectedIndex={selectedStringIndex}
          onSelect={(i) => {
            setSelectedStringIndex(i);
            setAutoDetect(false);
          }}
          statusMap={statusMap}
        />
      </View>

      {/* Auto-detect toggle */}
      <TouchableOpacity
        onPress={() => setAutoDetect((v) => !v)}
        activeOpacity={0.8}
      >
        <Card className={`p-3.5 flex-row items-center gap-3 ${autoDetect ? 'border border-accent' : ''}`}>
          <MaterialIcons
            name={autoDetect ? 'my-location' : 'location-searching'}
            size={18}
            color={autoDetect ? colors.accent : colors.muted}
          />
          <View className="flex-1">
            <Text className={`font-semibold text-sm ${autoDetect ? 'text-accent' : 'text-foreground'}`}>
              Auto-detect string
            </Text>
            <Text className="text-muted text-xs mt-0.5">
              {autoDetect ? 'Nearest string selected automatically' : 'String locked — tap to enable'}
            </Text>
          </View>
          <View
            className={`w-10 h-6 rounded-full ${autoDetect ? 'bg-accent' : 'bg-surface-alt'}`}
            style={{ justifyContent: 'center', paddingHorizontal: 2 }}
          >
            <View
              className="w-5 h-5 rounded-full bg-white"
              style={{ alignSelf: autoDetect ? 'flex-end' : 'flex-start' }}
            />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Mic status */}
      <View className="flex-row items-center gap-2 mt-4 px-1">
        <View className={`w-2 h-2 rounded-full ${micActive ? 'bg-success' : 'bg-muted-dark'}`} />
        <Text className="text-muted text-xs">
          {micActive ? 'Microphone active — play a note' : 'Microphone inactive'}
        </Text>
      </View>

      <TuningPicker
        tunings={allTunings}
        activeTuning={activeTuning}
        onSelect={setActiveTuning}
        visible={showTuningPicker}
        onClose={() => setShowTuningPicker(false)}
        onOpenCustom={() => setShowCustomModal(true)}
      />

      <CustomTuningModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={handleCustomSave}
        instrument={instrument}
        stringCount={activeTuning.strings.length}
      />
    </ScrollView>
  );
}

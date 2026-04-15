/**
 * Tune tab — Tuner + Metronome in a toggled layout.
 *
 * Tuner: uses TunerEngine (expo-av recording loop + YIN pitch detection)
 * Metronome: JS lookahead scheduler + expo-haptics
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NeedleDisplay } from '@/components/tuner/needle-display';
import { StrobeDisplay } from '@/components/tuner/strobe-display';
import { StringSelector } from '@/components/tuner/string-selector';
import { TuningPicker } from '@/components/tuner/tuning-picker';
import { BpmWheel } from '@/components/metronome/bpm-wheel';
import { BeatRow } from '@/components/metronome/beat-row';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getTuningsForInstrument, getDefaultTuning } from '@/constants/tunings';
import type { Tuning } from '@/constants/tunings';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TunerEngine } from '@/lib/audio/tuner-engine';
import { Metronome } from '@/lib/audio/metronome';
import { triggerAccountPrompt } from '@/components/account-prompt';
import { useAudioStore } from '@/store/audio-store';
import { useInstrumentStore } from '@/store/instrument-store';

type Mode = 'tuner' | 'metronome';

export default function TuneScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const [mode, setMode] = useState<Mode>('tuner');

  // ─── Shared audio store ─────────────────────────────────────
  const pitchHz = useAudioStore((s) => s.pitchHz);
  const noteName = useAudioStore((s) => s.noteName);
  const centsOffset = useAudioStore((s) => s.centsOffset);
  const tunerActive = useAudioStore((s) => s.tunerActive);
  const tunerDisplayMode = useAudioStore((s) => s.tunerDisplayMode);
  const referencePitch = useAudioStore((s) => s.referencePitch);
  const bpm = useAudioStore((s) => s.bpm);
  const metronomeActive = useAudioStore((s) => s.metronomeActive);
  const currentBeat = useAudioStore((s) => s.currentBeat);
  const beatsPerBar = useAudioStore((s) => s.beatsPerBar);
  const beatUnit = useAudioStore((s) => s.beatUnit);

  const {
    setPitch,
    setTunerActive,
    setTunerDisplayMode,
    setBpm,
    setMetronomeActive,
    setCurrentBeat,
    setTimeSignature,
  } = useAudioStore.getState();

  // ─── Instrument / Tuning ────────────────────────────────────
  const instrument = useInstrumentStore((s) => s.instrument);
  const [currentTuning, setCurrentTuning] = useState<Tuning>(() => getDefaultTuning(instrument));
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [showTuningPicker, setShowTuningPicker] = useState(false);

  // ─── Tuner engine ───────────────────────────────────────────
  const tunerRef = useRef<TunerEngine | null>(null);
  const pitchLockFiredRef = useRef(false);

  const startTuner = useCallback(async () => {
    if (tunerRef.current) {
      tunerRef.current.stop();
    }
    tunerRef.current = new TunerEngine((result) => {
      if (result) {
        setPitch(result.frequency, result.note, result.cents);

        // Trigger account prompt after first successful pitch lock
        if (!pitchLockFiredRef.current && Math.abs(result.cents) < 10) {
          pitchLockFiredRef.current = true;
          setTimeout(() => triggerAccountPrompt(), 3000);
        }
      } else {
        setPitch(null, null, 0);
      }
    }, referencePitch);

    const ok = await tunerRef.current.start();
    setTunerActive(ok);
    if (!ok) setPitch(null, null, 0);
  }, [referencePitch, setPitch, setTunerActive]);

  const stopTuner = useCallback(() => {
    tunerRef.current?.stop();
    tunerRef.current = null;
    setTunerActive(false);
    setPitch(null, null, 0);
  }, [setTunerActive, setPitch]);

  // ─── Metronome engine ───────────────────────────────────────
  const metronomeRef = useRef<Metronome | null>(null);

  const startMetronome = useCallback(() => {
    if (metronomeRef.current?.isRunning) return;
    metronomeRef.current = new Metronome({
      bpm,
      beatsPerBar,
      onBeat: (beat) => setCurrentBeat(beat),
    });
    metronomeRef.current.start();
    setMetronomeActive(true);
  }, [bpm, beatsPerBar, setCurrentBeat, setMetronomeActive]);

  const stopMetronome = useCallback(() => {
    metronomeRef.current?.stop();
    metronomeRef.current = null;
    setMetronomeActive(false);
    setCurrentBeat(0);
  }, [setMetronomeActive, setCurrentBeat]);

  // Update metronome config live when bpm/time sig changes
  useEffect(() => {
    metronomeRef.current?.updateConfig({ bpm, beatsPerBar });
  }, [bpm, beatsPerBar]);

  // Update tuner reference pitch live
  useEffect(() => {
    tunerRef.current?.setReferencePitch(referencePitch);
  }, [referencePitch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      tunerRef.current?.stop();
      metronomeRef.current?.stop();
    };
  }, []);

  // Reset instrument tuning on change
  useEffect(() => {
    setCurrentTuning(getDefaultTuning(instrument));
    setSelectedStringIndex(null);
  }, [instrument]);

  const handleToggleMetronome = () => {
    if (metronomeActive) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const handleToggleTuner = async () => {
    if (tunerActive) {
      stopTuner();
    } else {
      await startTuner();
    }
  };

  const tunings = getTuningsForInstrument(instrument);
  const targetHz = selectedStringIndex !== null
    ? currentTuning.strings[selectedStringIndex]?.hz ?? null
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>TUNE</Text>
        <View style={[styles.modeToggle, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Pressable
            onPress={() => { stopMetronome(); setMode('tuner'); }}
            style={[styles.modeBtn, mode === 'tuner' && { backgroundColor: C.accent }]}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'tuner' ? '#FFF' : C.muted }]}>Tuner</Text>
          </Pressable>
          <Pressable
            onPress={() => { stopTuner(); setMode('metronome'); }}
            style={[styles.modeBtn, mode === 'metronome' && { backgroundColor: C.accent }]}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'metronome' ? '#FFF' : C.muted }]}>Metronome</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'tuner' ? (
          <>
            {/* Display mode toggle */}
            <View style={styles.displayToggle}>
              {(['needle', 'strobe'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setTunerDisplayMode(m)}
                  style={[
                    styles.displayBtn,
                    { borderColor: C.border },
                    tunerDisplayMode === m && { backgroundColor: C.accentMuted, borderColor: C.accent },
                  ]}
                >
                  <Text style={[styles.displayBtnText, { color: tunerDisplayMode === m ? C.accent : C.muted }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Pitch display */}
            <View style={styles.displayContainer}>
              {tunerDisplayMode === 'needle' ? (
                <NeedleDisplay
                  note={noteName}
                  octave={noteName ? (pitchHz ? Math.floor(12 * Math.log2(pitchHz / 440) / 12) + 4 : null) : null}
                  cents={centsOffset}
                  frequency={pitchHz}
                  active={tunerActive}
                />
              ) : (
                <StrobeDisplay
                  note={noteName}
                  octave={noteName ? (pitchHz ? Math.floor(12 * Math.log2(pitchHz / 440) / 12) + 4 : null) : null}
                  cents={centsOffset}
                  active={tunerActive}
                />
              )}
            </View>

            {/* String selector */}
            <StringSelector
              strings={currentTuning.strings}
              selectedIndex={selectedStringIndex}
              onSelect={setSelectedStringIndex}
              targetFrequency={targetHz}
            />

            {/* Tuning picker trigger */}
            <Pressable
              onPress={() => setShowTuningPicker(true)}
              style={[styles.tuningRow, { backgroundColor: C.surface, borderColor: C.border }]}
            >
              <View>
                <Text style={[styles.tuningLabel, { color: C.muted }]}>TUNING</Text>
                <Text style={[styles.tuningName, { color: C.text }]}>{currentTuning.name}</Text>
              </View>
              <Text style={[styles.chevron, { color: C.muted }]}>›</Text>
            </Pressable>

            {/* Reference pitch */}
            <View style={[styles.refPitchRow, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.tuningLabel, { color: C.muted }]}>REFERENCE</Text>
              <View style={styles.refPitchButtons}>
                {[432, 440, 442, 444].map((hz) => (
                  <Pressable
                    key={hz}
                    onPress={() => useAudioStore.getState().setReferencePitch(hz)}
                    style={[
                      styles.refBtn,
                      { borderColor: C.border },
                      referencePitch === hz && { backgroundColor: C.accentMuted, borderColor: C.accent },
                    ]}
                  >
                    <Text style={[styles.refBtnText, { color: referencePitch === hz ? C.accent : C.muted }]}>
                      A={hz}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Start/Stop tuner */}
            <Pressable
              onPress={handleToggleTuner}
              style={[
                styles.startBtn,
                { backgroundColor: tunerActive ? C.danger : C.accent },
              ]}
            >
              <View style={[styles.startBtnDot, { backgroundColor: tunerActive ? C.danger : '#FFF' }]} />
              <Text style={styles.startBtnText}>
                {tunerActive ? 'STOP TUNING' : 'START TUNING'}
              </Text>
            </Pressable>

            <TuningPicker
              visible={showTuningPicker}
              tunings={tunings}
              selectedId={currentTuning.id}
              onSelect={(t) => { setCurrentTuning(t); setSelectedStringIndex(null); }}
              onClose={() => setShowTuningPicker(false)}
            />
          </>
        ) : (
          <>
            {/* Metronome */}
            <BpmWheel bpm={bpm} onBpmChange={setBpm} />

            <BeatRow
              beatsPerBar={beatsPerBar}
              currentBeat={currentBeat}
              isActive={metronomeActive}
              onTimeSigChange={setTimeSignature}
              beatUnit={beatUnit}
            />

            <Pressable
              onPress={handleToggleMetronome}
              style={[
                styles.startBtn,
                { backgroundColor: metronomeActive ? C.danger : C.accent },
              ]}
            >
              <View style={[styles.startBtnDot, { backgroundColor: metronomeActive ? C.danger : '#FFF' }]} />
              <Text style={styles.startBtnText}>
                {metronomeActive ? 'STOP' : 'START'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  modeBtn: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  displayToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  displayBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  displayBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  displayContainer: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
  },
  tuningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tuningLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  tuningName: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
  },
  refPitchRow: {
    width: '90%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  refPitchButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  refBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  refBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '80%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  startBtnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

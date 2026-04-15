/**
 * Key & Pitch tab — real-time key detection + scale/chord tools.
 *
 * Uses the same TunerEngine for mic input. Feeds detected frequencies
 * into KeyDetector to identify the musical key. Shows diatonic chords,
 * fretboard diagram, and capo advisor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChordSuggestionCard } from '@/components/key/chord-suggestion-card';
import { FretboardDiagram } from '@/components/key/fretboard-diagram';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDefaultTuning } from '@/constants/tunings';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TunerEngine } from '@/lib/audio/tuner-engine';
import { KeyDetector, getDiatonicChords, type KeyResult } from '@/lib/audio/key-detector';
import { fetchAiResponse } from '@/lib/ai/tone-chat';
import { useInstrumentStore } from '@/store/instrument-store';
import { useUserStore } from '@/store/user-store';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['major', 'minor'] as const;

export default function KeyScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const instrument = useInstrumentStore((s) => s.instrument);
  const user = useUserStore((s) => s.user);

  // ─── Detection state ────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [detectedKey, setDetectedKey] = useState<KeyResult | null>(null);
  const [manualRoot, setManualRoot] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<'major' | 'minor'>('major');

  // ─── AI chord suggestions ────────────────────────────────────
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ─── Capo ────────────────────────────────────────────────────
  const [capoFret, setCapoFret] = useState(0);

  const tunerRef = useRef<TunerEngine | null>(null);
  const detectorRef = useRef(new KeyDetector());

  const activeRoot = manualRoot ?? detectedKey?.root ?? null;
  const activeMode = manualRoot ? manualMode : detectedKey?.mode ?? 'major';
  const activeKey = activeRoot ? { root: activeRoot, mode: activeMode } : null;

  const chords = activeKey ? getDiatonicChords(activeKey.root, activeKey.mode) : [];
  const tuning = getDefaultTuning(instrument);

  // Capo-transposed root
  const capoRoot = activeRoot
    ? NOTE_NAMES[(NOTE_NAMES.indexOf(activeRoot) + capoFret + 12) % 12]
    : null;

  const startListening = useCallback(async () => {
    detectorRef.current.reset();
    tunerRef.current = new TunerEngine((result) => {
      if (result && result.probability > 0.8) {
        detectorRef.current.addFrequency(result.frequency, result.probability);
        const detected = detectorRef.current.detect();
        if (detected) setDetectedKey(detected);
      }
    });
    const ok = await tunerRef.current.start();
    setIsListening(ok);
    if (!ok) setIsListening(false);
  }, []);

  const stopListening = useCallback(() => {
    tunerRef.current?.stop();
    tunerRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => () => tunerRef.current?.stop(), []);

  const handleAskChords = useCallback(async (chord: string) => {
    if (!user || !activeKey) return;
    setIsAiLoading(true);
    const response = await fetchAiResponse({
      message: `Suggest chord progressions in ${activeKey.root} ${activeKey.mode} that feature a ${chord} chord. Include at least 2 options with different feels.`,
      feature: 'chord-suggestions',
    });
    setAiSuggestion(response);
    setIsAiLoading(false);
  }, [user, activeKey]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>KEY & PITCH</Text>
        </View>

        {/* Key display */}
        <View style={[styles.keyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {activeKey ? (
            <>
              <Text style={[styles.keyRoot, { color: C.accent }]}>{activeKey.root}</Text>
              <Text style={[styles.keyMode, { color: C.muted }]}>{activeKey.mode}</Text>
              {detectedKey && !manualRoot && (
                <Text style={[styles.confidence, { color: C.muted }]}>
                  {Math.round(detectedKey.confidence * 100)}% confidence
                </Text>
              )}
              {activeKey && (
                <Text style={[styles.scaleNotes, { color: C.muted }]}>
                  {getDiatonicChords(activeKey.root, activeKey.mode)
                    .map((c) => c.chord)
                    .join('  –  ')}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.noKey, { color: C.muted }]}>
              {isListening ? 'Listening…' : 'Tap Detect or select a key below'}
            </Text>
          )}
        </View>

        {/* Detect button */}
        <Pressable
          onPress={isListening ? stopListening : startListening}
          style={[
            styles.detectBtn,
            { backgroundColor: isListening ? C.danger : C.accent },
          ]}
        >
          <Text style={styles.detectBtnText}>
            {isListening ? '⏹ Stop Listening' : '🎤 Detect from Mic'}
          </Text>
        </Pressable>

        {/* Manual key picker */}
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>SELECT KEY MANUALLY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noteScroll}>
            {NOTE_NAMES.map((n) => (
              <Pressable
                key={n}
                onPress={() => setManualRoot(manualRoot === n ? null : n)}
                style={[
                  styles.noteChip,
                  { borderColor: C.border, backgroundColor: C.card },
                  manualRoot === n && { borderColor: C.accent, backgroundColor: C.accentMuted },
                ]}
              >
                <Text style={[styles.noteChipText, { color: manualRoot === n ? C.accent : C.text }]}>{n}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.modeRow}>
            {MODES.map((m) => (
              <Pressable
                key={m}
                onPress={() => setManualMode(m)}
                style={[
                  styles.modeChip,
                  { borderColor: C.border },
                  manualMode === m && { borderColor: C.accent, backgroundColor: C.accentMuted },
                ]}
              >
                <Text style={[styles.modeChipText, { color: manualMode === m ? C.accent : C.muted }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Diatonic chords */}
        {chords.length > 0 && (
          <ChordSuggestionCard
            chords={chords}
            onAskAI={user ? handleAskChords : undefined}
          />
        )}

        {/* AI chord suggestions */}
        {(aiSuggestion || isAiLoading) && (
          <View style={[styles.aiCard, { backgroundColor: C.surface, borderColor: C.accent }]}>
            <Text style={[styles.aiLabel, { color: C.accent }]}>✦ AI Chord Suggestions</Text>
            <Text style={[styles.aiText, { color: C.text }]}>
              {isAiLoading ? 'Generating suggestions…' : aiSuggestion}
            </Text>
          </View>
        )}

        {/* Capo advisor */}
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>CAPO ADVISOR</Text>
          <View style={styles.capoRow}>
            {Array.from({ length: 8 }).map((_, f) => (
              <Pressable
                key={f}
                onPress={() => setCapoFret(f)}
                style={[
                  styles.capoFret,
                  { borderColor: C.border },
                  capoFret === f && { borderColor: C.accent, backgroundColor: C.accentMuted },
                ]}
              >
                <Text style={[styles.capoFretText, { color: capoFret === f ? C.accent : C.muted }]}>
                  {f === 0 ? 'No\ncapo' : `Fret\n${f}`}
                </Text>
              </Pressable>
            ))}
          </View>
          {activeKey && capoFret > 0 && (
            <Text style={[styles.capoResult, { color: C.text }]}>
              Capo {capoFret}: Chord shapes from{' '}
              <Text style={{ color: C.accent, fontWeight: '700' }}>
                {NOTE_NAMES[(NOTE_NAMES.indexOf(activeKey.root) - capoFret + 12) % 12]} {activeKey.mode}
              </Text>
              {' '}sound like{' '}
              <Text style={{ color: C.accent, fontWeight: '700' }}>
                {activeKey.root} {activeKey.mode}
              </Text>
            </Text>
          )}
        </View>

        {/* Fretboard (guitar/bass only) */}
        {(instrument === 'guitarist' || instrument === 'bassist') && activeKey && (
          <FretboardDiagram
            rootNote={activeKey.root}
            scaleNotes={chords.map((c) => c.chord.replace('m', '').replace('dim', '').replace('maj', ''))}
            openStrings={tuning.strings.map((s) => s.note).reverse()}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: Spacing.xxl, gap: Spacing.md },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  keyCard: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    gap: 4,
  },
  keyRoot: { fontSize: 60, fontWeight: '800', letterSpacing: -2 },
  keyMode: { fontSize: 18, fontWeight: '500' },
  confidence: { fontSize: 12, marginTop: 4 },
  scaleNotes: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  noKey: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  detectBtn: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  detectBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  section: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  noteScroll: { marginHorizontal: -Spacing.md },
  noteChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginLeft: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  noteChipText: { fontSize: 14, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modeChipText: { fontSize: 14, fontWeight: '600' },
  aiCard: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  aiLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  aiText: { fontSize: 14, lineHeight: 22 },
  capoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  capoFret: {
    width: 56,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  capoFretText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  capoResult: { fontSize: 13, lineHeight: 20 },
});

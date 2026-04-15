/**
 * Song editor — create or edit a song record.
 * Pushed from the Compose tab; presented as a full stack screen.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createSong, getSong, updateSong, deleteSong, type Song } from '@/lib/db/songs';
import { scheduleSyncDebounced } from '@/lib/sync/uploader';
import { fetchAiResponse } from '@/lib/ai/tone-chat';
import { useUserStore } from '@/store/user-store';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIME_SIGS = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8'];
const TUNINGS = ['standard', 'drop-d', 'half-down', 'open-g', 'open-d', 'dadgad'];

export default function SongEditorScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const { songId } = useLocalSearchParams<{ songId?: string }>();
  const user = useUserStore((s) => s.user);

  const isEdit = !!songId;

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [tuning, setTuning] = useState('standard');
  const [capo, setCapo] = useState(0);
  const [tempo, setTempo] = useState('');
  const [timeSig, setTimeSig] = useState('4/4');
  const [lyrics, setLyrics] = useState('');
  const [chordChart, setChordChart] = useState('');
  const [aiChords, setAiChords] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (songId) {
      getSong(songId).then((s) => {
        if (!s) return;
        setTitle(s.title);
        setArtist(s.artist);
        setSongKey(s.song_key);
        setMode(s.mode);
        setTuning(s.tuning);
        setCapo(s.capo);
        setTempo(s.tempo?.toString() ?? '');
        setTimeSig(s.time_sig);
        setLyrics(s.lyrics ?? '');
        setChordChart(s.chord_chart ?? '');
      });
    }
  }, [songId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a song title.');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        title: title.trim(),
        artist: artist.trim(),
        song_key: songKey,
        mode,
        tuning,
        capo,
        tempo: tempo ? parseInt(tempo, 10) : null,
        time_sig: timeSig,
        lyrics: lyrics.trim() || null,
        chord_chart: chordChart.trim() || null,
      };
      if (isEdit && songId) {
        await updateSong(songId, data);
      } else {
        await createSong(data);
      }
      scheduleSyncDebounced();
      router.back();
    } finally {
      setIsSaving(false);
    }
  }, [title, artist, songKey, mode, tuning, capo, tempo, timeSig, lyrics, chordChart, isEdit, songId]);

  const handleDelete = useCallback(() => {
    if (!isEdit || !songId) return;
    Alert.alert('Delete Song', `Delete "${title || 'this song'}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSong(songId);
          scheduleSyncDebounced();
          router.back();
        },
      },
    ]);
  }, [isEdit, songId, title]);

  const handleAiChords = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'AI features require an account.');
      return;
    }
    setIsAiLoading(true);
    const response = await fetchAiResponse({
      message: `Suggest 3 chord progressions for a song in ${songKey} ${mode}, ${timeSig} time, ${tempo ? tempo + ' BPM' : 'any tempo'}. Include Roman numerals and actual chord names.`,
      feature: 'chord-suggestions',
    });
    setAiChords(response);
    setIsAiLoading(false);
  }, [user, songKey, mode, timeSig, tempo]);

  const field = (label: string, element: React.ReactNode) => (
    <View style={styles.field} key={label}>
      <Text style={[styles.fieldLabel, { color: C.muted }]}>{label}</Text>
      {element}
    </View>
  );

  const inputStyle = [styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.card }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: C.accent }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text }]}>{isEdit ? 'Edit Song' : 'New Song'}</Text>
          <Pressable onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.saveBtn, { color: C.accent, opacity: isSaving ? 0.5 : 1 }]}>
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic info */}
          {field('TITLE', (
            <TextInput
              value={title} onChangeText={setTitle}
              placeholder="Song title" placeholderTextColor={C.muted}
              style={inputStyle}
            />
          ))}
          {field('ARTIST', (
            <TextInput
              value={artist} onChangeText={setArtist}
              placeholder="Artist name" placeholderTextColor={C.muted}
              style={inputStyle}
            />
          ))}

          {/* Key */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: C.muted }]}>KEY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {NOTE_NAMES.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setSongKey(n)}
                  style={[styles.chip, { borderColor: C.border }, songKey === n && { borderColor: C.accent, backgroundColor: C.accentMuted }]}
                >
                  <Text style={[styles.chipText, { color: songKey === n ? C.accent : C.text }]}>{n}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modeRow}>
              {(['major', 'minor'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.chip, { borderColor: C.border, flex: 1, alignItems: 'center' }, mode === m && { borderColor: C.accent, backgroundColor: C.accentMuted }]}
                >
                  <Text style={[styles.chipText, { color: mode === m ? C.accent : C.muted }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tuning + Capo */}
          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={[styles.fieldLabel, { color: C.muted }]}>TUNING</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TUNINGS.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTuning(t)}
                    style={[styles.chip, { borderColor: C.border }, tuning === t && { borderColor: C.accent, backgroundColor: C.accentMuted }]}
                  >
                    <Text style={[styles.chipText, { color: tuning === t ? C.accent : C.muted, fontSize: 11 }]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: C.muted }]}>CAPO</Text>
              <View style={styles.capoRow}>
                <Pressable onPress={() => setCapo(Math.max(0, capo - 1))} style={styles.capoBtn}>
                  <Text style={[styles.capoBtnText, { color: C.text }]}>−</Text>
                </Pressable>
                <Text style={[styles.capoValue, { color: C.text }]}>{capo}</Text>
                <Pressable onPress={() => setCapo(Math.min(12, capo + 1))} style={styles.capoBtn}>
                  <Text style={[styles.capoBtnText, { color: C.text }]}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Tempo + Time sig */}
          <View style={styles.rowFields}>
            {field('TEMPO (BPM)', (
              <TextInput
                value={tempo} onChangeText={setTempo}
                keyboardType="number-pad" placeholder="—"
                placeholderTextColor={C.muted} style={inputStyle}
              />
            ))}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: C.muted }]}>TIME SIG</Text>
              <View style={styles.timeSigRow}>
                {TIME_SIGS.map((ts) => (
                  <Pressable
                    key={ts}
                    onPress={() => setTimeSig(ts)}
                    style={[styles.chip, { borderColor: C.border }, timeSig === ts && { borderColor: C.accent, backgroundColor: C.accentMuted }]}
                  >
                    <Text style={[styles.chipText, { color: timeSig === ts ? C.accent : C.muted }]}>{ts}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* AI Chord suggestions */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: C.muted }]}>AI CHORD PROGRESSIONS</Text>
            <Pressable
              onPress={handleAiChords}
              style={[styles.aiBtn, { borderColor: C.accent, backgroundColor: C.accentMuted }]}
            >
              <Text style={[styles.aiBtnText, { color: C.accent }]}>
                {isAiLoading ? '✦ Generating…' : `✦ Suggest for ${songKey} ${mode}`}
              </Text>
            </Pressable>
            {aiChords ? (
              <Text style={[styles.aiResult, { color: C.text, backgroundColor: C.surface, borderColor: C.border }]}>
                {aiChords}
              </Text>
            ) : null}
          </View>

          {/* Chord chart */}
          {field('CHORD CHART', (
            <TextInput
              value={chordChart} onChangeText={setChordChart}
              placeholder="Enter chords (e.g. Am G F E7…)"
              placeholderTextColor={C.muted}
              style={[inputStyle, styles.multiline]}
              multiline
              numberOfLines={4}
            />
          ))}

          {/* Lyrics */}
          {field('LYRICS', (
            <TextInput
              value={lyrics} onChangeText={setLyrics}
              placeholder="Verse 1:&#10;…"
              placeholderTextColor={C.muted}
              style={[inputStyle, styles.multiline, { minHeight: 150 }]}
              multiline
            />
          ))}

          {/* Delete */}
          {isEdit && (
            <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: C.danger }]}>
              <Text style={[styles.deleteBtnText, { color: C.danger }]}>Delete Song</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 16, fontWeight: '700' },
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  field: { gap: Spacing.sm },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  input: {
    borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, fontSize: 15, height: 48,
  },
  multiline: { height: undefined, minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.sm },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md, borderWidth: 1, marginRight: Spacing.xs,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  rowFields: { flexDirection: 'row', gap: Spacing.md },
  capoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  capoBtn: { padding: Spacing.sm },
  capoBtnText: { fontSize: 22, fontWeight: '600' },
  capoValue: { fontSize: 22, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  timeSigRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  aiBtn: {
    borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md, alignItems: 'center',
  },
  aiBtnText: { fontSize: 14, fontWeight: '700' },
  aiResult: {
    borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md,
    fontSize: 13, lineHeight: 20,
  },
  deleteBtn: {
    borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.sm + 4,
    alignItems: 'center', marginTop: Spacing.md,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
});

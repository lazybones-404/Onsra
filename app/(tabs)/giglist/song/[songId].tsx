import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useGigListStore } from '@/store/giglist-store';
import { useSessionStore } from '@/store/session-store';
import { ChordChartView } from '@/components/giglist/chord-chart-editor/chord-chart-view';
import { CursorsOverlay } from '@/components/giglist/collaboration-cursor/cursors-overlay';
import { SupabaseYjsProvider, type CollaboratorInfo } from '@/lib/collaboration/supabase-provider';
import { transposeChart, transposeKey, getTransposeOptions } from '@/lib/giglist/chord-transposer';
import { streamAiResponse } from '@/lib/ai/ai-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChordChartEntry } from '@/lib/supabase/types';
import { colors } from '@/constants/theme';

const COLLABORATOR_COLORS = [
  '#7C6CF7', '#F75C7C', '#F7A85C', '#5CF7A8', '#5C8AF7', '#F75CE5',
];

type Tab = 'chart' | 'lyrics' | 'info';

export default function SongEditorScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const navigation = useNavigation();
  const { songs, updateSong } = useGigListStore();
  const user = useSessionStore((s) => s.user);

  const song = songs.find((s) => s.id === songId);

  const [activeTab, setActiveTab] = useState<Tab>('chart');
  const [lyrics, setLyrics] = useState(song?.lyrics_raw ?? '');
  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const [songKey, setSongKey] = useState(song?.song_key ?? '');
  const [bpm, setBpm] = useState(song?.bpm?.toString() ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [showTranspose, setShowTranspose] = useState(false);
  const providerRef = useRef<SupabaseYjsProvider | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: song?.title ?? 'Song Editor' });
  }, [song?.title]);

  // Collaboration setup
  useEffect(() => {
    if (!user || !songId || !song) return;

    const initCollab = async () => {
      const { createSongDoc } = await import('@/lib/collaboration/supabase-provider');
      const doc = createSongDoc(song.lyrics_raw ?? '');
      const color = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
      const provider = new SupabaseYjsProvider(doc, `song-${songId}`, user.id, {
        userId: user.id,
        displayName: user.email?.split('@')[0] ?? 'User',
        color,
      });

      provider.onAwarenessUpdate(setCollaborators);

      try {
        await provider.connect();
        providerRef.current = provider;
      } catch (err) {
        console.error('[SongEditor] Collab connect failed:', err);
      }
    };

    initCollab();
    return () => {
      providerRef.current?.disconnect();
    };
  }, [user, songId]);

  async function handleAiChordPlacement() {
    if (!lyrics.trim() || !user) return;
    setIsGenerating(true);

    try {
      let fullResponse = '';
      for await (const token of streamAiResponse(
        'lyric-chord-assist',
        `Generate a chord chart for these lyrics:\n\n${lyrics}`,
        { key: songKey || 'C major', title, artist }
      )) {
        fullResponse += token;
      }

      // Parse the JSON response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response format');

      const parsed = JSON.parse(jsonMatch[0]) as {
        chart: ChordChartEntry[];
        key: string;
        summary: string;
      };

      if (!parsed.chart) throw new Error('No chart in response');

      await updateSong(songId!, {
        chord_chart: parsed.chart,
        song_key: parsed.key || songKey || null,
        lyrics_raw: lyrics,
      });

      if (parsed.key && !songKey) setSongKey(parsed.key);
      Alert.alert('Chart Generated', parsed.summary ?? 'Chord chart created successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      Alert.alert('Error', msg);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!songId) return;
    await updateSong(songId, {
      title: title.trim() || 'Untitled',
      artist: artist.trim() || null,
      song_key: songKey.trim() || null,
      bpm: bpm ? parseInt(bpm) : null,
      lyrics_raw: lyrics,
    });
  }

  function handleTranspose(semitones: number) {
    if (!song || !songId) return;
    const newChart = transposeChart(song.chord_chart, semitones);
    const newKey = transposeKey(song.song_key, semitones);
    updateSong(songId, { chord_chart: newChart, song_key: newKey });
    setSongKey(newKey ?? '');
    setTransposeOffset((prev) => prev + semitones);
  }

  if (!song) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Song not found</Text>
      </SafeAreaView>
    );
  }

  const displayChart = song.chord_chart;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/* Active collaborators */}
      {collaborators.length > 0 && (
        <CursorsOverlay collaborators={collaborators} currentUserId={user?.id ?? ''} />
      )}

      {/* Tab bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
        {(['chart', 'lyrics', 'info'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeTab === tab ? colors.accent : colors.surface,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : colors.muted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart tab */}
      {activeTab === 'chart' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}>
            {/* Song key + transpose */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Key</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                  {song.song_key ?? '—'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTranspose((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: showTranspose ? colors.accentMuted : colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <MaterialIcons name="swap-horiz" size={16} color={showTranspose ? colors.accent : colors.muted} />
                <Text style={{ color: showTranspose ? colors.accent : colors.muted, fontSize: 13, fontWeight: '600' }}>Transpose</Text>
              </TouchableOpacity>
            </View>

            {/* Transpose options */}
            {showTranspose && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                {getTransposeOptions(song.song_key).map((opt) => (
                  <TouchableOpacity
                    key={opt.semitones}
                    onPress={() => {
                      handleTranspose(opt.semitones - transposeOffset);
                      setTransposeOffset(opt.semitones);
                      setShowTranspose(false);
                    }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: transposeOffset === opt.semitones ? colors.accent : colors.surface,
                      borderWidth: 1,
                      borderColor: transposeOffset === opt.semitones ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{ color: transposeOffset === opt.semitones ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '600' }}>
                      {opt.label}
                    </Text>
                    {opt.capo !== null && (
                      <Text style={{ color: colors.muted, fontSize: 10 }}>Capo {opt.capo}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* AI generate button */}
            {displayChart.length === 0 && (
              <Card className="p-4 mb-4 items-center gap-3">
                <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
                <Text className="text-foreground font-semibold text-center">Generate chord chart with AI</Text>
                <Text className="text-muted text-sm text-center">
                  Add lyrics in the Lyrics tab, then let AI place chords automatically.
                </Text>
                {user ? (
                  <Button
                    title={isGenerating ? 'Generating...' : 'Generate Chords with AI'}
                    onPress={handleAiChordPlacement}
                    loading={isGenerating}
                    disabled={!lyrics.trim()}
                  />
                ) : (
                  <Text className="text-muted text-xs">Sign in required for AI features</Text>
                )}
              </Card>
            )}

            {/* Chart view */}
            <ChordChartView
              chart={displayChart}
              editable
              onUpdate={(chart) => updateSong(songId!, { chord_chart: chart })}
            />

            {/* Regenerate if chart exists */}
            {displayChart.length > 0 && user && (
              <Button
                title={isGenerating ? 'Regenerating...' : 'Regenerate with AI'}
                onPress={handleAiChordPlacement}
                loading={isGenerating}
                variant="secondary"
                className="mt-4"
                disabled={!lyrics.trim()}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Lyrics tab */}
      {activeTab === 'lyrics' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TextInput
            value={lyrics}
            onChangeText={setLyrics}
            onBlur={handleSave}
            placeholder="Paste or type your lyrics here..."
            placeholderTextColor={colors.mutedDark}
            multiline
            textAlignVertical="top"
            style={{
              flex: 1,
              padding: 20,
              color: colors.foreground,
              fontSize: 15,
              lineHeight: 24,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}
          />
        </KeyboardAvoidingView>
      )}

      {/* Info tab */}
      {activeTab === 'info' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {[
              { label: 'Title', value: title, onChange: setTitle, placeholder: 'Song title' },
              { label: 'Artist', value: artist, onChange: setArtist, placeholder: 'Artist name' },
              { label: 'Key', value: songKey, onChange: setSongKey, placeholder: 'e.g. Am, C major' },
              { label: 'BPM', value: bpm, onChange: setBpm, placeholder: 'e.g. 120', keyboardType: 'numeric' as const },
            ].map((field) => (
              <View key={field.label}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  {field.label}
                </Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={handleSave}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedDark}
                  keyboardType={field.keyboardType}
                  style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

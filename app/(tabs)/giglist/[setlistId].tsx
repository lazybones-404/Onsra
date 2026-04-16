import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useGigListStore } from '@/store/giglist-store';
import { SetlistTimer } from '@/components/giglist/setlist/setlist-timer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { colors } from '@/constants/theme';

export default function SetlistDetailScreen() {
  const { setlistId } = useLocalSearchParams<{ setlistId: string }>();
  const { setlists, setlistSongs, loadSetlistSongs, createSong, addSongToSetlist, removeSongFromSetlist } = useGigListStore();
  const [showAddSong, setShowAddSong] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [showTimer, setShowTimer] = useState(false);

  const setlist = setlists.find((s) => s.id === setlistId);
  const songs = setlistSongs[setlistId ?? ''] ?? [];
  const totalSeconds = songs.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

  useEffect(() => {
    if (setlistId) loadSetlistSongs(setlistId);
  }, [setlistId]);

  async function handleAddSong() {
    if (!newTitle.trim() || !setlistId) return;
    const song = await createSong({
      title: newTitle.trim(),
      artist: newArtist.trim() || null,
      lyrics_raw: null,
      song_key: null,
      bpm: null,
      duration_seconds: newDuration ? parseInt(newDuration) * 60 : null,
    });
    await addSongToSetlist(setlistId, song.id);
    setNewTitle('');
    setNewArtist('');
    setNewDuration('');
    setShowAddSong(false);
  }

  function handleRemoveSong(songId: string, title: string) {
    if (!setlistId) return;
    Alert.alert('Remove Song', `Remove "${title}" from this setlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSongFromSetlist(setlistId, songId) },
    ]);
  }

  if (!setlist) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Setlist not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      >
        {/* Setlist title */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">{setlist.name}</Text>
            <Text className="text-muted text-sm mt-1">
              {songs.length} song{songs.length !== 1 ? 's' : ''}
              {totalSeconds > 0 && ` · ~${Math.round(totalSeconds / 60)} min`}
            </Text>
          </View>
          {totalSeconds > 0 && (
            <TouchableOpacity
              onPress={() => setShowTimer((v) => !v)}
              style={{ padding: 8, borderRadius: 12, backgroundColor: colors.surface }}
            >
              <MaterialIcons name="timer" size={22} color={showTimer ? colors.accent : colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Timer */}
        {showTimer && totalSeconds > 0 && (
          <View className="mb-5">
            <SetlistTimer totalSeconds={totalSeconds} />
          </View>
        )}

        {/* Songs list */}
        {songs.length === 0 ? (
          <Card className="p-6 items-center gap-3 mb-5">
            <MaterialIcons name="music-note" size={36} color={colors.border} />
            <Text className="text-muted text-base">No songs in this setlist yet</Text>
            <Button title="Add First Song" onPress={() => setShowAddSong(true)} variant="secondary" />
          </Card>
        ) : (
          <View className="mb-5 gap-2">
            {songs.map((song, i) => (
              <TouchableOpacity
                key={song.id}
                onPress={() => router.push(`/(tabs)/giglist/song/${song.id}` as never)}
                activeOpacity={0.8}
              >
                <Card className="p-4 flex-row items-center gap-3">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.accentMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>
                      {i + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{song.title}</Text>
                    {song.artist && <Text className="text-muted text-sm">{song.artist}</Text>}
                    <View className="flex-row gap-3 mt-1">
                      {song.song_key && <Text className="text-muted-dark text-xs">Key: {song.song_key}</Text>}
                      {song.bpm && <Text className="text-muted-dark text-xs">{song.bpm} BPM</Text>}
                      {song.duration_seconds && <Text className="text-muted-dark text-xs">{Math.round(song.duration_seconds / 60)} min</Text>}
                      {song.chord_chart.length > 0 && (
                        <Text className="text-accent text-xs">Chart ✓</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveSong(song.id, song.title)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="remove-circle-outline" size={20} color={colors.mutedDark} />
                  </TouchableOpacity>
                  <MaterialIcons name="chevron-right" size={18} color={colors.mutedDark} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Button
          title="Add Song"
          onPress={() => setShowAddSong(true)}
          variant="secondary"
        />
      </ScrollView>

      {/* Add song modal */}
      <Modal visible={showAddSong} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSong(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>Add Song</Text>
            <TouchableOpacity onPress={() => setShowAddSong(false)}>
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Title *</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Song title"
                placeholderTextColor={colors.mutedDark}
                autoFocus
                style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Artist</Text>
              <TextInput
                value={newArtist}
                onChangeText={setNewArtist}
                placeholder="Artist name (optional)"
                placeholderTextColor={colors.mutedDark}
                style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Duration (minutes)</Text>
              <TextInput
                value={newDuration}
                onChangeText={setNewDuration}
                placeholder="e.g. 4"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedDark}
                style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            <Button title="Add to Setlist" onPress={handleAddSong} size="lg" disabled={!newTitle.trim()} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Compose tab — Songs library, Setlists builder, and Practice Log.
 * Three sections accessible via a segmented control.
 * All data stored in SQLite first; synced to Supabase when signed in.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { SongCard } from '@/components/compose/song-card';
import { SetlistRow } from '@/components/compose/setlist-row';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllSongs, deleteSong, type Song } from '@/lib/db/songs';
import {
  getAllSetlists, createSetlist, deleteSetlist, getSetlistEntries,
  removeSongFromSetlist, moveEntryUp, moveEntryDown, addSongToSetlist,
  type Setlist, type SetlistEntry,
} from '@/lib/db/setlists';
import {
  getAllLogEntries, createLogEntry, deleteLogEntry, getCurrentStreak,
  type PracticeLogEntry,
} from '@/lib/db/practice-log';
import { scheduleSyncDebounced } from '@/lib/sync/uploader';

type Tab = 'songs' | 'setlists' | 'log';

export default function ComposeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const [activeTab, setActiveTab] = useState<Tab>('songs');

  // ─── Songs ────────────────────────────────────────────────
  const [songs, setSongs] = useState<Song[]>([]);

  // ─── Setlists ─────────────────────────────────────────────
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [setlistEntries, setSetlistEntries] = useState<SetlistEntry[]>([]);

  // ─── Practice Log ─────────────────────────────────────────
  const [logEntries, setLogEntries] = useState<PracticeLogEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [newDuration, setNewDuration] = useState('30');
  const [newNotes, setNewNotes] = useState('');

  const loadSongs = useCallback(async () => {
    setSongs(await getAllSongs());
  }, []);

  const loadSetlists = useCallback(async () => {
    setSetlists(await getAllSetlists());
  }, []);

  const loadLog = useCallback(async () => {
    const [entries, s] = await Promise.all([getAllLogEntries(), getCurrentStreak()]);
    setLogEntries(entries);
    setStreak(s);
  }, []);

  const loadSetlistEntries = useCallback(async (setlist: Setlist) => {
    const entries = await getSetlistEntries(setlist.id);
    setSetlistEntries(entries);
  }, []);

  useEffect(() => {
    void loadSongs();
    void loadSetlists();
    void loadLog();
  }, [loadSongs, loadSetlists, loadLog]);

  useEffect(() => {
    if (selectedSetlist) void loadSetlistEntries(selectedSetlist);
  }, [selectedSetlist, loadSetlistEntries]);

  // ─── Song actions ──────────────────────────────────────────
  const handleDeleteSong = async (id: string) => {
    Alert.alert('Delete Song', 'Delete this song?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSong(id);
          await loadSongs();
          scheduleSyncDebounced();
        },
      },
    ]);
  };

  // ─── Setlist actions ───────────────────────────────────────
  const handleCreateSetlist = () => {
    Alert.prompt('New Setlist', 'Name your setlist:', async (name) => {
      if (!name?.trim()) return;
      const s = await createSetlist(name.trim());
      await loadSetlists();
      setSelectedSetlist(s);
    });
  };

  const handleDeleteSetlist = (id: string) => {
    Alert.alert('Delete Setlist', 'Delete this setlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSetlist(id);
          setSelectedSetlist(null);
          await loadSetlists();
        },
      },
    ]);
  };

  const handleAddSongToSetlist = async () => {
    if (!selectedSetlist || songs.length === 0) return;
    const songNames = songs.map((s) => s.title || 'Untitled');
    Alert.alert(
      'Add Song',
      'Select a song to add:',
      [
        ...songs.slice(0, 8).map((s, i) => ({
          text: songNames[i] || 'Untitled',
          onPress: async () => {
            await addSongToSetlist(selectedSetlist.id, s.id);
            await loadSetlistEntries(selectedSetlist);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleRemoveFromSetlist = async (entry: SetlistEntry) => {
    if (!selectedSetlist) return;
    await removeSongFromSetlist(entry.id, selectedSetlist.id);
    await loadSetlistEntries(selectedSetlist);
  };

  const handleMoveUp = async (entry: SetlistEntry) => {
    if (!selectedSetlist) return;
    await moveEntryUp(entry.id, selectedSetlist.id);
    await loadSetlistEntries(selectedSetlist);
  };

  const handleMoveDown = async (entry: SetlistEntry) => {
    if (!selectedSetlist) return;
    await moveEntryDown(entry.id, selectedSetlist.id);
    await loadSetlistEntries(selectedSetlist);
  };

  // ─── Log actions ───────────────────────────────────────────
  const handleLogPractice = async () => {
    const mins = parseInt(newDuration, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid Duration', 'Enter a valid number of minutes.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    await createLogEntry({ date: today, duration_minutes: mins, notes: newNotes.trim() || undefined });
    setNewDuration('30');
    setNewNotes('');
    await loadLog();
  };

  const handleDeleteLog = async (id: string) => {
    await deleteLogEntry(id);
    await loadLog();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>COMPOSE</Text>
        {activeTab === 'songs' && (
          <Pressable
            onPress={() => router.push('/song-editor')}
            style={[styles.addBtn, { backgroundColor: C.accent }]}
          >
            <Text style={styles.addBtnText}>+ Song</Text>
          </Pressable>
        )}
        {activeTab === 'setlists' && (
          <Pressable
            onPress={handleCreateSetlist}
            style={[styles.addBtn, { backgroundColor: C.accent }]}
          >
            <Text style={styles.addBtnText}>+ Setlist</Text>
          </Pressable>
        )}
      </View>

      {/* Tab selector */}
      <View style={[styles.tabBar, { backgroundColor: C.surface, borderColor: C.border }]}>
        {(['songs', 'setlists', 'log'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => { setActiveTab(tab); setSelectedSetlist(null); }}
            style={[
              styles.tabBtn,
              activeTab === tab && { backgroundColor: C.accent },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : C.muted }]}>
              {tab === 'songs' ? `Songs (${songs.length})` : tab === 'setlists' ? `Setlists (${setlists.length})` : `Log`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'songs' && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {songs.length === 0 ? (
            <EmptyState
              icon="🎵"
              title="No songs yet"
              subtitle='Tap "+ Song" to add your first song.'
              C={C}
            />
          ) : (
            songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onPress={() => router.push({ pathname: '/song-editor', params: { songId: song.id } })}
                onDelete={handleDeleteSong}
              />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'setlists' && (
        <>
          {selectedSetlist ? (
            // ─── Setlist detail ────────────────────────────────
            <ScrollView contentContainerStyle={styles.list}>
              <Pressable onPress={() => setSelectedSetlist(null)} style={styles.backBtn}>
                <Text style={[styles.backText, { color: C.accent }]}>← All Setlists</Text>
              </Pressable>
              <View style={styles.setlistHeader}>
                <Text style={[styles.setlistTitle, { color: C.text }]}>{selectedSetlist.name}</Text>
                <View style={styles.setlistActions}>
                  <Pressable
                    onPress={handleAddSongToSetlist}
                    style={[styles.addBtn, { backgroundColor: C.accentMuted }]}
                  >
                    <Text style={[styles.addBtnText, { color: C.accent }]}>+ Add Song</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteSetlist(selectedSetlist.id)}>
                    <Text style={[styles.deleteText, { color: C.danger }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              {setlistEntries.length === 0 ? (
                <EmptyState icon="📋" title="Empty setlist" subtitle='Tap "+ Add Song" to build your set.' C={C} />
              ) : (
                setlistEntries.map((entry, i) => (
                  <SetlistRow
                    key={entry.id}
                    entry={entry}
                    position={i}
                    total={setlistEntries.length}
                    onMoveUp={() => handleMoveUp(entry)}
                    onMoveDown={() => handleMoveDown(entry)}
                    onRemove={() => handleRemoveFromSetlist(entry)}
                  />
                ))
              )}
            </ScrollView>
          ) : (
            // ─── Setlist list ──────────────────────────────────
            <ScrollView contentContainerStyle={styles.list}>
              {setlists.length === 0 ? (
                <EmptyState icon="📋" title="No setlists yet" subtitle='Tap "+ Setlist" to create one.' C={C} />
              ) : (
                setlists.map((sl) => (
                  <Pressable
                    key={sl.id}
                    onPress={() => setSelectedSetlist(sl)}
                    style={[styles.setlistCard, { backgroundColor: C.surface, borderColor: C.border }]}
                  >
                    <Text style={[styles.setlistCardName, { color: C.text }]}>{sl.name}</Text>
                    <Text style={[styles.setlistCardDate, { color: C.muted }]}>
                      {new Date(sl.updated_at).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.chevron, { color: C.muted }]}>›</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {activeTab === 'log' && (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Streak card */}
          <View style={[styles.streakCard, { backgroundColor: C.accentMuted, borderColor: C.accent }]}>
            <Text style={[styles.streakNumber, { color: C.accent }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: C.accent }]}>day streak 🔥</Text>
          </View>

          {/* Log new session */}
          <View style={[styles.logForm, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.logFormTitle, { color: C.text }]}>Log Today's Practice</Text>
            <View style={styles.logRow}>
              <TextInput
                value={newDuration}
                onChangeText={setNewDuration}
                keyboardType="number-pad"
                style={[styles.durationInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]}
              />
              <Text style={[styles.durationUnit, { color: C.muted }]}>minutes</Text>
            </View>
            <TextInput
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={C.muted}
              style={[styles.notesInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]}
              multiline
            />
            <Pressable onPress={handleLogPractice} style={[styles.logBtn, { backgroundColor: C.accent }]}>
              <Text style={styles.logBtnText}>Log Session</Text>
            </Pressable>
          </View>

          {/* Past entries */}
          {logEntries.length === 0 ? (
            <EmptyState icon="📅" title="No sessions logged" subtitle="Log your first practice session above." C={C} />
          ) : (
            logEntries.map((entry) => (
              <Pressable
                key={entry.id}
                onLongPress={() => {
                  Alert.alert('Delete Entry', 'Remove this log entry?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDeleteLog(entry.id) },
                  ]);
                }}
                style={[styles.logEntry, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <View style={styles.logEntryInfo}>
                  <Text style={[styles.logDate, { color: C.text }]}>{entry.date}</Text>
                  {entry.notes ? <Text style={[styles.logNotes, { color: C.muted }]} numberOfLines={2}>{entry.notes}</Text> : null}
                </View>
                <View style={styles.logMeta}>
                  <Text style={[styles.logMins, { color: C.accent }]}>{entry.duration_minutes} min</Text>
                  <Text style={[styles.logStreak, { color: C.muted }]}>🔥{entry.streak_count}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ icon, title, subtitle, C }: { icon: string; title: string; subtitle: string; C: typeof Colors['dark'] }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={[emptyStyles.title, { color: C.text }]}>{title}</Text>
      <Text style={[emptyStyles.subtitle, { color: C.muted }]}>{subtitle}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  addBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.md, borderRadius: Radius.full,
    borderWidth: 1, padding: 2, gap: 2, marginBottom: Spacing.sm,
  },
  tabBtn: { flex: 1, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '700' },
  list: { gap: Spacing.sm, paddingBottom: Spacing.xxl, paddingTop: Spacing.xs },
  setlistCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.md, marginHorizontal: Spacing.md, gap: Spacing.sm,
  },
  setlistCardName: { flex: 1, fontSize: 16, fontWeight: '700' },
  setlistCardDate: { fontSize: 12 },
  chevron: { fontSize: 22 },
  setlistHeader: {
    paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  setlistTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  setlistActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  deleteText: { fontSize: 14, fontWeight: '600' },
  backBtn: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  backText: { fontSize: 14, fontWeight: '600' },
  streakCard: {
    marginHorizontal: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, alignItems: 'center', flexDirection: 'row', gap: Spacing.md,
  },
  streakNumber: { fontSize: 48, fontWeight: '800' },
  streakLabel: { fontSize: 18, fontWeight: '600' },
  logForm: {
    marginHorizontal: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, gap: Spacing.sm,
  },
  logFormTitle: { fontSize: 15, fontWeight: '700' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  durationInput: {
    width: 80, height: 44, borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.sm, fontSize: 18, fontWeight: '700', textAlign: 'center',
  },
  durationUnit: { fontSize: 15 },
  notesInput: {
    borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm, fontSize: 14, minHeight: 60,
  },
  logBtn: { borderRadius: Radius.full, paddingVertical: Spacing.sm + 4, alignItems: 'center' },
  logBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  logEntry: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.md, marginHorizontal: Spacing.md, gap: Spacing.sm,
  },
  logEntryInfo: { flex: 1, gap: 4 },
  logDate: { fontSize: 15, fontWeight: '600' },
  logNotes: { fontSize: 13, lineHeight: 18 },
  logMeta: { alignItems: 'flex-end', gap: 4 },
  logMins: { fontSize: 16, fontWeight: '700' },
  logStreak: { fontSize: 12 },
});

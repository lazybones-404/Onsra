import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useGigListStore } from '@/store/giglist-store';
import { useSessionStore } from '@/store/session-store';
import { SetlistCard } from '@/components/giglist/setlist/setlist-card';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import { track, EVENTS } from '@/lib/analytics';
import { BannerAdView } from '@/components/ui/banner-ad';

export default function GigListScreen() {
  const user = useSessionStore((s) => s.user);
  const { setlists, songs, isLoading, loadSetlists, loadSongs, createSetlist, removeSetlist, setlistSongs } = useGigListStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadSetlists();
    loadSongs();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    await createSetlist(newName.trim());
    track(EVENTS.SETLIST_CREATED);
    setNewName('');
    setShowCreate(false);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Setlist', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSetlist(id) },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="queue-music" size={64} color={colors.border} />
          <Text className="text-foreground text-2xl font-bold mt-6 text-center">GigList</Text>
          <Text className="text-muted text-base mt-3 text-center leading-relaxed">
            Build chord charts, collaborate with your band, and time your sets.
          </Text>
          <Button
            title="Sign In to Get Started"
            onPress={() => router.push('/auth' as never)}
            className="mt-8 w-full"
            size="lg"
          />
          <Text className="text-muted-dark text-xs mt-4 text-center">
            Sign in required for collaboration and cloud sync
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mt-4 mb-4">
        <Text className="text-2xl font-bold text-foreground">GigList</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : setlists.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="library-music" size={56} color={colors.border} />
          <Text className="text-foreground text-lg font-semibold mt-5">No setlists yet</Text>
          <Text className="text-muted text-sm mt-2 text-center">
            Create your first setlist and start adding songs with chord charts.
          </Text>
          <Button title="Create Setlist" onPress={() => setShowCreate(true)} className="mt-6" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {setlists.map((sl) => (
            <SetlistCard
              key={sl.id}
              setlist={sl}
              songCount={(setlistSongs[sl.id] ?? []).length}
              onPress={() => router.push(`/(tabs)/giglist/${sl.id}` as never)}
              onDelete={() => handleDelete(sl.id, sl.name)}
            />
          ))}
        </ScrollView>
      )}

      {/* Banner ad — GigList is a non-tool screen */}
      <BannerAdView />

      {/* Create setlist modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>New Setlist</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Setlist Name
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Friday Night Gig"
              placeholderTextColor={colors.mutedDark}
              autoFocus
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 16,
                color: colors.foreground,
                fontSize: 17,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Button title="Create Setlist" onPress={handleCreate} size="lg" disabled={!newName.trim()} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

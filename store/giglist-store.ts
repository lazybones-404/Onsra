import { create } from 'zustand';
import {
  getAllSetlists,
  getAllSongs,
  upsertSetlist,
  upsertSong,
  deleteSetlist,
  deleteSong,
  getSetlistSongs,
  addSongToSetlist,
  removeSongFromSetlist,
  type LocalSetlist,
  type LocalSong,
} from '@/lib/db/schema';
import type { ChordChartEntry } from '@/lib/supabase/types';

type ParsedSong = Omit<LocalSong, 'chord_chart_json'> & {
  chord_chart: ChordChartEntry[];
};

function parseSong(s: LocalSong): ParsedSong {
  let chord_chart: ChordChartEntry[] = [];
  try {
    if (s.chord_chart_json) chord_chart = JSON.parse(s.chord_chart_json);
  } catch {}
  return { ...s, chord_chart };
}

interface GigListState {
  setlists: LocalSetlist[];
  songs: ParsedSong[];
  activeSetlistId: string | null;
  setlistSongs: Record<string, ParsedSong[]>;
  isLoading: boolean;

  loadSetlists: () => Promise<void>;
  loadSongs: () => Promise<void>;
  loadSetlistSongs: (setlistId: string) => Promise<void>;

  createSetlist: (name: string) => Promise<LocalSetlist>;
  removeSetlist: (id: string) => Promise<void>;
  setActiveSetlist: (id: string | null) => void;

  createSong: (song: Pick<LocalSong, 'title' | 'artist' | 'lyrics_raw' | 'song_key' | 'bpm' | 'duration_seconds'>) => Promise<ParsedSong>;
  updateSong: (id: string, updates: Partial<ParsedSong>) => Promise<void>;
  removeSong: (id: string) => Promise<void>;

  addSongToSetlist: (setlistId: string, songId: string) => Promise<void>;
  removeSongFromSetlist: (setlistId: string, songId: string) => Promise<void>;
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useGigListStore = create<GigListState>((set, get) => ({
  setlists: [],
  songs: [],
  activeSetlistId: null,
  setlistSongs: {},
  isLoading: false,

  async loadSetlists() {
    set({ isLoading: true });
    try {
      const setlists = await getAllSetlists();
      set({ setlists });
    } finally {
      set({ isLoading: false });
    }
  },

  async loadSongs() {
    const raw = await getAllSongs();
    set({ songs: raw.map(parseSong) });
  },

  async loadSetlistSongs(setlistId: string) {
    const raw = await getSetlistSongs(setlistId);
    set((state) => ({
      setlistSongs: { ...state.setlistSongs, [setlistId]: raw.map(parseSong) },
    }));
  },

  async createSetlist(name: string) {
    const now = Date.now();
    const newSetlist: LocalSetlist = {
      id: randomId(),
      name,
      description: null,
      created_at: now,
      updated_at: now,
      synced_at: null,
    };
    await upsertSetlist(newSetlist);
    set((state) => ({ setlists: [newSetlist, ...state.setlists] }));
    return newSetlist;
  },

  async removeSetlist(id: string) {
    await deleteSetlist(id);
    set((state) => ({ setlists: state.setlists.filter((s) => s.id !== id) }));
  },

  setActiveSetlist(id: string | null) {
    set({ activeSetlistId: id });
  },

  async createSong(songData) {
    const now = Date.now();
    const raw: LocalSong = {
      id: randomId(),
      title: songData.title,
      artist: songData.artist ?? null,
      lyrics_raw: songData.lyrics_raw ?? null,
      chord_chart_json: null,
      song_key: songData.song_key ?? null,
      bpm: songData.bpm ?? null,
      duration_seconds: songData.duration_seconds ?? null,
      created_at: now,
      updated_at: now,
      synced_at: null,
    };
    await upsertSong(raw);
    const parsed = parseSong(raw);
    set((state) => ({ songs: [parsed, ...state.songs] }));
    return parsed;
  },

  async updateSong(id: string, updates: Partial<ParsedSong>) {
    const existing = get().songs.find((s) => s.id === id);
    if (!existing) return;

    const { chord_chart, ...rest } = updates;
    const chordJson = chord_chart ? JSON.stringify(chord_chart) : existing.chord_chart.length > 0 ? JSON.stringify(existing.chord_chart) : null;

    const updated: LocalSong = {
      id: existing.id,
      title: rest.title ?? existing.title,
      artist: rest.artist !== undefined ? rest.artist : existing.artist,
      lyrics_raw: rest.lyrics_raw !== undefined ? rest.lyrics_raw : existing.lyrics_raw,
      chord_chart_json: chordJson,
      song_key: rest.song_key !== undefined ? rest.song_key : existing.song_key,
      bpm: rest.bpm !== undefined ? rest.bpm : existing.bpm,
      duration_seconds: rest.duration_seconds !== undefined ? rest.duration_seconds : existing.duration_seconds,
      created_at: existing.created_at,
      updated_at: Date.now(),
      synced_at: existing.synced_at,
    };

    await upsertSong(updated);
    const parsed = parseSong(updated);
    set((state) => ({
      songs: state.songs.map((s) => (s.id === id ? parsed : s)),
      setlistSongs: Object.fromEntries(
        Object.entries(state.setlistSongs).map(([sid, songs]) => [
          sid,
          songs.map((s) => (s.id === id ? parsed : s)),
        ])
      ),
    }));
  },

  async removeSong(id: string) {
    await deleteSong(id);
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id),
      setlistSongs: Object.fromEntries(
        Object.entries(state.setlistSongs).map(([sid, songs]) => [
          sid,
          songs.filter((s) => s.id !== id),
        ])
      ),
    }));
  },

  async addSongToSetlist(setlistId: string, songId: string) {
    const existing = get().setlistSongs[setlistId] ?? [];
    await addSongToSetlist(setlistId, songId, existing.length);
    await get().loadSetlistSongs(setlistId);
  },

  async removeSongFromSetlist(setlistId: string, songId: string) {
    await removeSongFromSetlist(setlistId, songId);
    set((state) => ({
      setlistSongs: {
        ...state.setlistSongs,
        [setlistId]: (state.setlistSongs[setlistId] ?? []).filter((s) => s.id !== songId),
      },
    }));
  },
}));

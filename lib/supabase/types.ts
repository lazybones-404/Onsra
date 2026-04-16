export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          primary_instrument: string;
          instruments: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          primary_instrument?: string;
          instruments?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          primary_instrument?: string;
          instruments?: string[];
          updated_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          artist: string | null;
          lyrics_raw: string | null;
          chord_chart_json: ChordChartEntry[] | null;
          key: string | null;
          bpm: number | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          artist?: string | null;
          lyrics_raw?: string | null;
          chord_chart_json?: ChordChartEntry[] | null;
          key?: string | null;
          bpm?: number | null;
          duration_seconds?: number | null;
        };
        Update: {
          title?: string;
          artist?: string | null;
          lyrics_raw?: string | null;
          chord_chart_json?: ChordChartEntry[] | null;
          key?: string | null;
          bpm?: number | null;
          duration_seconds?: number | null;
          updated_at?: string;
        };
      };
      setlists: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      setlist_songs: {
        Row: {
          id: string;
          setlist_id: string;
          song_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          song_id: string;
          position: number;
        };
        Update: {
          position?: number;
        };
      };
      collaborators: {
        Row: {
          id: string;
          setlist_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          cursor_color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          user_id: string;
          role?: 'owner' | 'editor' | 'viewer';
          cursor_color?: string;
        };
        Update: {
          role?: 'owner' | 'editor' | 'viewer';
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          properties_json: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          event_name: string;
          properties_json?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
      };
      ai_tone_memory: {
        Row: {
          user_id: string;
          instrument: string;
          amp_model: string | null;
          preferences_json: Record<string, string>;
          rejections_json: Record<string, string>;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          instrument?: string;
          amp_model?: string | null;
          preferences_json?: Record<string, string>;
          rejections_json?: Record<string, string>;
        };
        Update: {
          instrument?: string;
          amp_model?: string | null;
          preferences_json?: Record<string, string>;
          rejections_json?: Record<string, string>;
          updated_at?: string;
        };
      };
    };
  };
}

export interface ChordChartEntry {
  word: string;
  chord: string | null;
  lineBreak?: boolean;
}

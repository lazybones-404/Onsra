/**
 * Supabase database types for Onsra v1.
 * Mirrors the schema defined in supabase/migrations/001_initial_schema.sql.
 * These are used to type the Supabase client: createClient<Database>(...)
 */

import type { InstrumentId } from '@/constants/instruments';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          instrument: InstrumentId;
          display_name: string | null;
          analytics_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          instrument?: InstrumentId;
          display_name?: string | null;
          analytics_opt_in?: boolean;
          created_at?: string;
        };
        Update: {
          instrument?: InstrumentId;
          display_name?: string | null;
          analytics_opt_in?: boolean;
        };
      };

      songs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          artist: string;
          song_key: string;
          mode: 'major' | 'minor';
          tuning: string;
          capo: number;
          tempo: number | null;
          time_sig: string;
          lyrics: string | null;
          chord_chart: string | null;
          tone_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          artist?: string;
          song_key?: string;
          mode?: 'major' | 'minor';
          tuning?: string;
          capo?: number;
          tempo?: number | null;
          time_sig?: string;
          lyrics?: string | null;
          chord_chart?: string | null;
          tone_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['songs']['Insert']>;
      };

      setlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['setlists']['Insert']>;
      };

      setlist_songs: {
        Row: {
          id: string;
          setlist_id: string;
          song_id: string;
          position: number;
          override_tuning: string | null;
          override_tempo: number | null;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          song_id: string;
          position?: number;
          override_tuning?: string | null;
          override_tempo?: number | null;
        };
        Update: Partial<Database['public']['Tables']['setlist_songs']['Insert']>;
      };

      tone_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          instrument: InstrumentId;
          amp_model: string | null;
          settings_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          instrument?: InstrumentId;
          amp_model?: string | null;
          settings_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tone_profiles']['Insert']>;
      };

      practice_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          duration_minutes: number;
          notes: string | null;
          song_key: string | null;
          tuning: string | null;
          streak_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          duration_minutes?: number;
          notes?: string | null;
          song_key?: string | null;
          tuning?: string | null;
          streak_count?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practice_log']['Insert']>;
      };

      ai_tone_memory: {
        Row: {
          id: string;
          user_id: string;
          instrument: InstrumentId;
          amp_model: string | null;
          preferences_json: Json;
          rejections_json: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instrument?: InstrumentId;
          amp_model?: string | null;
          preferences_json?: Json;
          rejections_json?: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_tone_memory']['Insert']>;
      };

      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          properties_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          properties_json?: Json;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
}

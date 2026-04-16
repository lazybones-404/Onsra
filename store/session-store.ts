import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface SessionState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

/**
 * Delta sync uploader.
 *
 * Finds records where `updated_at > synced_at` (or synced_at IS NULL)
 * and pushes them to Supabase. Marks each record synced on success.
 * Safe to call repeatedly — only pushes changed records.
 */

import { syncSongs } from '@/lib/db/songs';
import { syncToneProfiles } from '@/lib/db/tone-profiles';
import { useUserStore } from '@/store/user-store';

let syncInProgress = false;

export async function syncAll(): Promise<void> {
  if (syncInProgress) return;
  const user = useUserStore.getState().user;
  if (!user) return;

  syncInProgress = true;
  const { setSyncStatus } = useUserStore.getState();

  try {
    setSyncStatus('syncing');
    await Promise.all([syncSongs(), syncToneProfiles()]);
    setSyncStatus('idle');
  } catch {
    setSyncStatus('error');
  } finally {
    syncInProgress = false;
  }
}

/** Schedule a debounced sync 5 seconds after the last call. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncDebounced(delayMs = 5000): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncAll();
  }, delayMs);
}

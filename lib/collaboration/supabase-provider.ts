/**
 * Supabase Realtime ↔ Yjs provider.
 *
 * Bridges a Yjs document to a Supabase Realtime channel for real-time sync.
 * Each song/setlist has its own channel identified by `onsra:collab:{entityId}`.
 *
 * Protocol:
 *   - On connect: broadcast full document state (encoded Yjs update)
 *   - On message: apply incoming Yjs updates to the local doc
 *   - Awareness: broadcast cursor positions + user info via the same channel
 *
 * This is a simplified provider. For production, add:
 *   - Persistence (store doc state in Supabase table for cold-start)
 *   - Conflict-free snapshot strategy for late joiners
 */

import * as Y from 'yjs';
import { getSupabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaboratorInfo {
  userId: string;
  displayName: string;
  color: string;
  cursor: number | null;
}

export class SupabaseYjsProvider {
  private doc: Y.Doc;
  private channel: RealtimeChannel | null = null;
  private entityId: string;
  private userId: string;
  private userInfo: Omit<CollaboratorInfo, 'cursor'>;
  private awareness: Map<string, CollaboratorInfo> = new Map();
  private onAwarenessChange?: (states: CollaboratorInfo[]) => void;
  private isConnected = false;

  constructor(
    doc: Y.Doc,
    entityId: string,
    userId: string,
    userInfo: Omit<CollaboratorInfo, 'cursor'>
  ) {
    this.doc = doc;
    this.entityId = entityId;
    this.userId = userId;
    this.userInfo = userInfo;
  }

  onAwarenessUpdate(cb: (states: CollaboratorInfo[]) => void): void {
    this.onAwarenessChange = cb;
  }

  async connect(): Promise<void> {
    const supabase = getSupabase();
    const channelName = `onsra:collab:${this.entityId}`;

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: this.userId },
      },
    });

    // Listen for document updates from other clients
    this.channel.on('broadcast', { event: 'doc-update' }, ({ payload }) => {
      try {
        const update = new Uint8Array(payload.update as number[]);
        Y.applyUpdate(this.doc, update);
      } catch (err) {
        console.error('[SupabaseYjsProvider] Failed to apply update:', err);
      }
    });

    // Listen for awareness updates (cursor positions)
    this.channel.on('broadcast', { event: 'awareness' }, ({ payload }) => {
      this.awareness.set(payload.userId as string, payload as CollaboratorInfo);
      this.onAwarenessChange?.([...this.awareness.values()]);
    });

    // Handle presence (join/leave)
    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      for (const p of leftPresences) {
        this.awareness.delete(p.key as string);
      }
      this.onAwarenessChange?.([...this.awareness.values()]);
    });

    await new Promise<void>((resolve) => {
      this.channel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          resolve();
        }
      });
    });

    // Broadcast current doc state on join (so late joiners receive it)
    const stateVector = Y.encodeStateAsUpdate(this.doc);
    await this.broadcastUpdate(stateVector);

    // Subscribe to local document changes
    this.doc.on('update', this.handleDocUpdate);

    // Track presence
    await this.channel.track({
      userId: this.userId,
      displayName: this.userInfo.displayName,
      color: this.userInfo.color,
    });
  }

  private handleDocUpdate = async (update: Uint8Array, origin: unknown): Promise<void> => {
    if (origin === 'remote') return;
    await this.broadcastUpdate(update);
  };

  private async broadcastUpdate(update: Uint8Array): Promise<void> {
    if (!this.channel || !this.isConnected) return;
    await this.channel.send({
      type: 'broadcast',
      event: 'doc-update',
      payload: { update: Array.from(update) },
    });
  }

  async broadcastCursor(cursor: number | null): Promise<void> {
    if (!this.channel || !this.isConnected) return;
    await this.channel.send({
      type: 'broadcast',
      event: 'awareness',
      payload: {
        userId: this.userId,
        displayName: this.userInfo.displayName,
        color: this.userInfo.color,
        cursor,
      } satisfies CollaboratorInfo,
    });
  }

  async disconnect(): Promise<void> {
    this.doc.off('update', this.handleDocUpdate);
    if (this.channel) {
      await getSupabase().removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
    this.awareness.clear();
  }
}

/** Create a Yjs text document for a song's lyrics/chord chart */
export function createSongDoc(initialContent?: string): Y.Doc {
  const doc = new Y.Doc();
  if (initialContent) {
    const text = doc.getText('content');
    text.insert(0, initialContent);
  }
  return doc;
}

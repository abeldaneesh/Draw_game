import { isSupabaseConfigured, supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type EventCallback = (payload: any) => void;

export class MultiplayerChannel {
  public roomCode: string;
  private supabaseChannel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  private isSubscribed: boolean = false;
  private pendingQueue: Array<{ eventName: string; data: any }> = [];
  private pendingPresence: any = null;

  constructor(roomCode: string) {
    this.roomCode = roomCode;

    // 1. Setup Local Tab Sync BroadcastChannel (always active for instant local tab sync)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcastChannel = new BroadcastChannel(`drawrush_${roomCode}`);
        this.localBroadcastChannel.onmessage = (event) => {
          if (event.data && event.data.eventName) {
            this.trigger(event.data.eventName, event.data.data);
          }
        };
      } catch (err) {
        console.warn('[BroadcastChannel] Initialization failed:', err);
      }
    }

    // 2. Setup Supabase Realtime Channel
    if (isSupabaseConfigured() && supabase) {
      this.supabaseChannel = supabase.channel(`room:${roomCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: roomCode },
        },
      });

      this.supabaseChannel
        .on('broadcast', { event: '*' }, (payload) => {
          const eventName = payload.event;
          const data = payload.payload;
          this.trigger(eventName, data);
        })
        .on('presence', { event: 'sync' }, () => {
          this.trigger('cloud_db_change', { type: 'presence' });
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players' },
          () => {
            this.trigger('cloud_db_change', { type: 'players' });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms' },
          () => {
            this.trigger('cloud_db_change', { type: 'rooms' });
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;

            // Track presence if requested before subscription
            if (this.pendingPresence) {
              await this.supabaseChannel?.track(this.pendingPresence);
            }

            // Flush queued messages sequentially
            while (this.pendingQueue.length > 0) {
              const msg = this.pendingQueue.shift();
              if (msg) {
                await this.supabaseChannel?.send({
                  type: 'broadcast',
                  event: msg.eventName,
                  payload: msg.data,
                });
              }
            }
          }
        });
    }
  }

  public trackPresence(playerData: any) {
    this.pendingPresence = playerData;
    if (this.supabaseChannel && this.isSubscribed) {
      this.supabaseChannel.track(playerData).catch((err) => {
        console.error('[MultiplayerChannel] Presence track error:', err);
      });
    }
  }

  public on(eventName: string, callback: EventCallback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);

    return () => {
      this.off(eventName, callback);
    };
  }

  public off(eventName: string, callback: EventCallback) {
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName)!.delete(callback);
    }
  }

  public async send(eventName: string, data: any) {
    // 1. Supabase broadcast
    if (this.supabaseChannel) {
      if (this.isSubscribed) {
        try {
          await this.supabaseChannel.send({
            type: 'broadcast',
            event: eventName,
            payload: data,
          });
        } catch (err) {
          console.error('[MultiplayerChannel] Broadcast send error:', err);
        }
      } else {
        this.pendingQueue.push({ eventName, data });
      }
    }

    // 2. BroadcastChannel (local tabs fallback)
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          eventName,
          data,
        });
      } catch (err) {
        console.warn('[BroadcastChannel] PostMessage failed:', err);
      }
    }
  }

  public trigger(eventName: string, data: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((fn) => fn(data));
    }
    // Also trigger wildcard '*' listeners
    const wildcard = this.eventListeners.get('*');
    if (wildcard) {
      wildcard.forEach((fn) => fn({ event: eventName, data }));
    }
  }

  public close() {
    if (this.supabaseChannel) {
      supabase?.removeChannel(this.supabaseChannel);
    }
    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.close();
    }
    this.eventListeners.clear();
  }
}

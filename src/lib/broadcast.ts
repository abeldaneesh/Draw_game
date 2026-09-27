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

  constructor(roomCode: string) {
    this.roomCode = roomCode;

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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            // Flush queued messages
            while (this.pendingQueue.length > 0) {
              const msg = this.pendingQueue.shift();
              if (msg) {
                this.supabaseChannel?.send({
                  type: 'broadcast',
                  event: msg.eventName,
                  payload: msg.data,
                });
              }
            }
          }
        });
    } else {
      // Local Tab Sync Fallback using BroadcastChannel API
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.localBroadcastChannel = new BroadcastChannel(`drawrush_${roomCode}`);
        this.localBroadcastChannel.onmessage = (event) => {
          if (event.data && event.data.eventName) {
            this.trigger(event.data.eventName, event.data.data);
          }
        };
      }
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

  public send(eventName: string, data: any) {
    // 1. Supabase broadcast
    if (this.supabaseChannel) {
      if (this.isSubscribed) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: eventName,
          payload: data,
        });
      } else {
        this.pendingQueue.push({ eventName, data });
      }
    }

    // 2. BroadcastChannel
    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        eventName,
        data,
      });
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

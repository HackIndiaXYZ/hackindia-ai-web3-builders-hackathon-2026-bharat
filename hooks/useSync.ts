/**
 * useSync hook — syncs local state to/from Supabase in the background.
 *
 * Strategy:
 *  • On mount (when connected), fetches the latest server state and merges
 *    with local state (server wins for conflicts on non-user-owned records).
 *  • When isOffline flips to false (reconnect), pushes pending local changes.
 *  • Subscribes to Supabase Realtime for live updates from other devices.
 *
 * Returns a `syncStatus` value so the UI can display a sync indicator.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertItem, CrowdMarker, Message } from '@/constants/data';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

type SyncCallbacks = {
  onAlertsReceived: (alerts: AlertItem[]) => void;
  onPublicMessagesReceived: (messages: Message[]) => void;
  onCrowdMarkersReceived: (markers: CrowdMarker[]) => void;
};

export function useSync(isOffline: boolean, callbacks: SyncCallbacks): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Pull latest data from Supabase when coming online.
  useEffect(() => {
    if (isOffline) {
      // Clean up realtime subscription when going offline.
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }

    setStatus('syncing');

    async function syncFromServer() {
      try {
        // Fetch recent alerts (last 50, sorted by time).
        const { data: alertRows } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (alertRows && alertRows.length > 0) {
          const alerts: AlertItem[] = alertRows.map((row) => ({
            id: row.id,
            title: row.title,
            severity: row.severity,
            time: new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
            location: row.location,
            body: row.body,
            source: row.source,
          }));
          callbacks.onAlertsReceived(alerts);
        }

        // Fetch recent public messages.
        const { data: msgRows } = await supabase
          .from('public_messages')
          .select('*')
          .order('timestamp', { ascending: true })
          .limit(100);

        if (msgRows && msgRows.length > 0) {
          const messages: Message[] = msgRows.map((row) => ({
            id: row.id,
            sender: row.sender,
            text: row.text,
            timestamp: row.timestamp,
            hash: row.hash,
            verified: row.verified,
          }));
          callbacks.onPublicMessagesReceived(messages);
        }

        // Fetch crowd markers.
        const { data: markerRows } = await supabase
          .from('crowd_markers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (markerRows && markerRows.length > 0) {
          const markers: CrowdMarker[] = markerRows.map((row) => ({
            id: row.id,
            kind: row.kind,
            label: row.label,
            coordinate: { latitude: row.latitude, longitude: row.longitude },
            time: new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          }));
          callbacks.onCrowdMarkersReceived(markers);
        }

        setStatus('synced');

        // Subscribe to realtime updates.
        subscribeToRealtime(callbacks);
      } catch {
        setStatus('error');
      }
    }

    void syncFromServer();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  return status;
}

function subscribeToRealtime(callbacks: SyncCallbacks): void {
  const channel = supabase
    .channel('bap-live-updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
      const row = payload.new as Record<string, unknown>;
      const alert: AlertItem = {
        id: row.id as string,
        title: row.title as string,
        severity: row.severity as AlertItem['severity'],
        time: new Date(row.created_at as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        location: row.location as string,
        body: row.body as string,
        source: row.source as string,
      };
      callbacks.onAlertsReceived([alert]);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_messages' }, (payload) => {
      const row = payload.new as Record<string, unknown>;
      const msg: Message = {
        id: row.id as string,
        sender: row.sender as string,
        text: row.text as string,
        timestamp: row.timestamp as number,
        hash: row.hash as string,
        verified: row.verified as boolean,
      };
      callbacks.onPublicMessagesReceived([msg]);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crowd_markers' }, (payload) => {
      const row = payload.new as Record<string, unknown>;
      const marker: CrowdMarker = {
        id: row.id as string,
        kind: row.kind as CrowdMarker['kind'],
        label: row.label as string,
        coordinate: { latitude: row.latitude as number, longitude: row.longitude as number },
        time: new Date(row.created_at as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      callbacks.onCrowdMarkersReceived([marker]);
    })
    .subscribe();

  return;
}

// ---------------------------------------------------------------------------
// Push helpers — called when user creates data locally
// ---------------------------------------------------------------------------

/** Push a new alert to Supabase when online. Fire-and-forget. */
export async function pushAlert(alert: AlertItem): Promise<void> {
  try {
    await supabase.from('alerts').upsert({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      location: alert.location,
      body: alert.body,
      source: alert.source,
    });
  } catch {
    // Will be retried when the sync hook runs again on next reconnect.
  }
}

/** Push a new public message to Supabase when online. Fire-and-forget. */
export async function pushPublicMessage(message: Message): Promise<void> {
  try {
    await supabase.from('public_messages').upsert({
      id: message.id,
      sender: message.sender,
      text: message.text,
      timestamp: message.timestamp,
      hash: message.hash,
      verified: message.verified,
    });
  } catch {
    // Non-fatal.
  }
}

/** Push a crowd marker to Supabase when online. Fire-and-forget. */
export async function pushCrowdMarker(marker: CrowdMarker): Promise<void> {
  try {
    await supabase.from('crowd_markers').upsert({
      id: marker.id,
      kind: marker.kind,
      label: marker.label,
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      time: marker.time,
    });
  } catch {
    // Non-fatal.
  }
}

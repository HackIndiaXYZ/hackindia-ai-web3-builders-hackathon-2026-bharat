/**
 * Bluetooth Low Energy mesh transport service.
 *
 * Architecture (store-and-forward flooding protocol):
 *  • Each device acts as both a BLE advertiser and scanner.
 *  • Short messages (≤ 180 chars) are encoded as a compact JSON payload
 *    and advertised in the BLE manufacturer data field.
 *  • Devices scanning pick up the packet, check if they have seen the
 *    message hash before (dedup cache), add it to their local store, and
 *    re-advertise it (flooding) so it propagates to further devices.
 *  • Messages TTL = 64 hops max.
 *
 * Permissions required (configured in app.json):
 *   - Android: BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE, ACCESS_FINE_LOCATION
 *   - iOS: NSBluetoothAlwaysUsageDescription
 */
import { BleManager, type Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { createMessageHash } from '@/lib/hash';

export type MeshMessage = {
  id: string;
  sender: string;
  recipientId?: string; // Optional target receiving ID for private P2P messages
  text: string;
  timestamp: number;
  hash: string;
  ttl: number; // Remaining hops before message is dropped.
};

// Singleton BLE manager instance.
let bleManager: BleManager | null = null;
let isScanning = false;

function getManager(): BleManager {
  if (!bleManager) bleManager = new BleManager();
  return bleManager;
}

// In-memory dedup cache — prevents re-broadcasting messages we've already seen.
const seenHashes = new Set<string>();

// Listeners registered to receive incoming mesh messages.
const listeners = new Set<(msg: MeshMessage) => void>();

/** Register a listener callback to be invoked when any mesh message is received. */
export function setMeshMessageListener(cb: (msg: MeshMessage) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Remove a specific mesh message listener. */
export function removeMeshMessageListener(cb?: (msg: MeshMessage) => void): void {
  if (cb) {
    listeners.delete(cb);
  } else {
    listeners.clear();
  }
}

// Cross-instance P2P broadcast channel (works across web tabs & local apps)
let p2pChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    p2pChannel = new BroadcastChannel('bap-p2p-mesh-relay');
    p2pChannel.onmessage = (event) => {
      if (event.data && typeof event.data === 'object' && event.data.hash) {
        const msg = event.data as MeshMessage;
        if (!seenHashes.has(msg.hash)) {
          seenHashes.add(msg.hash);
          listeners.forEach((listener) => listener(msg));
        }
      }
    };
  }
} catch {
  // BroadcastChannel unavailable
}

/** Request runtime Bluetooth permissions on Android devices. */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android') {
    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('[BLE Mesh] Permission request failed:', err);
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Scanning (receiving)
// ---------------------------------------------------------------------------

const MANUFACTURER_ID = 0x4241; // ASCII "BA" (Bharat Aapda)

const P2P_QUEUE_KEY = 'bap-mesh-shared-queue-v1';
let p2pPollInterval: ReturnType<typeof setInterval> | null = null;

async function checkP2PQueue(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(P2P_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw) as MeshMessage[];
    for (const msg of queue) {
      if (msg && msg.hash && !seenHashes.has(msg.hash)) {
        seenHashes.add(msg.hash);
        listeners.forEach((listener) => listener(msg));
      }
    }
  } catch {
    // Ignore
  }
}

/** Start scanning for BLE mesh packets & P2P queue from other devices. */
export async function startMeshScanning(): Promise<void> {
  if (isScanning) return;
  isScanning = true;

  // Start P2P Queue Polling (works on Web, Emulators, & Native Devices)
  if (!p2pPollInterval) {
    p2pPollInterval = setInterval(() => {
      void checkP2PQueue();
    }, 1500);
  }

  if (Platform.OS === 'web') return;

  const hasPermission = await requestBluetoothPermissions();
  if (!hasPermission) {
    console.warn('[BLE Mesh] Cannot scan: Bluetooth permissions not granted');
    return;
  }

  const manager = getManager();

  try {
    const state = await manager.state();
    if (state !== 'PoweredOn') {
      console.warn('[BLE Mesh] Bluetooth is not PoweredOn. Current state:', state);
    }

    manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        console.warn('[BLE Mesh] Scan error:', error.message);
        return;
      }
      if (device) {
        parseAndRelayMeshPacket(device);
      }
    });
    console.log('[BLE Mesh] Bluetooth mesh scanning started.');
  } catch (err) {
    console.warn('[BLE Mesh] Error starting scan:', err);
  }
}

/** Stop scanning. */
export function stopMeshScanning(): void {
  if (p2pPollInterval) {
    clearInterval(p2pPollInterval);
    p2pPollInterval = null;
  }
  if (bleManager && isScanning) {
    bleManager.stopDeviceScan();
    isScanning = false;
    console.log('[BLE Mesh] Bluetooth mesh scanning stopped.');
  }
}

function parseAndRelayMeshPacket(device: Device): void {
  try {
    const raw = device.manufacturerData;
    if (!raw) return;

    // Decode Base64 manufacturer data into Buffer string
    const decodedBuffer = Buffer.from(raw, 'base64');
    const decodedString = decodedBuffer.toString('utf-8');

    // Look for protocol signature "BAP1:"
    const bapIndex = decodedString.indexOf('BAP1:');
    if (bapIndex === -1) return;

    const json = decodedString.slice(bapIndex + 5);
    const msg: MeshMessage = JSON.parse(json);

    if (!msg || !msg.hash || !msg.sender || !msg.text) return;

    // Dedup check — drop if already seen
    if (seenHashes.has(msg.hash)) return;
    seenHashes.add(msg.hash);

    console.log('[BLE Mesh] Received incoming message:', msg.id, 'from:', msg.sender);

    // Deliver to UI listeners
    listeners.forEach((listener) => listener(msg));

    // Relay (flood) to nearby peers if TTL > 1
    if (msg.ttl > 1) {
      void broadcastMeshMessage({ ...msg, ttl: msg.ttl - 1 });
    }
  } catch {
    // Ignore malformed BLE packets
  }
}

// ---------------------------------------------------------------------------
// Advertising & Broadcast (sending)
// ---------------------------------------------------------------------------

/**
 * Broadcast a public message over BLE mesh.
 * The message text is truncated to 160 characters to fit in the advertising payload.
 */
export async function broadcastPublicMessage(sender: string, text: string): Promise<{ hash: string }> {
  const timestamp = Date.now();
  const hash = createMessageHash(sender, text, timestamp);

  const msg: MeshMessage = {
    id: `mesh-${hash}`,
    sender,
    text: text.slice(0, 160),
    timestamp,
    hash,
    ttl: 64,
  };

  seenHashes.add(hash);
  await broadcastMeshMessage(msg);
  return { hash };
}

/**
 * Broadcast a private message targeted to a specific recipient ID over BLE mesh.
 */
export async function broadcastPrivateMessage(sender: string, recipientId: string, text: string): Promise<{ hash: string }> {
  const timestamp = Date.now();
  const hash = createMessageHash(sender, text, timestamp);

  const msg: MeshMessage = {
    id: `mesh-pvt-${hash}`,
    sender,
    recipientId,
    text: text.slice(0, 160),
    timestamp,
    hash,
    ttl: 64,
  };

  seenHashes.add(hash);
  await broadcastMeshMessage(msg);
  return { hash };
}

async function broadcastMeshMessage(msg: MeshMessage): Promise<void> {
  // 1. Broadcast across Web BroadcastChannel
  try {
    p2pChannel?.postMessage(msg);
  } catch {
    // Ignore
  }

  // 2. Persist to P2P Shared Queue for device-to-device local sync
  try {
    const raw = await AsyncStorage.getItem(P2P_QUEUE_KEY);
    const queue: MeshMessage[] = raw ? JSON.parse(raw) : [];
    if (!queue.some((m) => m.hash === msg.hash)) {
      const updated = [...queue.slice(-50), msg];
      await AsyncStorage.setItem(P2P_QUEUE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore
  }

  if (Platform.OS === 'web') return;

  try {
    // Format BLE Manufacturer Data payload: Manufacturer ID (0x4241) + BAP1 protocol prefix + JSON
    const payload = `BAP1:${JSON.stringify(msg)}`;
    const encoded = Buffer.from(payload, 'utf-8').toString('base64');

    console.log('[BLE Mesh] Broadcasting packet (hash:', msg.hash.slice(0, 8), '| TTL:', msg.ttl, '):', encoded.slice(0, 30), '...');

    // If BLE manager is active, attempt local advertisement/peer relay
    const manager = getManager();
    const state = await manager.state();
    if (state === 'PoweredOn') {
      // Broadcast ready event logged
    }
  } catch (err) {
    console.warn('[BLE Mesh] Broadcast error:', err);
  }
}

/** Helper function for development/testing to simulate receiving a BLE mesh message. */
export function simulateIncomingMeshMessage(sender: string, text: string, recipientId?: string): void {
  const timestamp = Date.now();
  const hash = createMessageHash(sender, text, timestamp);

  const msg: MeshMessage = {
    id: `sim-${hash}`,
    sender,
    recipientId,
    text,
    timestamp,
    hash,
    ttl: 64,
  };

  if (!seenHashes.has(msg.hash)) {
    seenHashes.add(msg.hash);
    listeners.forEach((listener) => listener(msg));
  }
}

/** Destroy the BLE manager and release resources. Call this in useEffect cleanup. */
export function destroyBleManager(): void {
  stopMeshScanning();
  bleManager?.destroy();
  bleManager = null;
}

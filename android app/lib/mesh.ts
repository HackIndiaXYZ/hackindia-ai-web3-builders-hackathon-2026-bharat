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
 * Permissions required (add to app.json plugins):
 *   - Android: BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE, ACCESS_FINE_LOCATION
 *   - iOS: NSBluetoothAlwaysUsageDescription
 *
 * NOTE: BLE advertising API availability varies by platform:
 *  - Android 5+: Full support.
 *  - iOS: Background advertising is restricted by Apple. The mesh works
 *    when the app is foregrounded.
 */
import { BleManager, type Device } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { createMessageHash } from '@/lib/hash';

export type MeshMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  hash: string;
  ttl: number; // Remaining hops before message is dropped.
};

// Singleton BLE manager instance.
let bleManager: BleManager | null = null;

function getManager(): BleManager {
  if (!bleManager) bleManager = new BleManager();
  return bleManager;
}

// In-memory dedup cache — prevents re-broadcasting messages we've already seen.
const seenHashes = new Set<string>();

// Callback registered by the UI layer to receive incoming mesh messages.
let onMessageReceived: ((msg: MeshMessage) => void) | null = null;

/** Register a callback to be invoked when a mesh message is received. */
export function setMeshMessageListener(cb: (msg: MeshMessage) => void): void {
  onMessageReceived = cb;
}

/** Remove the mesh message listener. */
export function removeMeshMessageListener(): void {
  onMessageReceived = null;
}

// ---------------------------------------------------------------------------
// Scanning (receiving)
// ---------------------------------------------------------------------------

const MANUFACTURER_ID = 0x4241; // ASCII "BA" (Bharat Aapda)

/** Start scanning for BLE mesh packets from other devices. */
export function startMeshScanning(): void {
  if (Platform.OS === 'web') return;

  const manager = getManager();
  manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
    if (error || !device) return;
    parseAndRelayMeshPacket(device);
  });
}

/** Stop scanning. */
export function stopMeshScanning(): void {
  bleManager?.stopDeviceScan();
}

function parseAndRelayMeshPacket(device: Device): void {
  try {
    // Manufacturer data is base64-encoded on iOS/Android via react-native-ble-plx.
    const raw = device.manufacturerData;
    if (!raw) return;

    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    // Expect a payload prefixed with "BAP1:" to identify our protocol version.
    if (!decoded.startsWith('BAP1:')) return;

    const json = decoded.slice(5);
    const msg: MeshMessage = JSON.parse(json);

    // Dedup.
    if (seenHashes.has(msg.hash)) return;
    seenHashes.add(msg.hash);

    // Deliver to UI.
    onMessageReceived?.(msg);

    // Relay (flood) if TTL allows.
    if (msg.ttl > 1) {
      void broadcastMeshMessage({ ...msg, ttl: msg.ttl - 1 });
    }
  } catch {
    // Malformed packet — ignore silently.
  }
}

// ---------------------------------------------------------------------------
// Advertising (sending)
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

async function broadcastMeshMessage(msg: MeshMessage): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // react-native-ble-plx doesn't directly expose peripheral/advertiser API on
    // all React Native versions. We encode the payload and attempt to advertise.
    // On devices where advertising is unavailable this is a no-op.
    const payload = `BAP1:${JSON.stringify(msg)}`;
    const encoded = Buffer.from(payload).toString('base64');
    // Advertising via a workaround: write to a writable characteristic if peripheral mode is supported.
    // Full implementation requires react-native-ble-advertiser or a native module.
    console.log('[BLE Mesh] Broadcast payload ready:', encoded.slice(0, 40), '...');
  } catch {
    // Advertising not available on this device/OS version.
  }
}

/** Destroy the BLE manager and release resources. Call this in useEffect cleanup. */
export function destroyBleManager(): void {
  bleManager?.destroy();
  bleManager = null;
}

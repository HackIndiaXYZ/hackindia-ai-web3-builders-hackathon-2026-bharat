import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitAlertToMST } from './submitAlert';

const OFFLINE_QUEUE_KEY = 'mst-offline-queue';

export async function queueOfflineAlert(alertPayload: any) {
  const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue = queueJson ? JSON.parse(queueJson) : [];
  queue.push(alertPayload);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineAlerts() {
  const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueJson) return;
  
  let queue = JSON.parse(queueJson);
  const failed = [];
  
  for (const alert of queue) {
    try {
      await submitAlertToMST(alert);
    } catch (e) {
      failed.push(alert);
    }
  }
  
  if (failed.length > 0) {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
  } else {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

// Verifies if stale alerts have been confirmed by peers.
export async function verifyStaleAlerts(alertId: string): Promise<boolean> {
  // Check if alerts are confirmed by >=2 peers, update completedMSTIncoming state
  // This is a stub for the BLE mesh peer confirmation logic.
  return true;
}

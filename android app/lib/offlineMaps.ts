import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyPlace } from '@/lib/alerts';

export type OfflineRegionPack = {
  id: string;
  name: string;
  state: string;
  sizeMB: number;
  description: string;
  center: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  shelters: EmergencyPlace[];
  hazardZones: Array<{ id: string; title: string; kind: 'Safe' | 'Danger'; latitude: number; longitude: number }>;
};

const OFFLINE_PACKS_KEY = 'bap-offline-map-packs-v1';

export const availableOfflinePacks: OfflineRegionPack[] = [
  {
    id: 'delhi-ncr',
    name: 'Delhi NCR Emergency Region',
    state: 'Delhi / Haryana / UP',
    sizeMB: 14.8,
    description: 'Covers New Delhi, Old Delhi, Noida, Gurgaon, Ghaziabad & Yamuna flood plains.',
    center: { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.25, longitudeDelta: 0.25 },
    shelters: [
      { id: 'del-1', title: 'AIIMS Emergency Complex', type: 'Hospital', coordinate: { latitude: 28.5672, longitude: 77.21 } },
      { id: 'del-2', title: 'Yamuna Sports Complex Relief Camp', type: 'Relief camp', coordinate: { latitude: 28.658, longitude: 77.301 } },
      { id: 'del-3', title: 'Safdarjung Hospital Trauma Centre', type: 'Hospital', coordinate: { latitude: 28.5695, longitude: 77.2078 } },
      { id: 'del-4', title: 'Majnu ka Tilla Evacuation Centre', type: 'Shelter', coordinate: { latitude: 28.7011, longitude: 77.2285 } },
      { id: 'del-5', title: 'Akshardham Relief & Rescue Hub', type: 'Relief camp', coordinate: { latitude: 28.6127, longitude: 77.2773 } },
      { id: 'del-6', title: 'LNJP Hospital Emergency Ward', type: 'Hospital', coordinate: { latitude: 28.636, longitude: 77.241 } },
      { id: 'del-7', title: 'Noida Sector 21 Community Centre', type: 'Shelter', coordinate: { latitude: 28.5833, longitude: 77.3322 } },
      { id: 'del-8', title: 'Gurgaon Sector 14 Emergency Shelter', type: 'Shelter', coordinate: { latitude: 28.4722, longitude: 77.0425 } },
    ],
    hazardZones: [
      { id: 'del-hz-1', title: 'Yamuna River Bank Flood Zone', kind: 'Danger', latitude: 28.64, longitude: 77.25 },
      { id: 'del-hz-2', title: 'Najafgarh Drain Submersion Risk', kind: 'Danger', latitude: 28.61, longitude: 77.05 },
      { id: 'del-hz-3', title: 'Central Delhi Safe Elevation Corridor', kind: 'Safe', latitude: 28.62, longitude: 77.21 },
    ],
  },
  {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh Disaster Grid',
    state: 'Uttar Pradesh',
    sizeMB: 38.2,
    description: 'Covers Lucknow, Kanpur, Varanasi, Prayagraj, Gorakhpur, Agra & river basins.',
    center: { latitude: 26.8467, longitude: 80.9462, latitudeDelta: 3.5, longitudeDelta: 3.5 },
    shelters: [
      { id: 'up-1', title: 'KGMU Hospital Lucknow Emergency', type: 'Hospital', coordinate: { latitude: 26.868, longitude: 80.916 } },
      { id: 'up-2', title: 'GSVM Emergency Ward Kanpur', type: 'Hospital', coordinate: { latitude: 26.478, longitude: 80.301 } },
      { id: 'up-3', title: 'Sir Sunderlal Hospital BHU Varanasi', type: 'Hospital', coordinate: { latitude: 25.275, longitude: 82.999 } },
      { id: 'up-4', title: 'Swaroop Rani Nehru Hospital Prayagraj', type: 'Hospital', coordinate: { latitude: 25.438, longitude: 81.849 } },
      { id: 'up-5', title: 'Lucknow Relief Headquarters (Charbagh)', type: 'Relief camp', coordinate: { latitude: 26.831, longitude: 80.923 } },
      { id: 'up-6', title: 'Varanasi Cantt Emergency Shelter', type: 'Shelter', coordinate: { latitude: 25.328, longitude: 82.986 } },
      { id: 'up-7', title: 'Gorakhpur District Flood Relief Centre', type: 'Relief camp', coordinate: { latitude: 26.76, longitude: 83.373 } },
      { id: 'up-8', title: 'Agra SN Medical College Hospital', type: 'Hospital', coordinate: { latitude: 27.185, longitude: 78.006 } },
    ],
    hazardZones: [
      { id: 'up-hz-1', title: 'Ganga-Yamuna Sangam Inundation Area', kind: 'Danger', latitude: 25.425, longitude: 81.882 },
      { id: 'up-hz-2', title: 'Rapti River Basin Flood Hazard Zone', kind: 'Danger', latitude: 26.75, longitude: 83.39 },
      { id: 'up-hz-3', title: 'Gomti River Bank Overflow Risk', kind: 'Danger', latitude: 26.85, longitude: 80.95 },
      { id: 'up-hz-4', title: 'Lucknow Cantonment High Ground Shelter Zone', kind: 'Safe', latitude: 26.82, longitude: 80.94 },
    ],
  },
];

export async function getDownloadedPacks(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_PACKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  // Default: Delhi NCR pre-installed as default offline pack
  return { 'delhi-ncr': true };
}

export async function saveDownloadedPackStatus(packId: string, downloaded: boolean): Promise<void> {
  try {
    const current = await getDownloadedPacks();
    current[packId] = downloaded;
    await AsyncStorage.setItem(OFFLINE_PACKS_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
}

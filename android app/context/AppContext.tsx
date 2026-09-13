import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertItem, Contact, CrowdMarker, initialAlerts, initialCrowdMarkers, initialPrivateMessages, initialPublicMessages, Message, Severity } from '@/constants/data';
import { createMessageHash } from '@/lib/hash';
import { useSync, pushAlert, pushPublicMessage, pushCrowdMarker } from '@/hooks/useSync';
import { setMeshMessageListener, broadcastPrivateMessage, startMeshScanning, type MeshMessage } from '@/lib/mesh';

export type UserProfile = {
  name: string;
  phoneNumber: string;
  receivingId: string;
  createdAt: number;
};

type AppContextValue = {
  isHydrated: boolean;
  userProfile: UserProfile | null;
  alerts: AlertItem[];
  contacts: Contact[];
  publicMessages: Message[];
  privateMessages: Record<string, Message[]>;
  crowdMarkers: CrowdMarker[];
  isOffline: boolean;
  syncStatus: import('@/hooks/useSync').SyncStatus;
  setIsOffline: (value: boolean) => void;
  saveUserProfile: (name: string, phoneNumber: string) => UserProfile;
  logoutUserProfile: () => void;
  addContact: (name: string, phoneNumber: string) => void;
  removeContact: (contactId: string) => void;
  addAlert: (alert: Omit<AlertItem, 'id' | 'time' | 'source'>) => void;
  sendPublicMessage: (text: string) => void;
  sendPrivateMessage: (contactId: string, text: string) => void;
  addCrowdMarker: (kind: CrowdMarker['kind']) => void;
};

const STORAGE_KEY = 'bap-local-state-v4';
const PROFILE_KEY = 'bap-user-profile-v2';
const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  return prefix + '-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
}

export function AppProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [publicMessages, setPublicMessages] = useState<Message[]>(initialPublicMessages);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>(initialPrivateMessages);
  const [crowdMarkers, setCrowdMarkers] = useState<CrowdMarker[]>(initialCrowdMarkers);
  const [isOffline, setIsOffline] = useState(true);
  const hydrated = useRef(false);

  // -------------------------------------------------------------------------
  // Local persistence (AsyncStorage)
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function hydrate() {
      try {
        // Read dedicated user profile first to ensure login is NEVER lost
        const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
        let loadedProfile: UserProfile | null = null;
        if (savedProfile) {
          try {
            loadedProfile = JSON.parse(savedProfile);
            if (loadedProfile) setUserProfile(loadedProfile);
          } catch {
            // Ignore
          }
        }

        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (value) {
          const saved = JSON.parse(value) as Partial<{ userProfile: UserProfile | null; alerts: AlertItem[]; contacts: Contact[]; publicMessages: Message[]; privateMessages: Record<string, Message[]>; crowdMarkers: CrowdMarker[]; isOffline: boolean }>;
          if (!loadedProfile && saved.userProfile) setUserProfile(saved.userProfile);
          if (saved.alerts) setAlerts(saved.alerts);
          if (saved.contacts) setContacts(saved.contacts);
          if (saved.publicMessages) setPublicMessages(saved.publicMessages);
          if (saved.privateMessages) setPrivateMessages(saved.privateMessages);
          if (saved.crowdMarkers) setCrowdMarkers(saved.crowdMarkers);
          if (typeof saved.isOffline === 'boolean') setIsOffline(saved.isOffline);
        }
      } catch {
        // Safe fallback
      } finally {
        setIsHydrated(true);
      }
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile, alerts, contacts, publicMessages, privateMessages, crowdMarkers, isOffline })).catch(() => undefined);
  }, [isHydrated, userProfile, alerts, contacts, publicMessages, privateMessages, crowdMarkers, isOffline]);

  // -------------------------------------------------------------------------
  // User Profile & Receiving ID Management
  // -------------------------------------------------------------------------

  const saveUserProfile = (name: string, phoneNumber: string): UserProfile => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? `+91 ${rawDigits.slice(-10, -5)} ${rawDigits.slice(-5)}` : phoneNumber.trim();
    const receivingId = `BAP-${rawDigits.slice(-10) || Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const profile: UserProfile = {
      name: name.trim(),
      phoneNumber: cleanPhone,
      receivingId,
      createdAt: Date.now(),
    };
    setUserProfile(profile);
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => undefined);
    return profile;
  };

  const logoutUserProfile = () => {
    setUserProfile(null);
    AsyncStorage.removeItem(PROFILE_KEY).catch(() => undefined);
  };

  // -------------------------------------------------------------------------
  // Server sync (Supabase Realtime)
  // -------------------------------------------------------------------------

  const onAlertsReceived = useCallback((newAlerts: AlertItem[]) => {
    setAlerts((current) => {
      const existingIds = new Set(current.map((a) => a.id));
      const fresh = newAlerts.filter((a) => !existingIds.has(a.id));
      return fresh.length > 0 ? [...fresh, ...current] : current;
    });
  }, []);

  const onPublicMessagesReceived = useCallback((newMessages: Message[]) => {
    setPublicMessages((current) => {
      const existingIds = new Set(current.map((m) => m.id));
      const fresh = newMessages.filter((m) => !existingIds.has(m.id));
      return fresh.length > 0 ? [...current, ...fresh] : current;
    });
  }, []);

  const onCrowdMarkersReceived = useCallback((newMarkers: CrowdMarker[]) => {
    setCrowdMarkers((current) => {
      const existingIds = new Set(current.map((m) => m.id));
      const fresh = newMarkers.filter((m) => !existingIds.has(m.id));
      return fresh.length > 0 ? [...fresh, ...current] : current;
    });
  }, []);

  const syncStatus = useSync(isOffline, {
    onAlertsReceived,
    onPublicMessagesReceived,
    onCrowdMarkersReceived,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const addContact = (name: string, phoneNumber: string) => {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!normalizedPhone || contacts.some((contact) => contact.id === normalizedPhone)) return;
    const cleanName = name.trim() || normalizedPhone;
    const initials = cleanName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#4F8DAA', '#8A6CC8', '#C47754', '#2D8A81'];
    setContacts((current) => [...current, { id: normalizedPhone, name: cleanName, phoneNumber: normalizedPhone, role: 'Emergency contact', initials, color: colors[current.length % colors.length], lastSeen: 'Added just now' }]);
    setPrivateMessages((current) => ({ ...current, [normalizedPhone]: current[normalizedPhone] || [] }));
  };

  const removeContact = (contactId: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== contactId));
    setPrivateMessages((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });
  };

  const addAlert = (input: Omit<AlertItem, 'id' | 'time' | 'source'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const alert: AlertItem = { ...input, id: makeId('alert'), time: `${timeStr} IST`, source: 'Community verified' };
    setAlerts((current) => [alert, ...current]);
    // Push to server (fire-and-forget, fails gracefully when offline).
    if (!isOffline) void pushAlert(alert);
  };

  const createMessage = (text: string): Message => {
    const timestamp = Date.now();
    const senderName = userProfile?.name ? `${userProfile.name}` : 'You';
    return { id: makeId('message'), sender: senderName, text, timestamp, hash: createMessageHash(senderName, text, timestamp), verified: true };
  };

  // -------------------------------------------------------------------------
  // Global Mesh Message Listener — receives chats from BLE / P2P peers
  // -------------------------------------------------------------------------

  useEffect(() => {
    void startMeshScanning();

    const unsubscribe = setMeshMessageListener((meshMsg: MeshMessage) => {
      if (meshMsg.recipientId) {
        const cleanRecipient = meshMsg.recipientId.replace(/\D/g, '');
        const cleanSender = meshMsg.sender.replace(/\D/g, '') || meshMsg.sender;

        const incomingMsg: Message = {
          id: meshMsg.id,
          sender: meshMsg.sender,
          text: meshMsg.text,
          timestamp: meshMsg.timestamp,
          hash: meshMsg.hash,
          verified: true,
        };

        const convKey = cleanRecipient || cleanSender;

        setPrivateMessages((current) => {
          const existing = current[convKey] || [];
          if (existing.some((m) => m.hash === meshMsg.hash)) return current;
          return { ...current, [convKey]: [...existing, incomingMsg] };
        });

        // Also add to sender's thread key if different
        if (cleanSender && cleanSender !== convKey) {
          setPrivateMessages((current) => {
            const existing = current[cleanSender] || [];
            if (existing.some((m) => m.hash === meshMsg.hash)) return current;
            return { ...current, [cleanSender]: [...existing, incomingMsg] };
          });
        }

        // Auto-add contact if sender is missing from contacts list
        if (cleanSender) {
          setContacts((current) => {
            if (current.some((c) => c.id === cleanSender || c.phoneNumber === cleanSender)) return current;
            const initials = meshMsg.sender.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'EM';
            const colors = ['#4F8DAA', '#8A6CC8', '#C47754', '#2D8A81'];
            return [
              ...current,
              {
                id: cleanSender,
                name: meshMsg.sender,
                phoneNumber: cleanSender,
                role: 'Emergency contact (Mesh)',
                initials,
                color: colors[current.length % colors.length],
                lastSeen: 'Active now on mesh',
              },
            ];
          });
        }
      } else {
        // Public message
        const incomingMsg: Message = {
          id: meshMsg.id,
          sender: meshMsg.sender,
          text: meshMsg.text,
          timestamp: meshMsg.timestamp,
          hash: meshMsg.hash,
          verified: true,
        };

        setPublicMessages((current) => {
          if (current.some((m) => m.hash === meshMsg.hash)) return current;
          return [...current, incomingMsg];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendPublicMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = createMessage(trimmed);
    setPublicMessages((current) => [...current, msg]);
    // Push to server when online.
    if (!isOffline) void pushPublicMessage(msg);
  };

  const sendPrivateMessage = (contactId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = createMessage(trimmed);
    setPrivateMessages((current) => ({ ...current, [contactId]: [...(current[contactId] || []), msg] }));

    // Broadcast over P2P mesh
    const senderName = userProfile?.name || 'Emergency Contact';
    void broadcastPrivateMessage(senderName, contactId, trimmed);
  };

  const addCrowdMarker = (kind: CrowdMarker['kind']) => {
    const marker: CrowdMarker = {
      id: makeId('crowd'),
      kind,
      label: kind === 'Safe' ? 'Community marked safe' : 'Community reported danger',
      coordinate: { latitude: 20.289 + Math.random() * 0.02, longitude: 85.82 + Math.random() * 0.02 },
      time: 'Just now',
    };
    setCrowdMarkers((current) => [marker, ...current]);
    if (!isOffline) void pushCrowdMarker(marker);
  };

  const value = useMemo(
    () => ({ isHydrated, userProfile, alerts, contacts, publicMessages, privateMessages, crowdMarkers, isOffline, syncStatus, setIsOffline, saveUserProfile, logoutUserProfile, addContact, removeContact, addAlert, sendPublicMessage, sendPrivateMessage, addCrowdMarker }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isHydrated, userProfile, alerts, contacts, publicMessages, privateMessages, crowdMarkers, isOffline, syncStatus],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

export function severityColor(severity: Severity, palette: ReturnType<typeof import('@/hooks/useColors').useColors>) {
  if (severity === 'Critical') return palette.critical;
  if (severity === 'High') return palette.high;
  if (severity === 'Moderate') return palette.moderate;
  return palette.low;
}

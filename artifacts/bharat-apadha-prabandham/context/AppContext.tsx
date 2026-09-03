import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertItem, Contact, CrowdMarker, contacts, initialAlerts, initialCrowdMarkers, initialPrivateMessages, initialPublicMessages, Message, Severity } from '@/constants/data';
import { createMessageHash } from '@/lib/hash';

type AppContextValue = {
  alerts: AlertItem[];
  contacts: Contact[];
  publicMessages: Message[];
  privateMessages: Record<string, Message[]>;
  crowdMarkers: CrowdMarker[];
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
  addAlert: (alert: Omit<AlertItem, 'id' | 'time' | 'source'>) => void;
  sendPublicMessage: (text: string) => void;
  sendPrivateMessage: (contactId: string, text: string) => void;
  addCrowdMarker: (kind: CrowdMarker['kind']) => void;
  addContact: (phoneNumber: string) => void;
};

const STORAGE_KEY = 'bap-local-state-v1';
const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  return prefix + '-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
}

export function AppProvider({ children }: PropsWithChildren) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [publicMessages, setPublicMessages] = useState<Message[]>(initialPublicMessages);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>(initialPrivateMessages);
  const [crowdMarkers, setCrowdMarkers] = useState<CrowdMarker[]>(initialCrowdMarkers);
  const [contactsState, setContactsState] = useState<Contact[]>(contacts);
  const [isOffline, setIsOffline] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        try {
          const saved = JSON.parse(value) as Partial<{ alerts: AlertItem[]; publicMessages: Message[]; privateMessages: Record<string, Message[]>; crowdMarkers: CrowdMarker[]; contacts: Contact[] }>;
          if (saved.alerts) setAlerts(saved.alerts);
          if (saved.publicMessages) setPublicMessages(saved.publicMessages);
          if (saved.privateMessages) setPrivateMessages(saved.privateMessages);
          if (saved.crowdMarkers) setCrowdMarkers(saved.crowdMarkers);
          if (saved.contacts) setContactsState(saved.contacts);
        } catch {
          // Keep the safe built-in offline data if local state is unreadable.
        }
      }
      hydrated.current = true;
    }).catch(() => {
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ alerts, publicMessages, privateMessages, crowdMarkers, contacts: contactsState })).catch(() => undefined);
  }, [alerts, publicMessages, privateMessages, crowdMarkers, contactsState]);

  const addAlert = (input: Omit<AlertItem, 'id' | 'time' | 'source'>) => {
    setAlerts((current) => [{ ...input, id: makeId('alert'), time: 'Just now', source: 'Community verified' }, ...current]);
  };

  const createMessage = (text: string): Message => {
    const timestamp = Date.now();
    return { id: makeId('message'), sender: 'You', text, timestamp, hash: createMessageHash('You', text, timestamp), verified: true };
  };

  const sendPublicMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPublicMessages((current) => [...current, createMessage(trimmed)]);
  };

  const sendPrivateMessage = (contactId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPrivateMessages((current) => ({ ...current, [contactId]: [...(current[contactId] || []), createMessage(trimmed)] }));
  };

  const addCrowdMarker = (kind: CrowdMarker['kind']) => {
    setCrowdMarkers((current) => [{ id: makeId('crowd'), kind, label: kind === 'Safe' ? 'Community marked safe' : 'Community reported danger', coordinate: { latitude: 20.289 + Math.random() * 0.02, longitude: 85.82 + Math.random() * 0.02 }, time: 'Just now' }, ...current]);
  };

  const addContact = (phoneNumber: string) => {
    if (!phoneNumber.trim()) return;
    const newContact: Contact = {
      id: phoneNumber,
      name: phoneNumber,
      role: 'Added via Mobile',
      initials: '#',
      color: '#2D8A81',
      lastSeen: 'Active now'
    };
    setContactsState(current => [...current, newContact]);
  };

  const value = useMemo(() => ({ alerts, contacts: contactsState, publicMessages, privateMessages, crowdMarkers, isOffline, setIsOffline, addAlert, sendPublicMessage, sendPrivateMessage, addCrowdMarker, addContact }), [alerts, contactsState, publicMessages, privateMessages, crowdMarkers, isOffline]);
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

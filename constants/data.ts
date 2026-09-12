export type Severity = 'Critical' | 'High' | 'Moderate' | 'Low';

export type AlertItem = {
  id: string;
  title: string;
  severity: Severity;
  time: string;
  location: string;
  body: string;
  source: string;
};

export type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  initials: string;
  color: string;
  lastSeen: string;
};

export type Message = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  hash: string;
  verified: boolean;
};

export type CrowdMarker = {
  id: string;
  kind: 'Safe' | 'Danger';
  label: string;
  coordinate: { latitude: number; longitude: number };
  time: string;
};

export const initialAlerts: AlertItem[] = [];
export const initialPrivateMessages: Record<string, Message[]> = {};
export const initialPublicMessages: Message[] = [];
export const initialCrowdMarkers: CrowdMarker[] = [];

export const indianLanguages = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Assamese'];

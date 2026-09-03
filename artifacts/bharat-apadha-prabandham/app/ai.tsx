import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChatComposer } from '@/components/ChatComposer';
import { Card, IconButton, StatusPill } from '@/components/Primitives';
import { useApp } from '@/context/AppContext';
import { Message } from '@/constants/data';
import { createMessageHash } from '@/lib/hash';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const answerFor = (prompt: string) => { const lower = prompt.toLowerCase(); if (lower.includes('first aid') || lower.includes('injury')) return 'For severe bleeding, press firmly with clean cloth and keep pressure steady. For burns, cool with clean running water for 20 minutes. Call 112 for life-threatening injuries.'; if (lower.includes('translate')) return 'I can translate an alert into Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, or Assamese. Open Translator for the full language pack.'; if (lower.includes('earthquake')) return 'Drop, cover, and hold on. Stay away from windows. After shaking stops, move outside only if the building is damaged and use stairs, not lifts.'; if (lower.includes('flood')) return 'Move to higher ground before water rises. Do not walk or drive through moving water. Switch off electricity only if you can do so safely.'; return 'Stay calm, move away from immediate danger, and follow verified government instructions. Keep water, medicines, a torch, and a charged phone with you.'; };

export default function AiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isOffline } = useApp();
  const welcome: Message = { id: 'ai-welcome', sender: 'BAP local model', text: 'I can help with safety steps, first aid, evacuation, and alert translation. What do you need right now?', timestamp: 0, hash: 'BAP-LOCAL-0001', verified: true };
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [typing, setTyping] = useState(false);
  const ask = (text: string) => { const timestamp = Date.now(); const user: Message = { id: 'user-' + timestamp.toString(), sender: 'You', text, timestamp, hash: createMessageHash('You', text, timestamp), verified: true }; setMessages((current) => [...current, user]); setTyping(true); setTimeout(() => { const responseText = answerFor(text); const responseTime = Date.now(); setMessages((current) => [...current, { id: 'ai-' + responseTime.toString(), sender: 'BAP local model', text: responseText, timestamp: responseTime, hash: 'BAP-LOCAL-' + responseTime.toString().slice(-6), verified: true }]); setTyping(false); }, 500); };
  return <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}><View style={styles.header}><IconButton name="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /><View style={styles.headerCenter}><View style={[styles.aiDot, { backgroundColor: colors.sage }]}><Feather name="cpu" size={14} color={colors.primaryForeground} /></View><View><Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety assistant</Text><Text style={[styles.headerMeta, { color: colors.sageLight }]}>Local inference · {isOffline ? 'offline' : 'connected'}</Text></View></View><StatusPill label="Private" icon="lock" /></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 14, gap: 12 }}>{messages.map((message) => <MessageBubble key={message.id} message={message} colors={colors} />)}{typing ? <View style={styles.typing}><View style={[styles.typingDot, { backgroundColor: colors.sageLight }]} /><Text style={[styles.typingText, { color: colors.mutedForeground }]}>Thinking locally...</Text></View> : null}</ScrollView><View style={[styles.quickWrap, { borderTopColor: colors.border }]}><Text style={[styles.quickLabel, { color: colors.mutedForeground }]}>QUICK HELP</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>{['Safety tips', 'First aid', 'Flood steps', 'Translate alert'].map((item) => <Pressable key={item} onPress={() => ask(item)} style={[styles.quickButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={item === 'First aid' ? 'heart' : item === 'Translate alert' ? 'globe' : 'shield'} size={13} color={colors.sageLight} /><Text style={[styles.quickText, { color: colors.foreground }]}>{item}</Text></Pressable>)}</ScrollView><ChatComposer onSend={ask} placeholder="Ask about your safety..." /></View></View>;
}

function MessageBubble({ message, colors }: { message: Message; colors: ReturnType<typeof useColors> }) { const mine = message.sender === 'You'; return <View style={[styles.messageRow, mine && styles.mine]}><View style={[styles.bubble, { backgroundColor: mine ? colors.sage : colors.card, borderColor: mine ? colors.sage : colors.border }]}><Text style={[styles.sender, { color: mine ? colors.primaryForeground : colors.sageLight }]}>{message.sender}</Text><Text style={[styles.messageText, { color: mine ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text>{message.verified ? <View style={styles.hashRow}><Feather name="check-circle" size={11} color={mine ? colors.primaryForeground : colors.sageLight} /><Text numberOfLines={1} style={[styles.hashText, { color: mine ? colors.primaryForeground : colors.mutedForeground }]}>{message.hash} · verified</Text></View> : null}</View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(43,65,99,0.55)' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  aiDot: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  headerMeta: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 3 },
  messageRow: { alignItems: 'flex-start' },
  mine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '88%', borderRadius: 17, borderWidth: 1, padding: 12 },
  sender: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  messageText: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  hashRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  hashText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },
  typingText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  quickWrap: { borderTopWidth: 1, padding: 12, paddingBottom: 10 },
  quickLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  quickRow: { gap: 7, paddingBottom: 10 },
  quickButton: { borderRadius: 11, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

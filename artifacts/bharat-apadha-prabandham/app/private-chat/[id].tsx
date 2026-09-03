import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ChatComposer } from '@/components/ChatComposer';
import { IconButton, StatusPill } from '@/components/Primitives';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivateChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contacts, privateMessages, sendPrivateMessage, isOffline } = useApp();
  const contact = contacts.find((item) => item.id === id) || contacts[0];
  const messages = privateMessages[contact.id] || [];
  return <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]} keyboardVerticalOffset={0}><View style={[styles.header, { paddingTop: insets.top + 8 }]}><IconButton name="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /><View style={[styles.avatar, { backgroundColor: contact.color }]}><Text style={styles.avatarText}>{contact.initials}</Text></View><View style={styles.headerCopy}><Text style={[styles.title, { color: colors.foreground }]}>{contact.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{contact.lastSeen} · {isOffline ? 'Bluetooth relay ready' : 'End-to-end synced'}</Text></View><StatusPill label="Private" icon="lock" /></View><View style={[styles.banner, { backgroundColor: colors.sage + '16', borderColor: colors.sage + '40' }]}><Feather name="shield" size={13} color={colors.sageLight} /><Text style={[styles.bannerText, { color: colors.sageLight }]}>Private messages are hash-verified before delivery</Text></View><FlatList data={[...messages].reverse()} inverted keyExtractor={(item) => item.id} contentContainerStyle={styles.list} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" renderItem={({ item }) => <PrivateBubble message={item} colors={colors} />} ListEmptyComponent={<View style={styles.empty}><Feather name="message-circle" size={25} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start a resilient conversation</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Your messages stay on this device and can relay over Bluetooth mesh.</Text></View>} /><View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: insets.bottom + 8 }}><ChatComposer onSend={(text) => sendPrivateMessage(contact.id, text)} placeholder={'Message ' + contact.name.split(' ')[0]} /></View></KeyboardAvoidingView>;
}

function PrivateBubble({ message, colors }: { message: { sender: string; text: string; hash: string }; colors: ReturnType<typeof useColors> }) { const mine = message.sender === 'You'; return <View style={[styles.row, mine && styles.mine]}><View style={[styles.bubble, { backgroundColor: mine ? colors.sage : colors.card, borderColor: mine ? colors.sage : colors.border }]}><Text style={[styles.text, { color: mine ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text><View style={styles.hash}><Feather name="check-circle" size={10} color={mine ? colors.primaryForeground : colors.sageLight} /><Text style={[styles.hashText, { color: mine ? colors.primaryForeground : colors.mutedForeground }]}>{message.hash}</Text></View></View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(43,65,99,0.55)' },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter_700Bold' },
  headerCopy: { flex: 1, marginLeft: 9 },
  title: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4 },
  banner: { margin: 12, borderRadius: 11, borderWidth: 1, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 14, paddingTop: 4, gap: 9 },
  row: { alignItems: 'flex-start', marginVertical: 4 },
  mine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '84%', borderRadius: 16, borderWidth: 1, padding: 12 },
  text: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  hash: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  hashText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50, paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyBody: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

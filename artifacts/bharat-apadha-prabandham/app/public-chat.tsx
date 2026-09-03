import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ChatComposer } from '@/components/ChatComposer';
import { IconButton, StatusPill } from '@/components/Primitives';
import { Message } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PublicChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { publicMessages, sendPublicMessage, isOffline } = useApp();
  return <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]} keyboardVerticalOffset={0}><View style={[styles.header, { paddingTop: insets.top + 8 }]}><IconButton name="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /><View style={styles.headerCopy}><Text style={[styles.title, { color: colors.foreground }]}>Public room</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}><View style={[styles.liveDot, { backgroundColor: colors.low }]} /> {isOffline ? 'Local relay · ' : 'Open network · '}{publicMessages.length} updates</Text></View><StatusPill label="Open" icon="users" /></View><FlatList data={[...publicMessages].reverse()} inverted keyExtractor={(item) => item.id} contentContainerStyle={styles.list} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" renderItem={({ item }) => <PublicBubble message={item} colors={colors} />} ListHeaderComponent={<View style={styles.notice}><Feather name="shield" size={13} color={colors.sageLight} /><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Open room · Share only what helps people stay safe.</Text></View>} /><View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: insets.bottom + 8 }}><ChatComposer onSend={sendPublicMessage} placeholder="Share an update with nearby people" /></View></KeyboardAvoidingView>;
}

function PublicBubble({ message, colors }: { message: Message; colors: ReturnType<typeof useColors> }) { const mine = message.sender === 'You'; return <View style={[styles.row, mine && styles.mine]}><View style={[styles.bubble, { backgroundColor: mine ? colors.sage : colors.card, borderColor: mine ? colors.sage : colors.border }]}><Text style={[styles.sender, { color: mine ? colors.primaryForeground : colors.sageLight }]}>{message.sender}</Text><Text style={[styles.text, { color: mine ? colors.primaryForeground : colors.foreground }]}>{message.text}</Text><View style={styles.hash}><Feather name="check-circle" size={10} color={mine ? colors.primaryForeground : colors.sageLight} /><Text style={[styles.hashText, { color: mine ? colors.primaryForeground : colors.mutedForeground }]}>{message.hash}</Text></View></View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(43,65,99,0.55)' },
  headerCopy: { flex: 1, marginLeft: 2 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  list: { paddingHorizontal: 14, paddingTop: 14, gap: 9 },
  row: { alignItems: 'flex-start', marginVertical: 4 },
  mine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '86%', borderRadius: 16, borderWidth: 1, padding: 12 },
  sender: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  text: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  hash: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  hashText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  notice: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noticeText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});

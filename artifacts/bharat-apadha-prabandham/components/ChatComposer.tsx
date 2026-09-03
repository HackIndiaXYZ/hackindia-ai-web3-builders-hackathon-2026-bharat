import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function ChatComposer({ onSend, placeholder = 'Write a message' }: { onSend: (text: string) => void; placeholder?: string }) {
  const colors = useColors();
  const [text, setText] = useState('');
  const submit = () => { if (!text.trim()) return; onSend(text.trim()); setText(''); };
  return <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}><TextInput value={text} onChangeText={setText} onSubmitEditing={submit} returnKeyType="send" placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} multiline maxLength={500} /><Pressable testID="send-message" accessibilityRole="button" accessibilityLabel="Send message" onPress={submit} style={({ pressed }) => [styles.send, { backgroundColor: text.trim() ? colors.sage : colors.muted }, pressed && styles.pressed]}><Feather name="arrow-up" size={18} color={text.trim() ? colors.primaryForeground : colors.mutedForeground} /></Pressable></View>;
}

const styles = StyleSheet.create({
  wrapper: { minHeight: 52, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 6, paddingVertical: 5 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 90, paddingTop: 8, paddingBottom: 8 },
  send: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
});

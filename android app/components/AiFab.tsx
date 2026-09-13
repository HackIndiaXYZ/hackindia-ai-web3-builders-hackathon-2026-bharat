import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function AiFab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <Pressable testID="open-ai-assistant" accessibilityRole="button" accessibilityLabel="Open local safety assistant" onPress={() => router.push('/ai')} style={({ pressed }) => [styles.fab, { backgroundColor: colors.sage, bottom: insets.bottom + 132 }, pressed && styles.pressed]}><Feather name="cpu" size={19} color={colors.primaryForeground} /><Text style={[styles.label, { color: colors.primaryForeground }]}>Ask AI</Text></Pressable>;
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 18, minHeight: 52, borderRadius: 28, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiFab } from '@/components/AiFab';

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  return <View style={styles.root}><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.sageLight, tabBarInactiveTintColor: colors.mutedForeground, tabBarStyle: { position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background, borderTopWidth: isWeb ? 1 : 0, borderTopColor: colors.border, elevation: 0, height: isWeb ? 84 : 58 + insets.bottom, paddingBottom: isWeb ? 30 : insets.bottom, paddingTop: 7 }, tabBarBackground: () => Platform.OS === 'ios' ? <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> }}><Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Feather name="radio" size={21} color={color} /> }} /><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Feather name="home" size={21} color={color} /> }} /><Tabs.Screen name="translator" options={{ title: 'Translator', tabBarIcon: ({ color }) => <Feather name="globe" size={21} color={color} /> }} /><Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color }) => <Feather name="map" size={21} color={color} /> }} /></Tabs><AiFab /></View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });

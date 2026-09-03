import React from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const tabHeight = isWeb ? 84 : 58 + insets.bottom;
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.sageLight, tabBarInactiveTintColor: colors.mutedForeground, tabBarStyle: { position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background, borderTopWidth: isWeb ? 1 : 0, borderTopColor: colors.border, elevation: 0, height: tabHeight, paddingBottom: isWeb ? 30 : insets.bottom, paddingTop: 7 }, tabBarBackground: () => Platform.OS === 'ios' ? <BlurView intensity={92} tint="light" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> }}>
        <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Feather name="radio" size={21} color={color} /> }} />
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Feather name="home" size={21} color={color} /> }} />
        <Tabs.Screen name="translator" options={{ title: 'Translator', tabBarIcon: ({ color }) => <Feather name="globe" size={21} color={color} /> }} />
        <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color }) => <Feather name="map" size={21} color={color} /> }} />
      </Tabs>
      <Pressable 
        onPress={() => router.push('/ai')} 
        style={({ pressed }) => [
          styles.fab, 
          { backgroundColor: colors.sage, bottom: tabHeight + 20 },
          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
        ]}
      >
        <Feather name="cpu" size={24} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  }
});

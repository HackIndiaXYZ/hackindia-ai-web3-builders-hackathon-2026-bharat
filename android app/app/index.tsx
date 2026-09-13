import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ONBOARDING_KEY = 'bap-onboarding-seen';

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);
  useEffect(() => { AsyncStorage.getItem(ONBOARDING_KEY).then((seen) => { if (seen) router.replace('/(tabs)'); else setChecking(false); }).catch(() => setChecking(false)); }, []);
  if (checking) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.sageLight} /></View>;
  return <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}><View style={styles.brandRow}><View style={[styles.brandMark, { backgroundColor: colors.sage }]}><Feather name="shield" size={21} color={colors.primaryForeground} /></View><Text style={[styles.brandText, { color: colors.foreground }]}>BAP / 01</Text></View><View style={styles.center}><View style={[styles.iconRing, { borderColor: colors.sage }]}><Image source={require('@/assets/images/icon.png')} style={styles.icon} /></View><Text style={[styles.kicker, { color: colors.sageLight }]}>SMART INDIA HACKATHON 2026</Text><Text style={[styles.title, { color: colors.foreground }]}>Safety moves faster{String.fromCharCode(10)}when we move together.</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Bharat Apadha Prabandhak brings verified alerts, local guidance, and resilient communication into one calm place.</Text><View style={styles.featureList}><Feature icon="radio" text="Government alerts, verified" colors={colors} /><Feature icon="wifi-off" text="Ready when networks are not" colors={colors} /><Feature icon="users" text="Community-powered response" colors={colors} /></View></View><Pressable testID="enter-app" accessibilityRole="button" onPress={() => { AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => undefined); router.replace('/(tabs)'); }} style={({ pressed }) => [styles.enterButton, { backgroundColor: colors.sage }, pressed && styles.pressed]}><Text style={[styles.enterText, { color: colors.primaryForeground }]}>Enter emergency network</Text><Feather name="arrow-right" size={18} color={colors.primaryForeground} /></Pressable><Text style={[styles.footer, { color: colors.mutedForeground }]}>Works offline · Built for India</Text></View>;
}

function Feature({ icon, text, colors }: { icon: React.ComponentProps<typeof Feather>['name']; text: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.feature}><Feather name={icon} size={16} color={colors.sageLight} /><Text style={[styles.featureText, { color: colors.foreground }]}>{text}</Text></View>; }

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  center: { gap: 16 },
  iconRing: { alignSelf: 'flex-start', width: 92, height: 92, borderRadius: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  icon: { width: 80, height: 80, borderRadius: 40 },
  kicker: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.4 },
  title: { fontSize: 35, lineHeight: 40, letterSpacing: -1.3, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 15, lineHeight: 23, fontFamily: 'Inter_400Regular', maxWidth: 340 },
  featureList: { gap: 13, marginTop: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  enterButton: { height: 54, borderRadius: 17, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enterText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  footer: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 13 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});

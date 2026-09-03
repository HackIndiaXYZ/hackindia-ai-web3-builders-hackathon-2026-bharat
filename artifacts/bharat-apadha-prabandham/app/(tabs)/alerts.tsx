import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { AlertCard } from '@/components/AlertCard';
import { ActionButton, IconButton, StatusPill } from '@/components/Primitives';
import { AlertItem, Severity } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, addAlert, isOffline } = useApp();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<Severity>('High');
  const submit = () => { if (!title.trim() || !location.trim() || !body.trim()) return; addAlert({ title: title.trim(), location: location.trim(), body: body.trim(), severity }); setTitle(''); setLocation(''); setBody(''); setAdding(false); };
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><KeyboardAwareScrollViewCompat bottomOffset={30} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 118 }} keyboardShouldPersistTaps="handled"><View style={styles.header}><View><Text style={[styles.kicker, { color: colors.sageLight }]}>LIVE BROADCASTS</Text><Text style={[styles.title, { color: colors.foreground }]}>Government alerts</Text></View><View style={styles.headerRight}><StatusPill label={isOffline ? 'Offline cache' : 'Live'} icon={isOffline ? 'wifi-off' : 'radio'} /><IconButton name={adding ? 'x' : 'plus'} accessibilityLabel={adding ? 'Close add alert form' : 'Add alert'} onPress={() => setAdding((value) => !value)} /></View></View><Text style={[styles.intro, { color: colors.mutedForeground }]}>Verified warnings from national and state response networks, plus trusted community reports.</Text>{adding ? <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.formTitle, { color: colors.foreground }]}>Share a verified alert</Text><TextInput value={title} onChangeText={setTitle} placeholder="Alert title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><TextInput value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><TextInput value={body} onChangeText={setBody} placeholder="What should people know?" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.textarea, { color: colors.foreground, borderColor: colors.border }]} multiline /><Text style={[styles.label, { color: colors.mutedForeground }]}>Severity</Text><View style={styles.severityRow}>{(['Critical', 'High', 'Moderate', 'Low'] as Severity[]).map((option) => <Pressable key={option} onPress={() => setSeverity(option)} style={[styles.severityOption, { borderColor: severity === option ? colors.sageLight : colors.border, backgroundColor: severity === option ? colors.sage + '24' : 'transparent' }]}><View style={[styles.severityDot, { backgroundColor: option === 'Critical' ? colors.critical : option === 'High' ? colors.high : option === 'Moderate' ? colors.moderate : colors.low }]} /><Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text></Pressable>)}</View><ActionButton label="Publish to local network" icon="radio" onPress={submit} disabled={!title.trim() || !location.trim() || !body.trim()} /></View> : null}<View style={styles.metaRow}><Text style={[styles.count, { color: colors.foreground }]}>{alerts.length} alerts</Text><Text style={[styles.updated, { color: colors.mutedForeground }]}>Sorted by urgency</Text></View>{alerts.map((alert) => <View key={alert.id} style={styles.alertWrap}><AlertCard alert={alert} /></View>)}</KeyboardAwareScrollViewCompat></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  intro: { paddingHorizontal: 20, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: 10, marginBottom: 22 },
  form: { marginHorizontal: 18, borderRadius: 18, borderWidth: 1, padding: 15, marginBottom: 22, gap: 10 },
  formTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  input: { minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  severityOption: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  severityDot: { width: 7, height: 7, borderRadius: 4 },
  optionText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  metaRow: { marginHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, alignItems: 'center' },
  count: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  updated: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  alertWrap: { marginHorizontal: 18, marginBottom: 10 },
});

import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { AlertCard } from '@/components/AlertCard';
import { ActionButton, IconButton, StatusPill } from '@/components/Primitives';
import { AlertItem, Severity } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { fetchWeatherAlerts, fetchNdmaAlerts } from '@/lib/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockchain } from '@/app/bcproviders';
import { queueOfflineAlert } from '@/lib/blockchain/verifyStaleAlerts';

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, addAlert, isOffline, syncStatus } = useApp();
  const { isAnchoring } = useBlockchain();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<Severity>('High');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Request location permission and get GPS coords for live alerts.
  useEffect(() => {
    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }
    }
    if (!isOffline) void getLocation();
  }, [isOffline]);

  // Live weather alerts from Open-Meteo.
  const { data: weatherAlerts } = useQuery({
    queryKey: ['weather-alerts', coords?.lat, coords?.lon],
    queryFn: () => fetchWeatherAlerts(coords!.lat, coords!.lon),
    enabled: !isOffline && coords !== null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // NDMA alerts via Supabase edge proxy.
  const { data: ndmaAlerts } = useQuery({
    queryKey: ['ndma-alerts'],
    queryFn: fetchNdmaAlerts,
    enabled: !isOffline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Merge live + local alerts, deduplicate by id.
  const liveAlerts = [...(weatherAlerts ?? []), ...(ndmaAlerts ?? [])];
  const allAlertIds = new Set(alerts.map((a) => a.id));
  const newLiveAlerts = liveAlerts.filter((a) => !allAlertIds.has(a.id));
  const displayAlerts = [...newLiveAlerts, ...alerts].sort((a, b) => {
    const severityOrder: Record<Severity, number> = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const submit = async () => {
    if (!title.trim() || !location.trim() || !body.trim()) return;
    const alertData = { title: title.trim(), location: location.trim(), body: body.trim(), severity };
    addAlert(alertData);
    
    try {
      await queueOfflineAlert(alertData);
    } catch (e) {}

    setTitle('');
    setLocation('');
    setBody('');
    setAdding(false);
  };

  const syncLabel = isOffline ? 'Offline cache' : isAnchoring ? 'Anchoring...' : syncStatus === 'syncing' ? 'Syncing...' : 'Live';
  const syncIcon = isOffline ? 'wifi-off' : syncStatus === 'syncing' ? 'loader' : 'radio';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat bottomOffset={30} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 118 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.sageLight }]}>LIVE BROADCASTS</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Government alerts</Text>
          </View>
          <View style={styles.headerRight}>
            <StatusPill label={syncLabel} icon={syncIcon} />
            <IconButton name={adding ? 'x' : 'plus'} accessibilityLabel={adding ? 'Close add alert form' : 'Add alert'} onPress={() => setAdding((value) => !value)} />
          </View>
        </View>

        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          {isOffline
            ? 'Showing cached alerts. Connect to receive live government and weather warnings.'
            : 'Live warnings from NDMA, IMD weather alerts, and verified community reports.'}
        </Text>

        {adding ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Share a verified alert</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Alert title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={body} onChangeText={setBody} placeholder="What should people know?" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.textarea, { color: colors.foreground, borderColor: colors.border }]} multiline />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Severity</Text>
            <View style={styles.severityRow}>
              {(['Critical', 'High', 'Moderate', 'Low'] as Severity[]).map((option) => (
                <Pressable key={option} onPress={() => setSeverity(option)} style={[styles.severityOption, { borderColor: severity === option ? colors.sageLight : colors.border, backgroundColor: severity === option ? colors.sage + '24' : 'transparent' }]}>
                  <View style={[styles.severityDot, { backgroundColor: option === 'Critical' ? colors.critical : option === 'High' ? colors.high : option === 'Moderate' ? colors.moderate : colors.low }]} />
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <ActionButton label="Publish to network" icon="radio" onPress={submit} disabled={!title.trim() || !location.trim() || !body.trim()} />
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.count, { color: colors.foreground }]}>{displayAlerts.length} alerts</Text>
          <Text style={[styles.updated, { color: colors.mutedForeground }]}>
            {isOffline ? 'Cached · sorted by urgency' : 'Live · sorted by urgency'}
          </Text>
        </View>

        {displayAlerts.map((alert) => (
          <View key={alert.id} style={styles.alertWrap}>
            <AlertCard alert={alert} />
          </View>
        ))}

        {displayAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={32} color={colors.sageLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No active alerts</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              {isOffline ? 'Connect to check for live government and weather warnings.' : 'Your area currently has no active warnings. Stay prepared.'}
            </Text>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
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
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptyBody: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MapCanvas } from '@/components/MapCanvas';
import { Card, StatusPill } from '@/components/Primitives';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { fetchNearbyEmergencyPlaces, type EmergencyPlace } from '@/lib/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

const defaultRegion: Region = { latitude: 20.2961, longitude: 85.8245, latitudeDelta: 0.09, longitudeDelta: 0.09 };

// Fallback static shelters shown when offline.
const fallbackShelters: EmergencyPlace[] = [
  { id: 'shelter-1', title: 'Unit 6 Community Centre', type: 'Shelter', coordinate: { latitude: 20.302, longitude: 85.815 } },
  { id: 'hospital-1', title: 'Capital Hospital', type: 'Hospital', coordinate: { latitude: 20.287, longitude: 85.83 } },
  { id: 'relief-1', title: 'Relief camp · School 3', type: 'Relief camp', coordinate: { latitude: 20.31, longitude: 85.839 } },
];

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { crowdMarkers, addCrowdMarker, isOffline } = useApp();
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [markerSheet, setMarkerSheet] = useState(false);
  const [layer, setLayer] = useState<'all' | 'safe' | 'danger'>('all');

  const requestLocation = async () => {
    const result = await requestPermission();
    if (result.granted) {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion((current) => ({ ...current, latitude: position.coords.latitude, longitude: position.coords.longitude }));
    }
  };

  // Fetch real shelter/hospital data from Overpass API when online.
  const { data: liveShelters, isFetching: sheltersFetching } = useQuery({
    queryKey: ['emergency-places', region.latitude.toFixed(2), region.longitude.toFixed(2)],
    queryFn: () => fetchNearbyEmergencyPlaces(region.latitude, region.longitude, 8000),
    enabled: !isOffline,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });

  const shelters = isOffline ? fallbackShelters : (liveShelters ?? fallbackShelters);
  const shownCrowd = crowdMarkers.filter((item) => layer === 'all' || item.kind.toLowerCase() === layer);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.top, { paddingTop: insets.top + 11 }]}>
        <View>
          <Text style={[styles.kicker, { color: colors.sageLight }]}>FIELD VIEW</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Response map</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {sheltersFetching ? <ActivityIndicator size="small" color={colors.sageLight} /> : null}
          <StatusPill label={isOffline ? 'Offline mode' : 'Live map'} icon={isOffline ? 'wifi-off' : 'navigation'} />
        </View>
      </View>

      <View style={styles.mapWrap}>
        <MapCanvas
          colors={colors}
          region={region}
          onRegionChange={setRegion}
          showUserLocation={permission?.granted === true}
          shelters={shelters}
          crowdMarkers={shownCrowd}
        />
        <View style={[styles.offlineBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={isOffline ? 'download-cloud' : 'radio'} size={13} color={colors.sageLight} />
          <Text style={[styles.offlineText, { color: colors.foreground }]}>
            {isOffline ? `Cached · ${fallbackShelters.length} locations` : `Live OSM · ${shelters.length} nearby`}
          </Text>
        </View>
        <Pressable onPress={requestLocation} style={[styles.locate, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="crosshair" size={18} color={colors.sageLight} />
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Text style={[styles.layerLabel, { color: colors.mutedForeground }]}>COMMUNITY LAYERS</Text>
        <View style={styles.chips}>
          {(['all', 'safe', 'danger'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setLayer(option)}
              style={[styles.chip, { borderColor: layer === option ? colors.sageLight : colors.border, backgroundColor: layer === option ? colors.sage + '24' : colors.card }]}
            >
              <View style={[styles.chipDot, { backgroundColor: option === 'safe' ? colors.low : option === 'danger' ? colors.critical : colors.sageLight }]} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>
                {option === 'all' ? 'All reports' : option === 'safe' ? 'Safe' : 'Danger'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.legend}>
          <Legend color={colors.sage} text="Shelter / hospital" colors={colors} />
          <Legend color={colors.moderate} text="Risk zone" colors={colors} />
          <Legend color={colors.critical} text="Community alert" colors={colors} />
          <Legend color={colors.low} text="Police / relief" colors={colors} />
        </View>

        <Pressable onPress={() => setMarkerSheet(true)} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.sage }, pressed && styles.pressed]}>
          <Feather name="map-pin" size={16} color={colors.primaryForeground} />
          <Text style={[styles.addText, { color: colors.primaryForeground }]}>Report a location</Text>
        </Pressable>
      </View>

      <Modal visible={markerSheet} transparent animationType="slide" onRequestClose={() => setMarkerSheet(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setMarkerSheet(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>What is happening here?</Text>
            <Text style={[styles.sheetBody, { color: colors.mutedForeground }]}>
              Your report is hash-verified and {isOffline ? 'queued for sync' : 'shared across all connected devices'}.
            </Text>
            <Pressable onPress={() => { addCrowdMarker('Safe'); setMarkerSheet(false); }} style={[styles.reportOption, { borderColor: colors.low + '66', backgroundColor: colors.low + '16' }]}>
              <View style={[styles.reportIcon, { backgroundColor: colors.low }]}>
                <Feather name="check" size={18} color={colors.primaryForeground} />
              </View>
              <View>
                <Text style={[styles.reportTitle, { color: colors.foreground }]}>Mark as safe</Text>
                <Text style={[styles.reportBody, { color: colors.mutedForeground }]}>Shelter open, route clear, or help available</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => { addCrowdMarker('Danger'); setMarkerSheet(false); }} style={[styles.reportOption, { borderColor: colors.critical + '66', backgroundColor: colors.critical + '16' }]}>
              <View style={[styles.reportIcon, { backgroundColor: colors.critical }]}>
                <Feather name="alert-triangle" size={18} color={colors.primaryForeground} />
              </View>
              <View>
                <Text style={[styles.reportTitle, { color: colors.foreground }]}>Report danger</Text>
                <Text style={[styles.reportBody, { color: colors.mutedForeground }]}>Blocked road, flooding, or immediate risk</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Legend({ color, text, colors }: { color: string; text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 13 },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  mapWrap: { height: 315, marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#2B4163', position: 'relative' },
  offlineBadge: { position: 'absolute', top: 12, left: 12, borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  locate: { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { paddingHorizontal: 20, paddingTop: 18 },
  layerLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 15, marginBottom: 17 },
  legendItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  addButton: { height: 47, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingTop: 10, gap: 11, paddingBottom: 30 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(170,184,200,0.5)', marginBottom: 10 },
  sheetTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  sheetBody: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginBottom: 5 },
  reportOption: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', gap: 11, alignItems: 'center' },
  reportIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reportBody: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
});

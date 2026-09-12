import { Feather } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MapCanvasProps } from '@/components/MapCanvas';

export function MapCanvas({ colors, region, onRegionChange, showUserLocation, shelters, crowdMarkers }: MapCanvasProps) {
  return <MapView provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill} region={region} onRegionChangeComplete={onRegionChange} showsUserLocation={showUserLocation} showsMyLocationButton={false} customMapStyle={[{ elementType: 'geometry', stylers: [{ color: colors.card }] }, { elementType: 'labels.text.fill', stylers: [{ color: colors.mutedForeground }] }, { featureType: 'water', stylers: [{ color: colors.background }] }]}><Polygon coordinates={[{ latitude: 20.32, longitude: 85.78 }, { latitude: 20.35, longitude: 85.86 }, { latitude: 20.27, longitude: 85.88 }, { latitude: 20.25, longitude: 85.8 }]} fillColor="rgba(240, 90, 90, 0.16)" strokeColor="rgba(240, 90, 90, 0.65)" strokeWidth={1} /><Circle center={{ latitude: 20.29, longitude: 85.83 }} radius={1700} fillColor="rgba(240, 200, 91, 0.14)" strokeColor="rgba(240, 200, 91, 0.6)" strokeWidth={1} />{shelters.map((item) => <Marker key={item.id} coordinate={item.coordinate} title={item.title} description={item.type}><View style={[styles.marker, { backgroundColor: colors.sage }]}><Feather name={item.type === 'Hospital' ? 'plus' : item.type === 'Shelter' ? 'home' : 'package'} size={13} color={colors.primaryForeground} /></View></Marker>)}{crowdMarkers.map((item) => <Marker key={item.id} coordinate={item.coordinate} title={item.label} description={item.time}><View style={[styles.marker, { backgroundColor: item.kind === 'Safe' ? colors.low : colors.critical }]}><Feather name={item.kind === 'Safe' ? 'check' : 'alert-triangle'} size={13} color={colors.primaryForeground} /></View></Marker>)}</MapView>;
}

const styles = StyleSheet.create({ marker: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F8F9FA' } });

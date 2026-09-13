import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertItem, Severity } from '@/constants/data';
import { severityColor } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/Primitives';

export function AlertCard({ alert, compact = false, onPress }: { alert: AlertItem; compact?: boolean; onPress?: () => void }) {
  const colors = useColors();
  const tone = severityColor(alert.severity, colors);
  const content = <Card style={compact ? styles.compactCard : undefined}><View style={styles.topLine}><View style={[styles.severityDot, { backgroundColor: tone }]} /><Text style={[styles.severity, { color: tone }]}>{alert.severity.toUpperCase()}</Text><Text style={[styles.time, { color: colors.mutedForeground }]}>{alert.time}</Text><Feather name="chevron-right" size={16} color={colors.mutedForeground} /></View><Text numberOfLines={compact ? 2 : undefined} style={[styles.title, { color: colors.foreground }]}>{alert.title}</Text><View style={styles.location}><Feather name="map-pin" size={13} color={colors.mutedForeground} /><Text style={[styles.locationText, { color: colors.mutedForeground }]}>{alert.location}</Text></View>{!compact ? <><Text style={[styles.body, { color: colors.mutedForeground }]}>{alert.body}</Text><View style={styles.source}><Feather name="radio" size={12} color={colors.sageLight} /><Text style={[styles.sourceText, { color: colors.sageLight }]}>{alert.source} · Verified broadcast</Text></View></> : null}</Card>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{content}</Pressable> : content;
}

export function severityLabel(severity: Severity): string { return severity; }

const styles = StyleSheet.create({
  compactCard: { padding: 14 },
  pressed: { opacity: 0.82 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severity: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 'auto' },
  title: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 21 },
  location: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 8 },
  locationText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  body: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: 12 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: 'rgba(120, 215, 201, 0.18)', marginTop: 14, paddingTop: 10 },
  sourceText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

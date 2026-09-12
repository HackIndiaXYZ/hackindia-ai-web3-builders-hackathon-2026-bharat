import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type IconButtonProps = { name: React.ComponentProps<typeof Feather>['name']; onPress: () => void; accessibilityLabel: string; size?: number; color?: string };
export function IconButton({ name, onPress, accessibilityLabel, size = 20, color }: IconButtonProps) {
  const colors = useColors();
  return <Pressable testID={accessibilityLabel} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Feather name={name} size={size} color={color || colors.foreground} /></Pressable>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} hitSlop={8}><Text style={[styles.sectionAction, { color: colors.sageLight }]}>{action}</Text></Pressable> : null}</View>;
}

export function StatusPill({ label, color, icon = 'check-circle' }: { label: string; color?: string; icon?: React.ComponentProps<typeof Feather>['name'] }) {
  const colors = useColors();
  return <View style={[styles.statusPill, { backgroundColor: (color || colors.sage) + '22' }]}><Feather name={icon} size={12} color={color || colors.sageLight} /><Text style={[styles.statusText, { color: color || colors.sageLight }]}>{label}</Text></View>;
}

export function ActionButton({ label, icon, onPress, secondary = false, disabled = false }: { label: string; icon?: React.ComponentProps<typeof Feather>['name']; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable disabled={disabled} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionButton, { backgroundColor: secondary ? colors.card : colors.sage, borderColor: secondary ? colors.border : colors.sage }, pressed && styles.pressed, disabled && styles.disabled]}>{icon ? <Feather name={icon} size={16} color={secondary ? colors.sageLight : colors.primaryForeground} /> : null}<Text style={[styles.actionButtonText, { color: secondary ? colors.sageLight : colors.primaryForeground }]}>{label}</Text></Pressable>;
}

export function EmptyState({ icon, title, body }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; body: string }) {
  const colors = useColors();
  return <View style={styles.emptyState}><Feather name={icon} size={28} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text></View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  actionButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  disabled: { opacity: 0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 9 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyBody: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 280, lineHeight: 19 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
});

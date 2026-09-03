import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCard } from '@/components/AlertCard';
import { SectionHeader } from '@/components/Primitives';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, contacts, publicMessages, privateMessages, isOffline, setIsOffline, addContact } = useApp();
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = () => {
    if (newContactPhone) {
      addContact(newContactPhone);
      setNewContactPhone('');
    }
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 118 }}>
  
  <SectionHeader title="Government alerts" action="View all" onAction={() => router.push('/(tabs)/alerts')} />
  <View style={styles.alertStack}>{alerts.slice(0, 2).map((alert) => <AlertCard key={alert.id} alert={alert} compact onPress={() => router.push('/(tabs)/alerts')} />)}</View>
  
  <SectionHeader title="My people" action="Public room" onAction={() => router.push('/public-chat')} />
  <View style={styles.addContactContainer}>
    <TextInput 
      value={newContactPhone} 
      onChangeText={setNewContactPhone} 
      placeholder="Enter mobile number..." 
      placeholderTextColor={colors.mutedForeground} 
      keyboardType="phone-pad"
      style={[styles.phoneInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} 
    />
    <Pressable onPress={handleAddContact} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.sage }, pressed && styles.pressed]}>
      <Feather name="user-plus" size={16} color={colors.primaryForeground} />
    </Pressable>
  </View>
  <View style={styles.contacts}>{contacts.map((contact) => <Pressable key={contact.id} onPress={() => router.push({ pathname: '/private-chat/[id]', params: { id: contact.id } })} style={({ pressed }) => [styles.contact, pressed && styles.pressed]}><View style={[styles.avatar, { backgroundColor: contact.color }]}><Text style={styles.avatarText}>{contact.initials}</Text></View><View style={styles.contactCopy}><Text style={[styles.contactName, { color: colors.foreground }]}>{contact.name}</Text><Text style={[styles.contactRole, { color: colors.mutedForeground }]}>{contact.role}</Text></View><View style={styles.online}><View style={[styles.onlineDot, { backgroundColor: contact.lastSeen === 'Active now' ? colors.low : colors.mutedForeground }]} /><Text style={[styles.onlineText, { color: colors.mutedForeground }]}>{contact.lastSeen}</Text></View></Pressable>)}</View>
  
  <Pressable onPress={() => router.push('/public-chat')} style={({ pressed }) => [styles.publicBar, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.publicIcon, { backgroundColor: colors.muted }]}><Feather name="users" size={17} color={colors.sageLight} /></View><View style={styles.publicCopy}><Text style={[styles.publicTitle, { color: colors.foreground }]}>Public community room</Text><Text style={[styles.publicMeta, { color: colors.mutedForeground }]}>{publicMessages.length} verified updates nearby</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
  
  <View style={styles.bottomNote}><Feather name="shield" size={13} color={colors.mutedForeground} /><Text style={[styles.bottomNoteText, { color: colors.mutedForeground }]}>Every message is timestamped and hash-verified</Text></View>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sectionHeader: { paddingHorizontal: 20 },
  alertStack: { gap: 10, marginHorizontal: 18, marginBottom: 25 },
  addContactContainer: { marginHorizontal: 18, marginBottom: 12, flexDirection: 'row', gap: 8 },
  phoneInput: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contacts: { marginHorizontal: 18, gap: 5, marginBottom: 23 },
  contact: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  contactCopy: { marginLeft: 11, flex: 1 },
  contactName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  contactRole: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  online: { alignItems: 'flex-end', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  publicBar: { marginHorizontal: 18, minHeight: 66, borderRadius: 17, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' },
  publicIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  publicCopy: { flex: 1, marginLeft: 11 },
  publicTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  publicMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  bottomNote: { justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 17 },
  bottomNoteText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});

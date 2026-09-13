import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCard } from '@/components/AlertCard';
import { Card, EmptyState, SectionHeader, StatusPill } from '@/components/Primitives';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, contacts, publicMessages, isOffline, addContact, removeContact, userProfile } = useApp();
  const [weather, setWeather] = useState({ temp: '28°', city: 'Bengaluru', loading: false });
  const [permission] = Location.useForegroundPermissions();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const refreshWeather = async () => {
    if (weather.loading) return;
    setWeather((current) => ({ ...current, loading: true }));
    try {
      let latitude = 12.9716;
      let longitude = 77.5946;
      if (permission?.granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + latitude + '&longitude=' + longitude + '&current=temperature_2m&timezone=auto');
      const data = await response.json() as { current?: { temperature_2m?: number } };
      setWeather({ temp: Math.round(data.current?.temperature_2m ?? 28) + '°', city: permission?.granted ? 'Your location' : 'Bengaluru', loading: false });
    } catch {
      setWeather((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => { refreshWeather().catch(() => undefined); }, [permission?.granted]);

  const submitContact = () => {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      Alert.alert('Enter a valid mobile number', 'Use at least 10 digits for the emergency contact.');
      return;
    }
    if (contacts.some((contact) => contact.id === normalizedPhone)) {
      Alert.alert('Contact already added', 'This mobile number is already in your emergency contacts.');
      return;
    }
    addContact(contactName, normalizedPhone);
    setContactName('');
    setPhoneNumber('');
    setContactModalOpen(false);
  };

  const confirmRemove = (contactId: string, name: string) => {
    Alert.alert('Remove contact?', name + ' will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeContact(contactId) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 124 }}
      >
        <View style={styles.topline}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.sageLight }]}>BHARAT AAPDA PRABANDHAN</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>Stay informed.{String.fromCharCode(10)}Stay together.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh weather" onPress={refreshWeather} style={[styles.weatherBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {weather.loading ? <ActivityIndicator size="small" color={colors.sageLight} /> : <><Feather name="cloud" size={15} color={colors.sageLight} /><Text style={[styles.temp, { color: colors.foreground }]}>{weather.temp}</Text></>}
          </Pressable>
        </View>
        <View style={styles.statusRow}><Text style={[styles.locationText, { color: colors.mutedForeground }]}>{weather.city} · Offline-first protection</Text><StatusPill label={isOffline ? 'Offline ready' : 'Connected'} icon={isOffline ? 'wifi-off' : 'wifi'} /></View>

        {/* My Emergency ID Card */}
        <Pressable
          onPress={() => router.push('/login')}
          style={({ pressed }) => [
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: colors.sage }]}>
            <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
              {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {userProfile?.name || 'Set up Emergency Identity'}
              </Text>
              <Feather name="shield" size={12} color={colors.sageLight} />
            </View>
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
              {userProfile
                ? `Receiving ID: ${userProfile.receivingId} (${userProfile.phoneNumber})`
                : 'Tap to register name & mobile number for offline messaging'}
            </Text>
          </View>
          <Feather name="edit-3" size={16} color={colors.sageLight} />
        </Pressable>

        <SectionHeader title="Government alerts" action="View all" onAction={() => router.push('/(tabs)/alerts')} />
        {alerts.length > 0 ? <View style={styles.alertStack}>{alerts.slice(0, 2).map((alert) => <AlertCard key={alert.id} alert={alert} compact onPress={() => router.push('/(tabs)/alerts')} />)}</View> : <Card style={styles.emptyCard}><EmptyState icon="radio" title="No alerts on this device" body="Verified warnings will appear here when you add or receive them." /></Card>}

        <View style={styles.peopleHeader}><SectionHeader title="Emergency contacts" /><Pressable accessibilityRole="button" accessibilityLabel="Add emergency contact" onPress={() => setContactModalOpen(true)} style={[styles.addButton, { backgroundColor: colors.sage }]}><Feather name="plus" size={15} color={colors.primaryForeground} /><Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>Add</Text></Pressable></View>
        {contacts.length > 0 ? <View style={styles.contacts}>{contacts.map((contact) => <View key={contact.id} style={styles.contactRow}><Pressable onPress={() => router.push({ pathname: '/private-chat/[id]', params: { id: contact.id } })} style={({ pressed }) => [styles.contact, pressed && styles.pressed]}><View style={[styles.avatar, { backgroundColor: contact.color }]}><Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{contact.initials}</Text></View><View style={styles.contactCopy}><Text style={[styles.contactName, { color: colors.foreground }]}>{contact.name}</Text><Text style={[styles.contactRole, { color: colors.mutedForeground }]}>{contact.phoneNumber}</Text></View><View style={styles.online}><View style={[styles.onlineDot, { backgroundColor: colors.low }]} /><Text style={[styles.onlineText, { color: colors.mutedForeground }]}>{contact.lastSeen}</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + contact.name} onPress={() => confirmRemove(contact.id, contact.name)} hitSlop={8} style={styles.removeButton}><Feather name="trash-2" size={15} color={colors.mutedForeground} /></Pressable></View>)}</View> : <Card style={styles.emptyCard}><EmptyState icon="users" title="Add your emergency circle" body="Save trusted people by mobile number so you can reach them quickly." /></Card>}

        <View style={styles.publicDock}>
          <SectionHeader title="Stay connected" />
          <Pressable onPress={() => router.push('/public-chat')} style={({ pressed }) => [styles.publicBar, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.publicIcon, { backgroundColor: colors.muted }]}><Feather name="users" size={17} color={colors.sageLight} /></View>
            <View style={styles.publicCopy}><Text style={[styles.publicTitle, { color: colors.foreground }]}>Public community room</Text><Text style={[styles.publicMeta, { color: colors.mutedForeground }]}>{publicMessages.length ? publicMessages.length + ' verified updates nearby' : 'Be the first to share an update'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.bottomNote}><Feather name="shield" size={13} color={colors.mutedForeground} /><Text style={[styles.bottomNoteText, { color: colors.mutedForeground }]}>Every message is timestamped and hash-verified</Text></View>
      </KeyboardAwareScrollViewCompat>

      <Modal visible={contactModalOpen} transparent animationType="slide" onRequestClose={() => setContactModalOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <KeyboardAwareScrollViewCompat bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}><View><Text style={[styles.modalTitle, { color: colors.foreground }]}>Add emergency contact</Text><Text style={[styles.modalBody, { color: colors.mutedForeground }]}>The mobile number becomes this contact's local ID.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close contact form" onPress={() => setContactModalOpen(false)}><Feather name="x" size={20} color={colors.mutedForeground} /></Pressable></View>
            <TextInput value={contactName} onChangeText={setContactName} placeholder="Name (optional)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Mobile number" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" textContentType="telephoneNumber" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <Pressable onPress={submitContact} style={[styles.saveButton, { backgroundColor: colors.sage }]}><Feather name="user-plus" size={16} color={colors.primaryForeground} /><Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Save contact</Text></Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topline: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.3, marginBottom: 8 },
  heading: { fontSize: 28, lineHeight: 31, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  weatherBox: { width: 57, height: 42, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  temp: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statusRow: { marginHorizontal: 20, marginTop: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  locationText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular' },
  profileCard: { marginHorizontal: 18, marginBottom: 20, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  profileName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  profileSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  alertStack: { gap: 10, marginHorizontal: 18, marginBottom: 25 },
  emptyCard: { marginHorizontal: 18, marginBottom: 25, padding: 4 },
  peopleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { marginRight: 20, minHeight: 32, borderRadius: 10, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  contacts: { marginHorizontal: 18, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contact: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  contactCopy: { marginLeft: 11, flex: 1 },
  contactName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  contactRole: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  online: { alignItems: 'flex-end', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  removeButton: { padding: 10 },
  publicDock: { marginTop: 25 },
  publicBar: { marginHorizontal: 18, minHeight: 66, borderRadius: 17, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' },
  publicIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  publicCopy: { flex: 1, marginLeft: 11 },
  publicTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  publicMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  bottomNote: { justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 17 },
  bottomNoteText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingTop: 10, paddingBottom: 30 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(170,184,200,0.5)', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  modalTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  modalBody: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginTop: 4 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  saveButton: { minHeight: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
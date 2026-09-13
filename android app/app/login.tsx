import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Primitives';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, saveUserProfile } = useApp();

  const [name, setName] = useState(userProfile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(
    userProfile?.phoneNumber?.replace(/\D/g, '').slice(-10) || ''
  );
  const [error, setError] = useState<string | null>(null);

  const cleanDigits = phoneNumber.replace(/\D/g, '');
  const generatedId = cleanDigits.length >= 10 
    ? `BAP-${cleanDigits.slice(-10)}` 
    : cleanDigits.length > 0 
      ? `BAP-${cleanDigits.padEnd(10, '•')}`
      : 'BAP-9876543210';

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name');
      return;
    }
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    saveUserProfile(trimmedName, cleanDigits);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <IconButton name="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
          <View style={[styles.badge, { backgroundColor: colors.sage + '20', borderColor: colors.sage + '40' }]}>
            <Feather name="shield" size={12} color={colors.sageLight} />
            <Text style={[styles.badgeText, { color: colors.sageLight }]}>EMERGENCY IDENTITY SETUP</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Emergency Identity</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your phone number generates your unique offline & mesh receiving ID so emergency responders and contacts can reach you without cell service.
          </Text>
        </View>

        {/* Live Receiving ID Card */}
        <View style={[styles.idCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.idCardHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.sage }]}>
              <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
                {name.trim() ? name.trim()[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.idLabel, { color: colors.mutedForeground }]}>GENERATED RECEIVING ID</Text>
              <Text style={[styles.idValue, { color: colors.foreground }]}>{generatedId}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: colors.low + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.low }]} />
              <Text style={[styles.statusText, { color: colors.low }]}>Mesh Active</Text>
            </View>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
          <View style={styles.idCardFooter}>
            <Feather name="bluetooth" size={12} color={colors.sageLight} />
            <Text style={[styles.idCardFootnote, { color: colors.mutedForeground }]}>
              Used for peer-to-peer message routing & verification over BLE mesh.
            </Text>
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="user" size={18} color={colors.sageLight} style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (error) setError(null);
                }}
                placeholder="e.g. Aaryamann Kapoor"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Mobile Number (Emergency Contact ID)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.prefix, { color: colors.sageLight }]}>+91</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  if (error) setError(null);
                }}
                placeholder="98765 43210"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
            <Text style={[styles.inputHelp, { color: colors.mutedForeground }]}>
              10-digit mobile number registered for emergency broadcast receiving.
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.critical + '18', borderColor: colors.critical + '40' }]}>
              <Feather name="alert-circle" size={15} color={colors.critical} />
              <Text style={[styles.errorText, { color: colors.critical }]}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            testID="save-profile"
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.sage },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              {userProfile ? 'Update Emergency Profile' : 'Save & Join Emergency Network'}
            </Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View style={styles.privacyNote}>
          <Feather name="lock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
            All identity information is stored locally on this device using AES encryption.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  header: { gap: 8 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  idCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  idCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  idLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  idValue: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginTop: 2 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  cardDivider: { height: 1 },
  idCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idCardFootnote: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  form: { gap: 16, marginTop: 4 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, gap: 10 },
  inputIcon: { marginRight: 2 },
  prefix: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  inputHelp: { fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  submitButton: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 },
  submitText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  privacyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  privacyText: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  return <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: '#F8F9FA' } }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="ai" options={{ presentation: 'modal', headerShown: false }} /><Stack.Screen name="public-chat" options={{ headerShown: false }} /><Stack.Screen name="private-chat/[id]" options={{ headerShown: false }} /></Stack>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { SystemUI.setBackgroundColorAsync('#F8F9FA').catch(() => undefined); }, []);
  useEffect(() => { if (fontsLoaded || fontError) SplashScreen.hideAsync(); }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return null;
  return <SafeAreaProvider><ErrorBoundary><QueryClientProvider client={queryClient}><AppProvider><GestureHandlerRootView style={{ flex: 1 }}><KeyboardProvider><RootLayoutNav /></KeyboardProvider></GestureHandlerRootView></AppProvider></QueryClientProvider></ErrorBoundary></SafeAreaProvider>;
}

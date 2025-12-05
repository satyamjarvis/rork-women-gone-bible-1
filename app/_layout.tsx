import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PrayerProvider } from '../contexts/PrayerContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="prayer/type"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="prayer/name"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayer/language"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayer/input"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayer/result"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayer/detail"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayer/folder"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <PrayerProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </PrayerProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
}

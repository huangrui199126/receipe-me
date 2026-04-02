import '../constants/i18n';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useStore } from '../store';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { loadInitial } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadInitial().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cookbook/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="recipe/[id]" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="recipe/[id]/cook" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trending" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

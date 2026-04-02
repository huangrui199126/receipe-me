import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from '../store';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const { onboardingDone } = useStore();

  useEffect(() => {
    if (onboardingDone) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

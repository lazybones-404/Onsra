import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function PracticeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerBackTitle: 'Tools',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="guitar" options={{ title: 'Guitar' }} />
      <Stack.Screen name="bass" options={{ title: 'Bass' }} />
      <Stack.Screen name="violin" options={{ title: 'Violin' }} />
      <Stack.Screen name="drums" options={{ title: 'Drums' }} />
      <Stack.Screen name="vocals" options={{ title: 'Vocals' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function GigListLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[setlistId]" options={{ title: 'Setlist' }} />
      <Stack.Screen name="song/[songId]" options={{ title: 'Song Editor' }} />
    </Stack>
  );
}

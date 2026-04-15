import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.tabIconSelected,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tune',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="tuningfork" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="key"
        options={{
          title: 'Key & Pitch',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="waveform" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tone"
        options={{
          title: 'Tone',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="slider.horizontal.3" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Compose',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="pencil.and.outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="ellipsis" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.primary, tabBarInactiveTintColor: theme.muted }}>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="kesfet" options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="bildirimler" options={{ title: 'Bildirimler' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

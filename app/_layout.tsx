import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../lib/theme';
import '../lib/notifications'; // registers the notification handler on app start

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'SymptoVet' }} />
        <Stack.Screen name="consent" options={{ headerShown: false }} />
        <Stack.Screen name="client/new" options={{ title: 'New client' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
        <Stack.Screen name="patient/[id]" options={{ title: 'Symptom check' }} />
        <Stack.Screen name="condition/[id]" options={{ title: 'Condition' }} />
        <Stack.Screen name="conditions" options={{ title: 'Conditions library' }} />
        <Stack.Screen name="reminders" options={{ title: 'Reminders' }} />
      </Stack>
    </>
  );
}

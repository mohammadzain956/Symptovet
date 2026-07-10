// Home screen: the client list. Also acts as the consent gate on first launch.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, Redirect, useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClients, getReminders } from '../lib/store';
import { Client } from '../lib/types';
import { colors, radius, spacing } from '../lib/theme';
import { CONSENT_VERSION } from './consent';

export default function Home() {
  const router = useRouter();
  const [gate, setGate] = useState<'loading' | 'consent' | 'ok'>('loading');
  const [clients, setClients] = useState<Client[]>([]);
  const [upcoming, setUpcoming] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [accepted, version] = await Promise.all([
          AsyncStorage.getItem('consent.accepted'),
          AsyncStorage.getItem('consent.version'),
        ]);
        if (!active) return;
        // Re-prompt if never accepted, or if the terms have been updated since.
        if (accepted !== 'true' || version !== CONSENT_VERSION) {
          setGate('consent');
          return;
        }
        setGate('ok');
        const [cs, rs] = await Promise.all([getClients(), getReminders()]);
        if (!active) return;
        setClients(cs);
        setUpcoming(
          rs.filter((r) => !r.done && new Date(r.dateTime).getTime() >= Date.now()).length
        );
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  if (gate === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (gate === 'consent') return <Redirect href="/consent" />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarItem}
          onPress={() => router.push('/reminders')}
          activeOpacity={0.8}
        >
          <Text style={styles.remindersText}>Reminders</Text>
          {upcoming > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{upcoming}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topBarItem}
          onPress={() => router.push('/conditions')}
          activeOpacity={0.8}
        >
          <Text style={styles.remindersText}>Conditions library</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptyText}>
              Tap “Add client” to create your first client and add their pets.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/client/[id]', params: { id: item.id } }} asChild>
            <TouchableOpacity style={styles.clientCard} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.clientMeta}>
                  {item.patients.length} pet{item.patients.length === 1 ? '' : 's'}
                  {item.phone ? `  ·  ${item.phone}` : ''}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </Link>
        )}
      />

      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/client/new')}
          activeOpacity={0.9}
        >
          <Text style={styles.fabText}>Add client</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  remindersText: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  clientMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.muted },
  empty: { alignItems: 'center', padding: spacing.xl, marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

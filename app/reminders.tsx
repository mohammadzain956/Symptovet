// The in-app Reminders window. This is the key point: reminders live HERE,
// independent of the phone's notification tray — so even after the user swipes
// the OS notification away, every visit reminder is still visible in the app.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getReminders, setReminderDone } from '../lib/store';
import { cancelScheduled } from '../lib/notifications';
import { Reminder } from '../lib/types';
import { colors, radius, spacing } from '../lib/theme';

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const reload = useCallback(async () => setReminders(await getReminders()), []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function toggle(r: Reminder) {
    if (!r.done) await cancelScheduled(r.notificationId);
    await setReminderDone(r.id, !r.done);
    reload();
  }

  const now = Date.now();
  const upcoming = reminders.filter((r) => !r.done && new Date(r.dateTime).getTime() >= now);
  const past = reminders.filter((r) => r.done || new Date(r.dateTime).getTime() < now);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
    >
      <Text style={styles.intro}>
        All your visit reminders live here — even after you clear them from your phone’s
        notification bar.
      </Text>

      <Text style={styles.section}>Upcoming ({upcoming.length})</Text>
      {upcoming.length === 0 ? (
        <Text style={styles.empty}>No upcoming reminders.</Text>
      ) : (
        upcoming.map((r) => <Row key={r.id} r={r} onToggle={toggle} />)
      )}

      <Text style={styles.section}>Past / done ({past.length})</Text>
      {past.length === 0 ? (
        <Text style={styles.empty}>Nothing here yet.</Text>
      ) : (
        past.map((r) => <Row key={r.id} r={r} onToggle={toggle} />)
      )}
    </ScrollView>
  );
}

function Row({ r, onToggle }: { r: Reminder; onToggle: (r: Reminder) => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onToggle(r)} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.client, r.done && styles.doneText]}>{r.clientName}</Text>
        <Text style={styles.when}>
          {new Date(r.dateTime).toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={styles.toggle}>{r.done ? 'Done' : 'Mark done'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: spacing.lg },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: { fontSize: 14, color: colors.muted, fontStyle: 'italic', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  client: { fontSize: 16, fontWeight: '700', color: colors.text },
  when: { fontSize: 13, color: colors.muted, marginTop: 2 },
  doneText: { textDecorationLine: 'line-through', color: colors.muted },
  toggle: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});

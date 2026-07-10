// Client detail: the client's pets (add with photo), plus next-visit scheduling.
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button, Card, Field } from '../../components/ui';
import { SearchSelect } from '../../components/SearchSelect';
import { BREEDS, SPECIES } from '../../lib/speciesData';

const SEXES = ['Male', 'Male (neutered)', 'Female', 'Female (spayed)'];
import {
  addPatient,
  addReminder,
  getClient,
  remindersForClient,
  setReminderDone,
} from '../../lib/store';
import {
  cancelScheduled,
  ensureNotificationPermission,
  scheduleVisitReminder,
} from '../../lib/notifications';
import { Client, Reminder } from '../../lib/types';
import { colors, radius, spacing } from '../../lib/theme';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | undefined>();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // add-patient form
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState('');
  const [pSpecies, setPSpecies] = useState('');
  const [pBreed, setPBreed] = useState('');
  const [pSex, setPSex] = useState('');
  const [pWeight, setPWeight] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  // date/time picker (Android shows date first, then time)
  const [picker, setPicker] = useState<{ mode: 'date' | 'time'; value: Date } | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const [c, rs] = await Promise.all([getClient(id), remindersForClient(id)]);
    setClient(c);
    setReminders(rs);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function pickImage(from: 'camera' | 'library') {
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to continue.');
      return;
    }
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.6,
            allowsEditing: true,
            aspect: [1, 1],
          });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  }

  async function savePatient() {
    if (!client) return;
    if (!pName.trim() || !pSpecies.trim()) {
      Alert.alert('Missing info', 'Please enter at least a name and species.');
      return;
    }
    const weightNum = parseFloat(pWeight.replace(',', '.'));
    await addPatient(client.id, {
      name: pName.trim(),
      species: pSpecies.trim(),
      breed: pBreed.trim() || undefined,
      sex: pSex.trim() || undefined,
      weightKg: Number.isFinite(weightNum) && weightNum > 0 ? weightNum : undefined,
      photoUri,
    });
    setPName('');
    setPSpecies('');
    setPBreed('');
    setPSex('');
    setPWeight('');
    setPhotoUri(undefined);
    setShowForm(false);
    reload();
  }

  function startNextVisit() {
    setPicker({ mode: 'date', value: new Date(Date.now() + 24 * 3600 * 1000) });
  }

  async function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed' || !selected) {
        setPicker(null);
        return;
      }
      if (picker?.mode === 'date') {
        // move on to choosing the time, keeping the chosen date
        setPicker({ mode: 'time', value: selected });
        return;
      }
      setPicker(null);
      await scheduleVisit(selected);
    } else {
      // iOS: inline spinner; confirm handled by the button below
      if (selected) setPicker((p) => (p ? { ...p, value: selected } : p));
    }
  }

  async function scheduleVisit(when: Date) {
    if (!client) return;
    if (when.getTime() <= Date.now()) {
      Alert.alert('Pick a future time', 'The next visit must be in the future.');
      return;
    }
    await ensureNotificationPermission();
    const title = `Upcoming visit: ${client.name}`;
    const body = client.patients.length
      ? `Patient(s): ${client.patients.map((p) => p.name).join(', ')}`
      : 'Tap to view details';
    const notifId = await scheduleVisitReminder(title, body, when);
    await addReminder({
      clientId: client.id,
      clientName: client.name,
      dateTime: when.toISOString(),
      notificationId: notifId,
    });
    reload();
  }

  async function toggleDone(r: Reminder) {
    if (!r.done) await cancelScheduled(r.notificationId);
    await setReminderDone(r.id, !r.done);
    reload();
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}>
      <Text style={styles.name}>{client.name}</Text>
      {client.phone ? <Text style={styles.phone}>{client.phone}</Text> : null}

      {/* Next visit */}
      <Text style={styles.section}>Next visit</Text>
      <Button title="Set next visit date & time" onPress={startNextVisit} variant="outline" />
      {reminders.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          {reminders.map((r) => (
            <TouchableOpacity key={r.id} style={styles.reminderRow} onPress={() => toggleDone(r)}>
              <Text style={[styles.reminderText, r.done && styles.done]}>
                {formatDateTime(r.dateTime)}
              </Text>
              <Text style={styles.reminderToggle}>{r.done ? 'Done' : 'Mark done'}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Patients */}
      <Text style={styles.section}>Pets / patients ({client.patients.length})</Text>
      {client.patients.map((p) => (
        <TouchableOpacity
          key={p.id}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/patient/[id]', params: { id: p.id } })}
        >
          <Card style={styles.patientCard}>
            {p.photoUri ? (
              <Image source={{ uri: p.photoUri }} style={styles.patientPhoto} />
            ) : (
              <View style={[styles.patientPhoto, styles.patientPhotoPlaceholder]}>
                <Text style={styles.patientInitial}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{p.name}</Text>
              <Text style={styles.patientMeta}>
                {p.species}
                {p.breed ? ` · ${p.breed}` : ''}
                {p.weightKg ? ` · ${p.weightKg} kg` : ''}
              </Text>
              <Text style={styles.patientAction}>Start symptom check ›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {!showForm ? (
        <Button title="Add a pet" onPress={() => setShowForm(true)} />
      ) : (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.formTitle}>New pet</Text>
          <View style={styles.photoPickRow}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewPhoto} />
            ) : (
              <View style={[styles.previewPhoto, styles.photoPlaceholder]}>
                <Text style={styles.noPhotoText}>No photo</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Button title="Take photo" onPress={() => pickImage('camera')} variant="outline" />
              <Button
                title="Choose from gallery"
                onPress={() => pickImage('library')}
                variant="outline"
              />
            </View>
          </View>
          <Field label="Pet name" value={pName} onChangeText={setPName} placeholder="e.g. Bella" />
          <SearchSelect
            label="Species"
            placeholder="Select species"
            options={SPECIES}
            value={pSpecies}
            onChange={(v) => {
              setPSpecies(v);
              setPBreed(''); // breeds differ per species — reset when species changes
            }}
          />
          <SearchSelect
            label="Breed (optional)"
            placeholder="Select breed"
            options={pSpecies ? BREEDS[pSpecies] ?? [] : []}
            value={pBreed}
            onChange={setPBreed}
            allowCustom
            disabled={!pSpecies}
            disabledHint="Select a species first"
          />
          <SearchSelect
            label="Sex (optional)"
            placeholder="Select sex"
            options={SEXES}
            value={pSex}
            onChange={setPSex}
          />
          <Field
            label="Weight in kg (used for dosing)"
            value={pWeight}
            onChangeText={setPWeight}
            placeholder="e.g. 12.5"
            keyboardType="decimal-pad"
          />
          <Button title="Save pet" onPress={savePatient} />
          <Button title="Cancel" onPress={() => setShowForm(false)} variant="outline" />
        </Card>
      )}

      {picker && (
        <DateTimePicker
          value={picker.value}
          mode={picker.mode}
          is24Hour={false}
          onChange={onPickerChange}
          minimumDate={picker.mode === 'date' ? new Date() : undefined}
        />
      )}
    </ScrollView>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  phone: { fontSize: 15, color: colors.muted, marginTop: 4 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  reminderToggle: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  done: { textDecorationLine: 'line-through', color: colors.muted, fontWeight: '400' },
  patientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  patientPhoto: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.bg },
  patientPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  patientInitial: { color: '#fff', fontWeight: '700', fontSize: 20 },
  patientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  patientMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  patientAction: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 6 },
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  photoPickRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md, alignItems: 'center' },
  previewPhoto: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.bg },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noPhotoText: { color: colors.muted, fontSize: 12 },
});

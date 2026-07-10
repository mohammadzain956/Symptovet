// Add a new client (owner): name + phone number.
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field } from '../../components/ui';
import { addClient } from '../../lib/store';
import { colors, spacing } from '../../lib/theme';

export default function NewClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the client’s name.');
      return;
    }
    setSaving(true);
    const client = await addClient({ name, phone });
    router.replace({ pathname: '/client/[id]', params: { id: client.id } });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Field
        label="Client name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Sarah Ahmed"
        autoFocus
      />
      <Field
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="e.g. 0300 1234567"
        keyboardType="phone-pad"
      />
      <Button title={saving ? 'Saving…' : 'Save client'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});

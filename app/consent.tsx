// First-launch gate: the user must read and accept before using the app.
// We store the acceptance (with version + timestamp) so it only shows once.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/ui';
import { colors, spacing } from '../lib/theme';

// Bump this whenever the wording changes so returning users must re-accept.
export const CONSENT_VERSION = '2.0';

export default function Consent() {
  const router = useRouter();
  const [isVet, setIsVet] = useState(false);       // professional-only attestation
  const [accepts, setAccepts] = useState(false);   // responsibility acknowledgement

  const canContinue = isVet && accepts;

  async function accept() {
    if (!canContinue) return;
    await AsyncStorage.multiSet([
      ['consent.accepted', 'true'],
      ['consent.version', CONSENT_VERSION],
      ['consent.acceptedAt', new Date().toISOString()],
      ['consent.vetAttested', 'true'],
    ]);
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>Please read before you begin</Text>
        <Text style={styles.title}>SymptoVet is a support tool — not a diagnosis</Text>

        <View style={styles.proBox}>
          <Text style={styles.proText}>
            For use by licensed veterinary professionals only. This app is not for pet owners and
            must not be used to self-treat an animal.
          </Text>
        </View>

        <Text style={styles.h2}>Suggestions only</Text>
        <Text style={styles.p}>
          SymptoVet is a clinical decision-support tool for veterinary professionals. It offers{' '}
          <Text style={styles.b}>suggestions only</Text> — possible conditions and reference
          information based on the details you enter. It does <Text style={styles.b}>not</Text>{' '}
          diagnose, and it is not a substitute for your own examination and professional judgment.
        </Text>

        <Text style={styles.h2}>Your professional responsibility</Text>
        <Text style={styles.p}>
          You are responsible for every clinical decision you make. Always verify any suggested
          condition, medication, dose or route against your own assessment and a current formulary
          before acting. The final decision — and responsibility for the patient's care — rests
          entirely with you.
        </Text>

        <Text style={styles.h2}>Acknowledgement</Text>
        <Text style={styles.p}>
          By continuing you confirm that you are using SymptoVet as an aid only and that you accept
          full responsibility for any decisions or outcomes arising from its use. To the maximum
          extent permitted by law, the developers accept no liability for any harm, loss or damage
          resulting from use of this app.
        </Text>

        <TouchableOpacity style={styles.checkRow} onPress={() => setIsVet((v) => !v)} activeOpacity={0.8}>
          <View style={[styles.checkbox, isVet && styles.checkboxOn]}>
            {isVet && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I am a licensed veterinary professional and will use this app in that capacity.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkRow} onPress={() => setAccepts((v) => !v)} activeOpacity={0.8}>
          <View style={[styles.checkbox, accepts && styles.checkboxOn]}>
            {accepts && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I have read and agree, and I accept responsibility for my own clinical decisions.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="I agree — continue" onPress={accept} disabled={!canContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  proBox: {
    marginTop: spacing.lg,
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    padding: spacing.md,
  },
  proText: { fontSize: 14, color: colors.primaryDark, fontWeight: '600', lineHeight: 20 },
  h2: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: spacing.xl, marginBottom: spacing.xs },
  p: { fontSize: 15, lineHeight: 22, color: colors.text },
  b: { fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.xl, gap: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary },
  checkMark: { color: '#fff', fontWeight: '900' },
  checkLabel: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});

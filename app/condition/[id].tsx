// Condition detail: the full picture for one candidate diagnosis, with
// medication doses calculated for the current patient's weight when available.
// Opened from the consult screen (carries weight + species) or the library.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/ui';
import { conditionById } from '../../lib/knowledge/conditions';
import { calcDose } from '../../lib/knowledge/engine';
import { DoseRule } from '../../lib/knowledge/types';
import { colors, radius, spacing } from '../../lib/theme';

export default function ConditionDetail() {
  const { id, weight, species } = useLocalSearchParams<{
    id: string;
    weight?: string;
    species?: string;
  }>();
  const condition = id ? conditionById(id) : undefined;
  const weightKg = weight ? parseFloat(weight) : undefined;

  if (!condition) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Condition not found.</Text>
      </View>
    );
  }

  // Show doses relevant to this patient's species (Both always applies).
  const drugs = condition.drugs.filter(
    (d) => !d.species || d.species === 'Both' || !species || d.species === species
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      <View style={styles.headRow}>
        <Text style={styles.name}>{condition.name}</Text>
        {condition.emergency && (
          <View style={styles.emBadge}>
            <Text style={styles.emText}>URGENT</Text>
          </View>
        )}
      </View>
      <Text style={styles.system}>
        {condition.system} · {condition.species === 'Both' ? 'Dog & Cat' : condition.species}
      </Text>
      {condition.aka && condition.aka.length > 0 && (
        <Text style={styles.aka}>Also known as: {condition.aka.join(', ')}</Text>
      )}
      <Text style={styles.summary}>{condition.summary}</Text>

      {condition.keySigns && <Block label="Typical presentation" text={condition.keySigns} />}

      {condition.redFlags && (
        <View style={styles.redBox}>
          <Text style={styles.redTitle}>Red flags</Text>
          <Text style={styles.redText}>{condition.redFlags}</Text>
        </View>
      )}

      {/* Medications with weight-based dosing */}
      <Text style={styles.section}>Medications</Text>
      {!weightKg && (
        <Text style={styles.doseHint}>
          Add a weight to this patient to see per-dose amounts. Showing mg/kg only.
        </Text>
      )}
      {drugs.map((rule, i) => (
        <DrugCard key={i} rule={rule} weightKg={weightKg} />
      ))}

      {condition.surgery && <Block label="Surgical option" text={condition.surgery} />}
      {condition.labClues && <Block label="Lab pointers (CBC / biochem / urinalysis)" text={condition.labClues} />}
      {condition.imaging && <Block label="Imaging (X-ray / ultrasound)" text={condition.imaging} />}
      {condition.differentials && condition.differentials.length > 0 && (
        <Block label="Also rule out" text={condition.differentials.join(' · ')} />
      )}
      {condition.prognosis && <Block label="Prognosis" text={condition.prognosis} />}

      <Text style={styles.disclaimer}>
        Decision support only — not a diagnosis. Doses are typical starting figures compiled from
        veterinary literature; confirm against a current formulary, the patient's condition, and
        drug interactions before administering.
      </Text>
    </ScrollView>
  );
}

function DrugCard({ rule, weightKg }: { rule: DoseRule; weightKg?: number }) {
  const dose = calcDose(rule, weightKg);
  return (
    <Card style={styles.drugCard}>
      <Text style={styles.drugName}>{rule.drug}</Text>
      {dose.perDose ? (
        <>
          <Text style={styles.drugDosePrimary}>{dose.perDose}</Text>
          <Text style={styles.drugDoseSub}>{dose.label}</Text>
          {dose.capped && <Text style={styles.capNote}>Capped at maximum per-dose limit.</Text>}
        </>
      ) : (
        <Text style={styles.drugDosePrimary}>{dose.label}</Text>
      )}
      {rule.note && <Text style={styles.drugNote}>{rule.note}</Text>}
      {rule.contraindication && (
        <Text style={styles.contra}>Caution: {rule.contraindication}</Text>
      )}
    </Card>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.section}>{label}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 8 },
  emBadge: { backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  emText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  system: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 4 },
  aka: { fontSize: 13, color: colors.muted, marginTop: 2 },
  summary: { fontSize: 15, color: colors.text, lineHeight: 21, marginTop: spacing.md },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  blockText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  redBox: {
    marginTop: spacing.lg,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  redTitle: { color: colors.danger, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  redText: { color: '#991B1B', fontSize: 14, lineHeight: 20 },
  doseHint: { fontSize: 13, color: colors.muted, fontStyle: 'italic', marginBottom: spacing.sm },
  drugCard: { marginBottom: spacing.md },
  drugName: { fontSize: 16, fontWeight: '700', color: colors.text },
  drugDosePrimary: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginTop: 4 },
  drugDoseSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  capNote: { fontSize: 12, color: colors.warning, marginTop: 2 },
  drugNote: { fontSize: 13, color: colors.text, marginTop: 6, lineHeight: 18 },
  contra: { fontSize: 13, color: colors.danger, marginTop: 6, lineHeight: 18 },
  disclaimer: {
    marginTop: spacing.xl,
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    lineHeight: 17,
  },
});

// Consult screen: pick a patient's symptoms, get a ranked differential list.
// This is the core clinical-support flow. Tapping a differential opens the full
// condition detail with weight-based dosing for THIS patient.
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SearchSelect } from '../../components/SearchSelect';
import { Card } from '../../components/ui';
import { getPatientContext } from '../../lib/store';
import { SYMPTOMS } from '../../lib/knowledge/symptoms';
import { rankConditions, Ranked } from '../../lib/knowledge/engine';
import { Client, Patient } from '../../lib/types';
import { colors, radius, spacing } from '../../lib/theme';

// How many suggestions to show before the "less common" fold.
const VISIBLE_LIMIT = 12;

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PatientConsult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ctx, setCtx] = useState<{ client: Client; patient: Patient } | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) getPatientContext(id).then(setCtx);
    }, [id])
  );

  const patient = ctx?.patient;
  const available = useMemo(
    () => SYMPTOMS.filter((s) => !selected.includes(s)),
    [selected]
  );
  const ranked = useMemo(
    () => rankConditions(selected, patient?.species),
    [selected, patient?.species]
  );

  function addSymptom(s: string) {
    if (s && !selected.includes(s)) {
      setSelected((prev) => [...prev, s]);
      setShowAll(false); // collapse back to common-first view on a new search
    }
  }
  function removeSymptom(s: string) {
    setSelected((prev) => prev.filter((x) => x !== s));
    setShowAll(false);
  }

  function openCondition(conditionId: string) {
    if (!patient) return;
    router.push({
      pathname: '/condition/[id]',
      params: {
        id: conditionId,
        weight: patient.weightKg ? String(patient.weightKg) : '',
        species: patient.species,
      },
    });
  }

  if (!patient || !ctx) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Patient header */}
      <Text style={styles.name}>{patient.name}</Text>
      <Text style={styles.meta}>
        {patient.species}
        {patient.breed ? ` · ${patient.breed}` : ''}
        {patient.sex ? ` · ${patient.sex}` : ''}
        {patient.weightKg ? ` · ${patient.weightKg} kg` : ''}
      </Text>
      <Text style={styles.owner}>Owner: {ctx.client.name}</Text>

      {!patient.weightKg && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            No weight on file — add a weight to this pet to calculate medication doses.
          </Text>
        </View>
      )}

      {/* Symptom picker */}
      <Text style={styles.section}>Symptoms</Text>
      <SearchSelect
        label="Add a symptom"
        placeholder="Search and add a symptom"
        options={available}
        value=""
        onChange={addSymptom}
      />

      {selected.length > 0 ? (
        <View style={styles.chips}>
          {selected.map((s) => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => removeSymptom(s)}>
              <Text style={styles.chipText}>{s}</Text>
              <Text style={styles.chipX}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Add one or more symptoms to see suggested conditions.</Text>
      )}

      {/* Differentials */}
      {selected.length > 0 && (
        <>
          <Text style={styles.section}>
            Suggested conditions ({ranked.length})
          </Text>
          {ranked.length === 0 ? (
            <Text style={styles.hint}>
              No match for this combination in the current knowledge base.
            </Text>
          ) : (
            <>
              <Text style={styles.rankNote}>Most likely first · add more symptoms to narrow</Text>
              {(showAll ? ranked : ranked.slice(0, VISIBLE_LIMIT)).map((r) => (
                <ConditionRow key={r.condition.id} r={r} onOpen={openCondition} />
              ))}
              {!showAll && ranked.length > VISIBLE_LIMIT && (
                <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(true)}>
                  <Text style={styles.moreText}>
                    Show {ranked.length - VISIBLE_LIMIT} more (less common)
                  </Text>
                </TouchableOpacity>
              )}
              {showAll && ranked.length > VISIBLE_LIMIT && (
                <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(false)}>
                  <Text style={styles.moreText}>Show fewer</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}

      <Text style={styles.disclaimer}>
        Suggestions only — not a diagnosis. Confirm clinically before acting.
      </Text>
    </ScrollView>
  );
}

function ConditionRow({ r, onOpen }: { r: Ranked; onOpen: (id: string) => void }) {
  const { condition, matched } = r;
  const prevalence = condition.prevalence ?? 'uncommon';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onOpen(condition.id)}>
      <Card style={styles.condCard}>
        <View style={styles.condHead}>
          <Text style={styles.condName}>{condition.name}</Text>
          {condition.emergency && (
            <View style={styles.emBadge}>
              <Text style={styles.emText}>URGENT</Text>
            </View>
          )}
        </View>
        <Text style={styles.condSystem}>
          {condition.system} · {titleCase(prevalence)}
        </Text>
        <View style={styles.matchRow}>
          {matched.map((m) => (
            <View key={m} style={styles.matchTag}>
              <Text style={styles.matchTagText}>{m}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.condCount}>
          Matches {matched.length} of {condition.symptoms.length} typical signs · tap for detail &
          dosing
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.muted, marginTop: 4 },
  owner: { fontSize: 13, color: colors.muted, marginTop: 2 },
  warnBox: {
    marginTop: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warnText: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chipX: { color: '#fff', fontSize: 12, opacity: 0.9 },
  hint: { fontSize: 14, color: colors.muted, fontStyle: 'italic', marginTop: 4 },
  rankNote: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  moreText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  condCard: { marginBottom: spacing.md },
  condHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  condName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, paddingRight: 8 },
  emBadge: { backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  emText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  condSystem: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  matchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  matchTag: {
    backgroundColor: '#E0F2F1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchTagText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  condCount: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  disclaimer: {
    marginTop: spacing.xl,
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

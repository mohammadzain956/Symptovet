// Browsable knowledge-base library: search all conditions by name, synonym or
// body system, independent of a specific patient. Opens the same condition
// detail (without patient weight, so it shows mg/kg dosing).
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CONDITIONS } from '../lib/knowledge/conditions';
import { colors, radius, spacing } from '../lib/theme';

export default function ConditionsLibrary() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? CONDITIONS.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.system.toLowerCase().includes(q) ||
            (c.aka ?? []).some((a) => a.toLowerCase().includes(q))
        )
      : CONDITIONS;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search conditions or body system"
          placeholderTextColor={colors.muted}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text style={styles.count}>{filtered.length} conditions in the knowledge base</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/condition/[id]', params: { id: item.id } })}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.rowHead}>
                <Text style={styles.rowName}>{item.name}</Text>
                {item.emergency && (
                  <View style={styles.emBadge}>
                    <Text style={styles.emText}>URGENT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rowSystem}>
                {item.system} · {item.species === 'Both' ? 'Dog & Cat' : item.species}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  search: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
  },
  count: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
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
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  emBadge: { backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  emText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rowSystem: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: 26, color: colors.muted },
});

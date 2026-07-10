// A searchable pick-list field. The user taps it, types to filter a fixed list
// of options, and taps one to select. This keeps data structured (important for
// the diagnosis/medication engine) while staying quick to use.
// The same pattern will drive the symptom search later.
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

type Props = {
  label: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allowCustom?: boolean; // let the user keep a typed value not in the list
  disabled?: boolean;
  disabledHint?: string;
};

export function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  allowCustom,
  disabled,
  disabledHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 60);
  }, [options, query]);

  const trimmed = query.trim();
  const showCustom =
    !!allowCustom &&
    trimmed.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());

  function select(v: string) {
    onChange(v);
    setQuery('');
    setOpen(false);
  }

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>

      {!open ? (
        <TouchableOpacity
          style={[styles.control, disabled && styles.controlDisabled]}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => {
            setQuery('');
            setOpen(true);
          }}
        >
          <Text style={value ? styles.valueText : styles.placeholderText}>
            {disabled ? disabledHint ?? placeholder : value || placeholder || 'Select'}
          </Text>
          {!disabled && <Text style={styles.caret}>{'▾'}</Text>}
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${label.toLowerCase()}`}
            placeholderTextColor={colors.muted}
          />
          <View style={styles.dropdown}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={{ maxHeight: 220 }}
            >
              {showCustom && (
                <TouchableOpacity style={styles.option} onPress={() => select(trimmed)}>
                  <Text style={styles.optionCustom}>Use “{trimmed}”</Text>
                </TouchableOpacity>
              )}
              {filtered.map((o) => (
                <TouchableOpacity key={o} style={styles.option} onPress={() => select(o)}>
                  <Text style={styles.optionText}>{o}</Text>
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && !showCustom && (
                <Text style={styles.noMatch}>No matches</Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  controlDisabled: { backgroundColor: colors.bg },
  valueText: { fontSize: 16, color: colors.text },
  placeholderText: { fontSize: 16, color: colors.muted },
  caret: { fontSize: 14, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 16, color: colors.text },
  optionCustom: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  noMatch: { padding: 14, fontSize: 14, color: colors.muted, fontStyle: 'italic' },
});

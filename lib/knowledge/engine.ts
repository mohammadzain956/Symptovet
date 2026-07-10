// The matching engine: turns a set of selected symptoms into a ranked list of
// candidate conditions, and turns a dose rule + patient weight into an actual
// dose. This is intentionally simple and transparent (overlap scoring) — a vet
// must always review the suggestions.

import { CONDITIONS } from './conditions';
import { Condition, DoseRule } from './types';

export type Ranked = {
  condition: Condition;
  matched: string[];     // which selected symptoms this condition explains
  score: number;         // 0..1 share of the condition's own signs that matched
  coverage: number;      // 0..1 share of the selected symptoms this condition explains
};

// Rank conditions by how well their known signs overlap the selected symptoms.
// Filters by species (Dog/Cat + Both). Emergencies are nudged up so they aren't
// missed. Only conditions matching at least one symptom are returned.
export function rankConditions(selected: string[], species?: string): Ranked[] {
  const sel = new Set(selected);
  const speciesKey =
    species === 'Dog' ? 'Dog' : species === 'Cat' ? 'Cat' : undefined;

  const results: Ranked[] = [];
  for (const condition of CONDITIONS) {
    if (speciesKey && condition.species !== 'Both' && condition.species !== speciesKey) {
      continue;
    }
    const matched = condition.symptoms.filter((s) => sel.has(s));
    if (matched.length === 0) continue;

    const score = matched.length / condition.symptoms.length;
    const coverage = sel.size ? matched.length / sel.size : 0;
    results.push({ condition, matched, score, coverage });
  }

  return results.sort((a, b) => {
    // Primary: number of matched symptoms — the more of the vet's selected
    // signs a condition explains, the higher it ranks.
    const byMatched = b.matched.length - a.matched.length;
    if (byMatched !== 0) return byMatched;
    // Tie-break among equally-matching conditions: favour COMMON diseases,
    // then specificity/coverage, with a small nudge for emergencies so a
    // rare-but-deadly one is never buried. This is what puts everyday
    // conditions at the top when a vague symptom matches many entries.
    const combined = (r: Ranked) =>
      prevalenceWeight(r.condition.prevalence) * 0.45 +
      r.score * 0.3 +
      r.coverage * 0.15 +
      (r.condition.emergency ? 0.1 : 0);
    return combined(b) - combined(a);
  });
}

// Weight used for ranking. Unset prevalence is treated as 'uncommon' (middle).
export function prevalenceWeight(p?: string): number {
  return p === 'common' ? 1 : p === 'rare' ? 0.2 : 0.5;
}

export type DoseResult = {
  label: string;         // human-readable dose line
  perDose?: string;      // computed mg range, if applicable
  capped?: boolean;      // true if the max cap was applied
};

// Compute an actual dose from a rule and the patient's weight (kg).
export function calcDose(rule: DoseRule, weightKg?: number): DoseResult {
  const routeFreq = `${rule.route}${rule.frequency ? ' · ' + rule.frequency : ''}`;

  // Text-only dose (fluids, insulin, "to effect"): no mg/kg math.
  if (rule.mgPerKgLow == null) {
    return { label: rule.doseText ? `${rule.doseText} (${routeFreq})` : routeFreq };
  }

  const low = rule.mgPerKgLow;
  const high = rule.mgPerKgHigh ?? rule.mgPerKgLow;
  const range = low === high ? `${low}` : `${low}–${high}`;
  const perKg = `${range} mg/kg ${routeFreq}`;

  if (!weightKg || weightKg <= 0) {
    return { label: perKg };
  }

  let doseLow = low * weightKg;
  let doseHigh = high * weightKg;
  let capped = false;
  if (rule.maxMg != null) {
    if (doseLow > rule.maxMg) {
      doseLow = rule.maxMg;
      capped = true;
    }
    if (doseHigh > rule.maxMg) {
      doseHigh = rule.maxMg;
      capped = true;
    }
  }

  const fmt = (n: number) => (n >= 10 ? Math.round(n).toString() : n.toFixed(1));
  const perDose =
    doseLow === doseHigh ? `${fmt(doseLow)} mg` : `${fmt(doseLow)}–${fmt(doseHigh)} mg`;

  return {
    label: perKg,
    perDose: `${perDose} per dose (${rule.route}, ${rule.frequency})`,
    capped,
  };
}

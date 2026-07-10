// Knowledge-base data model for the diagnosis / medication engine.
//
// Design notes:
// - Everything here is STRUCTURED CLINICAL FACT (which drug, which dose, which
//   sign) re-expressed in this app's own schema and wording. It is not copied
//   prose from any single source. Content is compiled from established
//   veterinary literature and must be reviewed by a licensed veterinarian
//   before it is relied on clinically.
// - The controlled vocabularies (symptoms, systems) let the engine match
//   reliably instead of guessing at free text.

export type Species = 'Dog' | 'Cat' | 'Both';

// How frequently the condition is seen in general practice. Drives ranking so
// common conditions surface above rare ones when the symptom match is similar.
export type Prevalence = 'common' | 'uncommon' | 'rare';

export type Route = 'PO' | 'SC' | 'IM' | 'IV' | 'Topical' | 'Otic' | 'Ophthalmic' | 'Inhaled' | 'Other';

// One dosing recommendation. Where a mg/kg figure exists, the app multiplies it
// by the patient's weight to show an actual dose range. Some entries (fluids,
// insulin, "to effect") have no mg/kg — they carry a text dose instead.
export type DoseRule = {
  drug: string;
  mgPerKgLow?: number;
  mgPerKgHigh?: number;
  route: Route;
  frequency: string;        // e.g. 'q12h', 'q24h', 'q8h', 'once', 'to effect'
  species?: Species;        // if the drug/dose is species-specific
  maxMg?: number;           // absolute per-dose cap, if any
  doseText?: string;        // used when there is no simple mg/kg (e.g. insulin, fluids)
  note?: string;
  contraindication?: string;
};

// One disease / condition entry.
export type Condition = {
  id: string;
  name: string;
  species: Species;
  system: string;           // body system, from SYSTEMS below
  prevalence?: Prevalence;  // how commonly seen; defaults to 'uncommon' if unset
  aka?: string[];           // synonyms / abbreviations, aids search
  emergency?: boolean;      // true = time-critical, surface prominently
  summary: string;          // short, original-worded definition
  symptoms: string[];       // symptom keys from symptoms.ts — drives the differential
  keySigns?: string;        // the classic presentation, in one line
  differentials?: string[]; // other conditions to rule out
  labClues?: string;        // CBC / biochemistry / urinalysis pointers
  imaging?: string;         // X-ray / ultrasound pointers
  surgery?: string;         // surgical option / recommendation, if relevant
  drugs: DoseRule[];
  redFlags?: string;        // when to escalate / warn
  prognosis?: string;
};

// Body systems used to group and filter conditions.
export const SYSTEMS = [
  'Gastrointestinal',
  'Urinary',
  'Endocrine',
  'Reproductive',
  'Respiratory',
  'Cardiovascular',
  'Hematologic',
  'Musculoskeletal',
  'Neurologic',
  'Ophthalmic',
  'Dermatologic',
  'Infectious',
  'Toxicology',
] as const;

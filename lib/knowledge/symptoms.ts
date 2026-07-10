// Controlled symptom vocabulary. The vet searches and picks from THIS list so
// the differential engine can match on stable keys (not free text). Grouping is
// only for readability; the app searches across all of them.
//
// When expanding the knowledge base, add new signs here first, then reference
// the exact string in a condition's `symptoms` array.

export const SYMPTOMS: string[] = [
  // General
  'Lethargy',
  'Anorexia (not eating)',
  'Weight loss',
  'Weight gain',
  'Increased appetite',
  'Fever',
  'Collapse',
  'Dehydration',
  'Pale gums',
  'Blue or grey gums',
  'Brown or muddy gums',
  'Jaundice (yellow gums/skin)',
  'Swollen lymph nodes',
  'Lump or swelling',
  'Poor growth (young animal)',
  'Behavioral change',
  'Known toxin ingestion',
  'Bruising or pinpoint spots (gums/skin)',
  'Nosebleed',
  'Facial or paw swelling',

  // Gastrointestinal
  'Vomiting',
  'Vomiting blood',
  'Diarrhea',
  'Bloody diarrhea',
  'Black tarry stool',
  'Regurgitation',
  'Excessive drooling',
  'Difficulty eating / dropping food',
  'Abdominal pain',
  'Abdominal distension',
  'Non-productive retching',
  'Restlessness / pacing',
  'Straining to defecate',
  'Constipation',
  'Scooting / licking rear',
  'Bad breath',
  'Gum inflammation',

  // Urinary
  'Increased thirst',
  'Increased urination',
  'Straining to urinate',
  'Frequent small urinations',
  'Blood in urine',
  'No urine production',
  'Urine leaking (incontinence)',
  'Urinating outside litter box',

  // Respiratory
  'Coughing',
  'Sneezing',
  'Nasal discharge',
  'Difficulty breathing',
  'Rapid breathing',
  'Panting',
  'Noisy breathing (stridor)',
  'Voice or bark change',
  'Exercise intolerance',

  // Cardiovascular
  'Heart murmur',
  'Fainting',

  // Skin / ears
  'Itching',
  'Hair loss',
  'Skin redness',
  'Skin sores / pustules / crusting',
  'Recurrent skin or ear infections',
  'Ear scratching / head shaking',
  'Ear discharge / odor',

  // Eyes
  'Eye redness',
  'Ocular discharge',
  'Squinting',
  'Cloudy eye',
  'Bulging or displaced eye',
  'Vision loss',

  // Neurologic
  'Seizures',
  'Head tilt',
  'Wobbly / uncoordinated gait',
  'Muscle tremors',
  'Hindlimb weakness',
  'Disorientation / confusion',
  'Circling',
  'Flicking eyes (nystagmus)',
  'Falling or rolling to one side',
  'Neck or back pain',
  'Sudden inability to walk / dragging limbs',
  'Sudden hindlimb paralysis',

  // Musculoskeletal
  'Lameness',
  'Joint pain / stiffness',

  // Reproductive
  'Vaginal discharge',
  'Enlarged abdomen (intact female)',
  'Straining to give birth',
];

// Starting lists and fixed scales. Lists can be edited in the app's Settings screen.

export const LIST_GROUPS = [
  { title: 'IBS', lists: ['ibsSymptoms', 'ibsFoods', 'ibsTriggers', 'ibsMeds'] },
  { title: 'Migraine / headache', lists: ['migLocations', 'migSymptoms', 'migTriggers', 'migMeds'] },
  { title: 'Other health issues', lists: ['otherConditions', 'otherSymptoms', 'otherTriggers', 'otherMeds'] },
  { title: 'Daily habits & new things', lists: ['stressSigns', 'exerciseTypes', 'newCategories'] },
];

export const LIST_LABELS = {
  ibsSymptoms: 'IBS symptoms',
  ibsFoods: 'IBS trigger foods',
  ibsTriggers: 'IBS other triggers',
  ibsMeds: 'IBS medications & remedies',
  migLocations: 'Pain locations',
  migSymptoms: 'Migraine symptoms',
  migTriggers: 'Migraine triggers',
  migMeds: 'Migraine medications & remedies',
  otherConditions: 'Conditions (what it was)',
  otherSymptoms: 'Symptoms',
  otherTriggers: 'Triggers',
  otherMeds: 'Medications & remedies',
  stressSigns: 'Stress signs',
  exerciseTypes: 'Exercise types',
  newCategories: '"Something new" categories',
};

// Lists start empty: you add items as they come up, and they stay for future days.
// The one exception is the "something new" categories, which feed a dropdown.
export const DEFAULT_LISTS = {
  ibsSymptoms: [], ibsFoods: [], ibsTriggers: [], ibsMeds: [],
  migLocations: [], migSymptoms: [], migTriggers: [], migMeds: [],
  otherConditions: [], otherSymptoms: [], otherTriggers: [], otherMeds: [],
  exerciseTypes: [],
  stressSigns: ['Trouble sleeping', 'Tense jaw or shoulders', 'Racing thoughts', 'Irritability',
    'Trouble concentrating', 'Appetite changes', 'Avoiding tasks', 'Crying'],
  newCategories: ['Food', 'Drink', 'Restaurant', 'Activity', 'Product', 'Supplement',
    'Medication', 'Place', 'Other'],
};

// Common options, offered only as type-ahead suggestions in the "Add" box.
export const SUGGESTIONS = {
  ibsSymptoms: ['Abdominal pain', 'Cramping', 'Bloating', 'Gas', 'Diarrhea', 'Constipation',
    'Urgency', 'Nausea', 'Incomplete emptying', 'Mucus in stool'],
  ibsFoods: ['Dairy', 'Wheat / gluten', 'Onion', 'Garlic', 'Beans / lentils', 'Spicy food',
    'Fried / fatty food', 'Coffee', 'Alcohol', 'Carbonated drinks', 'Artificial sweeteners',
    'Apples / pears', 'Raw vegetables'],
  ibsTriggers: ['Stress', 'Poor sleep', 'Large meal', 'Eating late', 'Skipped meal',
    'Menstrual cycle', 'Travel', 'Anxiety'],
  ibsMeds: ['Loperamide', 'Simethicone', 'Peppermint oil', 'Psyllium (fiber)',
    'Polyethylene glycol', 'Bismuth subsalicylate', 'Dicyclomine', 'Hyoscyamine',
    'Ondansetron', 'Probiotic', 'Peppermint tea', 'Ginger', 'Heating pad'],
  migLocations: ['Left side', 'Right side', 'Both sides', 'Behind eyes', 'Forehead', 'Temples',
    'Top of head', 'Back of head', 'Neck'],
  migSymptoms: ['Aura', 'Nausea', 'Vomiting', 'Light sensitivity', 'Sound sensitivity',
    'Smell sensitivity', 'Dizziness', 'Blurred vision', 'Neck pain', 'Fatigue', 'Brain fog'],
  migTriggers: ['Poor sleep', 'Too much sleep', 'Stress', 'Weather change', 'Screen time',
    'Missed meal', 'Caffeine', 'Hormonal', 'Dehydration', 'Alcohol', 'Bright lights',
    'Strong smells'],
  migMeds: ['Ibuprofen', 'Acetaminophen', 'Naproxen', 'Aspirin', 'Acetaminophen/aspirin/caffeine',
    'Sumatriptan', 'Rizatriptan', 'Eletriptan', 'Zolmitriptan', 'Ubrogepant', 'Rimegepant',
    'Ondansetron', 'Metoclopramide', 'Caffeine', 'Ice pack', 'Dark, quiet room'],
  otherConditions: ['Cold', 'Flu', 'COVID-19', 'Stomach bug', 'Sinus infection', 'Sore throat',
    'Allergies', 'Injury', 'Back pain', 'Muscle pain', 'Rash / skin issue', 'UTI'],
  otherSymptoms: ['Fever', 'Chills', 'Cough', 'Sore throat', 'Congestion', 'Runny nose',
    'Sneezing', 'Fatigue', 'Body aches', 'Headache', 'Pain', 'Swelling', 'Itching', 'Rash',
    'Vomiting', 'Diarrhea'],
  otherMeds: ['Acetaminophen', 'Ibuprofen', 'Naproxen', 'Dextromethorphan', 'Guaifenesin',
    'Pseudoephedrine', 'Phenylephrine', 'Cetirizine', 'Loratadine', 'Fexofenadine',
    'Diphenhydramine', 'Fluticasone nasal spray', 'Saline nasal spray', 'Throat lozenges',
    'Ice', 'Heat'],
  exerciseTypes: ['Walking', 'Running', 'Cycling', 'Strength training', 'Yoga', 'Pilates',
    'Swimming', 'Stretching', 'Hiking', 'Dance', 'Sports'],
  newCategories: ['Food', 'Drink', 'Restaurant', 'Activity', 'Product', 'Supplement',
    'Medication', 'Place', 'Other'],
};

// Impact scale: rates how much symptoms affected the day, not how bad they felt.
// `noun` is "Pain" or "Symptoms".
export function impactScale(noun) {
  const n = noun.toLowerCase();
  return [
    { v: 0, label: 'None', desc: `No ${n}` },
    { v: 1, label: 'No impact', desc: `${noun}, but I could do all my activities` },
    { v: 2, label: 'Some impact', desc: `${noun} limited my activities slightly or somewhat` },
    { v: 3, label: 'Major impact', desc: `${noun} significantly limited my activities` },
    { v: 4, label: 'Couldn\u2019t function', desc: `${noun} stopped me from doing anything I had planned` },
  ];
}

// Follow-up questions when IBS symptoms trigger a fainting episode.
// Each is answered yes/no. To add a question, add a line with a new unique id.
export const EPISODE_QUESTIONS = [
  { id: 'hotFlashes', q: 'Did you get hot flashes?' },
  { id: 'intensePain', q: 'Did you have increased, intense intestinal pain?' },
  { id: 'gas', q: 'Did it result in gas?' },
  { id: 'diarrhea', q: 'Did it result in diarrhea?' },
  { id: 'fainted', q: 'Did you faint?' },
];

// Stress: a descriptive five-level scale (replaced the old 0-10 rating).
export const STRESS_SCALE = [
  { v: 0, label: 'Calm', desc: 'Little or no stress. Things felt manageable without effort.' },
  { v: 1, label: 'Manageable', desc: 'Some stress, but it stayed in the background and didn\u2019t change my day.' },
  { v: 2, label: 'Stretched', desc: 'Stress was on my mind a lot. I had to push to focus or stay patient, but I still got things done.' },
  { v: 3, label: 'Overwhelmed', desc: 'Stress took over parts of my day. I avoided tasks, snapped at people, or couldn\u2019t concentrate.' },
  { v: 4, label: 'Crisis', desc: 'I couldn\u2019t function normally. I shut down, cried, couldn\u2019t sleep, or had to cancel plans.' },
];

// Old 0-10 stress rating to the closest level: 0-1 Calm, 2-3 Manageable, 4-6 Stretched,
// 7-8 Overwhelmed, 9-10 Crisis.
export function stressFromOld(n) {
  if (n <= 1) return 0;
  if (n <= 3) return 1;
  if (n <= 6) return 2;
  if (n <= 8) return 3;
  return 4;
}

// Past events: how well the event is remembered or recorded.
export const CONFIDENCE = [
  { v: 1, label: 'Clear', desc: 'I remember this clearly, or it\u2019s clearly recorded.' },
  { v: 2, label: 'A little fuzzy', desc: 'I remember some of the details, but it\u2019s a little fuzzy.' },
  { v: 3, label: 'Big picture only', desc: 'I remember the main thing (like having a migraine), but not the details.' },
];

// A historical record. Every field is optional.
export function newPastEvent() {
  const now = new Date().toISOString();
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    title: '',
    date: { year: null, month: null, day: null }, // month: 1-12, or 'winter'|'spring'|'summer'|'fall'
    duration: { amount: null, unit: null }, // unit: 'hours'|'days'|'weeks'|'months'
    confidence: null, // 1-3, see CONFIDENCE
    category: null, // 'ibs'|'migraine'|'other'
    symptoms: [],
    triggers: [],
    meds: [], // [{ name, helped }]
    unknown: { symptoms: false, triggers: false, meds: false }, // "I don't remember"
    impact: null, // 0-4, see impactScale()
    notes: '',
  };
}

export function normalizePastEvent(saved) {
  const base = newPastEvent();
  if (!saved || typeof saved !== 'object') return base;
  const out = { ...base, ...saved };
  for (const k of ['date', 'duration', 'unknown']) out[k] = { ...base[k], ...(saved[k] || {}) };
  return out;
}

// "Did it help?" scale: 0 = not at all, 4 = completely fixed it.
export const HELP_SCALE = [
  { v: 0, label: 'Not at all' },
  { v: 1, label: 'A little' },
  { v: 2, label: 'Somewhat' },
  { v: 3, label: 'Mostly' },
  { v: 4, label: 'Completely fixed it' },
];

export const SEVERITY3 = [
  { v: 'mild', label: 'Mild' },
  { v: 'moderate', label: 'Moderate' },
  { v: 'severe', label: 'Severe' },
];

export const SLEEP_QUALITY = [
  { v: 1, label: 'Very poor' },
  { v: 2, label: 'Poor' },
  { v: 3, label: 'OK' },
  { v: 4, label: 'Good' },
  { v: 5, label: 'Great' },
];

export const INTENSITY = [
  { v: 'light', label: 'Light' },
  { v: 'moderate', label: 'Moderate' },
  { v: 'hard', label: 'Hard' },
];

export const BRISTOL = [
  { n: 1, short: 'Hard lumps', desc: 'Separate hard lumps, like nuts (hard to pass)' },
  { n: 2, short: 'Lumpy', desc: 'Sausage-shaped but lumpy' },
  { n: 3, short: 'Cracked', desc: 'Like a sausage with cracks on the surface' },
  { n: 4, short: 'Smooth', desc: 'Like a sausage or snake, smooth and soft' },
  { n: 5, short: 'Soft blobs', desc: 'Soft blobs with clear-cut edges (passed easily)' },
  { n: 6, short: 'Mushy', desc: 'Fluffy pieces with ragged edges, a mushy stool' },
  { n: 7, short: 'Watery', desc: 'Watery, no solid pieces, entirely liquid' },
];

export function newEntry(date) {
  return {
    date,
    updatedAt: null,
    ibs: {
      status: null, // null = not answered, 'none' = no symptoms, 'yes' = had symptoms
      impact: null, // 0-4, see impactScale()
      symptoms: [], // [{ name, sev: 'mild'|'moderate'|'severe'|null }]
      episode: null, // did symptoms trigger a fainting episode? true | false | null
      episodeAnswers: {}, // { [EPISODE_QUESTIONS id]: true | false }
      bms: [], // [{ bristol: 1-7|null }]
      foods: [],
      triggers: [],
      meds: [], // [{ name, helped: 0-4|null }]
      notes: '',
    },
    migraine: {
      status: null,
      kind: null, // 'migraine' | 'headache'
      ended: null, // did it end today? true | false | null (migraines can last days)
      continued: false, // true when carried over from yesterday's unended migraine
      painMap: [], // [{ view: 'top'|'side', x, y }] marks tapped on the head diagrams
      impact: null,
      locations: [],
      symptoms: [],
      meds: [], // [{ name, time, helped }]
      triggers: [],
      notes: '',
    },
    other: {
      status: null,
      items: [], // see newOtherItem()
    },
    daily: {
      sleepHours: null,
      sleepQuality: null,
      stressLevel: null, // 0-4, see STRESS_SCALE
      stressConverted: false, // true when converted from an old 0-10 rating
      stressOriginal: null, // the old 0-10 rating, kept for reference
      stressSigns: [],
      water: null,
      exercised: null, // true | false | null
      exTypes: [],
      exMinutes: null,
      exIntensity: null,
      notes: '',
    },
    newThings: [], // [{ id, category, text }]
  };
}

export function newOtherItem() {
  return {
    id: uid(),
    condition: '',
    symptoms: [],
    impact: null,
    fever: null,
    temp: null,
    meds: [], // [{ name, helped }]
    notes: '',
  };
}

// Fill in any fields missing from older saved entries.
export function normalizeEntry(saved, date) {
  const base = newEntry(date);
  if (!saved) return base;
  for (const k of Object.keys(base)) {
    if (saved[k] === undefined) continue;
    const b = base[k];
    if (b && typeof b === 'object' && !Array.isArray(b)) base[k] = { ...b, ...saved[k] };
    else base[k] = saved[k];
  }
  // Convert an old 0-10 stress rating once, keeping the original value.
  const d = base.daily;
  if (typeof d.stress === 'number') {
    if (d.stressLevel == null) {
      d.stressLevel = stressFromOld(d.stress);
      d.stressConverted = true;
      d.stressOriginal = d.stress;
    }
    delete d.stress;
  } else if ('stress' in d) delete d.stress;
  return base;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

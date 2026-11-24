// Starting lists and fixed scales. Lists can be edited in the app's Settings screen.

export const LIST_GROUPS = [
  { title: 'IBS', lists: ['ibsSymptoms', 'ibsFoods', 'ibsTriggers', 'ibsMeds'] },
  { title: 'Migraine / headache', lists: ['migLocations', 'migSymptoms', 'migTriggers', 'migMeds'] },
  { title: 'Other health issues', lists: ['otherConditions', 'otherSymptoms', 'otherMeds'] },
  { title: 'Daily habits & new things', lists: ['exerciseTypes', 'newCategories'] },
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
  otherMeds: 'Medications & remedies',
  exerciseTypes: 'Exercise types',
  newCategories: '"Something new" categories',
};

// Lists start empty: you add items as they come up, and they stay for future days.
// The one exception is the "something new" categories, which feed a dropdown.
export const DEFAULT_LISTS = {
  ibsSymptoms: [], ibsFoods: [], ibsTriggers: [], ibsMeds: [],
  migLocations: [], migSymptoms: [], migTriggers: [], migMeds: [],
  otherConditions: [], otherSymptoms: [], otherMeds: [],
  exerciseTypes: [],
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
  { id: 'gasDiarrhea', q: 'Did it result in gas or diarrhea?' },
  { id: 'fainted', q: 'Did you faint?' },
];

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
      start: '',
      durH: null,
      durM: null,
      ongoing: false,
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
      stress: null,
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
  return base;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

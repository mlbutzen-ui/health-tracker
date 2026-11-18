import * as db from './db.js';
import {
  LIST_GROUPS, LIST_LABELS, DEFAULT_LISTS, HELP_SCALE, SEVERITY3, SLEEP_QUALITY, INTENSITY,
  BRISTOL, newEntry, newOtherItem, normalizeEntry, uid,
} from './defaults.js';

export const APP_VERSION = '1.0.0';

const S = {
  view: 'checkin',
  date: null,
  today: null,
  entry: null,
  prev: null, // yesterday's entry, for "still have" shortcuts
  lists: null,
  settings: { lockAfter: 60 },
  pin: null, // { salt, hash, len }
  entryCount: 0,
  lastBackup: null,
  saveTimer: null,
  dirty: false,
  saveStatus: '',
  openLists: new Set(),
  locked: false,
  hiddenAt: null,
  updateReady: false,
};

const root = document.getElementById('app');

/* ---------------- small helpers ---------------- */

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = !!v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : String(kid));
  }
  return el;
}

const pad2 = (n) => String(n).padStart(2, '0');
function dateStr(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); }
function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
function fmtLong(s) {
  const d = parseDate(s);
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}
function relLabel(s) {
  const diff = daysBetween(s, S.today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function numOrNull(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }

function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

function modal({ title, body, actions }) {
  return new Promise((resolve) => {
    const ov = h('div', { class: 'modal-overlay' });
    const close = (v) => { ov.remove(); resolve(v); };
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
      title && h('h3', {}, title),
      body,
      h('div', { class: 'modal-actions' }, actions.map((a) => h('button', {
        class: 'btn ' + (a.kind || 'btn-plain'),
        onclick: () => close(typeof a.value === 'function' ? a.value() : a.value),
      }, a.label))));
    ov.append(box);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(null); });
    document.body.append(ov);
    const inp = box.querySelector('input');
    if (inp) setTimeout(() => inp.focus(), 60);
  });
}

function confirmBox(title, text, okLabel = 'OK', danger = false) {
  return modal({
    title,
    body: h('p', {}, text),
    actions: [{ label: 'Cancel', value: false }, { label: okLabel, value: true, kind: danger ? 'btn-danger' : 'btn-primary' }],
  });
}

function askText(title, initial = '', placeholder = '', okLabel = 'Save') {
  const inp = h('input', { type: 'text', class: 'text-in', value: initial, placeholder, autocomplete: 'off' });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') inp.closest('.modal').querySelector('.btn-primary').click();
  });
  return modal({
    title,
    body: inp,
    actions: [{ label: 'Cancel', value: null }, { label: okLabel, kind: 'btn-primary', value: () => inp.value.trim() || null }],
  });
}

/* ---------------- saving ---------------- */

function setSaveStatus(text) {
  S.saveStatus = text;
  const el = document.getElementById('save-status');
  if (el) el.textContent = text;
}

function markDirty() {
  S.dirty = true;
  S.entry.updatedAt = new Date().toISOString();
  setSaveStatus('Saving…');
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(flush, 400);
}

async function flush() {
  clearTimeout(S.saveTimer);
  if (!S.dirty || !S.entry) return;
  S.dirty = false;
  try {
    const isNew = !(await db.getEntry(S.entry.date));
    await db.putEntry(clone(S.entry));
    if (isNew) S.entryCount++;
    setSaveStatus('Saved ✓');
    askPersistentStorage();
  } catch (err) {
    S.dirty = true;
    setSaveStatus('Not saved!');
    toast('Could not save: ' + err.message);
  }
}

let persistAsked = false;
function askPersistentStorage() {
  if (persistAsked || !navigator.storage || !navigator.storage.persist) return;
  persistAsked = true;
  navigator.storage.persist().catch(() => {});
}

// Change the current entry. Pass rerender=false for typing so the keyboard stays open.
function upd(fn, rerender = true) {
  fn(S.entry);
  markDirty();
  if (rerender) render();
}

async function saveLists() {
  await db.setMeta('lists', S.lists);
}

/* ---------------- navigation ---------------- */

async function goDate(d) {
  if (d > S.today) d = S.today;
  await flush();
  S.date = d;
  S.entry = normalizeEntry(await db.getEntry(d), d);
  const prev = await db.getEntry(addDays(d, -1));
  S.prev = prev ? normalizeEntry(prev, addDays(d, -1)) : null;
  S.saveStatus = S.entry.updatedAt ? 'Saved ✓' : '';
  S.view = 'checkin';
  render();
  window.scrollTo(0, 0);
}

function goView(v) {
  flush();
  S.view = v;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const y = window.scrollY;
  const main = S.view === 'settings' ? viewSettings() : viewCheckin();
  root.replaceChildren(...[updateBanner(), main, bottomNav()].filter(Boolean));
  window.scrollTo(0, y);
}

function bottomNav() {
  const tab = (v, icon, label) => h('button', {
    class: 'tab' + (S.view === v ? ' on' : ''),
    onclick: () => (v === 'checkin' ? goDate(S.date) : goView(v)),
  }, h('span', { class: 'tab-icon', 'aria-hidden': 'true' }, icon), h('span', {}, label));
  return h('nav', { class: 'bottom-nav' },
    tab('checkin', '✎', 'Check-in'),
    tab('settings', '⚙', 'Settings'));
}

function updateBanner() {
  if (!S.updateReady) return null;
  return h('div', { class: 'banner banner-info' },
    h('span', {}, 'A new version of the app is ready.'),
    h('button', { class: 'btn btn-small btn-primary', onclick: async () => { await flush(); location.reload(); } }, 'Update'));
}

/* ---------------- reusable inputs ---------------- */

function field(label, ...content) {
  return h('div', { class: 'field' }, label && h('div', { class: 'label' }, label), ...content);
}

function scale10(value, onSet, low = 'None', high = 'Worst') {
  return h('div', { class: 'scale10' },
    h('div', { class: 'scale-btns' }, Array.from({ length: 11 }, (_, n) => h('button', {
      class: 'sbtn' + (value === n ? ' on' : ''),
      style: { '--n': n },
      'aria-pressed': value === n ? 'true' : 'false',
      onclick: () => onSet(value === n ? null : n),
    }, n))),
    h('div', { class: 'scale-ends' }, h('span', {}, `0 = ${low}`), h('span', {}, `10 = ${high}`)));
}

function seg(options, value, onSet, extraClass = '') {
  return h('div', { class: 'seg ' + extraClass },
    options.map((o) => h('button', {
      class: 'seg-btn' + (value === o.v ? ' on' : ''),
      'aria-pressed': value === o.v ? 'true' : 'false',
      onclick: () => onSet(value === o.v ? null : o.v),
    }, o.label)));
}

// Chip checklist from an editable list. "+ Add" adds a new item to the list and selects it.
function chips(listKey, selected, onToggle, { single = false, addLabel = '+ Add other' } = {}) {
  const items = [...S.lists[listKey]];
  selected.forEach((s) => { if (s && !items.includes(s)) items.push(s); });
  return h('div', { class: 'chips' + (single ? ' single' : '') },
    items.map((name) => {
      const on = selected.includes(name);
      return h('button', {
        class: 'chip' + (on ? ' on' : ''),
        'aria-pressed': on ? 'true' : 'false',
        onclick: () => onToggle(name, !on),
      }, name);
    }),
    h('button', {
      class: 'chip chip-add',
      onclick: async () => {
        const name = await askText(`Add to "${LIST_LABELS[listKey]}"`, '', 'Type a name', 'Add');
        if (!name) return;
        const existing = S.lists[listKey].find((x) => x.toLowerCase() === name.toLowerCase());
        const finalName = existing || name;
        if (!existing) { S.lists[listKey].push(name); await saveLists(); toast(`Added "${name}" to your list`); }
        if (!selected.includes(finalName)) onToggle(finalName, true);
      },
    }, addLabel));
}

function toggleIn(arr, name, on) {
  const i = arr.indexOf(name);
  if (on && i < 0) arr.push(name);
  if (!on && i >= 0) arr.splice(i, 1);
}
function toggleObj(arr, name, on, make) {
  const i = arr.findIndex((o) => o.name === name);
  if (on && i < 0) arr.push(make(name));
  if (!on && i >= 0) arr.splice(i, 1);
}

function stepper(value, onSet, { step = 1, min = 0, max = 99, start = 1, unit = '' } = {}) {
  const fix = (v) => Math.round(v * 10) / 10;
  return h('div', { class: 'stepper' },
    h('button', { class: 'step-btn', 'aria-label': 'Less', onclick: () => onSet(value == null ? null : (value - step < min ? null : fix(value - step))) }, '−'),
    h('input', {
      type: 'number', inputmode: 'decimal', class: 'step-in', value: value ?? '', min, max, step, placeholder: '–',
      oninput: (e) => onSet(numOrNull(e.target.value), false),
      onchange: () => render(),
    }),
    unit && h('span', { class: 'step-unit' }, unit),
    h('button', { class: 'step-btn', 'aria-label': 'More', onclick: () => onSet(value == null ? start : Math.min(max, fix(value + step))) }, '+'));
}

function notesBox(value, onInput, placeholder = 'Anything else worth remembering…') {
  return h('textarea', { rows: 3, class: 'notes', placeholder, value, oninput: (e) => onInput(e.target.value) });
}

function helpedRow(med, setHelped, extra) {
  return h('div', { class: 'subrow' },
    h('div', { class: 'subrow-title' }, med.name),
    extra,
    h('div', { class: 'mini-label' }, 'Did it help?'),
    seg(HELP_SCALE, med.helped, setHelped, 'seg-help'));
}

function bristolPicker(value, onSet) {
  return h('div', {},
    h('div', { class: 'bristol' }, BRISTOL.map((b) => h('button', {
      class: 'bbtn b' + b.n + (value === b.n ? ' on' : ''),
      'aria-pressed': value === b.n ? 'true' : 'false',
      onclick: () => onSet(value === b.n ? null : b.n),
    }, h('b', {}, b.n), h('small', {}, b.short)))),
    value && h('div', { class: 'hint' }, `Type ${value}: ${BRISTOL[value - 1].desc}`));
}

/* ---------------- check-in ---------------- */

const ORDER = ['ibs', 'migraine', 'other', 'daily', 'newThings'];

function viewCheckin() {
  const e = S.entry;
  return h('main', { class: 'page' },
    checkinHeader(),
    backupReminder(),
    symptomSection('ibs', 'IBS', 'No IBS symptoms today', 'I had IBS symptoms', ibsBody),
    symptomSection('migraine', 'Migraine / headache', 'No migraine or headache', 'Yes, I had one', migraineBody),
    symptomSection('other', 'Other health issues', 'Nothing else today', 'Yes, log something', otherBody),
    dailySection(e),
    newThingsSection(e),
    h('p', { class: 'footer-note' }, 'Everything saves automatically as you go. ', h('br'), 'Your data stays on this phone only.'));
}

function checkinHeader() {
  const isToday = S.date === S.today;
  const dateInput = h('input', {
    type: 'date', class: 'date-native', value: S.date, max: S.today, tabindex: '-1', 'aria-hidden': 'true',
    onchange: (e) => { if (e.target.value) goDate(e.target.value); },
  });
  const openPicker = () => {
    try { dateInput.showPicker(); } catch { dateInput.focus(); dateInput.click(); }
  };
  return h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn', 'aria-label': 'Previous day', onclick: () => goDate(addDays(S.date, -1)) }, '‹'),
    h('div', { class: 'date-center' },
      h('button', { class: 'date-btn', onclick: openPicker, 'aria-label': 'Pick a date' },
        h('span', { class: 'date-main' }, fmtLong(S.date), ' ▾'),
        h('span', { class: 'date-sub' }, relLabel(S.date))),
      dateInput,
      h('div', { class: 'save-row' },
        !isToday && h('button', { class: 'link small', onclick: () => goDate(S.today) }, 'Back to today'),
        h('span', { id: 'save-status', class: 'save-status' }, S.saveStatus))),
    h('button', { class: 'icon-btn', 'aria-label': 'Next day', disabled: isToday, onclick: () => goDate(addDays(S.date, 1)) }, '›'));
}

function backupReminder() {
  if (S.entryCount < 3) return null;
  const days = S.lastBackup ? daysBetween(dateStr(new Date(S.lastBackup)), S.today) : null;
  if (days != null && days < 7) return null;
  return h('div', { class: 'banner banner-warn' },
    h('span', {}, days == null ? 'You haven’t backed up yet. Your data only lives on this phone.' : `Last backup was ${days} days ago.`),
    h('button', { class: 'btn btn-small btn-primary', onclick: () => doBackup() }, 'Back up now'));
}

function sectionHasData(key) {
  const blank = newEntry('')[key];
  const cur = { ...S.entry[key], status: null };
  return JSON.stringify(cur) !== JSON.stringify(blank);
}

async function setStatus(key, val) {
  if (val === 'none' && S.entry[key].status === 'yes' && sectionHasData(key)) {
    const ok = await confirmBox('Clear this section?', 'This will remove what you entered in this section for this day.', 'Clear it', true);
    if (!ok) return;
  }
  upd((e) => {
    if (val === 'none') e[key] = { ...newEntry('')[key], status: 'none' };
    else e[key].status = val;
    if (key === 'other' && val === 'yes' && e.other.items.length === 0) e.other.items.push(newOtherItem());
  });
  if (val === 'none') {
    const next = ORDER[ORDER.indexOf(key) + 1];
    const el = document.getElementById('sec-' + next);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function symptomSection(key, title, noText, yesText, bodyFn) {
  const sec = S.entry[key];
  const card = h('section', { class: 'card', id: 'sec-' + key },
    h('div', { class: 'card-head' },
      h('h2', {}, title),
      sec.status === 'none' && h('span', { class: 'pill pill-ok' }, 'None'),
      sec.status === 'yes' && h('span', { class: 'pill pill-yes' }, 'Logged')));
  if (sec.status == null) {
    card.append(h('div', { class: 'choice-row' },
      h('button', { class: 'btn btn-none', onclick: () => setStatus(key, 'none') }, '✓ ', noText),
      h('button', { class: 'btn btn-yes', onclick: () => setStatus(key, 'yes') }, yesText)));
    const still = key === 'other' && stillHaveButtons();
    if (still) card.append(still);
  } else if (sec.status === 'none') {
    card.append(h('div', { class: 'none-row' },
      h('span', {}, '✓ ', noText),
      h('button', { class: 'link', onclick: () => setStatus(key, null) }, 'Change')));
  } else {
    card.append(bodyFn(sec));
    card.append(h('div', { class: 'card-foot' },
      h('button', { class: 'link small muted', onclick: () => setStatus(key, 'none') }, `Change to "${noText}"`)));
  }
  return card;
}

/* ----- IBS ----- */

function ibsBody(s) {
  const symNames = s.symptoms.map((x) => x.name);
  const medNames = s.meds.map((x) => x.name);
  return h('div', { class: 'card-body' },
    field('Overall severity today', scale10(s.severity, (v) => upd((e) => { e.ibs.severity = v; }))),

    field('Symptoms',
      chips('ibsSymptoms', symNames, (name, on) => upd((e) => toggleObj(e.ibs.symptoms, name, on, (n) => ({ name: n, sev: null })))),
      s.symptoms.map((sym) => h('div', { class: 'subrow subrow-inline' },
        h('div', { class: 'subrow-title' }, sym.name),
        seg(SEVERITY3, sym.sev, (v) => upd((e) => { e.ibs.symptoms.find((x) => x.name === sym.name).sev = v; }), 'seg-sev')))),

    field('Bowel movements',
      h('div', { class: 'row-between' },
        h('span', { class: 'muted' }, 'How many today?'),
        stepper(s.bms.length, (v, rr = true) => upd((e) => {
          const n = Math.max(0, Math.min(20, Math.round(v || 0)));
          while (e.ibs.bms.length < n) e.ibs.bms.push({ bristol: null });
          e.ibs.bms.length = n;
        }, rr), { max: 20 })),
      s.bms.map((bm, i) => h('div', { class: 'subrow' },
        h('div', { class: 'subrow-title' }, `#${i + 1} – Bristol stool type`),
        bristolPicker(bm.bristol, (v) => upd((e) => { e.ibs.bms[i].bristol = v; })))),
      s.bms.length > 0 && h('div', { class: 'hint' }, 'Types 1–2 lean constipated, 3–4 are typical, 5–7 lean loose.')),

    field('Possible trigger foods',
      chips('ibsFoods', s.foods, (name, on) => upd((e) => toggleIn(e.ibs.foods, name, on)), { addLabel: '+ Add food' })),

    field('Other possible triggers',
      chips('ibsTriggers', s.triggers, (name, on) => upd((e) => toggleIn(e.ibs.triggers, name, on)))),

    field('Medications & remedies taken',
      chips('ibsMeds', medNames, (name, on) => upd((e) => toggleObj(e.ibs.meds, name, on, (n) => ({ name: n, helped: null })))),
      s.meds.map((m) => helpedRow(m, (v) => upd((e) => { e.ibs.meds.find((x) => x.name === m.name).helped = v; })))),

    field('Notes', notesBox(s.notes, (v) => upd((e) => { e.ibs.notes = v; }, false))));
}

/* ----- Migraine ----- */

function migraineBody(s) {
  const medNames = s.meds.map((x) => x.name);
  return h('div', { class: 'card-body' },
    field('What was it?', seg([{ v: 'migraine', label: 'Migraine' }, { v: 'headache', label: 'Headache' }], s.kind,
      (v) => upd((e) => { e.migraine.kind = v; }))),

    field('When did it start and how long did it last?',
      h('div', { class: 'row-wrap' },
        h('label', { class: 'inline-field' }, h('span', {}, 'Start'),
          h('input', { type: 'time', class: 'time-in', value: s.start, onchange: (ev) => upd((e) => { e.migraine.start = ev.target.value; }, false) })),
        h('label', { class: 'inline-field' }, h('span', {}, 'Lasted'),
          h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 72, class: 'num-in', placeholder: '0', value: s.durH ?? '',
            oninput: (ev) => upd((e) => { e.migraine.durH = numOrNull(ev.target.value); }, false) }),
          h('span', {}, 'hr'),
          h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 59, class: 'num-in', placeholder: '0', value: s.durM ?? '',
            oninput: (ev) => upd((e) => { e.migraine.durM = numOrNull(ev.target.value); }, false) }),
          h('span', {}, 'min'))),
      h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: s.ongoing, onchange: (ev) => upd((e) => { e.migraine.ongoing = ev.target.checked; }, false) }),
        ' Still going when I logged this')),

    field('Peak pain', scale10(s.peak, (v) => upd((e) => { e.migraine.peak = v; }))),

    field('Where was the pain?',
      chips('migLocations', s.locations, (name, on) => upd((e) => toggleIn(e.migraine.locations, name, on)))),

    field('Symptoms',
      chips('migSymptoms', s.symptoms, (name, on) => upd((e) => toggleIn(e.migraine.symptoms, name, on)))),

    field('Medications & remedies taken',
      chips('migMeds', medNames, (name, on) => upd((e) => toggleObj(e.migraine.meds, name, on, (n) => ({ name: n, time: '', helped: null })))),
      s.meds.map((m) => helpedRow(m,
        (v) => upd((e) => { e.migraine.meds.find((x) => x.name === m.name).helped = v; }),
        h('label', { class: 'inline-field' }, h('span', {}, 'Time taken'),
          h('input', { type: 'time', class: 'time-in', value: m.time,
            onchange: (ev) => upd((e) => { e.migraine.meds.find((x) => x.name === m.name).time = ev.target.value; }, false) }))))),

    field('Possible triggers',
      chips('migTriggers', s.triggers, (name, on) => upd((e) => toggleIn(e.migraine.triggers, name, on)))),

    field('Notes', notesBox(s.notes, (v) => upd((e) => { e.migraine.notes = v; }, false))));
}

/* ----- Other ----- */

function stillHaveButtons() {
  const prevItems = S.prev?.other?.status === 'yes' ? S.prev.other.items.filter((i) => i.condition) : [];
  const current = S.entry.other.items.map((i) => i.condition);
  const todo = prevItems.filter((i) => !current.includes(i.condition));
  if (!todo.length) return null;
  return h('div', { class: 'still-have' },
    h('div', { class: 'mini-label' }, 'From yesterday:'),
    todo.map((it) => h('button', {
      class: 'btn btn-outline btn-small',
      onclick: () => upd((e) => {
        e.other.status = 'yes';
        e.other.items = e.other.items.filter((x) => x.condition || x.symptoms.length || x.notes);
        e.other.items.push({ ...newOtherItem(), condition: it.condition, symptoms: [...it.symptoms],
          meds: it.meds.map((m) => ({ name: m.name, helped: null })) });
      }),
    }, `↻ Still have: ${it.condition}`)));
}

function otherBody(s) {
  return h('div', { class: 'card-body' },
    s.items.map((it, idx) => otherItem(it, idx, s.items.length)),
    h('div', { class: 'row-wrap' },
      h('button', { class: 'btn btn-outline', onclick: () => upd((e) => { e.other.items.push(newOtherItem()); }) }, '+ Add another issue')),
    stillHaveButtons());
}

function otherItem(it, idx, total) {
  const set = (fn, rr = true) => upd((e) => fn(e.other.items.find((x) => x.id === it.id)), rr);
  const medNames = it.meds.map((m) => m.name);
  return h('div', { class: 'subcard' },
    h('div', { class: 'subcard-head' },
      h('h3', {}, it.condition || (total > 1 ? `Issue ${idx + 1}` : 'What was it?')),
      h('button', {
        class: 'link small danger',
        onclick: async () => {
          if (!(await confirmBox('Remove this issue?', 'This removes it from this day.', 'Remove', true))) return;
          upd((e) => {
            e.other.items = e.other.items.filter((x) => x.id !== it.id);
            if (!e.other.items.length) e.other.status = null;
          });
        },
      }, 'Remove')),
    field('What was it?', chips('otherConditions', it.condition ? [it.condition] : [],
      (name, on) => set((x) => { x.condition = on ? name : ''; }), { single: true })),
    field('Symptoms', chips('otherSymptoms', it.symptoms, (name, on) => set((x) => toggleIn(x.symptoms, name, on)))),
    field('Severity', scale10(it.severity, (v) => set((x) => { x.severity = v; }))),
    field('Fever?',
      seg([{ v: false, label: 'No' }, { v: true, label: 'Yes' }], it.fever, (v) => set((x) => { x.fever = v; if (!v) x.temp = null; })),
      it.fever && h('label', { class: 'inline-field mt' }, h('span', {}, 'Highest temperature'),
        h('input', { type: 'number', inputmode: 'decimal', step: '0.1', min: 90, max: 110, class: 'num-in wide', placeholder: '100.4',
          value: it.temp ?? '', oninput: (ev) => set((x) => { x.temp = numOrNull(ev.target.value); }, false) }),
        h('span', {}, '°F'))),
    field('Medications & remedies taken',
      chips('otherMeds', medNames, (name, on) => set((x) => toggleObj(x.meds, name, on, (n) => ({ name: n, helped: null })))),
      it.meds.map((m) => helpedRow(m, (v) => set((x) => { x.meds.find((y) => y.name === m.name).helped = v; })))),
    field('Notes', notesBox(it.notes, (v) => set((x) => { x.notes = v; }, false))));
}

/* ----- Daily habits ----- */

function dailySection(e) {
  const d = e.daily;
  const set = (fn, rr = true) => upd((en) => fn(en.daily), rr);
  return h('section', { class: 'card', id: 'sec-daily' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Daily habits')),
    h('div', { class: 'card-body' },
      field('Sleep last night',
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Hours'),
          stepper(d.sleepHours, (v, rr = true) => set((x) => { x.sleepHours = v; }, rr), { step: 0.5, max: 24, start: 7 })),
        h('div', { class: 'mini-label mt' }, 'Quality'),
        seg(SLEEP_QUALITY, d.sleepQuality, (v) => set((x) => { x.sleepQuality = v; }), 'seg-5')),
      field('Stress level', scale10(d.stress, (v) => set((x) => { x.stress = v; }), 'None', 'Extreme')),
      field('Water',
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Cups (8 oz)'),
          stepper(d.water, (v, rr = true) => set((x) => { x.water = v; }, rr), { max: 30, start: 1 }))),
      field('Exercise',
        seg([{ v: false, label: 'No exercise' }, { v: true, label: 'Yes, I exercised' }], d.exercised,
          (v) => set((x) => { x.exercised = v; if (!v) { x.exTypes = []; x.exMinutes = null; x.exIntensity = null; } })),
        d.exercised && h('div', { class: 'subrow' },
          h('div', { class: 'mini-label' }, 'What kind?'),
          chips('exerciseTypes', d.exTypes, (name, on) => set((x) => toggleIn(x.exTypes, name, on))),
          h('div', { class: 'row-between mt' }, h('span', { class: 'muted' }, 'Minutes'),
            stepper(d.exMinutes, (v, rr = true) => set((x) => { x.exMinutes = v; }, rr), { step: 5, max: 600, start: 30 })),
          h('div', { class: 'mini-label mt' }, 'Intensity'),
          seg(INTENSITY, d.exIntensity, (v) => set((x) => { x.exIntensity = v; })))),
      field('Notes', notesBox(d.notes, (v) => set((x) => { x.notes = v; }, false), 'Anything else about your day…'))));
}

/* ----- Something new ----- */

function newThingsSection(e) {
  const cats = S.lists.newCategories;
  const catSel = h('select', { class: 'select' }, cats.map((c) => h('option', { value: c }, c)));
  const txt = h('input', { type: 'text', class: 'text-in', placeholder: 'e.g. Thai curry, new protein bar, hot yoga' });
  const add = () => {
    const text = txt.value.trim();
    if (!text) { txt.focus(); return; }
    upd((en) => { en.newThings.push({ id: uid(), category: catSel.value, text }); });
  };
  txt.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') add(); });
  return h('section', { class: 'card', id: 'sec-newThings' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Something new today')),
    h('div', { class: 'card-body' },
      h('p', { class: 'muted small' }, 'Did you eat, drink, do or try anything for the first time? Note it here so you can spot patterns later.'),
      e.newThings.length > 0 && h('ul', { class: 'new-list' }, e.newThings.map((n) => h('li', {},
        h('span', { class: 'tag' }, n.category),
        h('span', { class: 'new-text' }, n.text),
        h('button', { class: 'icon-btn small', 'aria-label': 'Remove', onclick: () => upd((en) => { en.newThings = en.newThings.filter((x) => x.id !== n.id); }) }, '✕')))),
      h('div', { class: 'new-add' }, catSel, txt, h('button', { class: 'btn btn-primary', onclick: add }, 'Add'))));
}

/* ---------------- settings ---------------- */

function viewSettings() {
  return h('main', { class: 'page' },
    h('header', { class: 'page-head' }, h('h1', {}, 'Settings')),
    backupCard(),
    lockCard(),
    listsCard(),
    aboutCard(),
    dangerCard());
}

function backupCard() {
  const last = S.lastBackup ? new Date(S.lastBackup).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'never';
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: (e) => doRestore(e.target.files[0]) });
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Backup & restore')),
    h('div', { class: 'card-body' },
      h('p', { class: 'small' }, 'Your data is stored only on this phone. Save a backup file regularly and keep a copy somewhere safe, like Google Drive or an email to yourself.'),
      h('p', { class: 'small' }, h('b', {}, 'Last backup: '), last),
      h('div', { class: 'stack' },
        h('button', { class: 'btn btn-primary', onclick: () => doBackup() }, '⬇ Save backup file'),
        canShareFiles() && h('button', { class: 'btn btn-outline', onclick: () => doBackup(true) }, '↗ Share backup (Drive, email…)'),
        h('button', { class: 'btn btn-outline', onclick: () => fileIn.click() }, '⬆ Restore from backup file'),
        fileIn),
      h('p', { class: 'hint' }, 'Backup files are not encrypted. Anyone who opens the file can read it, so store it somewhere private.')));
}

function lockCard() {
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, 'App lock (PIN)')),
    h('div', { class: 'card-body' },
      S.pin
        ? [
          h('p', { class: 'small' }, '✓ PIN lock is on.'),
          field('Lock again after leaving the app for',
            seg([{ v: 0, label: 'Right away' }, { v: 60, label: '1 minute' }, { v: 300, label: '5 minutes' }], S.settings.lockAfter,
              async (v) => { if (v == null) return; S.settings.lockAfter = v; await db.setMeta('settings', S.settings); render(); })),
          h('div', { class: 'stack' },
            h('button', { class: 'btn btn-outline', onclick: changePin }, 'Change PIN'),
            h('button', { class: 'btn btn-outline', onclick: removePin }, 'Turn off PIN lock')),
        ]
        : [
          h('p', { class: 'small' }, 'Require a PIN to open the app, in case someone else picks up your phone.'),
          h('button', { class: 'btn btn-primary', onclick: setNewPin }, 'Set a PIN'),
        ],
      h('p', { class: 'hint' }, 'The PIN keeps casual eyes out. If you forget it, the only way back in is to erase the app’s data and restore a backup.')));
}

function listsCard() {
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Your lists')),
    h('div', { class: 'card-body' },
      h('p', { class: 'small muted' }, 'Add, rename, reorder or remove the options shown in your check-in. Renaming also updates past entries. Removing an item keeps it in past entries.'),
      LIST_GROUPS.map((g) => h('div', { class: 'list-group' },
        h('h3', {}, g.title),
        g.lists.map((key) => listEditor(key))))));
}

function listEditor(key) {
  const items = S.lists[key];
  const det = h('details', { class: 'list-ed', open: S.openLists.has(key) },
    h('summary', {}, h('span', {}, LIST_LABELS[key]), h('span', { class: 'count' }, items.length)),
    h('ul', {}, items.map((name, i) => h('li', {},
      h('span', { class: 'li-name' }, name),
      h('button', { class: 'icon-btn small', 'aria-label': `Move ${name} up`, disabled: i === 0, onclick: () => moveItem(key, i) }, '↑'),
      h('button', { class: 'icon-btn small', 'aria-label': `Rename ${name}`, onclick: () => renameItem(key, name) }, '✎'),
      h('button', { class: 'icon-btn small danger', 'aria-label': `Remove ${name}`, onclick: () => removeItem(key, name) }, '✕')))),
    h('button', { class: 'btn btn-outline btn-small', onclick: () => addItem(key) }, '+ Add item'));
  det.addEventListener('toggle', () => { if (det.open) S.openLists.add(key); else S.openLists.delete(key); });
  return det;
}

async function addItem(key) {
  const name = await askText(`Add to "${LIST_LABELS[key]}"`, '', 'Type a name', 'Add');
  if (!name) return;
  if (S.lists[key].some((x) => x.toLowerCase() === name.toLowerCase())) { toast('That’s already in the list'); return; }
  S.lists[key].push(name);
  await saveLists();
  render();
}

async function moveItem(key, i) {
  const arr = S.lists[key];
  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  await saveLists();
  render();
}

async function removeItem(key, name) {
  if (!(await confirmBox(`Remove "${name}"?`, 'It will no longer show as an option. Past entries that used it keep it.', 'Remove', true))) return;
  S.lists[key] = S.lists[key].filter((x) => x !== name);
  await saveLists();
  render();
}

async function renameItem(key, oldName) {
  const name = await askText('Rename', oldName);
  if (!name || name === oldName) return;
  if (S.lists[key].some((x) => x !== oldName && x.toLowerCase() === name.toLowerCase())) { toast('That name is already in the list'); return; }
  await flush();
  S.lists[key] = S.lists[key].map((x) => (x === oldName ? name : x));
  await saveLists();
  const all = await db.allEntries();
  const changed = all.map((e) => normalizeEntry(e, e.date)).filter((e) => renameInEntry(e, key, oldName, name));
  if (changed.length) await db.putEntries(changed);
  S.entry = normalizeEntry(await db.getEntry(S.date), S.date);
  toast(changed.length ? `Renamed, and updated ${changed.length} past ${changed.length === 1 ? 'entry' : 'entries'}` : 'Renamed');
  render();
}

function renameInEntry(e, key, from, to) {
  const strArr = (arr) => {
    const i = arr.indexOf(from);
    if (i < 0) return false;
    if (arr.includes(to)) arr.splice(i, 1); else arr[i] = to;
    return true;
  };
  const objArr = (arr) => {
    let c = false;
    arr.forEach((o) => { if (o.name === from) { o.name = to; c = true; } });
    return c;
  };
  const items = e.other.items;
  const any = (fn) => items.map(fn).some(Boolean);
  switch (key) {
    case 'ibsSymptoms': return objArr(e.ibs.symptoms);
    case 'ibsFoods': return strArr(e.ibs.foods);
    case 'ibsTriggers': return strArr(e.ibs.triggers);
    case 'ibsMeds': return objArr(e.ibs.meds);
    case 'migLocations': return strArr(e.migraine.locations);
    case 'migSymptoms': return strArr(e.migraine.symptoms);
    case 'migTriggers': return strArr(e.migraine.triggers);
    case 'migMeds': return objArr(e.migraine.meds);
    case 'otherConditions': return any((it) => (it.condition === from ? ((it.condition = to), true) : false));
    case 'otherSymptoms': return any((it) => strArr(it.symptoms));
    case 'otherMeds': return any((it) => objArr(it.meds));
    case 'exerciseTypes': return strArr(e.daily.exTypes);
    case 'newCategories': return e.newThings.map((n) => (n.category === from ? ((n.category = to), true) : false)).some(Boolean);
    default: return false;
  }
}

function aboutCard() {
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, 'About')),
    h('div', { class: 'card-body small' },
      h('p', {}, `Days logged: ${S.entryCount}`),
      h('p', {}, `App version ${APP_VERSION}`),
      h('p', { class: 'muted' }, 'No account, no cloud, no tracking. Your entries are stored in this browser on this phone only.')));
}

function dangerCard() {
  return h('section', { class: 'card card-danger' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Erase everything')),
    h('div', { class: 'card-body' },
      h('p', { class: 'small' }, 'Permanently delete all entries, lists and the PIN from this phone. Make a backup first if you might want them later.'),
      h('button', { class: 'btn btn-danger', onclick: eraseFlow }, 'Erase all data')));
}

async function eraseFlow() {
  const typed = await askText('Type ERASE to confirm', '', 'ERASE', 'Erase');
  if (typed !== 'ERASE') { if (typed) toast('Nothing was erased'); return; }
  await db.eraseAll();
  location.reload();
}

/* ---------------- backup / restore ---------------- */

function canShareFiles() {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'test.json', { type: 'application/json' })] }));
  } catch { return false; }
}

async function doBackup(share = false) {
  await flush();
  const data = {
    app: 'health-tracker',
    format: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    lists: S.lists,
    settings: S.settings,
    entries: await db.allEntries(),
  };
  const name = `health-backup-${dateStr()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  try {
    if (share) {
      await navigator.share({ files: [new File([blob], name, { type: 'application/json' })], title: 'Health tracker backup' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user closed the share sheet
    toast('Backup failed: ' + err.message);
    return;
  }
  S.lastBackup = Date.now();
  await db.setMeta('lastBackup', S.lastBackup);
  toast(share ? 'Backup shared' : `Saved ${name} to Downloads`);
  render();
}

async function doRestore(file) {
  if (!file) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    toast('That file isn’t a valid backup');
    return;
  }
  if (!data || data.app !== 'health-tracker' || !Array.isArray(data.entries)) {
    toast('That file isn’t a Health Tracker backup');
    return;
  }
  const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'unknown date';
  const ok = await confirmBox('Restore this backup?',
    `It has ${data.entries.length} ${data.entries.length === 1 ? 'day' : 'days'} of entries, saved ${when}. This REPLACES everything currently in the app. Your PIN setting is kept.`,
    'Replace my data', true);
  if (!ok) return;
  const lists = { ...clone(DEFAULT_LISTS), ...(data.lists || {}) };
  const entries = data.entries.filter((e) => e && typeof e.date === 'string').map((e) => normalizeEntry(e, e.date));
  await db.replaceAll(entries, { lists, settings: { ...S.settings, ...(data.settings || {}) } });
  toast('Backup restored');
  setTimeout(() => location.reload(), 800);
}

/* ---------------- PIN lock ---------------- */

async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pinPad({ title, subtitle = '', onSubmit, autoLen = null, cancellable = false, forgot = false }) {
  return new Promise((resolve) => {
    let val = '';
    let busy = false;
    const dots = h('div', { class: 'pin-dots', 'aria-live': 'polite' });
    const msg = h('div', { class: 'pin-msg' }, subtitle);
    const okBtn = h('button', { class: 'btn btn-primary pin-ok', onclick: () => submit() }, 'OK');
    const ov = h('div', { class: 'pin-overlay' });
    const redraw = () => {
      const n = Math.max(autoLen || 4, val.length);
      dots.replaceChildren(...Array.from({ length: n }, (_, i) => h('span', { class: 'dot' + (i < val.length ? ' on' : '') })));
      okBtn.disabled = val.length < 4;
    };
    const close = (v) => { ov.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    async function submit() {
      if (busy || val.length < 4) return;
      busy = true;
      const r = await onSubmit(val);
      busy = false;
      if (r === true) { close(val); return; }
      msg.textContent = r;
      val = '';
      redraw();
      ov.classList.remove('shake');
      void ov.offsetWidth;
      ov.classList.add('shake');
    }
    const press = (d) => {
      if (busy || val.length >= 8) return;
      val += d;
      redraw();
      if (autoLen && val.length === autoLen) submit();
    };
    const back = () => { val = val.slice(0, -1); redraw(); };
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter') submit();
    };
    document.addEventListener('keydown', onKey);
    const key = (d) => h('button', { class: 'pin-key', onclick: () => press(d) }, d);
    ov.append(h('div', { class: 'pin-box' },
      h('div', { class: 'pin-logo', 'aria-hidden': 'true' }, '♥'),
      h('h2', {}, title),
      msg,
      dots,
      h('div', { class: 'pin-grid' },
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key),
        cancellable ? h('button', { class: 'pin-key pin-text', onclick: () => close(null) }, 'Cancel') : h('span'),
        key('0'),
        h('button', { class: 'pin-key pin-text', 'aria-label': 'Delete', onclick: back }, '⌫')),
      !autoLen && okBtn,
      forgot && h('button', { class: 'link small muted', onclick: forgotPin }, 'Forgot PIN?')));
    redraw();
    document.body.append(ov);
  });
}

async function setNewPin() {
  const first = await pinPad({ title: 'Choose a PIN', subtitle: '4 to 8 digits', cancellable: true, onSubmit: async () => true });
  if (!first) return;
  const second = await pinPad({
    title: 'Enter it again', subtitle: 'To make sure it’s right', cancellable: true,
    onSubmit: async (v) => (v === first ? true : 'Those didn’t match. Try again.'),
  });
  if (!second) return;
  const salt = uid() + uid();
  S.pin = { salt, hash: await hashPin(first, salt), len: first.length };
  await db.setMeta('pin', S.pin);
  toast('PIN lock is on');
  render();
}

function verifyCurrentPin(title) {
  return pinPad({
    title, subtitle: 'Enter your current PIN', cancellable: true, autoLen: S.pin.len,
    onSubmit: async (v) => ((await hashPin(v, S.pin.salt)) === S.pin.hash ? true : 'Wrong PIN, try again'),
  });
}

async function changePin() {
  if (!(await verifyCurrentPin('Change PIN'))) return;
  await setNewPin();
}

async function removePin() {
  if (!(await verifyCurrentPin('Turn off PIN'))) return;
  S.pin = null;
  await db.deleteMeta('pin');
  toast('PIN lock is off');
  render();
}

let wrongCount = 0;
async function lockApp() {
  if (!S.pin || S.locked) return;
  S.locked = true;
  await flush();
  root.hidden = true;
  document.querySelectorAll('.modal-overlay').forEach((m) => m.remove());
  await pinPad({
    title: 'Health Tracker', subtitle: 'Enter your PIN', autoLen: S.pin.len, forgot: true,
    onSubmit: async (v) => {
      if ((await hashPin(v, S.pin.salt)) === S.pin.hash) { wrongCount = 0; return true; }
      wrongCount++;
      if (wrongCount >= 5) {
        await new Promise((r) => setTimeout(r, 10000));
        return 'Too many tries. Try again.';
      }
      return 'Wrong PIN, try again';
    },
  });
  S.locked = false;
  root.hidden = false;
  checkNewDay();
}

async function forgotPin() {
  const ok = await modal({
    title: 'Forgot your PIN?',
    body: h('div', {},
      h('p', {}, 'For your privacy, a forgotten PIN can’t be recovered. You can erase all data on this phone and start fresh, then restore a backup file from Settings.'),
      h('p', {}, h('b', {}, 'Entries since your last backup will be lost.'))),
    actions: [{ label: 'Cancel', value: false }, { label: 'Erase & start over', value: true, kind: 'btn-danger' }],
  });
  if (!ok) return;
  const typed = await askText('Type ERASE to confirm', '', 'ERASE', 'Erase');
  if (typed !== 'ERASE') return;
  await db.eraseAll();
  location.reload();
}

/* ---------------- lifecycle ---------------- */

function checkNewDay() {
  const now = dateStr();
  if (now !== S.today) {
    const wasOnToday = S.date === S.today;
    S.today = now;
    if (wasOnToday && S.view === 'checkin') goDate(now);
    else render();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    S.hiddenAt = Date.now();
    flush();
  } else {
    if (S.pin && S.hiddenAt && Date.now() - S.hiddenAt >= S.settings.lockAfter * 1000) lockApp();
    else checkNewDay();
  }
});
window.addEventListener('pagehide', () => flush());

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    S.updateReady = true;
    render();
  });
}

async function init() {
  S.today = dateStr();
  const [lists, settings, pin, lastBackup, count] = await Promise.all([
    db.getMeta('lists'), db.getMeta('settings'), db.getMeta('pin'), db.getMeta('lastBackup'), db.countEntries(),
  ]);
  S.lists = { ...clone(DEFAULT_LISTS), ...(lists || {}) };
  if (!lists) await saveLists();
  S.settings = { ...S.settings, ...(settings || {}) };
  S.pin = pin || null;
  S.lastBackup = lastBackup || null;
  S.entryCount = count || 0;
  if (S.pin) {
    root.hidden = true;
    lockApp();
  }
  await goDate(S.today);
  registerSW();
}

init().catch((err) => {
  root.replaceChildren(h('div', { class: 'page' }, h('div', { class: 'card' },
    h('h2', {}, 'Something went wrong'),
    h('p', {}, String(err && err.message ? err.message : err)),
    h('p', { class: 'small' }, 'Try closing and reopening the app.'))));
});

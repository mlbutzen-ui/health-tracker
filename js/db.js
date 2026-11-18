// Tiny wrapper around IndexedDB, the browser's built-in on-device database.
// Nothing here ever leaves the phone.

const DB_NAME = 'health-tracker';
const DB_VERSION = 1;
let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run(storeName, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    let result;
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export const getEntry = (date) => run('entries', 'readonly', (s) => s.get(date));
export const putEntry = (entry) => run('entries', 'readwrite', (s) => s.put(entry));
export const allEntries = () => run('entries', 'readonly', (s) => s.getAll());
export const countEntries = () => run('entries', 'readonly', (s) => s.count());
export const getMeta = (key) => run('meta', 'readonly', (s) => s.get(key));
export const setMeta = (key, value) => run('meta', 'readwrite', (s) => s.put(value, key));
export const deleteMeta = (key) => run('meta', 'readwrite', (s) => s.delete(key));

export async function putEntries(entries) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const s = tx.objectStore('entries');
    entries.forEach((e) => s.put(e));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Replace all entries (used by Restore). Meta values in `meta` are overwritten; others are kept.
export async function replaceAll(entries, meta) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['entries', 'meta'], 'readwrite');
    const es = tx.objectStore('entries');
    es.clear();
    entries.forEach((e) => es.put(e));
    const ms = tx.objectStore('meta');
    for (const [k, v] of Object.entries(meta)) ms.put(v, k);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function eraseAll() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['entries', 'meta'], 'readwrite');
    tx.objectStore('entries').clear();
    tx.objectStore('meta').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

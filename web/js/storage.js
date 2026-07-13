/**
 * storage.js – IndexedDB abstraction with localStorage fallback.
 * Manages three object stores: contacts, messages, settings.
 */

const DB_NAME = 'ChatSimulatorDB';
const DB_VERSION = 1;

let db = null;

// ─── Open / Initialise Database ───────────────────────────────────────────────

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = e.target.result;

      if (!database.objectStoreNames.contains('contacts')) {
        const contactStore = database.createObjectStore('contacts', { keyPath: 'id' });
        contactStore.createIndex('name', 'name', { unique: false });
      }

      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('contactId', 'contactId', { unique: false });
      }

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

// ─── Generic CRUD Helpers ─────────────────────────────────────────────────────

export function dbGet(storeName, key) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbGetAll(storeName) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbGetByIndex(storeName, indexName, value) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readonly');
      const index = tx.objectStore(storeName).index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbPut(storeName, record) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbDelete(storeName, key) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbClear(storeName) {
  return openDB().then(database =>
    new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })
  );
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export async function getSetting(key, defaultValue = null) {
  const record = await dbGet('settings', key);
  return record ? record.value : defaultValue;
}

export async function setSetting(key, value) {
  return dbPut('settings', { key, value });
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export async function exportAllData() {
  const [contacts, messages, settings] = await Promise.all([
    dbGetAll('contacts'),
    dbGetAll('messages'),
    dbGetAll('settings'),
  ]);
  return { contacts, messages, settings, exportedAt: new Date().toISOString() };
}

export async function importAllData(data) {
  const stores = ['contacts', 'messages', 'settings'];
  for (const store of stores) {
    await dbClear(store);
    if (data[store]) {
      for (const record of data[store]) {
        await dbPut(store, record);
      }
    }
  }
}

export async function clearAllData() {
  await Promise.all(['contacts', 'messages'].map(s => dbClear(s)));
}

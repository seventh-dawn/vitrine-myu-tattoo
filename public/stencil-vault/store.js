// IndexedDB: cached index, packed (offline) files and preview images.
const DB_NAME = 'stencil-vault';

let dbp;
function open() {
  dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      for (const s of ['kv', 'files', 'previews']) {
        if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s);
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const get = k => tx('kv', 'readonly', s => s.get(k));
export const set = (k, v) => tx('kv', 'readwrite', s => s.put(v, k));

export const getBlob = id => tx('files', 'readonly', s => s.get(id));
export const putBlob = (id, b) => tx('files', 'readwrite', s => s.put(b, id));
export const delBlob = id => tx('files', 'readwrite', s => s.delete(id));
export const hasBlob = id => tx('files', 'readonly', s => s.count(id)).then(n => n > 0);
export const clearBlobs = () => tx('files', 'readwrite', s => s.clear());

export const getPreview = id => tx('previews', 'readonly', s => s.get(id));
export const putPreview = (id, b) => tx('previews', 'readwrite', s => s.put(b, id));
export const delPreview = id => tx('previews', 'readwrite', s => s.delete(id));

export async function wipe() {
  await Promise.all(['kv', 'files', 'previews'].map(n => tx(n, 'readwrite', s => s.clear())));
}

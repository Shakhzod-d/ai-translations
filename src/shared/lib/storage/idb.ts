/**
 * Minimal promise wrapper around IndexedDB. Used instead of localStorage for
 * documents: it holds hundreds of MB (vs ~5 MB) and stores binary files natively.
 */
const DB_NAME = 'lingua-reader';
const DB_VERSION = 1;
export const STORES = ['articles', 'files', 'vocabulary', 'aiCache'] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () =>
  (dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  }));

const run = async <T>(
  store: StoreName,
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = op(db.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const idb = {
  get: <T>(store: StoreName, key: string) =>
    run<T | undefined>(store, 'readonly', (s) => s.get(key)),
  getAll: <T>(store: StoreName) => run<T[]>(store, 'readonly', (s) => s.getAll()),
  set: (store: StoreName, key: string, value: unknown) =>
    run(store, 'readwrite', (s) => s.put(value, key)).then(() => undefined),
  delete: (store: StoreName, key: string) =>
    run(store, 'readwrite', (s) => s.delete(key)).then(() => undefined),
};

/** Ask the browser not to evict our data under storage pressure (best effort). */
export const requestPersistentStorage = () => navigator.storage?.persist?.().catch(() => false);

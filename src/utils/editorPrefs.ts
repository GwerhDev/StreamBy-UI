const DB_NAME    = 'streamby';
const STORE_NAME = 'editor-prefs';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'userId' });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

export interface EditorPrefs {
  wordWrap?: boolean;
}

export async function loadEditorPrefs(userId: string): Promise<EditorPrefs> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(userId);
      req.onsuccess = () => resolve((req.result?.prefs as EditorPrefs) ?? {});
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export async function saveEditorPrefs(userId: string, prefs: EditorPrefs): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({ userId, prefs });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* silently fail */ }
}

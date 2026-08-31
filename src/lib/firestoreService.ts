import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  writeBatch,
  query, 
  orderBy, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, UserPreferences } from '../types';

/**
 * Strips all undefined values recursively to ensure Firestore zero-crash payload hygiene.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as unknown as T;
  }
  return obj;
}

/**
 * Saves or updates a journal entry isolated strictly to /users/{userId}/entries/{entryId}.
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to persist journal entry.');
  }
  if (!entry.id) {
    throw new Error('Entry ID is required.');
  }

  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const cleanData = sanitizePayload({
    ...entry,
    userId,
    updatedAt: Date.now()
  });

  await setDoc(entryRef, cleanData, { merge: true });
}

/**
 * Imports multiple journal entries into Firestore in chunked batches.
 * Non-destructive: adds to existing entries.
 */
export async function importJournalEntriesBatch(
  userId: string,
  entries: JournalEntry[]
): Promise<{ importedCount: number }> {
  if (!userId) {
    throw new Error('User ID is required to import entries.');
  }
  if (!entries || entries.length === 0) {
    return { importedCount: 0 };
  }

  const CHUNK_SIZE = 400; // Firestore limit is 500 per batch
  let importedCount = 0;

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const entry of chunk) {
      if (!entry.id) continue;
      const entryRef = doc(db, 'users', userId, 'entries', entry.id);
      const cleanData = sanitizePayload({
        ...entry,
        userId,
        updatedAt: entry.updatedAt || Date.now(),
      });
      batch.set(entryRef, cleanData, { merge: true });
      importedCount++;
    }

    await batch.commit();
  }

  return { importedCount };
}


/**
 * Soft deletes a journal entry by stamping deletedAt.
 */
export async function softDeleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('User ID and Entry ID are required to delete.');
  }
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const now = Date.now();
  await setDoc(entryRef, { deletedAt: now, updatedAt: now }, { merge: true });
}

/**
 * Restores a soft-deleted journal entry.
 */
export async function restoreJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('User ID and Entry ID are required to restore.');
  }
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const now = Date.now();
  await setDoc(entryRef, { deletedAt: null, updatedAt: now }, { merge: true });
}

/**
 * Permanently hard deletes a journal entry from /users/{userId}/entries/{entryId}.
 */
export async function hardDeleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('User ID and Entry ID are required to delete.');
  }
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Default delete entry action (uses soft delete with undo capability).
 */
export const deleteJournalEntry = softDeleteJournalEntry;

/**
 * Fetches a single journal entry.
 */
export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const snapshot = await getDoc(entryRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as JournalEntry;
}

/**
 * Subscribes to the user's isolated journal collection in real-time.
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const entriesCol = collection(db, 'users', userId, 'entries');
  const q = query(entriesCol, orderBy('updatedAt', 'desc'));

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        // Check if soft-deleted
        if (data.deletedAt) {
          // If deleted more than 30 days ago, purge permanently from Firestore
          if (now - data.deletedAt > THIRTY_DAYS_MS) {
            deleteDoc(doc(db, 'users', userId, 'entries', docSnap.id)).catch((err) => {
              console.warn('Background auto-purge of expired deleted entry failed:', err);
            });
          }
          // Do not include soft-deleted entry in active list
          return;
        }
        entries.push(data);
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves user settings and preferences to /users/{userId}/settings/preferences.
 */
export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save preferences.');
  }

  const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
  const cleanData = sanitizePayload({
    ...preferences,
    updatedAt: Date.now()
  });

  await setDoc(prefRef, cleanData, { merge: true });
}

/**
 * Loads user settings and preferences from /users/{userId}/settings/preferences.
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) return null;
  try {
    const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
    const snapshot = await getDoc(prefRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as UserPreferences;
  } catch (err) {
    console.error('Failed to load user preferences:', err);
    return null;
  }
}

/**
 * Permanently deletes all data associated with a user:
 * - All entries in /users/{userId}/entries (active, soft-deleted, drafts)
 * - All settings in /users/{userId}/settings
 * - The root user doc /users/{userId} if it exists
 * - Clears all local storage keys
 */
export async function purgeAllUserData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to delete user data.');
  }

  // 1. Fetch and delete all entries
  const entriesCol = collection(db, 'users', userId, 'entries');
  const entriesSnapshot = await getDocs(entriesCol);
  
  const batch = writeBatch(db);
  entriesSnapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  // 2. Fetch and delete all settings docs
  const settingsCol = collection(db, 'users', userId, 'settings');
  const settingsSnapshot = await getDocs(settingsCol);
  settingsSnapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  // 3. Delete root user doc
  const userDocRef = doc(db, 'users', userId);
  batch.delete(userDocRef);

  // Commit batch delete
  await batch.commit();

  // 4. Clean up all local storage associated with inkwell
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove = [
        'inkwell_pref_theme',
        'inkwell_pref_theme_mode',
        'inkwell_pref_font_size',
        'inkwell_pref_language',
        'inkwell_prelogin_language_selected',
        'inkwell_lock_settings',
        'inkwell_last_activity',
        'inkwell_is_locked',
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Could not clear localStorage keys:', e);
    }
  }
}



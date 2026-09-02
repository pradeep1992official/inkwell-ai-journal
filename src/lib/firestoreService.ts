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
import { db, auth } from './firebase';
import { JournalEntry, UserPreferences, PreferenceFetchResult } from '../types';

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
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let isUnsubscribed = false;
  let activeUnsub: Unsubscribe | null = null;
  let retryTimeout: NodeJS.Timeout | null = null;

  const startListening = () => {
    if (isUnsubscribed) return;

    activeUnsub = onSnapshot(
      entriesCol,
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          if (!raw) return;
          
          const data: JournalEntry = {
            messages: [],
            title: 'Untitled Reflection',
            metadata: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...raw,
            id: raw.id || docSnap.id,
            userId: raw.userId || userId,
          };

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

        // Sort client-side reliably by updatedAt, createdAt timestamp descending
        entries.sort((a, b) => {
          const timeA = a.updatedAt || a.createdAt || 0;
          const timeB = b.updatedAt || b.createdAt || 0;
          return timeB - timeA;
        });

        onUpdate(entries);
      },
      (err) => {
        console.warn('[Inkwell Firestore] Subscription warning, attempting reconnect:', err?.message || err);
        if (onError) onError(err);
        
        // Auto-retry listener if connection was transient or token was refreshing
        if (!isUnsubscribed) {
          retryTimeout = setTimeout(() => {
            if (!isUnsubscribed) {
              startListening();
            }
          }, 2000);
        }
      }
    );
  };

  startListening();

  return () => {
    isUnsubscribed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (activeUnsub) activeUnsub();
  };
}

/**
 * Saves user settings and preferences to /users/{userId}/settings/preferences.
 */
export async function saveUserPreferences(
  userId: string, 
  preferences: UserPreferences
): Promise<{ success: boolean; offlineQueued?: boolean }> {
  if (!userId) {
    throw new Error('User ID is required to save preferences.');
  }

  const docPath = `users/${userId}/settings/preferences`;
  const cleanData = sanitizePayload({
    ...preferences,
    updatedAt: Date.now()
  });

  try {
    const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(prefRef, cleanData, { merge: true });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Inkwell Preferences] 💾 Saved preferences to Firestore | Path: ${docPath} | UID: ${userId}`);
    }
    return { success: true };
  } catch (err: any) {
    const errCode = err?.code || 'unknown';
    const errMsg = String(err?.message || err);

    if (errCode === 'permission-denied') {
      console.error(`[Inkwell Preferences] ⛔ Permission Denied when saving preferences to ${docPath} | UID: ${auth.currentUser?.uid || userId}`);
      throw err;
    }

    if (
      errCode === 'unavailable' ||
      errMsg.includes('offline') ||
      errMsg.includes('the client is offline') ||
      errMsg.includes('network-request-failed')
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Inkwell Preferences] 📡 Network offline during save. Will queue locally for sync. Path: ${docPath}`);
      }
      return { success: false, offlineQueued: true };
    }

    console.error(`[Inkwell Preferences] ⚠️ Failed to save preferences to ${docPath}:`, err);
    throw err;
  }
}

/**
 * Loads user settings and preferences from /users/{userId}/settings/preferences.
 * Distinguishes precisely between:
 * - 'success': retrieved from server or local Firestore IndexedDB cache
 * - 'not_found': user document does not exist yet (brand new user)
 * - 'unauthenticated': UID is missing or not signed in
 * - 'permission_denied': Firebase security rule violation
 * - 'offline': Firestore client is offline / unavailable
 * - 'error': other unexpected Firestore exceptions
 */
export async function getUserPreferences(userId: string): Promise<PreferenceFetchResult> {
  if (!userId) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Inkwell Preferences] ⚠️ getUserPreferences called with missing or empty userId (Unauthenticated)');
    }
    return {
      status: 'unauthenticated',
      data: null,
      errorMessage: 'User ID is missing or not authenticated',
    };
  }

  const docPath = `users/${userId}/settings/preferences`;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Inkwell Preferences] 🔍 Fetching preferences | Path: ${docPath} | Auth UID: ${auth.currentUser?.uid || 'none'}`);
  }

  try {
    const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
    const snapshot = await getDoc(prefRef);

    if (!snapshot.exists()) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Inkwell Preferences] ℹ️ Preferences document does not exist (New User) | Path: ${docPath}`);
      }
      return {
        status: 'not_found',
        data: null,
      };
    }

    const data = snapshot.data() as UserPreferences;
    const isFromCache = snapshot.metadata?.fromCache ?? false;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Inkwell Preferences] ✅ Loaded preferences from ${isFromCache ? 'Firestore cache' : 'server'} | Path: ${docPath}`);
    }

    return {
      status: 'success',
      data,
      fromCache: isFromCache,
    };
  } catch (err: any) {
    const errCode = err?.code || 'unknown';
    const errMsg = String(err?.message || err);

    if (errCode === 'permission-denied') {
      console.error(`[Inkwell Preferences] ⛔ Permission Denied on path: ${docPath} | UID: ${auth.currentUser?.uid || userId} | Code: ${errCode}`);
      return {
        status: 'permission_denied',
        data: null,
        errorCode: errCode,
        errorMessage: errMsg,
      };
    }

    if (
      errCode === 'unavailable' ||
      errMsg.includes('offline') ||
      errMsg.includes('the client is offline') ||
      errMsg.includes('network-request-failed')
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Inkwell Preferences] 📡 Firestore is offline/unavailable. Using local storage fallback. Path: ${docPath} | Code: ${errCode}`);
      }
      return {
        status: 'offline',
        data: null,
        errorCode: errCode,
        errorMessage: errMsg,
      };
    }

    console.warn(`[Inkwell Preferences] ⚠️ Error loading preferences from Firestore | Path: ${docPath} | Code: ${errCode} | Error: ${errMsg}`);
    return {
      status: 'error',
      data: null,
      errorCode: errCode,
      errorMessage: errMsg,
    };
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



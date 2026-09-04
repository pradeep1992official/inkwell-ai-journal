import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, UserPreferences } from '../types';
import { saveJournalEntry, saveUserPreferences, sanitizePayload } from './firestoreService';

const SAMPLE_STORAGE_PREFIX = 'inkwell_sample_seeded_';

/**
 * Constructs the canonical sample reflection for a new user.
 * Natural first-person tone, showcases key features (mood, tags, AI reflection response).
 */
export function createSampleJournalEntry(userId: string): JournalEntry {
  const now = Date.now();
  return {
    id: `sample-welcome-${userId}`,
    userId,
    title: 'Welcome to Inkwell — this is a sample reflection',
    summary: 'An introductory reflection showing how Inkwell’s private space, mood tagging, and AI conversational reflections work.',
    isSample: true,
    messages: [
      {
        id: `msg-user-sample-${now}`,
        role: 'user',
        content: "Taking a moment to try out Inkwell today. It feels nice to have a quiet, private space to gather my thoughts without any rush or pressure. I can see how this works now — I can write freely, choose how I'm feeling with the mood picker, add a couple of tags to organize things, and reflect whenever I'm ready. It feels like a space where I can genuinely build a daily habit.",
        timestamp: now - 60000,
        mode: 'reflect',
      },
      {
        id: `msg-model-sample-${now}`,
        role: 'model',
        content: "Welcome to your personal reflection space! Journaling is at its most rewarding when it feels effortless and entirely your own. Taking even a brief two-minute pause to unpack what’s on your mind can bring unexpected clarity, perspective, and calm.\n\nOnce you're ready, explore **Insights** (✨) at the top for an emotional breakdown and key takeaways, try **Read Aloud** (🔊) to hear your reflection read back to you, or open **Settings** from your profile to choose a theme and language that feels like home. Whenever you'd like to begin your first real entry, simply tap **+ New Reflection** above.",
        timestamp: now,
        mode: 'reflect',
        modelUsed: 'gemini-2.5-flash',
      },
    ],
    metadata: {
      mood: 'Reflective',
      tags: ['welcome', 'getting started'],
      isSample: true,
      hasCustomTitle: true,
      wordCount: 78,
      sentimentScore: 0.85,
      weather: {
        condition: 'Clear',
        conditionEmoji: '☀️',
        temperature: 24,
        humidity: 55,
        weatherCode: 0,
        capturedAt: now - 60000,
        isBackfilled: false,
      },
    },
    createdAt: now - 60000,
    updatedAt: now,
    deletedAt: null,
  };
}

// In-memory guard to prevent duplicate concurrent runs
const activeSeedingTasks = new Set<string>();

/**
 * Checks if a sample entry should be seeded for this user on sign-in.
 * 
 * Rules:
 * 1. If user has 1 or more active (non-deleted) journal entries in Firestore, they already have reflections:
 *    DO NOT seed.
 * 2. If user has 0 active entries in their journal vault (whether brand new user, or a user who deleted
 *    their entries/account and re-signed in):
 *    SEED the canonical sample reflection cleanly so they have a guided starting point.
 * 3. Does not auto-re-seed during an active session when an entry is deleted — only on sign-in / session init.
 */
export async function checkAndSeedSampleEntry(
  userId: string,
  cloudPrefs?: UserPreferences | null
): Promise<{ seeded: boolean; sampleEntry?: JournalEntry }> {
  if (!userId) return { seeded: false };

  // Prevent concurrent seeding runs for the same user
  if (activeSeedingTasks.has(userId)) {
    return { seeded: false };
  }
  activeSeedingTasks.add(userId);

  try {
    // Check if user currently has active, non-deleted entries in Firestore
    const entriesRef = collection(db, 'users', userId, 'entries');
    const snapshot = await getDocs(entriesRef);
    const existingEntries = snapshot.docs.map(docSnap => docSnap.data() as JournalEntry);
    const activeExisting = existingEntries.filter(e => !e.deletedAt && (e.isSample || (e.messages && e.messages.length > 0)));

    if (activeExisting.length > 0) {
      // User has existing active reflections - do not seed sample
      try {
        localStorage.setItem(`${SAMPLE_STORAGE_PREFIX}${userId}`, 'true');
      } catch {}
      saveUserPreferences(userId, {
        ...(cloudPrefs || {
          theme: 'light',
          fontSize: 'medium',
          language: 'en',
        }),
        hasSeededSampleEntry: true,
      }).catch((err) => console.warn('[Inkwell Sample] Could not mark seeded flag:', err));

      return { seeded: false };
    }

    // Vault is empty with 0 active reflections (brand new user, or user deleted and re-signed in)!
    // Cleanly provision the canonical sample reflection.
    const sample = createSampleJournalEntry(userId);
    const entryRef = doc(db, 'users', userId, 'entries', sample.id);
    const cleanData = sanitizePayload({
      ...sample,
      userId,
      deletedAt: null,
      updatedAt: Date.now(),
    });

    // Write completely to overwrite/clear any prior soft-deleted document at this path
    await setDoc(entryRef, cleanData);

    // Reset dismissed card state so companion card is visible on new session
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`inkwell_dismissed_sample_${sample.id}`);
        localStorage.setItem(`${SAMPLE_STORAGE_PREFIX}${userId}`, 'true');
      } catch {}
    }

    await saveUserPreferences(userId, {
      ...(cloudPrefs || {
        theme: 'light',
        fontSize: 'medium',
        language: 'en',
      }),
      hasSeededSampleEntry: true,
      sampleEntrySeededAt: Date.now(),
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Inkwell Sample] 🌱 Seeded sample reflection for user: ${userId} (empty vault)`);
    }

    return { seeded: true, sampleEntry: sample };
  } catch (err) {
    console.error('[Inkwell Sample] Error during sample entry check/seed:', err);
    return { seeded: false };
  } finally {
    activeSeedingTasks.delete(userId);
  }
}

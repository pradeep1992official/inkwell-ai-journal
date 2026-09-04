import { JournalEntry, AskMyLifeResult, MemoryCitation } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { sanitizePayload } from './firestoreService';

/**
 * Extracts clean searchable semantic text from a journal entry.
 * Prioritizes user reflections, emotions, mood, tags, and locations.
 */
export function extractEntrySearchableText(entry: JournalEntry): string {
  if (!entry) return '';

  const parts: string[] = [];

  // 1. Date & Time context (critical for temporal and date-based memory queries)
  const timestamp = entry.createdAt || entry.updatedAt || Date.now();
  const entryDate = new Date(timestamp);
  if (!isNaN(entryDate.getTime())) {
    const fullDate = entryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }); // e.g. "Thursday, September 3, 2026"
    const shortDate = entryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }); // e.g. "Sep 3, 2026"
    const monthDay = entryDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    }); // e.g. "September 3"
    const day = entryDate.getDate();
    const daySuffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const ordinalDate = `${entryDate.toLocaleDateString('en-US', { month: 'long' })} ${day}${daySuffix}`; // e.g. "September 3rd"
    const isoDate = entryDate.toISOString().slice(0, 10); // e.g. "2026-09-03"

    parts.push(`Date: ${fullDate} (${shortDate}, ${monthDay}, ${ordinalDate}, ${isoDate})`);
  }

  if (entry.title && entry.title !== 'New Reflection' && entry.title !== 'Untitled Reflection') {
    parts.push(`Title: ${entry.title}`);
  }

  if (entry.metadata?.mood) {
    parts.push(`Mood: ${entry.metadata.mood}`);
  }

  if (Array.isArray(entry.metadata?.tags) && entry.metadata.tags.length > 0) {
    parts.push(`Tags: ${entry.metadata.tags.join(', ')}`);
  }

  if (entry.metadata?.placeLocation?.name) {
    parts.push(`Location: ${entry.metadata.placeLocation.name}${entry.metadata.placeLocation.locality ? ` (${entry.metadata.placeLocation.locality})` : ''}`);
  }

  if (entry.metadata?.weather) {
    parts.push(`Weather: ${entry.metadata.weather.conditionEmoji || ''} ${entry.metadata.weather.condition || ''} (${entry.metadata.weather.temperature}°C)`);
  }

  if (entry.summary) {
    parts.push(`Summary: ${entry.summary}`);
  }

  // Extract user messages as primary signal
  const userTexts = (entry.messages || [])
    .filter((m) => m && m.role === 'user' && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => m.content.trim());

  if (userTexts.length > 0) {
    parts.push(`Reflections:\n${userTexts.join('\n\n')}`);
  } else {
    // If no user messages, include any messages
    const anyTexts = (entry.messages || [])
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => m.content.trim());
    if (anyTexts.length > 0) {
      parts.push(`Content:\n${anyTexts.join('\n\n')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Generates an embedding vector for a single journal entry via backend Gemini proxy.
 */
export async function generateEntryEmbedding(entry: JournalEntry): Promise<{ embedding: number[]; modelUsed?: string } | null> {
  const text = extractEntrySearchableText(entry);
  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    const res = await fetch('/api/gemini/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        outputDimensionality: 768,
      }),
    });

    if (!res.ok) {
      throw new Error(`Embedding generation error: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data.embedding) && data.embedding.length > 0) {
      return {
        embedding: data.embedding,
        modelUsed: data.modelUsed,
      };
    }
    return null;
  } catch (err) {
    console.warn('[Semantic Search] Single embedding generation note:', err);
    return null;
  }
}

/**
 * Submits a natural-language query to "Ask My Life" semantic memory search.
 */
export async function askMyLife(
  query: string,
  userId: string,
  entries: JournalEntry[],
  options?: { language?: string; userName?: string }
): Promise<AskMyLifeResult> {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) {
    throw new Error('Query is required.');
  }
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const res = await fetch('/api/gemini/ask-my-life', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: cleanQuery,
      userId,
      entries,
      language: options?.language || 'en',
      userName: options?.userName || '',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Ask My Life query failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Backfills missing embeddings for existing user entries in Firestore.
 * Processes entries in chunked batches and saves updated embeddings to Firestore.
 */
export async function backfillMissingEmbeddings(
  userId: string,
  entries: JournalEntry[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ updatedCount: number; errorCount: number }> {
  if (!userId) {
    throw new Error('User ID is required to backfill embeddings.');
  }

  // Find non-deleted entries without embeddings or with empty embeddings
  const unindexed = entries.filter((e) => {
    if (e.deletedAt) return false;
    const text = extractEntrySearchableText(e);
    if (!text || text.trim().length === 0) return false;
    return !Array.isArray(e.embedding) || e.embedding.length === 0;
  });

  if (unindexed.length === 0) {
    if (onProgress) onProgress(0, 0);
    return { updatedCount: 0, errorCount: 0 };
  }

  const total = unindexed.length;
  let completed = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const BATCH_SIZE = 15;
  for (let i = 0; i < unindexed.length; i += BATCH_SIZE) {
    const chunk = unindexed.slice(i, i + BATCH_SIZE);
    const items = chunk.map((e) => ({
      id: e.id,
      text: extractEntrySearchableText(e),
    }));

    try {
      const res = await fetch('/api/gemini/batch-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          outputDimensionality: 768,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];

        for (const resItem of results) {
          if (resItem.id && Array.isArray(resItem.embedding) && resItem.embedding.length > 0) {
            try {
              const entryRef = doc(db, 'users', userId, 'entries', resItem.id);
              await setDoc(
                entryRef,
                sanitizePayload({
                  embedding: resItem.embedding,
                  embeddingUpdatedAt: Date.now(),
                  embeddingModel: resItem.modelUsed || 'gemini-embedding-001',
                }),
                { merge: true }
              );
              updatedCount++;
            } catch (saveErr) {
              console.warn(`Failed to write backfilled embedding for ${resItem.id}:`, saveErr);
              errorCount++;
            }
          }
          completed++;
          if (onProgress) onProgress(completed, total);
        }
      } else {
        errorCount += chunk.length;
        completed += chunk.length;
        if (onProgress) onProgress(completed, total);
      }
    } catch (batchErr) {
      console.warn('Batch embedding request failed:', batchErr);
      errorCount += chunk.length;
      completed += chunk.length;
      if (onProgress) onProgress(completed, total);
    }
  }

  return { updatedCount, errorCount };
}

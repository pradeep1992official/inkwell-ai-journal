import { JournalEntry, JournalMessage, MessageRole, ReflectionMode } from '../types';
import { sanitizePayload } from './firestoreService';

export interface DuplicateMatch {
  entry: JournalEntry;
  reason: 'same_id' | 'same_content_and_time' | 'same_title_and_messages';
  matchedWithTitle: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errorMessage?: string;
  totalFound: number;
  newEntries: JournalEntry[];
  duplicates: DuplicateMatch[];
  dateRange?: {
    earliest: number;
    latest: number;
  };
}

/**
 * Generates a unique, collision-resistant random ID.
 */
function generateId(): string {
  return 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

function generateMessageId(): string {
  return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Normalizes and extracts message content for duplicate comparison.
 */
function getComparableMessageSignature(messages: JournalMessage[]): string {
  if (!messages || messages.length === 0) return '';
  return messages
    .map((m) => `${m.role}:${(m.content || '').trim().toLowerCase()}`)
    .join('||');
}

/**
 * Validates a single message item from imported JSON.
 */
function parseMessage(rawMsg: any, fallbackTimestamp: number): JournalMessage | null {
  if (!rawMsg || typeof rawMsg !== 'object') return null;

  const content = typeof rawMsg.content === 'string' ? rawMsg.content.trim() : '';
  if (!content) return null;

  let role: MessageRole = 'user';
  if (rawMsg.role === 'model' || rawMsg.role === 'assistant' || rawMsg.role === 'ai') {
    role = 'model';
  } else if (rawMsg.role === 'system') {
    role = 'system';
  }

  let timestamp = typeof rawMsg.timestamp === 'number' && !isNaN(rawMsg.timestamp) && rawMsg.timestamp > 0
    ? rawMsg.timestamp
    : (typeof rawMsg.timestamp === 'string' && !isNaN(Date.parse(rawMsg.timestamp)) ? Date.parse(rawMsg.timestamp) : fallbackTimestamp);

  const mode: ReflectionMode | undefined = ['reflect', 'summarize', 'brainstorm', 'action_items'].includes(rawMsg.mode)
    ? rawMsg.mode
    : undefined;

  return {
    id: typeof rawMsg.id === 'string' && rawMsg.id.trim().length > 0 ? rawMsg.id.trim() : generateMessageId(),
    role,
    content,
    timestamp,
    ...(mode ? { mode } : {}),
    ...(typeof rawMsg.editedAt === 'number' ? { editedAt: rawMsg.editedAt } : {}),
  };
}

/**
 * Normalizes a raw entry object into a strictly validated JournalEntry.
 */
function normalizeEntry(raw: any, currentUserId: string): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null;

  // Extract or parse createdAt
  let createdAt = Date.now();
  if (typeof raw.createdAt === 'number' && !isNaN(raw.createdAt) && raw.createdAt > 0) {
    createdAt = raw.createdAt;
  } else if (typeof raw.createdAt === 'string' && !isNaN(Date.parse(raw.createdAt))) {
    createdAt = Date.parse(raw.createdAt);
  } else if (typeof raw.timestamp === 'number' && !isNaN(raw.timestamp)) {
    createdAt = raw.timestamp;
  }

  // Extract or parse updatedAt
  let updatedAt = createdAt;
  if (typeof raw.updatedAt === 'number' && !isNaN(raw.updatedAt) && raw.updatedAt > 0) {
    updatedAt = raw.updatedAt;
  } else if (typeof raw.updatedAt === 'string' && !isNaN(Date.parse(raw.updatedAt))) {
    updatedAt = Date.parse(raw.updatedAt);
  }

  // Parse title
  let title = 'Untitled Reflection';
  if (typeof raw.title === 'string' && raw.title.trim().length > 0) {
    title = raw.title.trim().slice(0, 300);
  }

  // Parse messages
  let messages: JournalMessage[] = [];
  if (Array.isArray(raw.messages)) {
    for (const item of raw.messages) {
      const parsed = parseMessage(item, createdAt);
      if (parsed) messages.push(parsed);
    }
  } else if (typeof raw.content === 'string' && raw.content.trim().length > 0) {
    // Fallback: If imported JSON contains a top-level single content/body string
    messages.push({
      id: generateMessageId(),
      role: 'user',
      content: raw.content.trim(),
      timestamp: createdAt,
    });
  } else if (typeof raw.body === 'string' && raw.body.trim().length > 0) {
    messages.push({
      id: generateMessageId(),
      role: 'user',
      content: raw.body.trim(),
      timestamp: createdAt,
    });
  }

  // Require at least 1 message or valid content
  if (messages.length === 0) {
    return null;
  }

  // Parse summary
  const summary = typeof raw.summary === 'string' && raw.summary.trim().length > 0
    ? raw.summary.trim().slice(0, 5000)
    : undefined;

  // Parse metadata
  const rawMeta = typeof raw.metadata === 'object' && raw.metadata !== null ? raw.metadata : {};
  const tags: string[] = Array.isArray(rawMeta.tags)
    ? rawMeta.tags
        .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
        .map((t: string) => t.trim().slice(0, 50))
    : [];

  const mood = typeof rawMeta.mood === 'string' && rawMeta.mood.trim().length > 0
    ? rawMeta.mood.trim().slice(0, 50)
    : undefined;

  const id = typeof raw.id === 'string' && raw.id.trim().length > 0
    ? raw.id.trim()
    : generateId();

  const entry: JournalEntry = {
    id,
    userId: currentUserId,
    title,
    messages,
    metadata: {
      tags,
      ...(mood ? { mood } : {}),
      ...(rawMeta.category ? { category: String(rawMeta.category) } : {}),
    },
    createdAt,
    updatedAt,
    ...(summary ? { summary } : {}),
    ...(typeof raw.editedAt === 'number' ? { editedAt: raw.editedAt } : {}),
  };

  return sanitizePayload(entry);
}

/**
 * Validates and parses an imported JSON file string against current existing user entries.
 */
export function validateAndParseImportJson(
  fileContent: string,
  existingEntries: JournalEntry[],
  currentUserId: string = 'imported_user'
): ImportValidationResult {
  // 1. Check if string is empty
  if (!fileContent || !fileContent.trim()) {
    return {
      isValid: false,
      errorMessage: 'The uploaded file is empty.',
      totalFound: 0,
      newEntries: [],
      duplicates: [],
    };
  }

  // 2. Parse JSON syntax
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(fileContent);
  } catch (err: any) {
    return {
      isValid: false,
      errorMessage: 'Invalid JSON file format. Please ensure the file contains valid JSON syntax exported from Inkwell.',
      totalFound: 0,
      newEntries: [],
      duplicates: [],
    };
  }

  // 3. Extract raw entries array from different valid JSON shapes
  let rawList: any[] = [];

  if (Array.isArray(parsedJson)) {
    // Format: [ { ... }, { ... } ]
    rawList = parsedJson;
  } else if (parsedJson && typeof parsedJson === 'object') {
    if (Array.isArray(parsedJson.entries)) {
      // Format: { vault: "Inkwell Journal", entries: [ ... ] }
      rawList = parsedJson.entries;
    } else if (Array.isArray(parsedJson.reflections)) {
      rawList = parsedJson.reflections;
    } else if (parsedJson.id || parsedJson.messages || parsedJson.title) {
      // Format: Single entry object { id: "...", title: "...", messages: [...] }
      rawList = [parsedJson];
    } else {
      return {
        isValid: false,
        errorMessage: 'Unrecognized backup structure. The JSON file does not contain a valid "entries" list or Inkwell reflection object.',
        totalFound: 0,
        newEntries: [],
        duplicates: [],
      };
    }
  } else {
    return {
      isValid: false,
      errorMessage: 'Invalid data type. Expected a JSON object or array of journal entries.',
      totalFound: 0,
      newEntries: [],
      duplicates: [],
    };
  }

  if (rawList.length === 0) {
    return {
      isValid: false,
      errorMessage: 'The backup file contains zero reflection entries.',
      totalFound: 0,
      newEntries: [],
      duplicates: [],
    };
  }

  // 4. Normalize each entry & reject corrupted records
  const validParsedEntries: JournalEntry[] = [];
  for (const raw of rawList) {
    const norm = normalizeEntry(raw, currentUserId);
    if (norm) {
      validParsedEntries.push(norm);
    }
  }

  if (validParsedEntries.length === 0) {
    return {
      isValid: false,
      errorMessage: 'No valid journal entries could be parsed from this file. Please verify that the file was generated by Inkwell.',
      totalFound: rawList.length,
      newEntries: [],
      duplicates: [],
    };
  }

  // 5. Build lookup sets for existing active entries for duplicate detection
  const existingIdSet = new Set<string>();
  const existingSignatures = new Map<string, JournalEntry>(); // hash -> entry

  for (const existing of existingEntries) {
    if (existing.deletedAt) continue;
    if (existing.id) existingIdSet.add(existing.id);

    const sig = `${existing.createdAt}_${(existing.title || '').trim().toLowerCase()}`;
    existingSignatures.set(sig, existing);

    const fullMsgSig = getComparableMessageSignature(existing.messages);
    if (fullMsgSig) {
      existingSignatures.set(`msg_${fullMsgSig}`, existing);
    }
  }

  const newEntries: JournalEntry[] = [];
  const duplicates: DuplicateMatch[] = [];
  const processedImportIds = new Set<string>();

  for (const entry of validParsedEntries) {
    // Prevent duplicate entries inside the same import file
    if (processedImportIds.has(entry.id)) {
      duplicates.push({
        entry,
        reason: 'same_id',
        matchedWithTitle: entry.title,
      });
      continue;
    }

    // Check duplicate against existing vault
    if (existingIdSet.has(entry.id)) {
      const match = existingEntries.find((e) => e.id === entry.id);
      duplicates.push({
        entry,
        reason: 'same_id',
        matchedWithTitle: match?.title || entry.title,
      });
      processedImportIds.add(entry.id);
      continue;
    }

    // Check timestamp + title match
    const timeTitleKey = `${entry.createdAt}_${(entry.title || '').trim().toLowerCase()}`;
    if (existingSignatures.has(timeTitleKey)) {
      const match = existingSignatures.get(timeTitleKey);
      duplicates.push({
        entry,
        reason: 'same_content_and_time',
        matchedWithTitle: match?.title || entry.title,
      });
      processedImportIds.add(entry.id);
      continue;
    }

    // Check message signature match
    const msgSig = getComparableMessageSignature(entry.messages);
    if (msgSig && existingSignatures.has(`msg_${msgSig}`)) {
      const match = existingSignatures.get(`msg_${msgSig}`);
      duplicates.push({
        entry,
        reason: 'same_title_and_messages',
        matchedWithTitle: match?.title || entry.title,
      });
      processedImportIds.add(entry.id);
      continue;
    }

    // It's a new unique entry!
    newEntries.push(entry);
    processedImportIds.add(entry.id);
  }

  // 6. Calculate date range of new entries
  let earliest = Date.now();
  let latest = 0;

  if (newEntries.length > 0) {
    for (const e of newEntries) {
      if (e.createdAt < earliest) earliest = e.createdAt;
      if (e.createdAt > latest) latest = e.createdAt;
    }
  } else if (validParsedEntries.length > 0) {
    for (const e of validParsedEntries) {
      if (e.createdAt < earliest) earliest = e.createdAt;
      if (e.createdAt > latest) latest = e.createdAt;
    }
  }

  return {
    isValid: true,
    totalFound: validParsedEntries.length,
    newEntries,
    duplicates,
    dateRange: latest > 0 ? { earliest, latest } : undefined,
  };
}

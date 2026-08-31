export type MessageRole = 'user' | 'model' | 'system';

export type AppTheme = 'light' | 'dark' | 'paper' | 'vellum' | 'vivid';
export type AppFontSize = 'small' | 'medium' | 'large';
export type AppLanguage = 'en' | 'es' | 'fr' | 'hi' | 'ta';

export type ThemeMode = 'auto' | 'manual';

export interface LockSettings {
  enabled: boolean;
  pinHash?: string | null;
  autoLockMinutes: number; // 0 = never, 1 = 1m, 5 = 5m, 15 = 15m, 30 = 30m
}

export interface UserPreferences {
  theme: AppTheme;
  themeMode?: ThemeMode;
  fontSize: AppFontSize;
  language: AppLanguage;
  sidebarCollapsed?: boolean;
  lockSettings?: LockSettings;
  longestStreak?: number;
  currentStreak?: number;
  lastStreakDate?: string;
  focusMode?: boolean;
  hasCompletedTour?: boolean;
  tourCompletedAt?: number;
  updatedAt?: number;
}

export interface JournalMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
  editedAt?: number;
  isFallback?: boolean;
  modelUsed?: string;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'action_items';

export interface EntryMetadata {
  mood?: string;
  tags?: string[];
  category?: string;
  location?: string;
  sentimentScore?: number;
  wordCount?: number;
  editedAt?: number;
  [key: string]: unknown; // Extensibility for future modular metadata without schema breakage
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: JournalMessage[];
  metadata: EntryMetadata;
  createdAt: number;
  updatedAt: number;
  editedAt?: number;
  deletedAt?: number | null;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GeminiReflectRequest {
  prompt: string;
  mode?: ReflectionMode;
  history?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  entryTitle?: string;
  metadata?: EntryMetadata;
}

export interface GeminiReflectResponse {
  reply: string;
  modelUsed: string;
  suggestedTitle?: string;
  summary?: string;
  suggestedTags?: string[];
  detectedMood?: string;
  actionItems?: string[];
}

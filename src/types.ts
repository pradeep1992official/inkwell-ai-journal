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
  hasSeededSampleEntry?: boolean;
  sampleEntrySeededAt?: number;
  weatherEnabled?: boolean;
  updatedAt?: number;
}

export type PreferenceFetchStatus =
  | 'success'
  | 'not_found'
  | 'offline'
  | 'permission_denied'
  | 'unauthenticated'
  | 'error';

export interface PreferenceFetchResult {
  status: PreferenceFetchStatus;
  data: UserPreferences | null;
  fromCache?: boolean;
  errorCode?: string;
  errorMessage?: string;
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

export interface LocationMemory {
  placeId: string;
  name: string; // e.g. "Absolute Barbecues"
  formattedAddress: string; // e.g. "102, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004"
  city?: string; // e.g. "Coimbatore"
  locality?: string;
  country?: string;
  lat?: number;
  lng?: number;
  taggedAt?: number;
}

export interface WeatherData {
  condition: string; // e.g. "Rainy", "Clear", "Partly Cloudy"
  conditionEmoji: string; // e.g. "🌧️", "☀️", "⛅"
  temperature: number; // in Celsius (e.g. 27)
  humidity: number; // percentage (e.g. 82)
  weatherCode?: number; // Open-Meteo numeric WMO code
  capturedAt?: number;
  isBackfilled?: boolean;
}

export interface AttachedImage {
  url: string;
  storagePath: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  uploadedAt?: number;
}

export interface EntryMetadata {
  mood?: string;
  tags?: string[];
  category?: string;
  location?: string;
  placeLocation?: LocationMemory | null;
  weather?: WeatherData | null;
  attachedImage?: AttachedImage | null;
  sentimentScore?: number;
  wordCount?: number;
  editedAt?: number;
  isSample?: boolean;
  hasCustomTitle?: boolean;
  [key: string]: unknown; // Extensibility for future modular metadata without schema breakage
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: JournalMessage[];
  metadata: EntryMetadata;
  attachedImage?: AttachedImage | null;
  createdAt: number;
  updatedAt: number;
  editedAt?: number;
  deletedAt?: number | null;
  isSample?: boolean;
  embedding?: number[]; // Vector embedding for Ask My Life semantic similarity search
  embeddingUpdatedAt?: number;
  embeddingModel?: string;
}

export interface MemoryCitation {
  id: string;
  title: string;
  dateFormatted: string;
  timestamp: number;
  similarityScore: number;
  snippet: string;
  mood?: string;
  tags?: string[];
  location?: string;
  summary?: string;
}

export interface AskMyLifeResult {
  answer: string;
  citations: MemoryCitation[];
  modelUsed?: string;
  isFallback?: boolean;
  totalSearched: number;
  queryTimeMs: number;
  status: 'success' | 'no_matches' | 'error';
  suggestedFollowUps?: string[];
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  startTimeFormatted: string; // e.g. "9:00 AM"
  endTimeFormatted?: string;   // e.g. "10:00 AM"
  timeDisplay: string;         // e.g. "9:00 AM — 10:00 AM" or "9:00 AM"
  hangoutLink?: string;
  status?: string;
  htmlLink?: string;
}

export interface DaySynthesisData {
  summary: string;
  fullMarkdown: string;
  dayTheme?: string;
  detectedMood?: string;
  keyHighlights: string[];
  scheduleBreakdown: Array<{
    time: string;
    event: string;
    reflection?: string;
  }>;
  groundingThought: string;
  tomorrowIntention?: string;
  modelUsed: string;
  isFallback?: boolean;
  warning?: string;
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

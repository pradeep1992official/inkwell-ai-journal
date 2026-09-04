export type Language = 'en' | 'es' | 'fr' | 'hi' | 'ta';

export interface TranslationDictionary {
  // Navigation & General
  appName: string;
  appSubtitle: string;
  geminiVersion: string;
  vault: string;
  newReflection: string;
  newShort: string;
  toggleTheme: string;
  settings: string;
  howToUse: string;
  howToUseSubtitle: string;
  signOut: string;
  loadingApp: string;
  dismiss: string;
  readyToReflect: string;
  readyToReflectSub: string;
  startNewReflection: string;

  // Settings Panel
  settingsTitle: string;
  settingsSubtitle: string;
  themeSection: string;
  themeSectionDesc: string;
  themeModeAuto: string;
  themeModeAutoDesc: string;
  fontSizeSection: string;
  fontSizeSectionDesc: string;
  languageSection: string;
  languageSectionDesc: string;
  cloudSyncTitle: string;
  cloudSyncDesc: string;
  close: string;
  savedAutomatically: string;

  // Themes
  themeLight: string;
  themeLightDesc: string;
  themeDark: string;
  themeDarkDesc: string;
  themePaper: string;
  themePaperDesc: string;
  themeVellum: string;
  themeVellumDesc: string;
  themeVivid: string;
  themeVividDesc: string;

  // Font Sizes
  fontSmall: string;
  fontSmallDesc: string;
  fontMedium: string;
  fontMediumDesc: string;
  fontLarge: string;
  fontLargeDesc: string;

  // Sidebar & Search
  journalVault: string;
  searchPlaceholder: string;
  filterByMood: string;
  allMoods: string;
  allReflections: string;
  noEntriesFound: string;
  noEntriesYet: string;
  createFirstEntry: string;
  deleteEntryConfirm: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  cancel: string;
  delete: string;
  entryDeleted: string;
  undo: string;
  entryRestored: string;
  yesterday: string;
  edited: string;

  // Advanced Filtering
  filterBtn: string;
  filters: string;
  filterByDate: string;
  filterByMode: string;
  filterByTags: string;
  filterPresetAll: string;
  filterPresetToday: string;
  filterPresetThisWeek: string;
  filterPresetThisMonth: string;
  dateFrom: string;
  dateTo: string;
  resetFilters: string;
  activeFilters: string;

  // Sidebar Toggle & Focus Mode
  toggleSidebar: string;
  collapseSidebar: string;
  expandSidebar: string;
  focusMode: string;
  exitFocusMode: string;

  // Export
  export: string;
  exportEntry: string;
  exportAll: string;
  exportAsPdf: string;
  exportAsMarkdown: string;
  exportAsPlainText: string;
  exportAsJson: string;

  // Import
  importData: string;
  importDataSubtitle: string;
  importDesc: string;
  importSuccess: string;
  importSuccessDesc: string;
  importMergeNotice: string;
  importDuplicatesSkipped: string;
  importNoNewEntries: string;
  importInvalidFile: string;
  importProcessing: string;
  importConfirmBtn: string;
  importSelectFile: string;
  dragAndDropJson: string;
  browseFile: string;
  entriesToImport: string;
  duplicatesFound: string;
  dateRange: string;
  previewEntries: string;

  // Streak Tracker
  streak: string;
  streakTitle: string;
  currentStreak: string;
  longestStreak: string;
  totalDaysReflected: string;
  streakHeatmapTitle: string;
  streakActiveToday: string;
  streakNeedsEntry: string;

  // App Lock
  appLockTitle: string;
  appLockDesc: string;
  enableAppLock: string;
  setPinCode: string;
  enterPinCode: string;
  confirmPinCode: string;
  changePinCode: string;
  pinMismatch: string;
  autoLockTimeout: string;
  timeout1Min: string;
  timeout5Min: string;
  timeout15Min: string;
  timeout30Min: string;
  timeoutNever: string;
  unlockApp: string;
  appLockedTitle: string;
  appLockedDesc: string;
  incorrectPin: string;
  forgotPin: string;
  forgotPinPrompt: string;
  reauthSuccess: string;

  // Editor & Modes
  modeReflect: string;
  modeSummarize: string;
  modeBrainstorm: string;
  modeActionItems: string;
  modeReflectDesc: string;
  modeSummarizeDesc: string;
  modeBrainstormDesc: string;
  modeActionItemsDesc: string;

  inputPlaceholder: string;
  reflectOnThis: string;
  reflectActionPlaceholder: string;
  continueWritingPlaceholder: string;
  geminiReflecting: string;
  send: string;
  voiceInput: string;
  stopVoiceInput: string;
  listening: string;
  transcribingAudio: string;
  speechNotSupported: string;
  micDisabledAudioPlaying: string;
  readAloud: string;
  stopReadAloud: string;
  readingAloud: string;
  ttsNotSupported: string;
  voiceNotAvailable: string;
  suggestedPrompts: string;
  geminiThinking: string;
  insights: string;
  copyInsights: string;
  copied: string;
  saveStatusSaved: string;
  saveStatusSaving: string;
  saveStatusError: string;
  untitledReflection: string;
  addTag: string;
  enterTagPlaceholder: string;
  deleteEntry: string;
  moodSelect: string;
  editThought: string;
  saveChanges: string;
  saveAndRegenerate: string;
  cancelEdit: string;
  editClarification: string;
  editedMessageLabel: string;

  // Prompts
  promptUnpack: string;
  promptPatterns: string;
  promptBrainstorm: string;
  promptActionSteps: string;

  // Moods
  moodReflective: string;
  moodCalm: string;
  moodOptimistic: string;
  moodInspired: string;
  moodChallenged: string;
  moodGrateful: string;
  moodAnxious: string;
  moodEnergized: string;

  // Insights
  insightsTitle: string;
  executiveSummary: string;
  keyRealizations: string;
  creativeBrainstorming: string;
  emotionalTone: string;
  tagsLabel: string;
  none: string;

  // Mood Trends
  moodTrends: string;
  moodTrendsSubtitle: string;
  viewMoodTrends: string;
  timeRange2Weeks: string;
  timeRange1Month: string;
  timeRange3Months: string;
  timeRangeAllTime: string;
  moodTrajectory: string;
  moodDistribution: string;
  noMoodData: string;
  noMoodDataDesc: string;
  totalMoodEntries: string;
  dominantMood: string;
  moodDiversity: string;
  purelyObservationalNotice: string;

  // Danger Zone & Account Deletion
  dangerZone: string;
  deleteAccount: string;
  deleteAccountDesc: string;
  deleteAccountConfirmTitle: string;
  deleteAccountConfirmDesc: string;
  deleteAccountGoogleNotice: string;
  typeDeleteToConfirm: string;
  deleteInputPlaceholder: string;
  permanentlyDeleteBtn: string;
  deletingAccount: string;
  accountDeletedSuccess: string;
  accountDeletedSuccessDesc: string;
  returnToHome: string;

  // Mental Health Helpline
  needToTalk: string;
  helplineDirectory: string;

  // Landing Page
  landingBadge: string;
  landingHero1: string;
  landingHeroWith: string;
  landingHeroGemini: string;
  landingSubtitle: string;
  signInWithGoogle: string;
  connecting: string;
  landingAuthSub: string;
  feature1Title: string;
  feature1Desc: string;
  feature1Badge: string;
  feature2Title: string;
  feature2Desc: string;
  feature2Badge: string;
  feature3Title: string;
  feature3Desc: string;
  feature3Badge: string;
  feature4Title: string;
  feature4Desc: string;
  feature4Badge: string;
  feature5Title: string;
  feature5Desc: string;
  feature5Badge: string;
  feature6Title: string;
  feature6Desc: string;
  feature6Badge: string;
  footerRights: string;
  footerAuth: string;
  footerProxy: string;

  // Onboarding Tour
  onboardingTourTitle: string;
  onboardingTourStep: string;
  onboardingNext: string;
  onboardingPrev: string;
  onboardingFinish: string;
  onboardingSkip: string;
  onboardingReplay: string;
  onboardingReplaySubtitle: string;
  tourStep1Title: string;
  tourStep1Desc: string;
  tourStep2Title: string;
  tourStep2Desc: string;
  tourStep3Title: string;
  tourStep3Desc: string;
  tourStep4Title: string;
  tourStep4Desc: string;
  tourStep5Title: string;
  tourStep5Desc: string;
  tourStep6Title: string;
  tourStep6Desc: string;

  // Sample Reflection & Welcome Guide
  sample: string;
  sampleReflection: string;
  whatYouCanDo: string;
  sampleEntryTip: string;

  // Guest Mode & Anonymous Auth
  continueAsGuest: string;
  continueAsGuestSubtitle: string;
  guestMode: string;
  guestModeBadge: string;
  guestModeNotice: string;
  guestModeDisclaimer: string;
  guestModeWarning: string;
  linkGoogleAccount: string;
  saveDataPermanently: string;
  linkingAccount: string;
  accountLinkedSuccess: string;
  guestCalendarNotice: string;
  guestCalendarBtn: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: 'Inkwell',
    appSubtitle: 'AI reflection journal & mindful thinking space',
    geminiVersion: 'Powered by Gemini',
    vault: 'Vault',
    newReflection: 'New Reflection',
    newShort: 'New',
    toggleTheme: 'Switch Theme',
    settings: 'Settings',
    howToUse: 'How to Use',
    howToUseSubtitle: 'Complete guide to reflection, privacy & features',
    signOut: 'Sign out securely',
    loadingApp: 'Loading Inkwell...',
    dismiss: 'Dismiss',
    readyToReflect: 'Ready to reflect?',
    readyToReflectSub: 'Create a new reflection entry to begin exploring your thoughts with Gemini and save your personal journey.',
    startNewReflection: 'Start New Reflection',

    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Customize your journaling theme, privacy locks, and reading typography.',
    themeSection: 'Theme Canvas',
    themeSectionDesc: 'Select the color palette and atmosphere that matches your state of mind.',
    themeModeAuto: 'Automatic Dark Theme after 6:00 PM',
    themeModeAutoDesc: 'Automatically switches to dark theme in the evening when on default mode.',
    fontSizeSection: 'Font Size',
    fontSizeSectionDesc: 'Adjust reading and reflection text size across the entire application.',
    languageSection: 'Interface Language',
    languageSectionDesc: 'Choose your preferred language for all interface navigation and labels.',
    cloudSyncTitle: 'User Profile Sync',
    cloudSyncDesc: 'Your preferences are securely synchronized with your private account.',
    close: 'Close',
    savedAutomatically: 'Saved automatically',

    themeLight: 'Light',
    themeLightDesc: 'Clean, neutral light canvas with calm blue accents.',
    themeDark: 'Dark',
    themeDarkDesc: 'Warm ink-toned charcoal with rich amber highlights.',
    themePaper: 'Paper',
    themePaperDesc: 'Cream parchment with terracotta tones and classic notebook warmth.',
    themeVellum: 'Vellum',
    themeVellumDesc: 'Aged sepia and warm burnt-orange for an antique, vintage feel.',
    themeVivid: 'Vivid',
    themeVividDesc: 'High-energy palette with electric violet and vibrant coral accents.',

    fontSmall: 'Small',
    fontSmallDesc: 'Compact density for high-information reading',
    fontMedium: 'Medium',
    fontMediumDesc: 'Balanced default scale for comfortable reflection',
    fontLarge: 'Large',
    fontLargeDesc: 'Spacious, high-legibility scale for relaxed reading',

    journalVault: 'Journal Vault',
    searchPlaceholder: 'Search reflections, tags, or thoughts...',
    filterByMood: 'Filter by mood',
    allMoods: 'All Moods',
    allReflections: 'All Reflections',
    noEntriesFound: 'No reflections match your search or filters.',
    noEntriesYet: 'No entries yet in your vault.',
    createFirstEntry: 'Create your first reflection',
    deleteEntryConfirm: 'Are you sure you want to delete this reflection? You can undo this immediately after deleting.',
    deleteConfirmTitle: 'Delete Reflection?',
    deleteConfirmDesc: 'This reflection will be moved to trash and hidden from your vault. You can undo this immediately.',
    cancel: 'Cancel',
    delete: 'Delete',
    entryDeleted: 'Reflection moved to trash',
    undo: 'Undo',
    entryRestored: 'Reflection restored',
    yesterday: 'Yesterday',
    edited: 'Edited',

    filterBtn: 'Filter',
    filters: 'Filters',
    filterByDate: 'Date Range',
    filterByMode: 'Reflection Mode',
    filterByTags: 'Tags',
    filterPresetAll: 'All Time',
    filterPresetToday: 'Today',
    filterPresetThisWeek: 'This Week',
    filterPresetThisMonth: 'This Month',
    dateFrom: 'From',
    dateTo: 'To',
    resetFilters: 'Reset Filters',
    activeFilters: 'Active Filters',

    toggleSidebar: 'Toggle Vault Sidebar',
    collapseSidebar: 'Collapse Sidebar',
    expandSidebar: 'Open Journal Vault',
    focusMode: 'Focus Mode',
    exitFocusMode: 'Exit Focus Mode (Esc)',

    export: 'Export',
    exportEntry: 'Export Reflection',
    exportAll: 'Export All Vault Entries',
    exportAsPdf: 'Download as PDF Document',
    exportAsMarkdown: 'Download as Markdown (.md)',
    exportAsPlainText: 'Download as Plain Text (.txt)',
    exportAsJson: 'Download Structured Data (.json)',

    // Import
    importData: 'Import Backup Data',
    importDataSubtitle: 'Restore reflections from an Inkwell JSON backup',
    importDesc: 'Select a previously exported Inkwell JSON file to restore into your vault.',
    importSuccess: 'Backup Imported Successfully',
    importSuccessDesc: 'Your reflections have been safely merged into your vault.',
    importMergeNotice: 'Non-destructive Merge: Imported entries will be added to your current vault without overwriting any existing data.',
    importDuplicatesSkipped: 'duplicate entries already in your vault were detected and skipped to prevent clutter.',
    importNoNewEntries: 'All reflections in this backup file already exist in your vault. No new entries were added.',
    importInvalidFile: 'Invalid or unsupported backup file format.',
    importProcessing: 'Analyzing backup file structure...',
    importConfirmBtn: 'Import Reflections',
    importSelectFile: 'Choose JSON File',
    dragAndDropJson: 'Drop your Inkwell JSON backup file here',
    browseFile: 'browse files',
    entriesToImport: 'Reflections to Import',
    duplicatesFound: 'Duplicates Found (Skipped)',
    dateRange: 'Timeline Date Range',
    previewEntries: 'Preview Reflections',

    streak: 'Streak',
    streakTitle: 'Journaling Consistency',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    totalDaysReflected: 'Days Journaled',
    streakHeatmapTitle: 'Activity (Last 6 Weeks)',
    streakActiveToday: 'You have journaled today! Keep it up.',
    streakNeedsEntry: 'Write a reflection today to maintain your streak.',

    appLockTitle: 'App Lock & Security',
    appLockDesc: 'Require a 4-digit PIN to view your journal after inactivity.',
    enableAppLock: 'Enable App Lock (PIN)',
    setPinCode: 'Set 4-Digit PIN',
    enterPinCode: 'Enter 4-Digit PIN',
    confirmPinCode: 'Confirm PIN',
    changePinCode: 'Change PIN',
    pinMismatch: 'PINs do not match. Please try again.',
    autoLockTimeout: 'Auto-Lock Timeout',
    timeout1Min: '1 Minute',
    timeout5Min: '5 Minutes',
    timeout15Min: '15 Minutes',
    timeout30Min: '30 Minutes',
    timeoutNever: 'Never (Manual lock only)',
    unlockApp: 'Unlock Inkwell',
    appLockedTitle: 'Inkwell is Locked',
    appLockedDesc: 'Enter your 4-digit PIN to access your personal journal.',
    incorrectPin: 'Incorrect PIN. Please try again.',
    forgotPin: 'Forgot PIN?',
    forgotPinPrompt: 'Re-authenticate with your Google Account to reset your lock PIN.',
    reauthSuccess: 'Successfully authenticated. You can now set a new PIN.',

    modeReflect: 'Reflect',
    modeSummarize: 'Summarize',
    modeBrainstorm: 'Brainstorm',
    modeActionItems: 'Action Items',
    modeReflectDesc: 'Empathetic inquiry and thoughtful questions',
    modeSummarizeDesc: 'Synthesizes key realizations and emotional trajectory',
    modeBrainstormDesc: 'Explores creative angles, analogies, and alternatives',
    modeActionItemsDesc: 'Extracts clear, prioritized next steps',

    inputPlaceholder: 'Write your thoughts freely, express what is on your mind, or ask Gemini to reflect with you...',
    reflectOnThis: 'Reflect on this',
    reflectActionPlaceholder: 'Write your thoughts freely... write multiple paragraphs, quiet reflections, or raw thoughts without interruption. When ready, invite Gemini to reflect.',
    continueWritingPlaceholder: 'Continue writing your reflection... write as much as you like.',
    geminiReflecting: 'Gemini is reflecting on your entry...',
    send: 'Send',
    voiceInput: 'Voice input',
    stopVoiceInput: 'Stop recording',
    listening: 'Listening to your voice...',
    transcribingAudio: 'Transcribing voice with Gemini...',
    speechNotSupported: 'Microphone recording is not supported in this browser.',
    micDisabledAudioPlaying: 'Microphone is disabled while Read Aloud is playing.',
    readAloud: 'Read aloud',
    stopReadAloud: 'Stop reading',
    readingAloud: 'Reading message aloud...',
    ttsNotSupported: 'Text-to-speech is not supported in this browser.',
    voiceNotAvailable: 'Voice not available for this language on your device.',
    suggestedPrompts: 'Suggested Reflection Prompts',
    geminiThinking: 'Gemini is exploring your reflection...',
    insights: 'Insights',
    copyInsights: 'Copy Insights',
    copied: 'Copied',
    saveStatusSaved: '',
    saveStatusSaving: 'Saving...',
    saveStatusError: 'Save Error',
    untitledReflection: 'Untitled Reflection',
    addTag: 'Add Tag',
    enterTagPlaceholder: 'tag name...',
    deleteEntry: 'Delete Entry',
    moodSelect: 'Select mood',
    editThought: 'Edit thought',
    saveChanges: 'Save Changes',
    saveAndRegenerate: 'Save & Regenerate Gemini Reply',
    cancelEdit: 'Cancel',
    editClarification: 'Editing updates your words without altering Gemini’s existing response.',
    editedMessageLabel: 'edited',

    promptUnpack: 'Help me unpack what happened today and what it taught me.',
    promptPatterns: 'What patterns or blind spots do you notice in what I shared?',
    promptBrainstorm: 'Help me brainstorm 3 fresh perspectives on this dilemma.',
    promptActionSteps: 'Turn my thoughts into 3 clear, actionable next steps.',

    moodReflective: 'Reflective',
    moodCalm: 'Calm',
    moodOptimistic: 'Optimistic',
    moodInspired: 'Inspired',
    moodChallenged: 'Challenged',
    moodGrateful: 'Grateful',
    moodAnxious: 'Anxious',
    moodEnergized: 'Energized',

    insightsTitle: 'Gemini Synthesis & Insights',
    executiveSummary: 'Executive Reflection Summary',
    keyRealizations: 'Key Realizations & Patterns',
    creativeBrainstorming: 'Creative Brainstorming & Forward Ideas',
    emotionalTone: 'Emotional Tone',
    tagsLabel: 'Tags',
    none: 'None',

    moodTrends: 'Mood Trends',
    moodTrendsSubtitle: 'Observational patterns of your tagged moods over time',
    viewMoodTrends: 'View Mood Trends',
    timeRange2Weeks: 'Last 2 Weeks',
    timeRange1Month: 'Last Month',
    timeRange3Months: 'Last 3 Months',
    timeRangeAllTime: 'All Time',
    moodTrajectory: 'Mood Trajectory',
    moodDistribution: 'Mood Frequency & Distribution',
    noMoodData: 'No tagged moods found for this time range.',
    noMoodDataDesc: 'Tag moods (like Calm, Inspired, or Grateful) when creating reflections to observe your patterns here.',
    totalMoodEntries: 'Reflections with Moods',
    dominantMood: 'Most Frequent Mood',
    moodDiversity: 'Unique Moods',
    purelyObservationalNotice: 'This chart is purely observational for your own personal reflection.',

    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account & Data',
    deleteAccountDesc: 'Permanently erase your entire journal vault, reflections, streaks, and settings from cloud storage.',
    deleteAccountConfirmTitle: 'Delete Account & All Inkwell Data?',
    deleteAccountConfirmDesc: 'This action is permanent and completely irreversible. All your reflections, conversation history with Gemini, tagged moods, streak logs, lock configuration, and personalized settings will be erased immediately.',
    deleteAccountGoogleNotice: 'This will only delete your Inkwell data. Your Google account remains completely intact and unaffected.',
    typeDeleteToConfirm: 'To confirm, please type DELETE below:',
    deleteInputPlaceholder: 'Type DELETE',
    permanentlyDeleteBtn: 'Permanently Delete Everything',
    deletingAccount: 'Erasing your data and signing out...',
    accountDeletedSuccess: 'Account & Data Successfully Deleted',
    accountDeletedSuccessDesc: 'All your reflections, personal settings, and vault data have been completely erased from Inkwell. Your Google account was not changed.',
    returnToHome: 'Return to Home',

    needToTalk: 'Need to talk to someone?',
    helplineDirectory: 'Find free, confidential crisis helplines in 130+ countries',

    landingBadge: 'Private & Secure — Only You Can See Your Entries',
    landingHero1: 'A quiet space to write, reflect, and find clarity with',
    landingHeroWith: '',
    landingHeroGemini: 'Gemini AI',
    landingSubtitle: 'Inkwell brings together the comfort of personal journaling with the thoughtful insight of Google Gemini. Work through your thoughts, have real conversations about what\'s on your mind, and get clear takeaways — all in one calm space.',
    signInWithGoogle: 'Sign In with Google',
    connecting: 'Connecting...',
    landingAuthSub: 'No passwords needed. Your account is protected by Google, and your entries are visible only to you.',
    feature1Title: 'Voice-to-Text Dictation',
    feature1Desc: 'Speak your reflections naturally. Dual-engine voice capture works everywhere — even browsers that block standard speech recognition.',
    feature1Badge: 'Works in any browser',
    feature2Title: 'Read Aloud, In Your Language',
    feature2Desc: 'Every reflection and Gemini response can be read back to you, with natural voice matching across all supported languages.',
    feature2Badge: 'Multilingual narration',
    feature3Title: 'Export Your Journal Anytime',
    feature3Desc: 'Download any reflection as a clean, print-ready PDF — your thoughts, your insights, yours to keep offline.',
    feature3Badge: 'PDF export',
    feature4Title: 'Five Moods, One Journal',
    feature4Desc: 'Choose from five distinct visual themes — from calm Paper to bold Vivid — with automatic evening dark mode.',
    feature4Badge: '5 themes',
    feature5Title: 'Speak Your Own Language',
    feature5Desc: 'A fully localized interface — not just translated labels, but a complete experience in your language.',
    feature5Badge: 'Full localization',
    feature6Title: 'Insights, Not Just Answers',
    feature6Desc: 'Beyond conversation: automatic synthesis extracts key realizations, mood trends, and action items from your reflections.',
    feature6Badge: 'AI-powered synthesis',
    footerRights: 'Inkwell — a personal journal powered by Gemini AI.',
    footerAuth: 'Secured by Google Sign-In',
    footerProxy: 'Your data stays protected',

    // Onboarding Tour
    onboardingTourTitle: 'Welcome to Inkwell',
    onboardingTourStep: 'Step {current} of {total}',
    onboardingNext: 'Next',
    onboardingPrev: 'Back',
    onboardingFinish: 'Get Started',
    onboardingSkip: 'Skip Tour',
    onboardingReplay: 'Feature Tour',
    onboardingReplaySubtitle: 'Take a quick 1-minute guided walkthrough of all Inkwell features',
    tourStep1Title: 'Start a New Reflection',
    tourStep1Desc: 'Tap New Reflection or jump straight into the canvas to write down what is on your mind and receive mindful AI perspectives.',
    tourStep2Title: 'Mood Tracking & Custom Tags',
    tourStep2Desc: 'Tag how you feel (Calm, Inspired, Challenged, etc.) and add custom tags to easily organize your emotional journey.',
    tourStep3Title: 'Reflection Modes & Voice Studio',
    tourStep3Desc: 'Switch between Reflect, Summarize, Brainstorm, and Action Items. Speak naturally with voice input or listen with Read Aloud.',
    tourStep4Title: 'Journal Vault & Search Filters',
    tourStep4Desc: 'Browse past reflections, search keywords instantly, or filter by date, mood, tags, and reflection modes.',
    tourStep5Title: 'AI Insights & Mood Trends',
    tourStep5Desc: 'Extract mindful summaries, core realizations, and discover longitudinal patterns in your emotional trajectory.',
    tourStep6Title: 'Themes, Backup & App Lock',
    tourStep6Desc: 'Personalize with 5 themes, streak heatmaps, multi-format export/import, and secure your reflections with 4-Digit PIN App Lock.',

    sample: 'Sample',
    sampleReflection: 'Sample Reflection',
    whatYouCanDo: 'What you can do in Inkwell',
    sampleEntryTip: 'This is a sample reflection to help you explore. Feel free to test out the tools, edit it, or delete it whenever you’re ready to write your own.',

    // Guest Mode & Anonymous Auth
    continueAsGuest: 'Continue as Guest',
    continueAsGuestSubtitle: 'Try Inkwell instantly without a Google account. Data stays on this browser.',
    guestMode: 'Guest Mode',
    guestModeBadge: 'Guest',
    guestModeNotice: 'Guest Mode: Reflections are stored locally in this browser. To preserve your entries permanently across devices, link your Google account.',
    guestModeDisclaimer: 'Device-only storage. Clearing cookies or browsing data will reset this session.',
    guestModeWarning: 'Guest data is not synced across devices.',
    linkGoogleAccount: 'Link Google Account',
    saveDataPermanently: 'Save Data Permanently',
    linkingAccount: 'Linking account...',
    accountLinkedSuccess: 'Google Account successfully linked! Your reflections are now permanently protected.',
    guestCalendarNotice: 'Google Calendar integration requires a real Google account. Sign in with Google to connect your live schedule.',
    guestCalendarBtn: 'Sign in to Connect Calendar',
  },

  es: {
    appName: 'Inkwell',
    appSubtitle: 'Diario de reflexión con IA y espacio consciente',
    geminiVersion: 'Powered by Gemini',
    vault: 'Bóveda',
    newReflection: 'Nueva Reflexión',
    newShort: 'Nuevo',
    toggleTheme: 'Cambiar Tema',
    settings: 'Configuración',
    howToUse: 'Cómo Usar',
    howToUseSubtitle: 'Guía completa de reflexión, privacidad y funciones',
    signOut: 'Cerrar sesión de forma segura',
    loadingApp: 'Cargando Inkwell...',
    dismiss: 'Descartar',
    readyToReflect: '¿Listo para reflexionar?',
    readyToReflectSub: 'Crea una nueva reflexión para explorar tus pensamientos con Gemini y guardar tu camino personal.',
    startNewReflection: 'Comenzar Nueva Reflexión',

    settingsTitle: 'Configuración y Preferencias',
    settingsSubtitle: 'Personaliza tu tema de diario, bloqueos de privacidad y tamaño de lectura.',
    themeSection: 'Lienzo de Tema',
    themeSectionDesc: 'Elige la paleta de colores y atmósfera que mejor se adapte a tu estado mental.',
    themeModeAuto: 'Tema Oscuro automático después de las 18:00',
    themeModeAutoDesc: 'Cambia automáticamente a modo oscuro al atardecer si estás en modo predeterminado.',
    fontSizeSection: 'Tamaño de Fuente',
    fontSizeSectionDesc: 'Ajusta el tamaño del texto de lectura y reflexión en toda la app.',
    languageSection: 'Idioma de la Interfaz',
    languageSectionDesc: 'Selecciona tu idioma preferido para todas las opciones y menús.',
    cloudSyncTitle: 'Sincronización de Perfil',
    cloudSyncDesc: 'Tus preferencias se sincronizan de forma segura con tu cuenta privada.',
    close: 'Cerrar',
    savedAutomatically: 'Guardado automáticamente',

    themeLight: 'Claro',
    themeLightDesc: 'Lienzo claro y neutral con detalles en azul tranquilo.',
    themeDark: 'Oscuro',
    themeDarkDesc: 'Carbón con tono de tinta cálido y toques ámbar.',
    themePaper: 'Papel',
    themePaperDesc: 'Pergamino crema con tonos terracota y calidez de cuaderno clásico.',
    themeVellum: 'Vitela',
    themeVellumDesc: 'Sepia envejecido y naranja quemado para un estilo vintage.',
    themeVivid: 'Vívido',
    themeVividDesc: 'Paleta vibrante con violeta eléctrico y toques coral.',

    fontSmall: 'Pequeño',
    fontSmallDesc: 'Densidad compacta para lectura informativa',
    fontMedium: 'Mediano',
    fontMediumDesc: 'Escala equilibrada predeterminada para reflexionar cómodamente',
    fontLarge: 'Grande',
    fontLargeDesc: 'Escala espaciosa y de alta legibilidad',

    journalVault: 'Bóveda de Diario',
    searchPlaceholder: 'Buscar reflexiones, etiquetas o pensamientos...',
    filterByMood: 'Filtrar por estado de ánimo',
    allMoods: 'Todos los estados',
    allReflections: 'Todas las Reflexiones',
    noEntriesFound: 'Ninguna reflexión coincide con tu búsqueda o filtros.',
    noEntriesYet: 'Aún no hay entradas en tu bóveda.',
    createFirstEntry: 'Crea tu primera reflexión',
    deleteEntryConfirm: '¿Estás seguro de que deseas eliminar esta reflexión? Puedes deshacerlo inmediatamente después de borrar.',
    deleteConfirmTitle: '¿Eliminar Reflexión?',
    deleteConfirmDesc: 'Esta reflexión se moverá a la papelera. Puedes deshacer esta acción inmediatamente.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    entryDeleted: 'Reflexión movida a la papelera',
    undo: 'Deshacer',
    entryRestored: 'Reflexión restaurada',
    yesterday: 'Ayer',
    edited: 'Editado',

    filterBtn: 'Filtro',
    filters: 'Filtros',
    filterByDate: 'Rango de Fechas',
    filterByMode: 'Modo de Reflexión',
    filterByTags: 'Etiquetas',
    filterPresetAll: 'Todo el Tiempo',
    filterPresetToday: 'Hoy',
    filterPresetThisWeek: 'Esta Semana',
    filterPresetThisMonth: 'Este Mes',
    dateFrom: 'Desde',
    dateTo: 'Hasta',
    resetFilters: 'Restablecer Filtros',
    activeFilters: 'Filtros Activos',

    toggleSidebar: 'Alternar Barra de Bóveda',
    collapseSidebar: 'Colapsar Barra',
    expandSidebar: 'Abrir Bóveda de Diario',
    focusMode: 'Modo Enfoque',
    exitFocusMode: 'Salir del Modo Enfoque (Esc)',

    export: 'Exportar',
    exportEntry: 'Exportar Reflexión',
    exportAll: 'Exportar Toda la Bóveda',
    exportAsPdf: 'Descargar como Documento PDF',
    exportAsMarkdown: 'Descargar como Markdown (.md)',
    exportAsPlainText: 'Descargar como Texto Plano (.txt)',
    exportAsJson: 'Descargar Datos Estructurados (.json)',

    // Import
    importData: 'Importar Datos de Respaldo',
    importDataSubtitle: 'Restaurar reflexiones desde una copia JSON de Inkwell',
    importDesc: 'Seleccione un archivo JSON exportado previamente para restaurarlo en su bóveda.',
    importSuccess: 'Copia de Seguridad Importada con Éxito',
    importSuccessDesc: 'Sus reflexiones se han integrado de forma segura en su bóveda.',
    importMergeNotice: 'Fusión no destructiva: las entradas importadas se agregarán a su bóveda actual sin sobrescribir ningún dato existente.',
    importDuplicatesSkipped: 'entradas duplicadas ya presentes en su bóveda fueron omitidas automáticamente.',
    importNoNewEntries: 'Todas las reflexiones en este archivo de respaldo ya existen en su bóveda. No se agregaron nuevas entradas.',
    importInvalidFile: 'Formato de archivo de respaldo no válido o incompatible.',
    importProcessing: 'Analizando estructura del archivo...',
    importConfirmBtn: 'Importar Reflexiones',
    importSelectFile: 'Seleccionar Archivo JSON',
    dragAndDropJson: 'Arrastre su archivo JSON de Inkwell aquí',
    browseFile: 'examinar archivos',
    entriesToImport: 'Reflexiones para Importar',
    duplicatesFound: 'Duplicados Encontrados (Omitidos)',
    dateRange: 'Rango de Fechas',
    previewEntries: 'Vista Previa de Reflexiones',

    streak: 'Racha',
    streakTitle: 'Constancia al Escribir',
    currentStreak: 'Racha Actual',
    longestStreak: 'Mayor Racha',
    totalDaysReflected: 'Días con Diario',
    streakHeatmapTitle: 'Actividad (Últimas 6 Semanas)',
    streakActiveToday: '¡Ya escribiste hoy! Sigue así.',
    streakNeedsEntry: 'Escribe una reflexión hoy para mantener tu racha.',

    appLockTitle: 'Bloqueo y Seguridad de la App',
    appLockDesc: 'Solicita un PIN de 4 dígitos para acceder a tu diario tras inactividad.',
    enableAppLock: 'Activar Bloqueo (PIN)',
    setPinCode: 'Definir PIN de 4 Dígitos',
    enterPinCode: 'Introduce PIN de 4 Dígitos',
    confirmPinCode: 'Confirmar PIN',
    changePinCode: 'Cambiar PIN',
    pinMismatch: 'Los códigos PIN no coinciden. Inténtalo de nuevo.',
    autoLockTimeout: 'Tiempo de Bloqueo Automático',
    timeout1Min: '1 Minuto',
    timeout5Min: '5 Minutos',
    timeout15Min: '15 Minutos',
    timeout30Min: '30 Minutos',
    timeoutNever: 'Nunca (Solo bloqueo manual)',
    unlockApp: 'Desbloquear Inkwell',
    appLockedTitle: 'Inkwell está Bloqueado',
    appLockedDesc: 'Introduce tu PIN de 4 dígitos para acceder a tu diario privado.',
    incorrectPin: 'PIN incorrecto. Inténtalo de nuevo.',
    forgotPin: '¿Olvidaste tu PIN?',
    forgotPinPrompt: 'Vuelve a identificarte con tu cuenta de Google para restablecer tu PIN.',
    reauthSuccess: 'Autenticación exitosa. Ahora puedes definir un nuevo PIN.',

    modeReflect: 'Reflexionar',
    modeSummarize: 'Resumir',
    modeBrainstorm: 'Idear',
    modeActionItems: 'Acciones',
    modeReflectDesc: 'Preguntas reflexivas y escucha empática',
    modeSummarizeDesc: 'Sintetiza aprendizajes clave y trayectoria emocional',
    modeBrainstormDesc: 'Explora ángulos creativos, analogías y alternativas',
    modeActionItemsDesc: 'Extrae pasos siguientes claros y priorizados',

    inputPlaceholder: 'Escribe tus pensamientos libremente o pide a Gemini reflexionar contigo...',
    reflectOnThis: 'Reflexionar sobre esto',
    reflectActionPlaceholder: 'Escribe tus pensamientos libremente... escribe varios párrafos, reflexiones tranquilas o ideas en bruto sin interrupciones. Cuando estés listo, invita a Gemini a reflexionar.',
    continueWritingPlaceholder: 'Continúa escribiendo tu reflexión... escribe tanto como desees.',
    geminiReflecting: 'Gemini está reflexionando sobre tu entrada...',
    send: 'Enviar',
    voiceInput: 'Entrada de voz',
    stopVoiceInput: 'Detener grabación',
    listening: 'Escuchando tu voz...',
    transcribingAudio: 'Transcribiendo voz con Gemini...',
    speechNotSupported: 'La grabación por micrófono no está soportada en este navegador.',
    micDisabledAudioPlaying: 'El micrófono está deshabilitado mientras se reproduce la lectura en voz alta.',
    readAloud: 'Leer en voz alta',
    stopReadAloud: 'Detener lectura',
    readingAloud: 'Leyendo mensaje en voz alta...',
    ttsNotSupported: 'La lectura de texto a voz no está disponible en este navegador.',
    voiceNotAvailable: 'No hay voz disponible para este idioma en tu dispositivo.',
    suggestedPrompts: 'Sugerencias de Reflexión',
    geminiThinking: 'Gemini está analizando tu reflexión...',
    insights: 'Análisis',
    copyInsights: 'Copiar Análisis',
    copied: 'Copiado',
    saveStatusSaved: '',
    saveStatusSaving: 'Guardando...',
    saveStatusError: 'Error al guardar',
    untitledReflection: 'Reflexión sin título',
    addTag: 'Añadir Etiqueta',
    enterTagPlaceholder: 'nombre de etiqueta...',
    deleteEntry: 'Eliminar Entrada',
    moodSelect: 'Elegir estado de ánimo',
    editThought: 'Editar pensamiento',
    saveChanges: 'Guardar cambios',
    saveAndRegenerate: 'Guardar y regenerar respuesta de Gemini',
    cancelEdit: 'Cancelar',
    editClarification: 'La edición actualiza tus palabras sin alterar la respuesta previa de Gemini.',
    editedMessageLabel: 'editado',

    promptUnpack: 'Ayúdame a desglosar lo ocurrido hoy y qué aprendizaje me deja.',
    promptPatterns: '¿Qué patrones o puntos ciegos notas en lo que compartí?',
    promptBrainstorm: 'Ayúdame a pensar 3 perspectivas nuevas sobre este dilema.',
    promptActionSteps: 'Convierte mis reflexiones en 3 pasos de acción claros.',

    moodReflective: 'Reflexivo',
    moodCalm: 'Calmado',
    moodOptimistic: 'Optimista',
    moodInspired: 'Inspirado',
    moodChallenged: 'Desafiado',
    moodGrateful: 'Agradecido',
    moodAnxious: 'Ansioso',
    moodEnergized: 'Con energía',

    insightsTitle: 'Síntesis y Análisis de Gemini',
    executiveSummary: 'Resumen Ejecutivo de Reflexión',
    keyRealizations: 'Realizaciones y Patrones Clave',
    creativeBrainstorming: 'Lluvia de Ideas y Próximos Ángulos',
    emotionalTone: 'Tono Emocional',
    tagsLabel: 'Etiquetas',
    none: 'Ninguno',

    moodTrends: 'Tendencias de Ánimo',
    moodTrendsSubtitle: 'Patrones observacionales de tus estados de ánimo a lo largo del tiempo',
    viewMoodTrends: 'Ver Tendencias de Ánimo',
    timeRange2Weeks: 'Últimas 2 Semanas',
    timeRange1Month: 'Último Mes',
    timeRange3Months: 'Últimos 3 Meses',
    timeRangeAllTime: 'Todo el Tiempo',
    moodTrajectory: 'Trayectoria del Estado de Ánimo',
    moodDistribution: 'Frecuencia y Distribución',
    noMoodData: 'No se encontraron estados de ánimo etiquetados en este período.',
    noMoodDataDesc: 'Etiqueta estados de ánimo (como Calma, Inspiración o Gratitud) en tus reflexiones para observar tus patrones aquí.',
    totalMoodEntries: 'Reflexiones con Ánimo',
    dominantMood: 'Ánimo más frecuente',
    moodDiversity: 'Ánimos únicos',
    purelyObservationalNotice: 'Este gráfico es puramente observacional para tu reflexión personal.',

    dangerZone: 'Zona de Peligro',
    deleteAccount: 'Eliminar Cuenta y Datos',
    deleteAccountDesc: 'Borra de forma permanente todas tus reflexiones, rachas y configuraciones de la nube.',
    deleteAccountConfirmTitle: '¿Eliminar Cuenta y Todos los Datos de Inkwell?',
    deleteAccountConfirmDesc: 'Esta acción es permanente e irreversible. Todas tus reflexiones, historial de Gemini, estados de ánimo, rachas y ajustes serán eliminados inmediatamente.',
    deleteAccountGoogleNotice: 'Esto solo eliminará tus datos en Inkwell. Tu cuenta de Google no se verá afectada.',
    typeDeleteToConfirm: 'Para confirmar, escribe DELETE a continuación:',
    deleteInputPlaceholder: 'Escribe DELETE',
    permanentlyDeleteBtn: 'Eliminar Todo Permanentemente',
    deletingAccount: 'Borrando tus datos y cerrando sesión...',
    accountDeletedSuccess: 'Cuenta y Datos Eliminados con Éxito',
    accountDeletedSuccessDesc: 'Todas tus reflexiones y configuraciones se han eliminado por completo de Inkwell. Tu cuenta de Google no sufrió cambios.',
    returnToHome: 'Volver al Inicio',

    needToTalk: '¿Necesitas hablar con alguien?',
    helplineDirectory: 'Encuentra líneas de ayuda gratuitas y confidenciales en más de 130 países',

    landingBadge: 'Private & Secure — Only You Can See Your Entries',
    landingHero1: 'Un espacio tranquilo para escribir, reflexionar y encontrar claridad con',
    landingHeroWith: '',
    landingHeroGemini: 'Gemini AI',
    landingSubtitle: 'Inkwell combina la comodidad del diario personal con la perspectiva reflexiva de Google Gemini. Explora tus pensamientos, conversa sobre lo que tienes en mente y obtén aprendizajes claros, todo en un entorno sereno.',
    signInWithGoogle: 'Iniciar Sesión con Google',
    connecting: 'Conectando...',
    landingAuthSub: 'Sin necesidad de contraseñas. Tu cuenta está protegida por Google y tus entradas solo son visibles para ti.',
    feature1Title: 'Dictado de Voz a Texto',
    feature1Desc: 'Habla tus reflexiones con naturalidad. La captura de voz de doble motor funciona en todos los navegadores.',
    feature1Badge: 'Funciona en cualquier navegador',
    feature2Title: 'Lectura en Voz Alta en Tu Idioma',
    feature2Desc: 'Cada reflexión y respuesta de Gemini puede ser leída en voz alta con adaptación natural a todos los idiomas.',
    feature2Badge: 'Narración multilingüe',
    feature3Title: 'Exporta Tu Diario Cuando Quieras',
    feature3Desc: 'Descarga cualquier reflexión en formato PDF impecable: tus pensamientos e ideas listos para guardar.',
    feature3Badge: 'Exportación a PDF',
    feature4Title: 'Cinco Ambientes, Un Diario',
    feature4Desc: 'Elige entre cinco temas visuales únicos, desde el sereno Paper hasta el enérgico Vivid, con modo oscuro nocturno.',
    feature4Badge: '5 temas',
    feature5Title: 'Habla en Tu Propio Idioma',
    feature5Desc: 'Una interfaz completamente localizada: una experiencia integral pensada en tu propio idioma.',
    feature5Badge: 'Localización completa',
    feature6Title: 'Perspectivas, No Solo Respuestas',
    feature6Desc: 'Más allá del diálogo: la síntesis automática extrae conclusiones clave, tendencias de ánimo y próximos pasos.',
    feature6Badge: 'Síntesis con IA',
    footerRights: 'Inkwell — un diario personal impulsado por Gemini AI.',
    footerAuth: 'Protegido por Google Sign-In',
    footerProxy: 'Tus datos se mantienen protegidos',

    // Onboarding Tour
    onboardingTourTitle: 'Bienvenido a Inkwell',
    onboardingTourStep: 'Paso {current} de {total}',
    onboardingNext: 'Siguiente',
    onboardingPrev: 'Atrás',
    onboardingFinish: 'Comenzar',
    onboardingSkip: 'Saltar Guía',
    onboardingReplay: 'Guía Interactiva',
    onboardingReplaySubtitle: 'Haz un recorrido guiado rápido de 1 minuto por todas las funciones de Inkwell',
    tourStep1Title: 'Comienza una Nueva Reflexión',
    tourStep1Desc: 'Toca Nueva Reflexión o escribe directamente en el lienzo para reflexionar y recibir perspectivas conscientes con Gemini.',
    tourStep2Title: 'Registro de Ánimo y Etiquetas',
    tourStep2Desc: 'Elige cómo te sientes (Calma, Inspirado, Desafiado, etc.) y añade etiquetas para organizar tu camino emocional.',
    tourStep3Title: 'Modos de Reflexión y Voz',
    tourStep3Desc: 'Cambia entre Reflexión, Resumen, Lluvia de ideas y Acciones. Habla con dictado por voz o escucha con Lectura en Voz Alta.',
    tourStep4Title: 'Bóveda de Diario y Búsqueda',
    tourStep4Desc: 'Explora reflexiones pasadas, busca por palabras clave al instante o filtra por fecha, estado de ánimo y etiquetas.',
    tourStep5Title: 'Perspectivas de IA y Tendencias',
    tourStep5Desc: 'Extrae resúmenes conscientes, aprendizajes clave y descubre patrones longitudinales en tu trayectoria emocional.',
    tourStep6Title: 'Temas, Respaldos y Bloqueo Seguro',
    tourStep6Desc: 'Personaliza con 5 temas, rachas, exportación/importación y protege tus pensamientos con Bloqueo por PIN de 4 dígitos.',

    sample: 'Muestra',
    sampleReflection: 'Reflexión de Muestra',
    whatYouCanDo: 'Lo que puedes hacer en Inkwell',
    sampleEntryTip: 'Esta es una reflexión de muestra para ayudarte a explorar. Puedes editarla, probar las herramientas o eliminarla cuando desees escribir la tuya.',

    // Guest Mode & Anonymous Auth
    continueAsGuest: 'Continuar como Invitado',
    continueAsGuestSubtitle: 'Prueba Inkwell al instante sin cuenta de Google. Los datos quedan en este navegador.',
    guestMode: 'Modo Invitado',
    guestModeBadge: 'Invitado',
    guestModeNotice: 'Modo Invitado: Las reflexiones se guardan en este navegador. Para conservar tus entradas permanentemente, vincula tu cuenta de Google.',
    guestModeDisclaimer: 'Almacenamiento local. Borrar cookies o datos del navegador reiniciará esta sesión.',
    guestModeWarning: 'Los datos de invitado no se sincronizan entre dispositivos.',
    linkGoogleAccount: 'Vincular Cuenta de Google',
    saveDataPermanently: 'Guardar Datos Permanentemente',
    linkingAccount: 'Vinculando cuenta...',
    accountLinkedSuccess: '¡Cuenta de Google vinculada con éxito! Tus reflexiones ahora están protegidas permanentemente.',
    guestCalendarNotice: 'La integración con Google Calendar requiere una cuenta de Google real. Inicia sesión con Google para conectar tu agenda.',
    guestCalendarBtn: 'Acceder para Conectar Calendario',
  },

  fr: {
    appName: 'Inkwell',
    appSubtitle: 'Journal de réflexion IA & espace de pensée consciente',
    geminiVersion: 'Powered by Gemini',
    vault: 'Coffre',
    newReflection: 'Nouvelle Réflexion',
    newShort: 'Nouveau',
    toggleTheme: 'Changer de Thème',
    settings: 'Paramètres',
    howToUse: 'Guide d\'utilisation',
    howToUseSubtitle: 'Guide complet de réflexion, sécurité et fonctionnalités',
    signOut: 'Se déconnecter en toute sécurité',
    loadingApp: 'Chargement d\'Inkwell...',
    dismiss: 'Fermer',
    readyToReflect: 'Prêt à réfléchir ?',
    readyToReflectSub: 'Créez une nouvelle réflexion pour explorer vos pensées avec Gemini et enrichir votre journal personnel.',
    startNewReflection: 'Commencer une Réflexion',

    settingsTitle: 'Paramètres & Préférences',
    settingsSubtitle: 'Personnalisez votre thème de journal, le verrouillage de confidentialité et la typographie.',
    themeSection: 'Toile de Thème',
    themeSectionDesc: 'Choisissez la palette de couleurs et l\'ambiance qui correspondent à votre état d\'esprit.',
    themeModeAuto: 'Mode Sombre automatique après 18h00',
    themeModeAutoDesc: 'Bascule automatiquement en thème sombre le soir lorsque le mode par défaut est actif.',
    fontSizeSection: 'Taille de Police',
    fontSizeSectionDesc: 'Ajustez la taille du texte de lecture et de réflexion dans toute l\'application.',
    languageSection: 'Langue de l\'Interface',
    languageSectionDesc: 'Sélectionnez votre langue préférée pour l\'ensemble des menus et libellés.',
    cloudSyncTitle: 'Synchronisation du Profil',
    cloudSyncDesc: 'Vos préférences sont synchronisées en toute sécurité avec votre compte privé.',
    close: 'Fermer',
    savedAutomatically: 'Enregistré automatiquement',

    themeLight: 'Clair',
    themeLightDesc: 'Toile claire et neutre avec des accents bleu apaisant.',
    themeDark: 'Sombre',
    themeDarkDesc: 'Fusain chaleureux aux reflets d\'encre et d\'ambre.',
    themePaper: 'Papier',
    themePaperDesc: 'Parchemin crème aux tonalités terracotta et à la douceur d\'un carnet classique.',
    themeVellum: 'Vélin',
    themeVellumDesc: 'Sépia vieilli et orange brûlé pour une sensation vintage élégante.',
    themeVivid: 'Vif',
    themeVividDesc: 'Palette dynamique aux accents violet électrique et corail éclatant.',

    fontSmall: 'Petit',
    fontSmallDesc: 'Densité compacte pour une lecture riche en informations',
    fontMedium: 'Moyen',
    fontMediumDesc: 'Échelle par défaut équilibrée pour une réflexion confortable',
    fontLarge: 'Grand',
    fontLargeDesc: 'Échelle spacieuse offrant une excellente lisibilité',

    journalVault: 'Coffre de Journal',
    searchPlaceholder: 'Rechercher des réflexions, tags ou pensées...',
    filterByMood: 'Filtrer par humeur',
    allMoods: 'Toutes les humeurs',
    allReflections: 'Toutes les Réflexions',
    noEntriesFound: 'Aucune réflexion ne correspond à vos critères.',
    noEntriesYet: 'Aucune entrée dans votre coffre pour le moment.',
    createFirstEntry: 'Rédigez votre première réflexion',
    deleteEntryConfirm: 'Voulez-vous vraiment supprimer cette réflexion ? Vous pourrez annuler cette action juste après.',
    deleteConfirmTitle: 'Supprimer la Réflexion ?',
    deleteConfirmDesc: 'Cette réflexion sera placée dans la corbeille. Vous pourrez annuler immédiatement.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    entryDeleted: 'Réflexion déplacée dans la corbeille',
    undo: 'Annuler',
    entryRestored: 'Réflexion restaurée',
    yesterday: 'Hier',
    edited: 'Modifié',

    filterBtn: 'Filtrer',
    filters: 'Filtres',
    filterByDate: 'Période',
    filterByMode: 'Mode de Réflexion',
    filterByTags: 'Tags',
    filterPresetAll: 'Toutes les dates',
    filterPresetToday: 'Aujourd\'hui',
    filterPresetThisWeek: 'Cette Semaine',
    filterPresetThisMonth: 'Ce Mois-ci',
    dateFrom: 'Du',
    dateTo: 'Au',
    resetFilters: 'Réinitialiser les Filtres',
    activeFilters: 'Filtres Actifs',

    toggleSidebar: 'Afficher/Masquer le Coffre',
    collapseSidebar: 'Réduire la Barre Latérale',
    expandSidebar: 'Ouvrir le Coffre de Journal',
    focusMode: 'Mode Concentration',
    exitFocusMode: 'Quitter le Mode Concentration (Échap)',

    export: 'Exporter',
    exportEntry: 'Exporter la Réflexion',
    exportAll: 'Exporter Tout le Coffre',
    exportAsPdf: 'Télécharger en Document PDF',
    exportAsMarkdown: 'Télécharger en Markdown (.md)',
    exportAsPlainText: 'Télécharger en Texte Brut (.txt)',
    exportAsJson: 'Télécharger les Données (.json)',

    // Import
    importData: 'Importer une Sauvegarde',
    importDataSubtitle: 'Restaurer des réflexions depuis une sauvegarde JSON Inkwell',
    importDesc: 'Sélectionnez un fichier JSON Inkwell précédemment exporté pour le restaurer dans votre coffre.',
    importSuccess: 'Sauvegarde Importée avec Succès',
    importSuccessDesc: 'Vos réflexions ont été fusionnées en toute sécurité dans votre coffre.',
    importMergeNotice: 'Fusion non destructive : les entrées importées seront ajoutées à votre coffre sans écraser vos données existantes.',
    importDuplicatesSkipped: 'entrées en double déjà présentes dans votre coffre ont été ignorées pour éviter les doublons.',
    importNoNewEntries: 'Toutes les réflexions de ce fichier de sauvegarde existent déjà dans votre coffre. Aucune nouvelle entrée ajoutée.',
    importInvalidFile: 'Format de fichier de sauvegarde non valide ou corrompu.',
    importProcessing: 'Analyse du fichier de sauvegarde...',
    importConfirmBtn: 'Importer les Réflexions',
    importSelectFile: 'Choisir un Fichier JSON',
    dragAndDropJson: 'Glissez votre fichier JSON Inkwell ici',
    browseFile: 'parcourir les fichiers',
    entriesToImport: 'Réflexions à Importer',
    duplicatesFound: 'Doublons Trouvés (Ignorés)',
    dateRange: 'Période Chronologique',
    previewEntries: 'Aperçu des Réflexions',

    streak: 'Série',
    streakTitle: 'Régularité du Journal',
    currentStreak: 'Série Actuelle',
    longestStreak: 'Meilleure Série',
    totalDaysReflected: 'Jours Écrits',
    streakHeatmapTitle: 'Activité (6 Dernières Semaines)',
    streakActiveToday: 'Vous avez écrit aujourd\'hui ! Continuez ainsi.',
    streakNeedsEntry: 'Écrivez une réflexion aujourd\'hui pour maintenir votre série.',

    appLockTitle: 'Verrouillage & Sécurité',
    appLockDesc: 'Exigez un code PIN à 4 chiffres après une période d\'inactivité.',
    enableAppLock: 'Activer le Verrouillage (PIN)',
    setPinCode: 'Définir le PIN à 4 Chiffres',
    enterPinCode: 'Entrer le PIN à 4 Chiffres',
    confirmPinCode: 'Confirmer le PIN',
    changePinCode: 'Modifier le PIN',
    pinMismatch: 'Les codes PIN ne correspondent pas. Veuillez réessayer.',
    autoLockTimeout: 'Délai de Verrouillage Automatique',
    timeout1Min: '1 Minute',
    timeout5Min: '5 Minutes',
    timeout15Min: '15 Minutes',
    timeout30Min: '30 Minutes',
    timeoutNever: 'Jamais (Verrouillage manuel uniquement)',
    unlockApp: 'Déverrouiller Inkwell',
    appLockedTitle: 'Inkwell est Verrouillé',
    appLockedDesc: 'Entrez votre code PIN à 4 chiffres pour accéder à votre journal.',
    incorrectPin: 'Code PIN incorrect. Veuillez réessayer.',
    forgotPin: 'PIN oublié ?',
    forgotPinPrompt: 'Ré-authentifiez-vous avec votre compte Google pour réinitialiser votre code PIN.',
    reauthSuccess: 'Authentification réussie. Vous pouvez maintenant définir un nouveau code PIN.',

    modeReflect: 'Réfléchir',
    modeSummarize: 'Résumer',
    modeBrainstorm: 'Explorer',
    modeActionItems: 'Actions',
    modeReflectDesc: 'Questionnement bienveillant et approfondissement',
    modeSummarizeDesc: 'Synthèse des prises de conscience et trajectoire émotionnelle',
    modeBrainstormDesc: 'Exploration d\'angles créatifs et d\'alternatives',
    modeActionItemsDesc: 'Extraction d\'étapes concrètes et prioritaires',

    inputPlaceholder: 'Exprimez librement vos pensées ou demandez à Gemini d\'explorer avec vous...',
    reflectOnThis: 'Réfléchir à ceci',
    reflectActionPlaceholder: 'Écrivez librement vos pensées... plusieurs paragraphes, réflexions calmes ou pensées brutes sans interruption. Quand vous êtes prêt, invitez Gemini à réfléchir.',
    continueWritingPlaceholder: 'Continuez à rédiger votre réflexion... écrivez autant que vous le souhaitez.',
    geminiReflecting: 'Gemini réfléchit sur votre journal...',
    send: 'Envoyer',
    voiceInput: 'Saisie vocale',
    stopVoiceInput: 'Arrêter l\'enregistrement',
    listening: 'Écoute de votre voix...',
    transcribingAudio: 'Transcription vocale avec Gemini...',
    speechNotSupported: 'L\'enregistrement au microphone n\'est pas pris en charge par ce navigateur.',
    micDisabledAudioPlaying: 'Le microphone est désactivé pendant la lecture vocale.',
    readAloud: 'Lecture à voix haute',
    stopReadAloud: 'Arrêter la lecture',
    readingAloud: 'Lecture du message à voix haute...',
    ttsNotSupported: 'La synthèse vocale n\'est pas supportée dans ce navigateur.',
    voiceNotAvailable: 'Aucune voix disponible pour cette langue sur votre appareil.',
    suggestedPrompts: 'Pistes de Réflexion Suggérées',
    geminiThinking: 'Gemini explore votre réflexion...',
    insights: 'Synthèse',
    copyInsights: 'Copier la Synthèse',
    copied: 'Copié',
    saveStatusSaved: '',
    saveStatusSaving: 'Enregistrement...',
    saveStatusError: 'Erreur d\'enregistrement',
    untitledReflection: 'Réflexion sans titre',
    addTag: 'Ajouter un Tag',
    enterTagPlaceholder: 'nom du tag...',
    deleteEntry: 'Supprimer l\'Entrée',
    moodSelect: 'Sélectionner l\'humeur',
    editThought: 'Modifier la pensée',
    saveChanges: 'Enregistrer les modifications',
    saveAndRegenerate: 'Enregistrer & régénérer la réponse de Gemini',
    cancelEdit: 'Annuler',
    editClarification: 'La modification met à jour vos propos sans altérer la réponse existante de Gemini.',
    editedMessageLabel: 'modifié',

    promptUnpack: 'Aide-moi à décortiquer ce qui s\'est passé aujourd\'hui et ce que j\'en retire.',
    promptPatterns: 'Quels schémas ou angles morts remarques-tu dans ce que j\'ai partagé ?',
    promptBrainstorm: 'Aide-moi à trouver 3 nouvelles perspectives sur ce dilemme.',
    promptActionSteps: 'Transforme mes pensées en 3 prochaines étapes concrètes.',

    moodReflective: 'Réflexif',
    moodCalm: 'Calme',
    moodOptimistic: 'Optimiste',
    moodInspired: 'Inspiré',
    moodChallenged: 'Mis au défi',
    moodGrateful: 'Reconnaissant',
    moodAnxious: 'Anxieux',
    moodEnergized: 'Dynamique',

    insightsTitle: 'Synthèse & Analyse Gemini',
    executiveSummary: 'Résumé Exécutif de Réflexion',
    keyRealizations: 'Prises de Conscience & Schémas Clés',
    creativeBrainstorming: 'Brainstorming Créatif & Nouvelles Perspectives',
    emotionalTone: 'Tonalité Émotionnelle',
    tagsLabel: 'Tags',
    none: 'Aucun',

    moodTrends: 'Tendances Émotionnelles',
    moodTrendsSubtitle: 'Schémas observationnels de vos humeurs au fil du temps',
    viewMoodTrends: 'Voir les Tendances Émotionnelles',
    timeRange2Weeks: '2 Dernières Semaines',
    timeRange1Month: 'Dernier Mois',
    timeRange3Months: '3 Derniers Mois',
    timeRangeAllTime: 'Tout l\'Historique',
    moodTrajectory: 'Trajectoire Émotionnelle',
    moodDistribution: 'Fréquence & Répartition',
    noMoodData: 'Aucune humeur enregistrée pour cette période.',
    noMoodDataDesc: 'Associez des humeurs (comme Calme, Inspiré ou Reconnaissant) à vos écrits pour observer vos schémas ici.',
    totalMoodEntries: 'Réflexions avec Humeur',
    dominantMood: 'Humeur dominante',
    moodDiversity: 'Humeurs uniques',
    purelyObservationalNotice: 'Ce graphique est purement observationnel pour votre propre réflexion personnelle.',

    dangerZone: 'Zone de Danger',
    deleteAccount: 'Supprimer le Compte et les Données',
    deleteAccountDesc: 'Effacez définitivement toutes vos réflexions, vos séries et vos préférences du stockage cloud.',
    deleteAccountConfirmTitle: 'Supprimer le Compte et Toutes les Données Inkwell ?',
    deleteAccountConfirmDesc: 'Cette action est définitive et irréversible. Toutes vos réflexions, l\'historique Gemini, vos humeurs, vos séries et vos paramètres seront immédiatement supprimés.',
    deleteAccountGoogleNotice: 'Cela ne supprime que vos données Inkwell. Votre compte Google reste totalement intact et inchangé.',
    typeDeleteToConfirm: 'Pour confirmer, veuillez saisir DELETE ci-dessous :',
    deleteInputPlaceholder: 'Tapez DELETE',
    permanentlyDeleteBtn: 'Tout Supprimer Définitivement',
    deletingAccount: 'Suppression des données et déconnexion...',
    accountDeletedSuccess: 'Compte et Données Supprimés avec Succès',
    accountDeletedSuccessDesc: 'Toutes vos réflexions et vos paramètres personnels ont été intégralement supprimés d\'Inkwell. Votre compte Google n\'a pas été modifié.',
    returnToHome: 'Retour à l\'Accueil',

    needToTalk: 'Besoin de parler à quelqu\'un ?',
    helplineDirectory: 'Lignes d\'écoute gratuites et confidentielles dans plus de 130 pays',

    landingBadge: 'Private & Secure — Only You Can See Your Entries',
    landingHero1: 'Un espace paisible pour écrire, réfléchir et trouver la clarté avec',
    landingHeroWith: '',
    landingHeroGemini: 'Gemini AI',
    landingSubtitle: 'Inkwell associe le confort du journal intime à la vision éclairée de Google Gemini. Décortiquez vos pensées, dialoguez en toute liberté et dégagez des enseignements clairs dans un environnement calme et épuré.',
    signInWithGoogle: 'Se Connecter avec Google',
    connecting: 'Connexion...',
    landingAuthSub: 'Aucun mot de passe requis. Votre compte est protégé par Google et vos écrits ne sont visibles que par vous.',
    feature1Title: 'Dictée Vocale Texte',
    feature1Desc: 'Exprimez vos réflexions à voix haute. La capture vocale double moteur fonctionne sur tous les navigateurs.',
    feature1Badge: 'Fonctionne sur tout navigateur',
    feature2Title: 'Lecture Vocale dans Votre Langue',
    feature2Desc: 'Chaque réflexion et réponse Gemini peut vous être lue à voix haute avec une voix naturelle adaptée.',
    feature2Badge: 'Narration multilingue',
    feature3Title: 'Exportez Votre Journal à Tout Moment',
    feature3Desc: 'Téléchargez n\'importe quelle réflexion en PDF soigné : vos pensées et analyses à conserver hors ligne.',
    feature3Badge: 'Export PDF',
    feature4Title: 'Cinq Atmosphères, Un Journal',
    feature4Desc: 'Choisissez parmi cinq thèmes visuels raffinés, de Paper à Vivid, avec mode sombre automatique le soir.',
    feature4Badge: '5 thèmes',
    feature5Title: 'Parlez Votre Propre Langue',
    feature5Desc: 'Une interface intégralement localisée pour une expérience naturelle et fluide dans votre langue.',
    feature5Badge: 'Localisation intégrale',
    feature6Title: 'Des Perspectives, Pas de Simples Réponses',
    feature6Desc: 'Au-delà de la conversation : synthèse automatique des prises de conscience, tendances d\'humeur et actions.',
    feature6Badge: 'Synthèse par IA',
    footerRights: 'Inkwell — un journal personnel propulsé par Gemini AI.',
    footerAuth: 'Sécurisé par Google Sign-In',
    footerProxy: 'Vos données restent protégées',

    // Onboarding Tour
    onboardingTourTitle: 'Bienvenue sur Inkwell',
    onboardingTourStep: 'Étape {current} sur {total}',
    onboardingNext: 'Suivant',
    onboardingPrev: 'Précédent',
    onboardingFinish: 'Commencer',
    onboardingSkip: 'Passer la visite',
    onboardingReplay: 'Visite guidée',
    onboardingReplaySubtitle: 'Découvrez rapidement en 1 minute toutes les fonctionnalités clés d\'Inkwell',
    tourStep1Title: 'Commencer une Nouvelle Réflexion',
    tourStep1Desc: 'Cliquez sur Nouvelle Réflexion ou écrivez directement dans l\'espace de rédaction pour échanger avec la vision bienveillante de Gemini.',
    tourStep2Title: 'Suivi de l\'Humeur & Étiquettes',
    tourStep2Desc: 'Indiquez votre état d\'esprit (Calme, Inspiré, Éprouvé, etc.) et ajoutez des tags pour structurer votre cheminement.',
    tourStep3Title: 'Modes de Réflexion & Studio Vocal',
    tourStep3Desc: 'Basculez entre Réfléchir, Résumer, Idées et Actions. Dictez à voix haute ou écoutez la lecture audio naturelle.',
    tourStep4Title: 'Coffre du Journal & Recherche',
    tourStep4Desc: 'Parcourez vos écrits passés, recherchez par mots-clés et filtrez facilement par date, humeur, tags et modes.',
    tourStep5Title: 'Analyses IA & Tendances d\'Humeur',
    tourStep5Desc: 'Générez des synthèses conscientes, des prises de conscience et visualisez l\'évolution de votre trajectoire émotionnelle.',
    tourStep6Title: 'Thèmes, Sauvegarde & Verrouillage',
    tourStep6Desc: 'Personnalisez avec 5 thèmes, calendrier de régularité, export/import et sécurisez vos réflexions par code PIN à 4 chiffres.',

    sample: 'Exemple',
    sampleReflection: 'Réflexion d’Exemple',
    whatYouCanDo: 'Ce que vous pouvez faire dans Inkwell',
    sampleEntryTip: 'Ceci est une réflexion d’exemple pour vous aider à explorer. Vous pouvez la modifier, tester les outils ou la supprimer quand vous serez prêt.',

    // Guest Mode & Anonymous Auth
    continueAsGuest: 'Continuer en tant qu’Invité',
    continueAsGuestSubtitle: 'Essayez Inkwell instantanément sans compte Google. Vos données restent sur ce navigateur.',
    guestMode: 'Mode Invité',
    guestModeBadge: 'Invité',
    guestModeNotice: 'Mode Invité : Vos réflexions sont enregistrées sur ce navigateur. Pour les conserver de façon permanente, associez votre compte Google.',
    guestModeDisclaimer: 'Stockage local uniquement. Vider les cookies ou les données réinitialisera cette session.',
    guestModeWarning: 'Les données d’invité ne sont pas synchronisées entre appareils.',
    linkGoogleAccount: 'Associer un Compte Google',
    saveDataPermanently: 'Sauvegarder Définitivement',
    linkingAccount: 'Association du compte...',
    accountLinkedSuccess: 'Compte Google associé avec succès ! Vos réflexions sont désormais protégées en permanence.',
    guestCalendarNotice: 'L’intégration Google Agenda nécessite un vrai compte Google. Connectez-vous avec Google pour lier votre emploi du temps.',
    guestCalendarBtn: 'Se connecter pour lier l’Agenda',
  },

  hi: {
    appName: 'Inkwell',
    appSubtitle: 'एआई चिंतन डायरी और विचारशील स्थान',
    geminiVersion: 'Powered by Gemini',
    vault: 'वॉल्ट',
    newReflection: 'नया चिंतन',
    newShort: 'नया',
    toggleTheme: 'थीम बदलें',
    settings: 'सेटिंग्स',
    howToUse: 'उपयोग कैसे करें (मार्गदर्शिका)',
    howToUseSubtitle: 'चिंतन, गोपनीयता और सभी सुविधाओं की पूरी गाइड',
    signOut: 'सुरक्षित लॉग आउट',
    loadingApp: 'Inkwell लोड हो रहा है...',
    dismiss: 'खारिज करें',
    readyToReflect: 'चिंतन के लिए तैयार हैं?',
    readyToReflectSub: 'Gemini के साथ अपने विचारों को तलाशने और अपनी व्यक्तिगत यात्रा सहेजने के लिए एक नई प्रविष्टि बनाएं।',
    startNewReflection: 'नया चिंतन शुरू करें',

    settingsTitle: 'सेटिंग्स और प्राथमिकताएं',
    settingsSubtitle: 'अपनी डायरी थीम, सुरक्षा लॉक और पढ़ने के फ़ॉन्ट आकार को कस्टमाइज़ करें।',
    themeSection: 'थीम कैनवास',
    themeSectionDesc: 'अपने मूड और मन की स्थिति के अनुसार रंग पैलेट चुनें।',
    themeModeAuto: 'शाम 6:00 बजे के बाद स्वचालित डार्क थीम',
    themeModeAutoDesc: 'डिफ़ॉल्ट मोड में रहने पर शाम को अपने आप डार्क थीम लागू होती है।',
    fontSizeSection: 'फ़ॉन्ट का आकार',
    fontSizeSectionDesc: 'पूरी ऐप में पढ़ने और चिंतन पाठ के आकार को समायोजित करें।',
    languageSection: 'इंटरफ़ेस भाषा',
    languageSectionDesc: 'सभी मेनू और लेबल के लिए अपनी पसंदीदा भाषा चुनें।',
    cloudSyncTitle: 'यूज़र प्रोफ़ाइल सिंक',
    cloudSyncDesc: 'आपकी प्राथमिकताएं आपके निजी खाते के साथ सुरक्षित रूप से सिंक होती हैं।',
    close: 'बंद करें',
    savedAutomatically: 'स्वचालित रूप से सहेजा गया',

    themeLight: 'लाइट',
    themeLightDesc: 'शांत नीले लहजे के साथ साफ और तटस्थ लाइट कैनवास।',
    themeDark: 'डार्क',
    themeDarkDesc: 'अंबर हाइलाइट्स के साथ गर्म चारकोल डार्क थीम।',
    themePaper: 'कागज़ (Paper)',
    themePaperDesc: 'टेराकोटा रंगों और क्लासिक नोटबुक गर्माहट के साथ क्रीम चर्मपत्र।',
    themeVellum: 'वेल्लम (Vellum)',
    themeVellumDesc: 'प्राचीन विंटेज अहसास के लिए सेपिया और बर्न-ऑरेंज शेड्स।',
    themeVivid: 'विविड (Vivid)',
    themeVividDesc: 'इलेक्ट्रिक वायलेट और जीवंत कोरल रंगों के साथ ऊर्जावान पैलेट।',

    fontSmall: 'छोटा',
    fontSmallDesc: 'सघन जानकारी पढ़ने के लिए कॉम्पैक्ट आकार',
    fontMedium: 'मध्यम',
    fontMediumDesc: 'सहज चिंतन के लिए डिफ़ॉल्ट संतुलित पैमाना',
    fontLarge: 'बड़ा',
    fontLargeDesc: 'आरामदायक पठन के लिए स्पष्ट और बड़ा फ़ॉन्ट',

    journalVault: 'डायरी वॉल्ट',
    searchPlaceholder: 'चिंतन, टैग या विचार खोजें...',
    filterByMood: 'मूड के अनुसार फ़िल्टर करें',
    allMoods: 'सभी मूड',
    allReflections: 'सभी चिंतन',
    noEntriesFound: 'आपकी खोज या फ़िल्टर से मेल खाती कोई प्रविष्टि नहीं मिली।',
    noEntriesYet: 'आपके वॉल्ट में अभी कोई प्रविष्टि नहीं है।',
    createFirstEntry: 'अपना पहला चिंतन लिखें',
    deleteEntryConfirm: 'क्या आप वाकई इस चिंतन को हटाना चाहते हैं? आप हटाने के तुरंत बाद इसे वापस ला सकते हैं।',
    deleteConfirmTitle: 'क्या चिंतन हटाएं?',
    deleteConfirmDesc: 'यह चिंतन ट्रैश में भेज दिया जाएगा। आप इसे तुरंत पूर्ववत (Undo) कर सकते हैं।',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    entryDeleted: 'चिंतन हटा दिया गया',
    undo: 'वापस लाएं (Undo)',
    entryRestored: 'चिंतन पुनः स्थापित किया गया',
    yesterday: 'कल',
    edited: 'संपादित',

    filterBtn: 'फ़िल्टर',
    filters: 'फ़िल्टर',
    filterByDate: 'तारीख सीमा',
    filterByMode: 'चिंतन मोड',
    filterByTags: 'टैग्स',
    filterPresetAll: 'सभी समय',
    filterPresetToday: 'आज',
    filterPresetThisWeek: 'इस सप्ताह',
    filterPresetThisMonth: 'इस महीने',
    dateFrom: 'से',
    dateTo: 'तक',
    resetFilters: 'फ़िल्टर रीसेट करें',
    activeFilters: 'सक्रिय फ़िल्टर',

    toggleSidebar: 'वॉल्ट साइडबार दिखाएं/छुपाएं',
    collapseSidebar: 'साइडबार छुपाएं',
    expandSidebar: 'डायरी वॉल्ट खोलें',
    focusMode: 'फ़ोकस मोड',
    exitFocusMode: 'फ़ोकस मोड से बाहर निकलें (Esc)',

    export: 'निर्यात (Export)',
    exportEntry: 'चिंतन निर्यात करें',
    exportAll: 'पूरा वॉल्ट निर्यात करें',
    exportAsPdf: 'PDF दस्तावेज़ डाउनलोड करें',
    exportAsMarkdown: 'Markdown (.md) डाउनलोड करें',
    exportAsPlainText: 'सादा टेक्स्ट (.txt) डाउनलोड करें',
    exportAsJson: 'संरचित डेटा (.json) डाउनलोड करें',

    // Import
    importData: 'डेटा बैकअप आयात करें (Import)',
    importDataSubtitle: 'Inkwell JSON बैकअप से चिंतन पुनर्स्थापित करें',
    importDesc: 'अपने वॉल्ट में पुनर्स्थापित करने के लिए पूर्व में निर्यात की गई JSON फ़ाइल चुनें।',
    importSuccess: 'डेटा सफलतापूर्वक आयात किया गया',
    importSuccessDesc: 'आपके चिंतन सुरक्षित रूप से आपके वॉल्ट में जोड़ दिए गए हैं।',
    importMergeNotice: 'सुरक्षित विलय (Non-destructive Merge): आयात की गई प्रविष्टियां आपके मौजूदा डेटा को मिटाए बिना वॉल्ट में जोड़ी जाएंगी।',
    importDuplicatesSkipped: 'डुप्लिकेट प्रविष्टियों को स्वचालित रूप से छोड़ दिया गया।',
    importNoNewEntries: 'इस बैकअप फ़ाइल की सभी प्रविष्टियां पहले से आपके वॉल्ट में मौजूद हैं।',
    importInvalidFile: 'अमान्य या विकृत JSON बैकअप फ़ाइल।',
    importProcessing: 'फ़ाइल संरचना की जांच की जा रही है...',
    importConfirmBtn: 'चिंतन आयात करें',
    importSelectFile: 'JSON फ़ाइल चुनें',
    dragAndDropJson: 'अपनी Inkwell JSON बैकअप फ़ाइल यहां छोड़ें',
    browseFile: 'फ़ाइलें ब्राउज़ करें',
    entriesToImport: 'आयात के लिए प्रविष्टियां',
    duplicatesFound: 'डुप्लिकेट मिले (छोड़े गए)',
    dateRange: 'समय सीमा',
    previewEntries: 'प्रविष्टियों का पूर्वावलोकन',

    streak: 'स्ट्रिक (Streak)',
    streakTitle: 'चिंतन निरंतरता',
    currentStreak: 'वर्तमान स्ट्रिक',
    longestStreak: 'सर्वोत्तम स्ट्रिक',
    totalDaysReflected: 'डायरी लिखने के दिन',
    streakHeatmapTitle: 'गतिविधि (पिछले 6 सप्ताह)',
    streakActiveToday: 'आपने आज डायरी लिखी है! बहुत बढ़िया।',
    streakNeedsEntry: 'अपनी स्ट्रिक बनाए रखने के लिए आज एक चिंतन लिखें।',

    appLockTitle: 'ऐप लॉक और सुरक्षा',
    appLockDesc: 'निष्क्रियता के बाद अपनी डायरी देखने के लिए 4-अंकीय पिन अनिवार्य करें।',
    enableAppLock: 'ऐप लॉक सक्रिय करें (PIN)',
    setPinCode: '4-अंकीय पिन सेट करें',
    enterPinCode: '4-अंकीय पिन दर्ज करें',
    confirmPinCode: 'पिन की पुष्टि करें',
    changePinCode: 'पिन बदलें',
    pinMismatch: 'पिन मेल नहीं खाते। कृपया पुनः प्रयास करें।',
    autoLockTimeout: 'ऑटो-लॉक समय सीमा',
    timeout1Min: '1 मिनट',
    timeout5Min: '5 मिनट',
    timeout15Min: '15 मिनट',
    timeout30Min: '30 मिनट',
    timeoutNever: 'कभी नहीं (केवल मैन्युअल लॉक)',
    unlockApp: 'Inkwell अनलॉक करें',
    appLockedTitle: 'Inkwell लॉक है',
    appLockedDesc: 'अपनी निजी डायरी तक पहुंचने के लिए अपना 4-अंकीय पिन दर्ज करें।',
    incorrectPin: 'गलत पिन। कृपया पुनः प्रयास करें।',
    forgotPin: 'पिन भूल गए?',
    forgotPinPrompt: 'अपना पिन रीसेट करने के लिए अपने Google खाते से पुनः प्रमाणित करें।',
    reauthSuccess: 'सफलतापूर्वक प्रमाणित। अब आप नया पिन सेट कर सकते हैं।',

    modeReflect: 'चिंतन',
    modeSummarize: 'सारांश',
    modeBrainstorm: 'मंथन',
    modeActionItems: 'कार्य बिंदु',
    modeReflectDesc: 'सहानुभूतिपूर्ण पूछताछ और विचारशील प्रश्न',
    modeSummarizeDesc: 'प्रमुख अनुभूतियों और भावनात्मक दिशा का सारांश',
    modeBrainstormDesc: 'रचनात्मक दृष्टिकोण, उपमाओं और विकल्पों की खोज',
    modeActionItemsDesc: 'स्पष्ट, प्राथमिकता वाले अगले कदमों का निष्कर्षण',

    inputPlaceholder: 'अपने विचारों को खुलकर लिखें, मन की बात साझा करें या Gemini से चिंतन में मदद लें...',
    reflectOnThis: 'इस पर विचार करें',
    reflectActionPlaceholder: 'अपने विचार खुलकर लिखें... बिना किसी बाधा के कई पैराग्राफ, शांत विचार या आत्मचिंतन लिखें। जब तैयार हों, तो Gemini को विचार करने के लिए आमंत्रित करें।',
    continueWritingPlaceholder: 'अपना चिंतन आगे लिखना जारी रखें... जितना चाहें उतना लिखें।',
    geminiReflecting: 'Gemini आपकी प्रविष्टि पर विचार कर रहा है...',
    send: 'भेजें',
    voiceInput: 'ध्वनि इनपुट',
    stopVoiceInput: 'रिकॉर्डिंग रोकें',
    listening: 'आपकी आवाज सुनी जा रही है...',
    transcribingAudio: 'Gemini के साथ आवाज को टेक्स्ट में बदला जा रहा है...',
    speechNotSupported: 'इस ब्राउज़र में माइक्रोफ़ोन समर्थित नहीं है।',
    micDisabledAudioPlaying: 'जब तक ऑडियो चल रहा है, माइक्रोफ़ोन अक्षम रहेगा।',
    readAloud: 'बोलकर सुनाएं',
    stopReadAloud: 'पठन रोकें',
    readingAloud: 'संदेश पढ़कर सुनाया जा रहा है...',
    ttsNotSupported: 'इस ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित नहीं है।',
    voiceNotAvailable: 'आपके डिवाइस पर इस भाषा के लिए आवाज़ उपलब्ध नहीं है।',
    suggestedPrompts: 'सुझाए गए चिंतन प्रॉम्प्ट',
    geminiThinking: 'Gemini आपके विचारों का विश्लेषण कर रहा है...',
    insights: 'इनसाइट्स',
    copyInsights: 'इनसाइट्स कॉपी करें',
    copied: 'कॉपी हो गया',
    saveStatusSaved: '',
    saveStatusSaving: 'सहेजा जा रहा है...',
    saveStatusError: 'सहेजने में त्रुटि',
    untitledReflection: 'शीर्षकहीन चिंतन',
    addTag: 'टैग जोड़ें',
    enterTagPlaceholder: 'टैग का नाम...',
    deleteEntry: 'प्रविष्टि हटाएं',
    moodSelect: 'मूड चुनें',
    editThought: 'विचार संपादित करें',
    saveChanges: 'बदलाव सहेजें',
    saveAndRegenerate: 'सहेजें और Gemini उत्तर पुनः उत्पन्न करें',
    cancelEdit: 'रद्द करें',
    editClarification: 'संपादित करने से आपके शब्द अपडेट होते हैं, Gemini का उत्तर नहीं बदलता।',
    editedMessageLabel: 'संपादित',

    promptUnpack: 'आज जो कुछ हुआ और उससे मुझे क्या सीख मिली, उसे समझने में मदद करें।',
    promptPatterns: 'मेरे द्वारा साझा की गई बातों में आप क्या पैटर्न या अनदेखे बिंदु देखते हैं?',
    promptBrainstorm: 'इस दुविधा पर 3 नए दृष्टिकोण खोजने में मेरी मदद करें।',
    promptActionSteps: 'मेरे विचारों को 3 स्पष्ट, क्रियाशील अगले चरणों में बदलें।',

    moodReflective: 'विचारशील',
    moodCalm: 'शांत',
    moodOptimistic: 'आशावादी',
    moodInspired: 'प्रेरित',
    moodChallenged: 'चुनौतीपूर्ण',
    moodGrateful: 'आभारी',
    moodAnxious: 'चिंतित',
    moodEnergized: 'ऊर्जावान',

    insightsTitle: 'Gemini संश्लेषण और इनसाइट्स',
    executiveSummary: 'कार्यकारी चिंतन सारांश',
    keyRealizations: 'प्रमुख अनुभूतियां और पैटर्न',
    creativeBrainstorming: 'रचनात्मक विचार और नए दृष्टिकोण',
    emotionalTone: 'भावनात्मक स्वर',
    tagsLabel: 'टैग्स',
    none: 'कोई नहीं',

    moodTrends: 'मूड रुझान (Mood Trends)',
    moodTrendsSubtitle: 'समय के साथ आपके मनोभावों के प्रतिरूप का अवलोकन',
    viewMoodTrends: 'मूड रुझान देखें',
    timeRange2Weeks: 'पिछले 2 सप्ताह',
    timeRange1Month: 'पिछला महीना',
    timeRange3Months: 'पिछले 3 महीने',
    timeRangeAllTime: 'सभी समय',
    moodTrajectory: 'मूड प्रक्षेपवक्र (Trajectory)',
    moodDistribution: 'मूड आवृत्ति और वितरण',
    noMoodData: 'इस समयावधि में कोई टैग किया गया मूड नहीं मिला।',
    noMoodDataDesc: 'चिंतन लिखते समय मूड टैग (जैसे शांत, प्रेरित, आभारी) जोड़ें ताकि आप यहां अपने रुझान देख सकें।',
    totalMoodEntries: 'मूड के साथ चिंतन',
    dominantMood: 'सर्वाधिक बार चुना गया मूड',
    moodDiversity: 'विभिन्न मूड',
    purelyObservationalNotice: 'यह चार्ट केवल आपके व्यक्तिगत चिंतन के अवलोकन हेतु है।',

    dangerZone: 'खतरे का क्षेत्र (Danger Zone)',
    deleteAccount: 'खाता और सभी डेटा हटाएं',
    deleteAccountDesc: 'क्लाउड स्टोरेज से अपनी सभी विचार डायरी, स्ट्रीक और सेटिंग्स हमेशा के लिए मिटाएं।',
    deleteAccountConfirmTitle: 'क्या आप खाता और सारा Inkwell डेटा हटाना चाहते हैं?',
    deleteAccountConfirmDesc: 'यह क्रिया स्थायी और अपरिवर्तनीय है। आपके सभी विचार, Gemini बातचीत, मनोदशाएं, स्ट्रीक और सेटिंग्स तुरंत मिटा दी जाएंगी।',
    deleteAccountGoogleNotice: 'यह केवल आपके Inkwell डेटा को हटाएगा। आपका Google खाता पूरी तरह सुरक्षित रहेगा।',
    typeDeleteToConfirm: 'पुष्टि करने के लिए नीचे DELETE लिखें:',
    deleteInputPlaceholder: 'DELETE टाइप करें',
    permanentlyDeleteBtn: 'सब कुछ हमेशा के लिए हटाएं',
    deletingAccount: 'डेटा मिटाया जा रहा है और साइन आउट हो रहा है...',
    accountDeletedSuccess: 'खाता और डेटा सफलतापूर्वक हटाया गया',
    accountDeletedSuccessDesc: 'आपकी सभी प्रविष्टियां और सेटिंग्स Inkwell से पूरी तरह हटा दी गई हैं।',
    returnToHome: 'होम पेज पर वापस जाएं',

    needToTalk: 'क्या आपको किसी से बात करनी है?',
    helplineDirectory: '130+ देशों में निःशुल्क, गोपनीय संकट हेल्पलाइन खोजें',

    landingBadge: 'Private & Secure — Only You Can See Your Entries',
    landingHero1: 'लिखने, चिंतन करने और स्पष्टता पाने का एक शांत स्थान -',
    landingHeroWith: '',
    landingHeroGemini: 'Gemini AI के साथ',
    landingSubtitle: 'Inkwell व्यक्तिगत डायरी के सुकून को Google Gemini की विचारशील समझ से जोड़ता है। अपने विचारों को सुलझाएं, जो मन में है उस पर बात करें और एक शांत माहौल में स्पष्ट निष्कर्ष पाएं।',
    signInWithGoogle: 'Google से साइन इन करें',
    connecting: 'कनेक्ट हो रहा है...',
    landingAuthSub: 'पासवर्ड की आवश्यकता नहीं। आपका खाता Google द्वारा सुरक्षित है, और आपकी प्रविष्टियां केवल आप देख सकते हैं।',
    feature1Title: 'आवाज से टेक्स्ट डिक्टेशन',
    feature1Desc: 'अपने विचारों को स्वाभाविक रूप से बोलें। डुअल-इंजन वॉयस कैप्चर हर ब्राउज़र में सुचारू रूप से काम करता है।',
    feature1Badge: 'सभी ब्राउज़र में सक्षम',
    feature2Title: 'अपनी भाषा में बोलकर सुनें',
    feature2Desc: 'हर चिंतन और Gemini प्रतिक्रिया को सभी समर्थित भाषाओं में प्राकृतिक आवाज के साथ सुना जा सकता है।',
    feature2Badge: 'बहुभाषी वाचन',
    feature3Title: 'कभी भी अपनी डायरी निर्यात करें',
    feature3Desc: 'किसी भी चिंतन को स्पष्ट, प्रिंट-रेडी PDF के रूप में डाउनलोड करें — आपके विचार हमेशा आपके पास सुरक्षित।',
    feature3Badge: 'PDF निर्यात',
    feature4Title: 'पाँच मूड, एक डायरी',
    feature4Desc: 'शांत Paper से लेकर जीवंत Vivid तक पाँच अनूठी थीम चुनें — शाम को स्वचालित डार्क मोड के साथ।',
    feature4Badge: '5 थीम',
    feature5Title: 'अपनी भाषा में संवाद करें',
    feature5Desc: 'पूरी तरह से स्थानीयकृत इंटरफ़ेस — आपकी अपनी भाषा में एक संपूर्ण और सहज अनुभव।',
    feature5Badge: 'पूर्ण स्थानीयकरण',
    feature6Title: 'गहन इनसाइट्स, सिर्फ उत्तर नहीं',
    feature6Desc: 'संवाद से आगे: स्वचालित संश्लेषण प्रमुख अनुभूतियों, मूड के रुझानों और प्राथमिक कदमों को निकालता है।',
    feature6Badge: 'एआई-संचालित संश्लेषण',
    footerRights: 'Inkwell — Gemini AI द्वारा संचालित एक व्यक्तिगत डायरी।',
    footerAuth: 'Google Sign-In द्वारा सुरक्षित',
    footerProxy: 'आपका डेटा पूरी तरह सुरक्षित है',

    // Onboarding Tour
    onboardingTourTitle: 'Inkwell में आपका स्वागत है',
    onboardingTourStep: 'चरण {current} / {total}',
    onboardingNext: 'आगे',
    onboardingPrev: 'पीछे',
    onboardingFinish: 'शुरू करें',
    onboardingSkip: 'टूर छोड़ें',
    onboardingReplay: 'गाइडेड टूर',
    onboardingReplaySubtitle: 'Inkwell की सभी प्रमुख विशेषताओं का त्वरित 1 मिनट का परिचय देखें',
    tourStep1Title: 'नया चिंतन शुरू करें',
    tourStep1Desc: 'नया चिंतन पर टैप करें या सीधे लिखना शुरू करें और Gemini के साथ संवेदनशील व स्पष्ट दृष्टिकोण प्राप्त करें।',
    tourStep2Title: 'मूड ट्रैकिंग और कस्टम टैग',
    tourStep2Desc: 'अपनी मनोदशा (शांत, प्रेरित, आभारी आदि) चुनें और अपनी भावनात्मक यात्रा को व्यवस्थित करने के लिए टैग जोड़ें।',
    tourStep3Title: 'चिंतन मोड और वॉयस स्टूडियो',
    tourStep3Desc: 'चिंतन, सारांश, विचार मंथन और एक्शन आइटम मोड के बीच स्विच करें। वॉयस इनपुट से बोलें या रीड अलाउड से सुनें।',
    tourStep4Title: 'डायरी वॉल्ट और खोज फ़िल्टर',
    tourStep4Desc: 'पिछले चिंतन देखें, शब्दों से तुरंत खोजें, और दिनांक, मूड या टैग द्वारा आसानी से फ़िल्टर करें।',
    tourStep5Title: 'एआई इनसाइट्स और मूड रुझान',
    tourStep5Desc: 'विचारशील सारांश व मुख्य अनुभूतियाँ प्राप्त करें और समय के साथ अपनी मनोदशा के रुझानों को देखें।',
    tourStep6Title: 'थीम, बैकअप और सुरक्षा लॉक',
    tourStep6Desc: '5 थीम, निरंतरता स्ट्रीक, निर्यात/आयात अनुकूलित करें और 4-अंकीय पिन लॉक से डायरी सुरक्षित रखें।',

    sample: 'नमूना',
    sampleReflection: 'नमूना चिंतन',
    whatYouCanDo: 'Inkwell में आप क्या कर सकते हैं',
    sampleEntryTip: 'यह आपको परिचित कराने के लिए एक नमूना चिंतन है। आप इसे संपादित कर सकते हैं, टूल आज़मा सकते हैं, या अपनी डायरी लिखने के लिए इसे कभी भी हटा सकते हैं।',

    // Guest Mode & Anonymous Auth
    continueAsGuest: 'अतिथि के रूप में जारी रखें',
    continueAsGuestSubtitle: 'Google खाते के बिना तुरंत आज़माएँ। डेटा केवल इस ब्राउज़र में रहेगा।',
    guestMode: 'अतिथि मोड',
    guestModeBadge: 'अतिथि',
    guestModeNotice: 'अतिथि मोड: चिंतन केवल इस ब्राउज़र में सहेजे गए हैं। डेटा को हमेशा सुरक्षित रखने के लिए अपना Google खाता जोड़ें।',
    guestModeDisclaimer: 'केवल डिवाइस संग्रहण। ब्राउज़र कुकीज़ हटाने पर यह सत्र रीसेट हो जाएगा।',
    guestModeWarning: 'अतिथि डेटा अन्य डिवाइस पर सिंक नहीं होता है।',
    linkGoogleAccount: 'Google खाता लिंक करें',
    saveDataPermanently: 'डेटा स्थायी रूप से सुरक्षित करें',
    linkingAccount: 'खाता लिंक हो रहा है...',
    accountLinkedSuccess: 'Google खाता सफलतापूर्वक लिंक हो गया! आपके चिंतन अब स्थायी रूप से सुरक्षित हैं।',
    guestCalendarNotice: 'Google Calendar एकीकरण के लिए वास्तविक Google खाते की आवश्यकता है। कैलेंडर जोड़ने के लिए Google से साइन इन करें।',
    guestCalendarBtn: 'कैलेंडर कनेक्ट करने के लिए साइन इन करें',
  },

  ta: {
    appName: 'Inkwell',
    appSubtitle: 'AI சிந்தனை நாட்குறிப்பு & அமைதியான சிந்தனை வெளி',
    geminiVersion: 'Powered by Gemini',
    vault: 'பெட்டகம்',
    newReflection: 'புதிய சிந்தனை',
    newShort: 'புதியது',
    toggleTheme: 'தீம் மாற்றவும்',
    settings: 'அமைப்புகள்',
    howToUse: 'பயன்படுத்துவது எப்படி (வழிகாட்டி)',
    howToUseSubtitle: 'சிந்தனை, தனியுரிமை & அம்சங்களின் முழு வழிகாட்டி',
    signOut: 'பாதுகாப்பாக வெளியேறவும்',
    loadingApp: 'Inkwell ஏற்றப்படுகிறது...',
    dismiss: 'மூடுக',
    readyToReflect: 'சிந்திக்க தயாரா?',
    readyToReflectSub: 'Gemini உடன் உங்கள் எண்ணங்களை ஆராயவும் உங்கள் தனிப்பட்ட பயணத்தைப் பாதுகாக்கவும் புதிய பதிவை உருவாக்கவும்.',
    startNewReflection: 'புதிய சிந்தனையைத் தொடங்குக',

    settingsTitle: 'அமைப்புகள் & விருப்பத்தேர்வுகள்',
    settingsSubtitle: 'உங்கள் நாட்குறிப்பு தீம், தனியுரிமை பூட்டு மற்றும் வாசிப்பு எழுத்துரு அளவைத் தனிப்பயனாக்கவும்.',
    themeSection: 'தீம் கேன்வாஸ்',
    themeSectionDesc: 'உங்கள் மனநிலைக்கு ஏற்ற வண்ணப் பின்னணியைத் தேர்ந்தெடுக்கவும்.',
    themeModeAuto: 'மாலை 6:00 மணிக்கு மேல் தானியங்கி டார்க் தீம்',
    themeModeAutoDesc: 'இயல்புநிலை அமைப்பில் இருக்கும்போது மாலையில் தானாகவே இருண்ட வண்ணத்திற்கு மாறும்.',
    fontSizeSection: 'எழுத்துரு அளவு',
    fontSizeSectionDesc: 'பயன்பாடு முழுவதும் வாசிப்பு மற்றும் சிந்தனை உரை அளவை மாற்றியமைக்கவும்.',
    languageSection: 'பயனர் இடைமுக மொழி',
    languageSectionDesc: 'அனைத்து மெனுக்கள் மற்றும் லேபிள்களுக்கான உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்.',
    cloudSyncTitle: 'பயனர் சுயவிவர ஒத்திசைவு',
    cloudSyncDesc: 'உங்கள் விருப்பத்தேர்வுகள் உங்கள் தனிப்பட்ட கணக்குடன் பாதுகாப்பாக ஒத்திசைக்கப்படும்.',
    close: 'மூடுக',
    savedAutomatically: 'தானாகச் சேமிக்கப்பட்டது',

    themeLight: 'லைட்',
    themeLightDesc: 'அமைதியான நீல நிறத்துடன் தெளிவான லைட் கேன்வாஸ்.',
    themeDark: 'டார்க்',
    themeDarkDesc: 'ஆம்பர் ஒளியுடன் கூடிய சூடான கரிக்கல் டார்க் தீம்.',
    themePaper: 'பேப்பர் (Paper)',
    themePaperDesc: 'கிளாசிக் நோட்டுப்புத்தக உணர்வோடு கூடிய கிரீம் காகிதத் தோற்றம்.',
    themeVellum: 'வெல்லம் (Vellum)',
    themeVellumDesc: 'பழங்கால விண்டேஜ் உணர்வுக்கான செபியா மற்றும் சுட்ட-ஆரஞ்சு வண்ணங்கள்.',
    themeVivid: 'விவிட் (Vivid)',
    themeVividDesc: 'எலக்ட்ரிக் வயலட் மற்றும் பிரகாசமான பவள வண்ணங்களுடன் கூடிய உற்சாகமான தீம்.',

    fontSmall: 'சிறியது',
    fontSmallDesc: 'அடர்த்தியான வாசிப்புக்கான சிறிய அளவு',
    fontMedium: 'நடுத்தரம்',
    fontMediumDesc: 'சமநிலையான இயல்புநிலை வாசிப்பு அளவு',
    fontLarge: 'பெரியது',
    fontLargeDesc: 'எளிதாக வாசிப்பதற்கான விசாலமான எழுத்துரு அளவு',

    journalVault: 'நாட்குறிப்புப் பெட்டகம்',
    searchPlaceholder: 'சிந்தனைகள், குறிச்சொற்கள் அல்லது எண்ணங்களைத் தேடுங்கள்...',
    filterByMood: 'மனநிலை வாரியாக வடிகட்டவும்',
    allMoods: 'அனைத்து மனநிலைகள்',
    allReflections: 'அனைத்து சிந்தனைகள்',
    noEntriesFound: 'பொருத்தமான சிந்தனைகள் எதுவும் கிடைக்கவில்லை.',
    noEntriesYet: 'உங்கள் பெட்டகத்தில் இன்னும் பதிவுகள் இல்லை.',
    createFirstEntry: 'உங்கள் முதல் சிந்தனையை எழுதுங்கள்',
    deleteEntryConfirm: 'இந்த சிந்தனையை நீக்க விரும்புகிறீர்களா? நீக்கிய உடனே இதை மீட்டெடுக்கலாம்.',
    deleteConfirmTitle: 'சிந்தனையை நீக்கவா?',
    deleteConfirmDesc: 'இந்த சிந்தனை குப்பைக்கு மாற்றப்படும். உடனே மீட்டெடுக்கலாம் (Undo).',
    cancel: 'ரத்து செய்',
    delete: 'நீக்கு',
    entryDeleted: 'சிந்தனை நீக்கப்பட்டது',
    undo: 'செயல்தவிர் (Undo)',
    entryRestored: 'சிந்தனை மீட்டெடுக்கப்பட்டது',
    yesterday: 'நேற்று',
    edited: 'திருத்தப்பட்டது',

    filterBtn: 'வடிகட்டி',
    filters: 'வடிகட்டிகள்',
    filterByDate: 'தேதி வரம்பு',
    filterByMode: 'சிந்தனை முறை',
    filterByTags: 'குறிச்சொற்கள்',
    filterPresetAll: 'முழுக்காலம்',
    filterPresetToday: 'இன்று',
    filterPresetThisWeek: 'இந்த வாரம்',
    filterPresetThisMonth: 'இந்த மாதம்',
    dateFrom: 'முதல்',
    dateTo: 'வரை',
    resetFilters: 'வடிகட்டிகளை மீட்டமை',
    activeFilters: 'செயலில் உள்ள வடிகட்டிகள்',

    toggleSidebar: 'பெட்டக பக்கப்பட்டியை மாற்றுக',
    collapseSidebar: 'பக்கப்பட்டியைச் சுருக்குக',
    expandSidebar: 'நாட்குறிப்புப் பெட்டகத்தைத் திறக்க',
    focusMode: 'கவனக் குவிப்பு முறை (Focus Mode)',
    exitFocusMode: 'கவனக் குவிப்பிலிருந்து வெளியேறு (Esc)',

    export: 'ஏற்றுமதி (Export)',
    exportEntry: 'சிந்தனையை ஏற்றுமதி செய்',
    exportAll: 'முழு பெட்டகத்தையும் ஏற்றுமதி செய்',
    exportAsPdf: 'PDF ஆவணமாகப் பதிவிறக்கு',
    exportAsMarkdown: 'Markdown (.md) ஆகப் பதிவிறக்கு',
    exportAsPlainText: 'வெற்று உரையாக (.txt) பதிவிறக்கு',
    exportAsJson: 'கட்டமைக்கப்பட்ட தரவாக (.json) பதிவிறக்கு',

    // Import
    importData: 'தரவு காப்புப்பிரதியை இறக்குமதி செய் (Import)',
    importDataSubtitle: 'Inkwell JSON காப்பிலிருந்து சிந்தனைகளை மீட்டமைக்கவும்',
    importDesc: 'உங்கள் பெட்டகத்தில் மீட்டமைக்க முன் ஏற்றுமதி செய்யப்பட்ட JSON கோப்பைத் தேர்ந்தெடுக்கவும்.',
    importSuccess: 'காப்புப்பிரதி வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது',
    importSuccessDesc: 'உங்கள் சிந்தனைகள் பாதுகாப்பாக உங்கள் பெட்டகத்தில் இணைக்கப்பட்டுள்ளன.',
    importMergeNotice: 'பாதுகாப்பான இணைப்பு: இருக்கும் தரவை மேலெழுதாமல் புதிய பதிவுகள் பெட்டகத்தில் சேர்க்கப்படும்.',
    importDuplicatesSkipped: 'நகல் பதிவுகள் தானாகவே தவிர்க்கப்பட்டன.',
    importNoNewEntries: 'இந்தக் கோப்பிலுள்ள அனைத்து சிந்தனைகளும் ஏற்கனவே உங்கள் பெட்டகத்தில் உள்ளன.',
    importInvalidFile: 'செல்லுபடியாகாத JSON கோப்பு வடிவம்.',
    importProcessing: 'கோப்பு சரிபார்க்கப்படுகிறது...',
    importConfirmBtn: 'சிந்தனைகளை இறக்குமதி செய்',
    importSelectFile: 'JSON கோப்பைத் தேர்ந்தெடு',
    dragAndDropJson: 'Inkwell JSON கோப்பை இங்கே இழுத்து விடவும்',
    browseFile: 'கோப்புகளை உலாவவும்',
    entriesToImport: 'இறக்குமதி செய்ய வேண்டிய பதிவுகள்',
    duplicatesFound: 'நகல்கள் கண்டறியப்பட்டன (தவிர்க்கப்பட்டது)',
    dateRange: 'கால வரம்பு',
    previewEntries: 'பதிவுகளின் முன்னோட்டம்',

    streak: 'தொடர்ச்சி (Streak)',
    streakTitle: 'நாட்குறிப்பு நிலைத்தன்மை',
    currentStreak: 'தற்போதைய தொடர்ச்சி',
    longestStreak: 'நீண்ட தொடர்ச்சி',
    totalDaysReflected: 'எழுதிய நாட்கள்',
    streakHeatmapTitle: 'செயல்பாடு (கடந்த 6 வாரங்கள்)',
    streakActiveToday: 'இன்று நீங்கள் நாட்குறிப்பு எழுதியுள்ளீர்கள்! வாழ்த்துகள்.',
    streakNeedsEntry: 'உங்கள் தொடர்ச்சியைத் தக்கவைக்க இன்று ஒரு சிந்தனையை எழுதுங்கள்.',

    appLockTitle: 'பயன்பாட்டு பூட்டு & பாதுகாப்பு',
    appLockDesc: 'செயலற்ற நிலைக்குப் பிறகு நாட்குறிப்பைப் பார்க்க 4-இலக்க பின்னைப் பயன்படுத்துங்கள்.',
    enableAppLock: 'பயன்பாட்டு பூட்டை இயக்கு (PIN)',
    setPinCode: '4-இலக்க பின் அமைக்க',
    enterPinCode: '4-இலக்க பின்னை உள்ளிடவும்',
    confirmPinCode: 'பின்னை உறுதிப்படுத்தவும்',
    changePinCode: 'பின்னை மாற்றவும்',
    pinMismatch: 'பின்கள் பொருந்தவில்லை. மீண்டும் முயற்சிக்கவும்.',
    autoLockTimeout: 'தானியங்கி பூட்டு நேரம்',
    timeout1Min: '1 நிமிடம்',
    timeout5Min: '5 நிமிடங்கள்',
    timeout15Min: '15 நிமிடங்கள்',
    timeout30Min: '30 நிமிடங்கள்',
    timeoutNever: 'ஒருபோதும் இல்லை (கையேடு பூட்டு மட்டும்)',
    unlockApp: 'Inkwell திறக்க',
    appLockedTitle: 'Inkwell பூட்டப்பட்டுள்ளது',
    appLockedDesc: 'உங்கள் தனிப்பட்ட நாட்குறிப்பை அணுக உங்கள் 4-இலக்க பின்னை உள்ளிடவும்.',
    incorrectPin: 'தவறான பின். மீண்டும் முயற்சிக்கவும்.',
    forgotPin: 'பின் மறந்துவிட்டதா?',
    forgotPinPrompt: 'உங்கள் பின்னை மீட்டமைக்க உங்கள் Google கணக்குடன் மீண்டும் உள்நுழையவும்.',
    reauthSuccess: 'வெற்றிகரமாக அங்கீகரிக்கப்பட்டது. இப்போது புதிய பின்னை அமைக்கலாம்.',

    modeReflect: 'சிந்தித்தல்',
    modeSummarize: 'சுருக்கம்',
    modeBrainstorm: 'புதிய யோசனைகள்',
    modeActionItems: 'செயல் திட்டங்கள்',
    modeReflectDesc: 'பரிவுமிக்க விசாரணை மற்றும் சிந்தனைமிக்க வினாக்கள்',
    modeSummarizeDesc: 'முக்கிய உணர்தல்கள் மற்றும் உணர்ச்சிப் போக்கின் சுருக்கம்',
    modeBrainstormDesc: 'படைப்பாற்றல்மிக்க கோணங்கள், உவமைகள் மற்றும் மாற்றுகள்',
    modeActionItemsDesc: 'முன்னுரிமை அளிக்கப்பட்ட அடுத்த படிகளைப் பிரித்தெடுக்கிறது',

    inputPlaceholder: 'உங்கள் எண்ணங்களை சுதந்திரமாக எழுதுங்கள் அல்லது Gemini உடன் உரையாடத் தொடங்குங்கள்...',
    reflectOnThis: 'சிந்திக்கவும்',
    reflectActionPlaceholder: 'உங்கள் எண்ணங்களை சுதந்திரமாக எழுதுங்கள்... குறுக்கீடுகள் இன்றி பல பத்திகள், அமைதியான சிந்தனைகள் அல்லது மூல எண்ணங்களை எழுதுங்கள். தயாரானதும், சிந்திக்க ஜெமினியை அழைக்கவும்.',
    continueWritingPlaceholder: 'உங்கள் சிந்தனையை தொடர்ந்து எழுதுங்கள்... நீங்கள் விரும்பும் வரை எழுதுங்கள்.',
    geminiReflecting: 'ஜெமினி உங்கள் பதிவை சிந்திக்கிறது...',
    send: 'அனுப்புக',
    voiceInput: 'குரல் உள்ளீடு',
    stopVoiceInput: 'பதிவை நிறுத்து',
    listening: 'உங்கள் குரல் கேட்கப்படுகிறது...',
    transcribingAudio: 'Gemini மூலம் உங்கள் குரல் உரையாக மாற்றப்படுகிறது...',
    speechNotSupported: 'இந்த உலாவியில் மைக்ரோஃபோன் ஆதரிக்கப்படவில்லை.',
    micDisabledAudioPlaying: 'ஆடியோ இயங்கும் போது மைக்ரோஃபோன் முடக்கப்பட்டுள்ளது.',
    readAloud: 'உரக்க வாசிக்க',
    stopReadAloud: 'வாசிப்பை நிறுத்து',
    readingAloud: 'செய்தி உரக்க வாசிக்கப்படுகிறது...',
    ttsNotSupported: 'இந்த உலாவியில் உரையிலிருந்து குரல் மாற்றம் ஆதரிக்கப்படவில்லை.',
    voiceNotAvailable: 'உங்கள் சாதனத்தில் இந்த மொழிக்கான குரல் கிடைக்கவில்லை.',
    suggestedPrompts: 'பரிந்துரைக்கப்பட்ட சிந்தனை வழிகாட்டிகள்',
    geminiThinking: 'Gemini உங்கள் சிந்தனையை ஆராய்கிறது...',
    insights: 'நுண்ணறிவு',
    copyInsights: 'நுண்ணறிவை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    saveStatusSaved: '',
    saveStatusSaving: 'சேமிக்கப்படுகிறது...',
    saveStatusError: 'சேமிப்பதில் பிழை',
    untitledReflection: 'தலைப்பில்லாத சிந்தனை',
    addTag: 'குறிச்சொல் சேர்க்க',
    enterTagPlaceholder: 'குறிச்சொல் பெயர்...',
    deleteEntry: 'பதிவை நீக்கு',
    moodSelect: 'மனநிலை தேர்வு',
    editThought: 'சிந்தனையைத் திருத்து',
    saveChanges: 'மாற்றங்களைச் சேமி',
    saveAndRegenerate: 'சேமித்து Gemini பதிலை மீண்டும் உருவாக்கு',
    cancelEdit: 'ரத்து செய்',
    editClarification: 'திருத்துவது உங்கள் வார்த்தைகளை மட்டுமே புதுப்பிக்கும், Gemini இன் பதிலை மாற்றாது.',
    editedMessageLabel: 'திருத்தப்பட்டது',

    promptUnpack: 'இன்று நடந்ததையும் அதனால் நான் கற்றுக்கொண்டதையும் பகுப்பாய்வு செய்ய உதவுங்கள்.',
    promptPatterns: 'நான் பகிர்ந்தவற்றில் நீங்கள் கவனிக்கும் வடிவங்கள் அல்லது குருட்டுப் புள்ளிகள் யாவை?',
    promptBrainstorm: 'இந்த இக்கட்டான நிலைக்கு 3 புதிய கோணங்களை யோசிக்க உதவுங்கள்.',
    promptActionSteps: 'என் எண்ணங்களை 3 தெளிவான, செயல்படுத்தக்கூடிய படிகளாக மாற்றவும்.',

    moodReflective: 'சிந்தனைமிக்க',
    moodCalm: 'அமைதியான',
    moodOptimistic: 'நம்பிக்கையான',
    moodInspired: 'ஊக்கமளிக்கும்',
    moodChallenged: 'சவாலான',
    moodGrateful: 'நன்றியுணர்வுள்ள',
    moodAnxious: 'பதட்டமான',
    moodEnergized: 'சுறுசுறுப்பான',

    insightsTitle: 'Gemini தொகுப்பு & நுண்ணறிவுகள்',
    executiveSummary: 'நிர்வாக சிந்தனைச் சுருக்கம்',
    keyRealizations: 'முக்கிய உணர்தல்கள் & வடிவங்கள்',
    creativeBrainstorming: 'படைப்பாற்றல் யோசனைகள் & அடுத்த கோணங்கள்',
    emotionalTone: 'உணர்ச்சி தொனி',
    tagsLabel: 'குறிச்சொற்கள்',
    none: 'எதுவுமில்லை',

    moodTrends: 'மனநிலை போக்குகள் (Mood Trends)',
    moodTrendsSubtitle: 'காலப்போக்கில் உங்கள் உணர்வு வடிவங்களின் பார்வை',
    viewMoodTrends: 'மனநிலை போக்குகளைக் காண்க',
    timeRange2Weeks: 'கடந்த 2 வாரங்கள்',
    timeRange1Month: 'கடந்த மாதம்',
    timeRange3Months: 'கடந்த 3 மாதங்கள்',
    timeRangeAllTime: 'எல்லா காலமும்',
    moodTrajectory: 'மனநிலை பாதை',
    moodDistribution: 'மனநிலை அதிர்வெண் & பகிர்வு',
    noMoodData: 'இந்தக் காலக்கட்டத்தில் எந்த மனநிலைப் பதிவும் இல்லை.',
    noMoodDataDesc: 'பதிவுகள் எழுதும் போது மனநிலையைக் குறித்தால் (அமைதி, ஊக்கம் போன்றவை), இங்கு வடிவங்களைக் காணலாம்.',
    totalMoodEntries: 'மனநிலையுடன் கூடிய பதிவுகள்',
    dominantMood: 'அடிக்கடி நிலவிய மனநிலை',
    moodDiversity: 'தனித்துவ மனநிலைகள்',
    purelyObservationalNotice: 'இந்த வரைபடம் உங்கள் தனிப்பட்ட சிந்தனைப் பார்வைக்கானது மட்டுமே.',

    dangerZone: 'எச்சரிக்கை பகுதி (Danger Zone)',
    deleteAccount: 'கணக்கு மற்றும் தரவை நீக்குக',
    deleteAccountDesc: 'உங்கள் அனைத்து நாட்குறிப்புகள், சிந்தனைகள் மற்றும் அமைப்புகளை கிளவுடில் இருந்து நிரந்தரமாக அழிக்கவும்.',
    deleteAccountConfirmTitle: 'கணக்கு மற்றும் அனைத்து Inkwell தரவையும் நீக்கவா?',
    deleteAccountConfirmDesc: 'இந்த செயல் நிரந்தரமானது மற்றும் மாற்ற முடியாதது. உங்கள் அனைத்து சிந்தனைகள், Gemini வரலாறு, மனநிலைகள் மற்றும் அமைப்புகள் உடனடியாக அழிக்கப்படும்.',
    deleteAccountGoogleNotice: 'இது உங்கள் Inkwell தரவை மட்டுமே நீக்கும். உங்கள் Google கணக்கு எந்த வகையிலும் பாதிக்கப்படாது.',
    typeDeleteToConfirm: 'உறுதிப்படுத்த கீழே DELETE என தட்டச்சு செய்யவும்:',
    deleteInputPlaceholder: 'DELETE என தட்டச்சு செய்க',
    permanentlyDeleteBtn: 'அனைத்தையும் நிரந்தரமாக நீக்குக',
    deletingAccount: 'தரவு அழிக்கப்பட்டு வெளியேறுகிறது...',
    accountDeletedSuccess: 'கணக்கு & தரவு வெற்றிகரமாக நீக்கப்பட்டது',
    accountDeletedSuccessDesc: 'உங்கள் அனைத்து சிந்தனைகள் மற்றும் அமைப்புகள் Inkwell இலிருந்து முழுமையாக அகற்றப்பட்டன.',
    returnToHome: 'முகப்புப் பக்கத்திற்குத் திரும்பு',

    needToTalk: 'யாருடனாவது பேச வேண்டுமா?',
    helplineDirectory: '130+ நாடுகளில் இலவச, ரகசிய உதவி எண்களைக் கண்டறியுங்கள்',

    landingBadge: 'Private & Secure — Only You Can See Your Entries',
    landingHero1: 'எழுத, சிந்திக்க மற்றும் தெளிவு பெற ஒரு அமைதியான இடம் -',
    landingHeroWith: '',
    landingHeroGemini: 'Gemini AI உடன்',
    landingSubtitle: 'Inkwell தனிப்பட்ட நாட்குறிப்பின் வசதியை Google Gemini இன் சிந்தனைப் பார்வையுடன் இணைக்கிறது. உங்கள் எண்ணங்களை ஆராயுங்கள், மனதில் உள்ளதைப் பற்றி உரையாடுங்கள் மற்றும் அமைதியான சூழலில் தெளிவான முடிவுகளைப் பெறுங்கள்.',
    signInWithGoogle: 'Google மூலம் உள்நுழைக',
    connecting: 'இணைக்கிறது...',
    landingAuthSub: 'கடவுச்சொற்கள் தேவையில்லை. உங்கள் கணக்கு Google ஆல் பாதுகாக்கப்படுகிறது, மேலும் உங்கள் பதிவுகளை நீங்கள் மட்டுமே பார்க்க முடியும்.',
    feature1Title: 'குரல்வழி உரை உள்ளீடு (Dictation)',
    feature1Desc: 'உங்கள் சிந்தனைகளை இயல்பாகப் பேசுங்கள். இரட்டை இயந்திரக் குரல் பதிவு அனைத்து உலாவிகளிலும் சிறப்பாகச் செயல்படும்.',
    feature1Badge: 'அனைத்து உலாவிகளிலும் இயங்கும்',
    feature2Title: 'உங்கள் மொழியில் உரக்க வாசிப்பு',
    feature2Desc: 'ஒவ்வொரு சிந்தனையையும் Gemini இன் பதிலையும் அனைத்து மொழிகளிலும் இயல்பான குரல்வழியாகக் கேட்கலாம்.',
    feature2Badge: 'பன்மொழி வாசிப்பு',
    feature3Title: 'எப்போது வேண்டுமானாலும் ஏற்றுமதி செய்க',
    feature3Desc: 'எந்தவொரு சிந்தனையையும் நேர்த்தியான PDF ஆகப் பதிவிறக்குங்கள் — உங்கள் சிந்தனைகள் ஆஃப்லைனிலும் எப்போதும் உங்களுடன்.',
    feature3Badge: 'PDF ஏற்றுமதி',
    feature4Title: 'ஐந்து மனநிலைகள், ஒரே நாட்குறிப்பு',
    feature4Desc: 'Paper முதல் Vivid வரை ஐந்து தனித்துவமான தீம்களைத் தேர்வுசெய்க — மாலை நேர தானியங்கி இருண்ட பயன்முறையுடன்.',
    feature4Badge: '5 தீம்கள்',
    feature5Title: 'உங்கள் சொந்த மொழியில் பேசுங்கள்',
    feature5Desc: 'முழுமையாக மொழிபெயர்க்கப்பட்ட இடைமுகம் — உங்கள் தாய்மொழியில் ஒரு முழுமையான அனுபவம்.',
    feature5Badge: 'முழுமையான மொழிபெயர்ப்பு',
    feature6Title: 'நுண்ணறிவுகள், வெறும் பதில்கள் மட்டுமல்ல',
    feature6Desc: 'உரையாடலுக்கு அப்பால்: தானியங்கி தொகுப்பு முக்கிய உணர்தல்கள், மனநிலை போக்குகள் மற்றும் அடுத்த கட்ட நடவடிக்கைகளைப் பிரித்தெடுக்கிறது.',
    feature6Badge: 'AI தொகுப்பு நுண்ணறிவு',
    footerRights: 'Inkwell — Gemini AI மூலம் இயங்கும் தனிப்பட்ட நாட்குறிப்பு.',
    footerAuth: 'Google Sign-In மூலம் பாதுகாக்கப்பட்டது',
    footerProxy: 'உங்கள் தரவு பாதுகாப்பாக உள்ளது',

    // Onboarding Tour
    onboardingTourTitle: 'Inkwell-க்கு நல்வரவு',
    onboardingTourStep: 'படி {current} / {total}',
    onboardingNext: 'அடுத்து',
    onboardingPrev: 'முந்தையது',
    onboardingFinish: 'தொடங்குங்கள்',
    onboardingSkip: 'சுற்றுப்பயணத்தைத் தவிர்',
    onboardingReplay: 'வழிகாட்டி சுற்றுப்பயணம்',
    onboardingReplaySubtitle: 'Inkwell-இன் அனைத்து முக்கிய அம்சங்களையும் 1 நிமிடத்தில் எளிதாக அறிந்துகொள்ளுங்கள்',
    tourStep1Title: 'புதிய சிந்தனையைத் தொடங்குங்கள்',
    tourStep1Desc: 'புதிய சிந்தனை பொத்தானை அழுத்தி அல்லது நேரடியாக எழுதி Gemini-இன் சிந்தனைப் பார்வையுடன் உரையாடுங்கள்.',
    tourStep2Title: 'மனநிலைப் பதிவு & குறிச்சொற்கள்',
    tourStep2Desc: 'உங்கள் மனநிலையைக் குறித்து (அமைதி, ஊக்கம், சவால் போன்றவை) குறிச்சொற்களைச் சேர்த்து ஒழுங்கமைக்கவும்.',
    tourStep3Title: 'சிந்தனை முறைகள் & குரல்வழிக் கூடம்',
    tourStep3Desc: 'சிந்தனை, தொகுப்பு, யோசனை, செயல் முறைகளில் மாறலாம். குரல்வழிப் பேச்சைப் பதிவு செய்யவும், உரக்கக் கேட்கவும் முடியும்.',
    tourStep4Title: 'நாட்குறிப்புப் பெட்டகம் & தேடல்',
    tourStep4Desc: 'பழைய பதிவுகளைப் பார்க்கவும், உடனடியாகத் தேடவும், தேதி, மனநிலை, குறிச்சொற்கள் மூலம் வடிகட்டவும் முடியும்.',
    tourStep5Title: 'AI நுண்ணறிவுகள் & மனநிலைப் போக்குகள்',
    tourStep5Desc: 'முக்கிய உணர்தல்கள், தொகுப்புகள் மற்றும் காலப்போக்கில் உங்கள் மனநிலை மாற்றங்களைக் கண்காணிக்கவும்.',
    tourStep6Title: 'தீம்கள், காப்புப்பிரதி & பாதுகாப்பு பூட்டு',
    tourStep6Desc: '5 தீம்கள், தொடர் நாள் பதிவு, ஏற்றுமதி/இறக்குமதி மற்றும் 4-இலக்க PIN பூட்டு மூலம் உங்கள் நாட்குறிப்பைப் பாதுகாக்கவும்.',

    sample: 'மாதிரி',
    sampleReflection: 'மாதிரி சிந்தனை',
    whatYouCanDo: 'Inkwell இல் நீங்கள் செய்யக்கூடியவை',
    sampleEntryTip: 'இது நீங்கள் அறிந்துகொள்ள உதவும் மாதிரி சிந்தனைப் பதிவு. நீங்கள் இதைத் தொகுக்கலாம், கருவிகளைப் பரிசோதிக்கலாம், அல்லது சொந்தப் பதிவு எழுதும்போது நீக்கலாம்.',

    // Guest Mode & Anonymous Auth
    continueAsGuest: 'விருந்தினராக தொடரவும்',
    continueAsGuestSubtitle: 'Google கணக்கு இல்லாமல் உடனடியாகப் பயன்படுத்துங்கள். தரவு இந்த உலாவியில் மட்டுமே இருக்கும்.',
    guestMode: 'விருந்தினர் முறை',
    guestModeBadge: 'விருந்தினர்',
    guestModeNotice: 'விருந்தினர் முறை: பதிவுகள் இந்த உலாவியில் மட்டுமே சேமிக்கப்படும். நிரந்தரமாகப் பாதுகாக்க உங்கள் Google கணக்கை இணைக்கவும்.',
    guestModeDisclaimer: 'உள்ளூர் சாதனம் மட்டும். குக்கீகளை நீக்கினால் இந்த அமர்வு மீட்டமைக்கப்படும்.',
    guestModeWarning: 'விருந்தினர் தரவு பிற சாதனங்களில் ஒத்திசைக்கப்படாது.',
    linkGoogleAccount: 'Google கணக்கை இணைக்கவும்',
    saveDataPermanently: 'நிரந்தரமாகச் சேமிக்கவும்',
    linkingAccount: 'கணக்கு இணைக்கப்படுகிறது...',
    accountLinkedSuccess: 'Google கணக்கு வெற்றிகரமாக இணைக்கப்பட்டது! உங்கள் சிந்தனைகள் இப்போது நிரந்தரமாகப் பாதுகாக்கப்படுகின்றன.',
    guestCalendarNotice: 'Google Calendar ஒருங்கிணைப்புக்கு உண்மையான Google கணக்கு தேவைப்படுகிறது. உங்கள் காலெண்டரை இணைக்க Google மூலம் உள்நுழைக.',
    guestCalendarBtn: 'காலெண்டரை இணைக்க உள்நுழைக',
  },
};

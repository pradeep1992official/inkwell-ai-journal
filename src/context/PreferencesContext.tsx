import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { AppTheme, AppFontSize, AppLanguage, ThemeMode, LockSettings, UserPreferences } from '../types';
import { translations, TranslationDictionary } from '../i18n/translations';
import { getUserPreferences, saveUserPreferences } from '../lib/firestoreService';
import { subscribeToAuthState } from '../lib/firebase';

interface PreferencesContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  fontSize: AppFontSize;
  language: AppLanguage;
  t: TranslationDictionary;
  setTheme: (theme: AppTheme, isManual?: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (fontSize: AppFontSize) => void;
  setLanguage: (language: AppLanguage) => void;
  toggleTheme: () => void;
  loadUserPreferences: (user: User) => Promise<void>;
  isSavingPrefs: boolean;
  isDark: boolean;

  // Lock State & Settings
  lockSettings: LockSettings;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  updateLockSettings: (newSettings: Partial<LockSettings>) => Promise<void>;

  // Onboarding Tour
  hasCompletedTour: boolean;
  isTourActive: boolean;
  currentTourStep: number;
  startTour: (step?: number) => void;
  completeTour: (isSkipped?: boolean) => Promise<void>;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => Promise<void>;
}

const STORAGE_KEYS = {
  THEME: 'inkwell_pref_theme',
  THEME_MODE: 'inkwell_pref_theme_mode',
  FONT_SIZE: 'inkwell_pref_font_size',
  LANGUAGE: 'inkwell_pref_language',
  PRELOGIN_LANG_SELECTED: 'inkwell_prelogin_language_selected',
  LOCK_SETTINGS: 'inkwell_lock_settings',
  LAST_ACTIVITY: 'inkwell_last_activity',
  IS_LOCKED: 'inkwell_is_locked',
  HAS_COMPLETED_TOUR: 'inkwell_has_completed_tour',
};

const DEFAULT_LOCK_SETTINGS: LockSettings = {
  enabled: false,
  pinHash: null,
  autoLockMinutes: 5,
};

export function getAutoTheme(): AppTheme {
  const hour = new Date().getHours();
  // 6:00 PM (18:00) to 5:59 AM (hour < 6) is dark theme
  // 6:00 AM (06:00) to 5:59 PM (hour 6 to 17) is light theme
  return hour >= 18 || hour < 6 ? 'dark' : 'light';
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Mode ('auto' or 'manual')
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
      if (saved === 'auto' || saved === 'manual') return saved;
    }
    return 'auto';
  });

  // Theme
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme | null;

      if (savedMode === 'manual' && saved && ['light', 'dark', 'paper', 'vellum', 'vivid'].includes(saved)) {
        return saved;
      }
      return getAutoTheme();
    }
    return getAutoTheme();
  });

  // Font Size
  const [fontSize, setFontSizeState] = useState<AppFontSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as AppFontSize | null;
      if (saved && ['small', 'medium', 'large'].includes(saved)) {
        return saved;
      }
    }
    return 'medium';
  });

  // Language
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as AppLanguage | null;
      if (saved && ['en', 'es', 'fr', 'hi', 'ta'].includes(saved)) {
        return saved;
      }
      const navLang = navigator.language?.slice(0, 2);
      if (navLang === 'es' || navLang === 'fr' || navLang === 'hi' || navLang === 'ta') {
        return navLang as AppLanguage;
      }
    }
    return 'en';
  });

  // Lock Settings & Runtime Lock State
  const [lockSettings, setLockSettingsState] = useState<LockSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.LOCK_SETTINGS);
        if (saved) return { ...DEFAULT_LOCK_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_LOCK_SETTINGS;
  });

  // Onboarding Tour State
  const [hasCompletedTour, setHasCompletedTourState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_TOUR) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const tourAutoTriggeredRef = useRef<boolean>(false);

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLockSettings = localStorage.getItem(STORAGE_KEYS.LOCK_SETTINGS);
        if (savedLockSettings) {
          const parsed = JSON.parse(savedLockSettings);
          if (parsed.enabled && parsed.pinHash) {
            const savedIsLocked = localStorage.getItem(STORAGE_KEYS.IS_LOCKED);
            if (savedIsLocked === 'true') {
              return true;
            }
            if (parsed.autoLockMinutes && parsed.autoLockMinutes > 0) {
              const lastActiveStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
              const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
              if (lastActive > 0 && Date.now() - lastActive >= parsed.autoLockMinutes * 60 * 1000) {
                return true;
              }
            }
            // If fresh browser launch with configured lock
            return true;
          }
        }
      } catch {
        // ignore
      }
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Ref to always access the latest preferences without changing callback identities
  const prefsRef = useRef<{
    theme: AppTheme;
    themeMode: ThemeMode;
    fontSize: AppFontSize;
    language: AppLanguage;
    lockSettings: LockSettings;
  }>({
    theme,
    themeMode,
    fontSize,
    language,
    lockSettings,
  });

  useEffect(() => {
    prefsRef.current = {
      theme,
      themeMode,
      fontSize,
      language,
      lockSettings,
    };
  }, [theme, themeMode, fontSize, language, lockSettings]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const getLastActivityTimestamp = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      const parsed = stored ? parseInt(stored, 10) : 0;
      if (parsed && !isNaN(parsed) && parsed > 0) {
        return Math.max(lastActivityRef.current, parsed);
      }
    } catch {}
    return lastActivityRef.current;
  }, []);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
    } catch {}
  }, []);

  // 1. Time-based automatic dark theme check (continuously evaluates if themeMode is 'auto')
  useEffect(() => {
    const checkAutoTheme = () => {
      if (themeMode === 'auto') {
        const auto = getAutoTheme();
        setThemeState((prev) => (prev !== auto ? auto : prev));
      }
    };

    // Immediate check
    checkAutoTheme();

    // Check periodically every 15 seconds to catch transitions live
    const interval = setInterval(checkAutoTheme, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAutoTheme();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkAutoTheme);
    window.addEventListener('pageshow', checkAutoTheme);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkAutoTheme);
      window.removeEventListener('pageshow', checkAutoTheme);
    };
  }, [themeMode]);

  // 2. Synchronize DOM attributes whenever theme, font size, or language changes
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('lang', language);
    root.setAttribute('data-language', language);

    // Synchronize browser theme-color meta tags with the active theme's warm accent / canvas color
    const themeColorMap: Record<string, { themeColor: string; bg: string }> = {
      paper: { themeColor: '#8C6239', bg: '#F8F6F0' },
      dark: { themeColor: '#E8A33D', bg: '#1A1816' },
      sepia: { themeColor: '#7C4A27', bg: '#F4ECE1' },
      minimal: { themeColor: '#525252', bg: '#FFFFFF' },
    };
    const currentThemeColors = themeColorMap[theme] || themeColorMap.paper;
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    metaThemeColors.forEach((meta) => {
      meta.setAttribute('content', currentThemeColors.themeColor);
    });

    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode);
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      localStorage.setItem(STORAGE_KEYS.LOCK_SETTINGS, JSON.stringify(lockSettings));
    } catch {
      // ignore storage errors
    }
  }, [theme, themeMode, fontSize, language, lockSettings]);

  // 3. High-Precision Inactivity Auto-Lock Timer & Event Listeners
  useEffect(() => {
    if (!lockSettings.enabled || !lockSettings.pinHash || lockSettings.autoLockMinutes <= 0) {
      return;
    }

    const checkLockOnInactivity = () => {
      if (isLocked) return;
      const lastActive = getLastActivityTimestamp();
      const timeoutMs = lockSettings.autoLockMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActive;

      if (elapsedMs >= timeoutMs) {
        setIsLocked(true);
        try {
          localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
        } catch {}
      }
    };

    // Immediate check whenever autoLockMinutes or settings update
    checkLockOnInactivity();

    let lastRecorded = 0;
    const handleActivityEvent = () => {
      if (isLocked) return;

      const lastActive = getLastActivityTimestamp();
      const timeoutMs = lockSettings.autoLockMinutes * 60 * 1000;
      const elapsedMs = Date.now() - lastActive;

      // If already timed out, lock immediately instead of resetting the timer!
      if (elapsedMs >= timeoutMs) {
        setIsLocked(true);
        try {
          localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
        } catch {}
        return;
      }

      // Otherwise record genuine user activity (throttled)
      const now = Date.now();
      if (now - lastRecorded > 500) {
        lastRecorded = now;
        recordActivity();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLockOnInactivity();
      }
    };

    // Active interval polling (every 1 second)
    const interval = setInterval(checkLockOnInactivity, 1000);

    // Genuine user interaction listeners
    window.addEventListener('mousemove', handleActivityEvent, { passive: true });
    window.addEventListener('mousedown', handleActivityEvent, { passive: true });
    window.addEventListener('pointerdown', handleActivityEvent, { passive: true });
    window.addEventListener('keydown', handleActivityEvent, { passive: true });
    window.addEventListener('touchstart', handleActivityEvent, { passive: true });
    window.addEventListener('scroll', handleActivityEvent, { passive: true });
    window.addEventListener('wheel', handleActivityEvent, { passive: true });
    window.addEventListener('focus', checkLockOnInactivity);
    window.addEventListener('pageshow', checkLockOnInactivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivityEvent);
      window.removeEventListener('mousedown', handleActivityEvent);
      window.removeEventListener('pointerdown', handleActivityEvent);
      window.removeEventListener('keydown', handleActivityEvent);
      window.removeEventListener('touchstart', handleActivityEvent);
      window.removeEventListener('scroll', handleActivityEvent);
      window.removeEventListener('wheel', handleActivityEvent);
      window.removeEventListener('focus', checkLockOnInactivity);
      window.removeEventListener('pageshow', checkLockOnInactivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    lockSettings.enabled,
    lockSettings.pinHash,
    lockSettings.autoLockMinutes,
    isLocked,
    getLastActivityTimestamp,
    recordActivity,
  ]);

  // Keep currentUser state in sync with Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      currentUserRef.current = user;
    });
    return () => unsubscribe();
  }, []);

  // 4. Firestore persistence
  const persistPreferencesToCloud = useCallback(
    async (
      newTheme: AppTheme,
      newThemeMode: ThemeMode,
      newFontSize: AppFontSize,
      newLang: AppLanguage,
      newLock: LockSettings,
      user: User | null
    ) => {
      const activeUser = user || currentUserRef.current;
      if (!activeUser) return;
      try {
        setIsSavingPrefs(true);
        await saveUserPreferences(activeUser.uid, {
          theme: newTheme,
          themeMode: newThemeMode,
          fontSize: newFontSize,
          language: newLang,
          lockSettings: newLock,
        });
      } catch (err) {
        console.error('Failed to sync user preferences to Firestore:', err);
      } finally {
        setIsSavingPrefs(false);
      }
    },
    []
  );

  // 5. Load preferences from Firestore on login
  const loadUserPreferences = useCallback(
    async (user: User) => {
      setCurrentUser(user);
      currentUserRef.current = user;
      try {
        const cloudPrefs = await getUserPreferences(user.uid);

        // Determine user's active/selected language:
        // 1. Explicit pre-login selection
        // 2. Explicit localStorage preference
        // 3. Current active React state
        let chosenLang: AppLanguage | null = null;
        try {
          const storedPrelogin = localStorage.getItem(STORAGE_KEYS.PRELOGIN_LANG_SELECTED) as AppLanguage | null;
          if (storedPrelogin && ['en', 'es', 'fr', 'hi', 'ta'].includes(storedPrelogin)) {
            chosenLang = storedPrelogin;
          }
        } catch {}

        if (!chosenLang) {
          try {
            const storedLocal = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as AppLanguage | null;
            if (storedLocal && ['en', 'es', 'fr', 'hi', 'ta'].includes(storedLocal)) {
              chosenLang = storedLocal;
            }
          } catch {}
        }

        if (!chosenLang) {
          chosenLang = prefsRef.current.language;
        }

        if (cloudPrefs) {
          const loadedMode = cloudPrefs.themeMode || 'auto';
          setThemeModeState(loadedMode);

          if (loadedMode === 'manual' && cloudPrefs.theme && ['light', 'dark', 'paper', 'vellum', 'vivid'].includes(cloudPrefs.theme)) {
            setThemeState(cloudPrefs.theme);
          } else {
            setThemeState(getAutoTheme());
          }

          if (cloudPrefs.fontSize && ['small', 'medium', 'large'].includes(cloudPrefs.fontSize)) {
            setFontSizeState(cloudPrefs.fontSize);
          }

          // Prioritize explicitly selected language if present, otherwise fallback to cloud setting
          if (chosenLang) {
            setLanguageState(chosenLang);
            try {
              localStorage.setItem(STORAGE_KEYS.LANGUAGE, chosenLang);
            } catch {}

            // If cloud prefs differs from chosen language, sync to Firestore
            if (cloudPrefs.language !== chosenLang) {
              await saveUserPreferences(user.uid, {
                ...cloudPrefs,
                language: chosenLang,
              });
            }
          } else if (cloudPrefs.language && ['en', 'es', 'fr', 'hi', 'ta'].includes(cloudPrefs.language)) {
            setLanguageState(cloudPrefs.language);
            try {
              localStorage.setItem(STORAGE_KEYS.LANGUAGE, cloudPrefs.language);
            } catch {}
          }

          if (cloudPrefs.lockSettings) {
            setLockSettingsState(cloudPrefs.lockSettings);
            try {
              localStorage.setItem(STORAGE_KEYS.LOCK_SETTINGS, JSON.stringify(cloudPrefs.lockSettings));
            } catch {}

            if (cloudPrefs.lockSettings.enabled && cloudPrefs.lockSettings.pinHash) {
              const lastActive = getLastActivityTimestamp();
              const autoMinutes = cloudPrefs.lockSettings.autoLockMinutes ?? 5;
              if (autoMinutes > 0 && Date.now() - lastActive >= autoMinutes * 60 * 1000) {
                setIsLocked(true);
                try {
                  localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
                } catch {}
              }
            }
          }

          // Check Onboarding Tour status from Firestore
          const isTourCompleted = cloudPrefs.hasCompletedTour === true;
          setHasCompletedTourState(isTourCompleted);
          try {
            localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_TOUR, String(isTourCompleted));
          } catch {}

          // Auto-trigger tour for first-time sign-in users if not yet completed and not already triggered
          if (!isTourCompleted && !tourAutoTriggeredRef.current) {
            tourAutoTriggeredRef.current = true;
            setTimeout(() => {
              setCurrentTourStep(0);
              setIsTourActive(true);
            }, 800);
          }
        } else {
          // New user sign-in: persist current state (including chosen language)
          const targetLang = chosenLang || prefsRef.current.language;
          setLanguageState(targetLang);
          try {
            localStorage.setItem(STORAGE_KEYS.LANGUAGE, targetLang);
          } catch {}

          await saveUserPreferences(user.uid, {
            theme: prefsRef.current.theme,
            themeMode: prefsRef.current.themeMode,
            fontSize: prefsRef.current.fontSize,
            language: targetLang,
            lockSettings: prefsRef.current.lockSettings,
            hasCompletedTour: false,
          });

          // Auto-trigger tour for first-time sign-in
          if (!tourAutoTriggeredRef.current) {
            tourAutoTriggeredRef.current = true;
            setTimeout(() => {
              setCurrentTourStep(0);
              setIsTourActive(true);
            }, 800);
          }
        }
      } catch (err) {
        console.error('Error fetching user settings from Firestore:', err);
      }
    },
    [getLastActivityTimestamp]
  );

  // 6. Updaters
  const setTheme = useCallback(
    (newTheme: AppTheme, isManual = true) => {
      const nextMode: ThemeMode = isManual ? 'manual' : 'auto';
      setThemeState(newTheme);
      setThemeModeState(nextMode);
      persistPreferencesToCloud(
        newTheme,
        nextMode,
        prefsRef.current.fontSize,
        prefsRef.current.language,
        prefsRef.current.lockSettings,
        currentUserRef.current
      );
    },
    [persistPreferencesToCloud]
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      let targetTheme = prefsRef.current.theme;
      if (mode === 'auto') {
        targetTheme = getAutoTheme();
        setThemeState(targetTheme);
      }
      persistPreferencesToCloud(
        targetTheme,
        mode,
        prefsRef.current.fontSize,
        prefsRef.current.language,
        prefsRef.current.lockSettings,
        currentUserRef.current
      );
    },
    [persistPreferencesToCloud]
  );

  const setFontSize = useCallback(
    (newFontSize: AppFontSize) => {
      setFontSizeState(newFontSize);
      persistPreferencesToCloud(
        prefsRef.current.theme,
        prefsRef.current.themeMode,
        newFontSize,
        prefsRef.current.language,
        prefsRef.current.lockSettings,
        currentUserRef.current
      );
    },
    [persistPreferencesToCloud]
  );

  const setLanguage = useCallback(
    (newLang: AppLanguage) => {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
        localStorage.setItem(STORAGE_KEYS.PRELOGIN_LANG_SELECTED, newLang);
      } catch {}
      persistPreferencesToCloud(
        prefsRef.current.theme,
        prefsRef.current.themeMode,
        prefsRef.current.fontSize,
        newLang,
        prefsRef.current.lockSettings,
        currentUserRef.current
      );
    },
    [persistPreferencesToCloud]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark';
      setThemeModeState('manual');
      persistPreferencesToCloud(
        next,
        'manual',
        prefsRef.current.fontSize,
        prefsRef.current.language,
        prefsRef.current.lockSettings,
        currentUserRef.current
      );
      return next;
    });
  }, [persistPreferencesToCloud]);

  const updateLockSettings = useCallback(
    async (newSettings: Partial<LockSettings>) => {
      const merged: LockSettings = { ...prefsRef.current.lockSettings, ...newSettings };
      setLockSettingsState(merged);

      if (!merged.enabled || !merged.pinHash) {
        setIsLocked(false);
        try {
          localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
        } catch {}
      } else if (merged.enabled && merged.pinHash && merged.autoLockMinutes > 0) {
        // Evaluate immediately with the newly selected timeout
        const lastActive = getLastActivityTimestamp();
        const timeoutMs = merged.autoLockMinutes * 60 * 1000;
        if (Date.now() - lastActive >= timeoutMs) {
          setIsLocked(true);
          try {
            localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
          } catch {}
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.LOCK_SETTINGS, JSON.stringify(merged));
      } catch {}

      await persistPreferencesToCloud(
        prefsRef.current.theme,
        prefsRef.current.themeMode,
        prefsRef.current.fontSize,
        prefsRef.current.language,
        merged,
        currentUserRef.current
      );
    },
    [persistPreferencesToCloud, getLastActivityTimestamp]
  );

  const lockApp = useCallback(() => {
    if (lockSettings.enabled && lockSettings.pinHash) {
      setIsLocked(true);
      try {
        localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
      } catch {}
    }
  }, [lockSettings.enabled, lockSettings.pinHash]);

  const unlockApp = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
      localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    } catch {}
    setIsLocked(false);
  }, []);

  // 7. Onboarding Tour Control Methods
  const startTour = useCallback((step = 0) => {
    setCurrentTourStep(Math.max(0, Math.min(5, step)));
    setIsTourActive(true);
  }, []);

  const completeTour = useCallback(async (isSkipped = false) => {
    setHasCompletedTourState(true);
    setIsTourActive(false);
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_TOUR, 'true');
    } catch {}

    const user = currentUserRef.current;
    if (user) {
      try {
        await saveUserPreferences(user.uid, {
          theme: prefsRef.current.theme,
          themeMode: prefsRef.current.themeMode,
          fontSize: prefsRef.current.fontSize,
          language: prefsRef.current.language,
          lockSettings: prefsRef.current.lockSettings,
          hasCompletedTour: true,
          tourCompletedAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to save tour completion to Firestore:', err);
      }
    }
  }, []);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep((prev) => {
      if (prev >= 5) {
        completeTour(false);
        return prev;
      }
      return prev + 1;
    });
  }, [completeTour]);

  const prevTourStep = useCallback(() => {
    setCurrentTourStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(async () => {
    await completeTour(true);
  }, [completeTour]);

  const t = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  const isDark = theme === 'dark';

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        themeMode,
        fontSize,
        language,
        t,
        setTheme,
        setThemeMode,
        setFontSize,
        setLanguage,
        toggleTheme,
        loadUserPreferences,
        isSavingPrefs,
        isDark,
        lockSettings,
        isLocked,
        lockApp,
        unlockApp,
        updateLockSettings,
        hasCompletedTour,
        isTourActive,
        currentTourStep,
        startTour,
        completeTour,
        nextTourStep,
        prevTourStep,
        skipTour,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const useTheme = () => {
  const { theme, isDark, toggleTheme, setTheme } = usePreferences();
  return { theme, isDark, toggleTheme, setTheme };
};

export const useTranslation = () => {
  const { t, language, setLanguage } = usePreferences();
  return { t, language, setLanguage };
};

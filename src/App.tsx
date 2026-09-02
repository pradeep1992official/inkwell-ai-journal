import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthState } from './lib/firebase';
import { 
  subscribeToUserEntries, 
  softDeleteJournalEntry,
  restoreJournalEntry, 
  saveJournalEntry 
} from './lib/firestoreService';
import { JournalEntry } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { SettingsModal } from './components/SettingsModal';
import { StreakModal } from './components/StreakModal';
import { ExportVaultModal } from './components/ExportVaultModal';
import { ImportDataModal } from './components/ImportDataModal';
import { HowToUseModal } from './components/HowToUseModal';
import { MoodTrendsModal } from './components/MoodTrendsModal';
import { CalendarDayReview } from './components/CalendarDayReview';
import { MyMemoriesModal } from './components/MyMemoriesModal';
import { AppLockOverlay } from './components/AppLockOverlay';
import { OnboardingTour } from './components/OnboardingTour';
import { isAppLockConfigured } from './lib/lockService';
import { calculateStreakStats } from './lib/streakService';
import { fetchCurrentWeather } from './lib/weatherService';
import { Feather, AlertCircle, Plus, PanelLeftOpen, Undo2, CheckCircle2, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePreferences } from './context/PreferencesContext';

interface DeletedToastState {
  id: string;
  title: string;
}

export default function App() {
  const { t, loadUserPreferences, isLocked, unlockApp, lockSettings, weatherEnabled } = usePreferences();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [moodTrendsModalOpen, setMoodTrendsModalOpen] = useState(false);
  const [calendarReviewOpen, setCalendarReviewOpen] = useState(false);
  const [memoriesModalOpen, setMemoriesModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Undo Toast state
  const [deletedToast, setDeletedToast] = useState<DeletedToastState | null>(null);
  const [restoredToastMessage, setRestoredToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor Authentication state
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadUserPreferences(currentUser);
      }
    });
    return () => unsubscribe();
  }, [loadUserPreferences]);

  // Monitor user's private Firestore collection
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntryId(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (userEntries) => {
        setEntries(userEntries);
        // If no entry is selected and entries exist, select the most recent one
        setSelectedEntryId((prev) => {
          if (prev && userEntries.some((e) => e.id === prev)) return prev;
          return userEntries.length > 0 ? userEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Firestore real-time subscription error:', error);
        setGlobalError('Unable to sync your private journal entries. Please check connection.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate streak stats
  const streakStats = useMemo(() => calculateStreakStats(entries), [entries]);

  // Active selected entry object
  const activeEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId),
    [entries, selectedEntryId]
  );

  // Create a brand new draft reflection
  const handleNewEntry = useCallback(async () => {
    if (!user) return;
    const newId = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    let initialWeather = undefined;
    if (weatherEnabled && typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'granted') {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 4000,
              maximumAge: 600000,
              enableHighAccuracy: false,
            });
          }).catch(() => null);

          if (pos) {
            const w = await fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude);
            if (w) {
              initialWeather = w;
            }
          }
        }
      } catch {
        // Continue creating entry without blocking
      }
    }

    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: 'New Reflection',
      messages: [],
      metadata: {
        tags: [],
        mood: undefined,
        weather: initialWeather,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveJournalEntry(user.uid, newEntry);
      setSelectedEntryId(newId);
    } catch (err: any) {
      console.error('Failed to create new entry:', err);
      setGlobalError('Failed to initialize new reflection entry.');
    }
  }, [user, weatherEnabled]);

  // Save day synthesis as a brand new dedicated entry
  const handleSaveAsNewEntry = useCallback(
    async (title: string, content: string, metadata?: any) => {
      if (!user) return;
      const newId = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newEntry: JournalEntry = {
        id: newId,
        userId: user.uid,
        title: title || 'Day Review',
        messages: [
          {
            id: `msg-synthesis-${Date.now()}`,
            role: 'model',
            content,
            timestamp: Date.now(),
            modelUsed: metadata?.modelUsed || 'gemini-3.7-flash',
          },
        ],
        metadata: {
          tags: metadata?.tags || ['day-review', 'google-calendar'],
          mood: metadata?.mood || 'Reflective',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await saveJournalEntry(user.uid, newEntry);
        setSelectedEntryId(newId);
      } catch (err: any) {
        console.error('Failed to save synthesis entry:', err);
        setGlobalError('Failed to save day review entry.');
      }
    },
    [user]
  );

  // Append synthesized text to active reflection or create new if none
  const handleInsertTextToActiveEntry = useCallback(
    async (text: string) => {
      if (!user) return;
      if (!activeEntry) {
        await handleSaveAsNewEntry('Day Reflection', text);
        return;
      }

      const updated: JournalEntry = {
        ...activeEntry,
        messages: [
          ...activeEntry.messages,
          {
            id: `msg-inserted-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      };

      try {
        await saveJournalEntry(user.uid, updated);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } catch (err) {
        console.error('Failed to append to active entry:', err);
      }
    },
    [user, activeEntry, handleSaveAsNewEntry]
  );

  // Handle entry deletion (Soft-delete with instant Undo capability)
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    const targetEntry = entries.find((e) => e.id === entryId);
    const entryTitle = targetEntry?.title || t.untitledReflection;

    try {
      await softDeleteJournalEntry(user.uid, entryId);
      
      if (selectedEntryId === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId && !e.deletedAt);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }

      // Clear any prior deletion timer
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setDeletedToast({
        id: entryId,
        title: entryTitle,
      });

      // Automatically dismiss undo prompt after 7 seconds
      toastTimeoutRef.current = setTimeout(() => {
        setDeletedToast(null);
      }, 7000);
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setGlobalError('Failed to delete the selected reflection.');
    }
  };

  // Handle restoring a soft-deleted entry
  const handleUndoDelete = async () => {
    if (!user || !deletedToast) return;
    const toastData = deletedToast;

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setDeletedToast(null);

    try {
      await restoreJournalEntry(user.uid, toastData.id);
      setSelectedEntryId(toastData.id);

      // Brief confirmation
      setRestoredToastMessage(toastData.title);
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
      restoreTimeoutRef.current = setTimeout(() => {
        setRestoredToastMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to restore entry:', err);
      setGlobalError('Failed to restore reflection.');
    }
  };

  const handleDismissDeletedToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setDeletedToast(null);
  };

  // If initial auth is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen theme-bg-app flex flex-col items-center justify-center theme-text-primary">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white mb-4 shadow-lg animate-pulse">
          <Feather className="w-6 h-6 stroke-[2.2]" />
        </div>
        <p className="text-sm font-gemini-display font-medium theme-text-secondary">{t.loadingApp}</p>
      </div>
    );
  }

  // Unauthenticated -> Landing page
  if (!user) {
    return <LandingPage />;
  }

  // App Lock Screen when locked (completely replaces and shields the journal content from DOM)
  if (isLocked && lockSettings.enabled && lockSettings.pinHash) {
    return (
      <AppLockOverlay
        isLocked={true}
        onUnlock={unlockApp}
      />
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden theme-bg-app theme-text-primary flex flex-col antialiased selection:bg-[#1A73E8]/20 transition-colors">
      {/* Top Navigation */}
      {!focusMode && (
        <Navbar
          user={user}
          onNewEntry={handleNewEntry}
          entriesCount={entries.length}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHowToUse={() => setHowToUseOpen(true)}
          onOpenStreakModal={() => setStreakModalOpen(true)}
          onOpenExportVault={() => setExportModalOpen(true)}
          onOpenImportVault={() => setImportModalOpen(true)}
          onOpenMoodTrends={() => setMoodTrendsModalOpen(true)}
          onOpenCalendarReview={() => setCalendarReviewOpen(true)}
          onOpenMemories={() => setMemoriesModalOpen(true)}
          streakCount={streakStats.currentStreak}
        />
      )}

      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 px-4 py-2.5 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-rose-700 dark:text-rose-300 hover:underline text-xs font-semibold"
          >
            {t.dismiss}
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left History Sidebar */}
        {!focusMode && !desktopSidebarCollapsed && (
          <HistorySidebar
            entries={entries}
            selectedEntryId={selectedEntryId}
            onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpenStreakModal={() => setStreakModalOpen(true)}
            onOpenExportModal={() => setExportModalOpen(true)}
            onOpenHowToUse={() => setHowToUseOpen(true)}
            onOpenMoodTrends={() => setMoodTrendsModalOpen(true)}
            onOpenMemories={() => setMemoriesModalOpen(true)}
            onToggleCollapse={() => setDesktopSidebarCollapsed(true)}
          />
        )}

        {/* Collapsed Sidebar Restore Tab */}
        {!focusMode && desktopSidebarCollapsed && (
          <button
            onClick={() => setDesktopSidebarCollapsed(false)}
            title="Expand Journal Vault"
            className="hidden md:flex flex-col items-center justify-center w-10 border-r theme-border theme-bg-subtle hover:theme-bg-hover text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Right Active Editor or Empty State */}
        <main className="flex-1 min-h-0 flex flex-col min-w-0 theme-bg-app overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeEntry ? (
              <motion.div
                key={activeEntry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="flex-1 min-h-0 flex flex-col h-full w-full overflow-hidden"
              >
                <JournalEditor
                  key={activeEntry.id}
                  userId={user.uid}
                  userName={user.displayName || user.email?.split('@')[0] || ''}
                  entry={activeEntry}
                  onEntryUpdated={(updated) => {
                    setEntries((prev) =>
                      prev.map((e) => (e.id === updated.id ? updated : e))
                    );
                  }}
                  onDeleteEntry={handleDeleteEntry}
                  focusMode={focusMode}
                  onToggleFocusMode={() => setFocusMode(!focusMode)}
                  onOpenMoodTrends={() => setMoodTrendsModalOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white mb-4 shadow-md shadow-blue-500/15">
                  <Feather className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-2xl font-gemini-display font-bold theme-text-primary">{t.readyToReflect}</h3>
                <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                  {t.readyToReflectSub}
                </p>
                <button
                  id="btn-empty-state-new"
                  onClick={handleNewEntry}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.startNewReflection}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* How to Use / User Guide Modal */}
      <HowToUseModal
        isOpen={howToUseOpen}
        onClose={() => setHowToUseOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenStreak={() => setStreakModalOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={user.uid}
        userEmail={user.email}
        entries={entries}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenImport={() => setImportModalOpen(true)}
      />

      {/* Streak & Mindfulness Heatmap Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        entries={entries}
      />

      {/* Mood Trends Observational Chart Modal */}
      <MoodTrendsModal
        isOpen={moodTrendsModalOpen}
        onClose={() => setMoodTrendsModalOpen(false)}
        entries={entries}
        onSelectEntry={(id) => {
          setSelectedEntryId(id);
          setMoodTrendsModalOpen(false);
        }}
      />

      {/* Vault Export Modal */}
      <ExportVaultModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        entries={entries}
        currentEntry={activeEntry}
      />

      {/* Vault Import Modal */}
      <ImportDataModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entries={entries}
        userId={user.uid}
        onImportComplete={(count) => {
          // If we imported entries, optionally select the first new entry or keep view
        }}
      />

      {/* Google Calendar: "What happened today?" Day Review Modal */}
      <CalendarDayReview
        isOpen={calendarReviewOpen}
        onClose={() => setCalendarReviewOpen(false)}
        entries={entries}
        activeEntry={activeEntry}
        onInsertTextToActiveEntry={handleInsertTextToActiveEntry}
        onSaveAsNewEntry={handleSaveAsNewEntry}
        userName={user.displayName || user.email?.split('@')[0] || ''}
      />

      {/* Google Places: "My Memories" Location Browser Modal */}
      <MyMemoriesModal
        isOpen={memoriesModalOpen}
        onClose={() => setMemoriesModalOpen(false)}
        entries={entries}
        onSelectEntry={(entryId) => {
          setSelectedEntryId(entryId);
          setMemoriesModalOpen(false);
        }}
        onNewEntry={() => {
          setMemoriesModalOpen(false);
          handleNewEntry();
        }}
      />

      {/* Undo Soft-Delete Toast / Snackbar */}
      <AnimatePresence>
        {deletedToast && (
          <motion.div
            key={deletedToast.id}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2.5rem)] sm:max-w-md theme-bg-surface border theme-border rounded-2xl shadow-2xl p-3.5 overflow-hidden flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold theme-text-primary truncate">
                "{deletedToast.title}"
              </p>
              <p className="text-[11px] theme-text-secondary">
                {t.entryDeleted}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-undo-delete"
                onClick={handleUndoDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] transition-all shadow-xs active:scale-95"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>{t.undo}</span>
              </button>

              <button
                id="btn-dismiss-undo-toast"
                onClick={handleDismissDeletedToast}
                title={t.dismiss}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Countdown progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 7, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-[#1A73E8] dark:bg-[#E8A33D]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restored Entry Success Notification */}
      <AnimatePresence>
        {restoredToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2.5rem)] sm:max-w-md theme-bg-surface border theme-border rounded-2xl shadow-xl px-4 py-3 overflow-hidden flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold theme-text-primary truncate">
              {t.entryRestored}: <span className="font-normal opacity-90">"{restoredToastMessage}"</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-Time Guided Onboarding Tour Spotlight */}
      {user && !isLocked && (
        <OnboardingTour
          ensureActiveEntry={handleNewEntry}
          ensureSidebarOpen={() => {
            setDesktopSidebarCollapsed(false);
            setSidebarOpen(true);
          }}
          hasActiveEntry={!!activeEntry}
        />
      )}
    </div>
  );
}

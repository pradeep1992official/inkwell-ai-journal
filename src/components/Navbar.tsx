import React, { useState, useRef, useEffect } from 'react';
import {
  Feather,
  LogOut,
  Plus,
  BookOpen,
  User as UserIcon,
  Sun,
  Moon,
  Settings,
  Flame,
  ChevronDown,
  Lock,
  TrendingUp,
  Sparkles,
  Calendar,
  MapPin,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { logOut, linkGuestWithGoogle } from '../lib/firebase';
import { usePreferences } from '../context/PreferencesContext';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  entriesCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onOpenSettings: () => void;
  onOpenHowToUse?: () => void;
  onOpenStreakModal?: () => void;
  onOpenExportVault?: () => void;
  onOpenImportVault?: () => void;
  onOpenMoodTrends?: () => void;
  onOpenCalendarReview?: () => void;
  onOpenMemories?: () => void;
  onOpenAskMyLife?: () => void;
  streakCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  entriesCount = 0,
  sidebarOpen,
  setSidebarOpen,
  onOpenSettings,
  onOpenHowToUse,
  onOpenStreakModal,
  onOpenExportVault,
  onOpenImportVault,
  onOpenMoodTrends,
  onOpenCalendarReview,
  onOpenMemories,
  onOpenAskMyLife,
  streakCount = 0,
}) => {
  const { theme, themeMode, toggleTheme, t, lockSettings, lockApp, startTour } = usePreferences();
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const dropdownScrollRef = useRef<HTMLDivElement>(null);

  const checkScrollAffordance = () => {
    const el = dropdownScrollRef.current;
    if (!el) {
      setHasMoreBelow(false);
      return;
    }
    const canScroll = el.scrollHeight > el.clientHeight + 2 && el.scrollTop + el.clientHeight < el.scrollHeight - 6;
    setHasMoreBelow(canScroll);
  };

  useEffect(() => {
    if (isAvatarDropdownOpen) {
      const timer = setTimeout(checkScrollAffordance, 60);
      window.addEventListener('resize', checkScrollAffordance);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScrollAffordance);
      };
    } else {
      setHasMoreBelow(false);
    }
  }, [isAvatarDropdownOpen]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAvatarDropdownOpen(false);
      }
    };

    if (isAvatarDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAvatarDropdownOpen]);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(false);
    try {
      await linkGuestWithGoogle();
      setLinkSuccess(true);
      setTimeout(() => setLinkSuccess(false), 4000);
    } catch (err: any) {
      if (err?.code === 'auth/credential-already-in-use') {
        setLinkError('This Google account is already linked to another vault. Sign out and sign in directly with Google.');
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setLinkError('Sign-in popup closed. You can link anytime.');
      } else {
        setLinkError(err?.message || 'Could not link account. Please try again.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 theme-bg-surface backdrop-blur-md border-b theme-border theme-text-primary transition-colors shadow-xs shrink-0">
      <div className="w-full px-2.5 sm:px-6 h-13 sm:h-16 flex items-center justify-between">
        {/* Left branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors focus:outline-none shrink-0"
            aria-label="Toggle journal history"
          >
            <BookOpen className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Inkwell Quill / Pen Brand Icon */}
            <div className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 shrink-0">
              <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-gemini-display font-bold text-base sm:text-lg tracking-tight theme-text-primary flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{t.appName}</span>
                  {user?.isAnonymous ? (
                    <span
                      id="badge-guest-mode-nav"
                      title={t.guestModeNotice}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {t.guestModeBadge}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-[#1A73E8] dark:text-[#E8A33D] border border-blue-500/20 shrink-0">
                      {t.geminiVersion}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] theme-text-secondary hidden sm:block truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right actions & user profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user && (
            <>
              {/* Ask My Life Button */}
              {onOpenAskMyLife && (
                <button
                  id="btn-navbar-ask-my-life"
                  onClick={onOpenAskMyLife}
                  title="Ask My Life: Semantic memory search powered by Gemini & vector embeddings"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/15 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 text-[#1A73E8] dark:text-[#E8A33D] font-bold text-xs transition-all border border-[#1A73E8]/20 dark:border-[#E8A33D]/20 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask My Life</span>
                </button>
              )}

              {/* Streak Tracker Badge */}
              {onOpenStreakModal && (
                <button
                  id="btn-navbar-streak"
                  onClick={onOpenStreakModal}
                  title={`${streakCount} ${streakCount === 1 ? t.dayUnit : t.daysUnit} ${t.streakTag}`}
                  className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-bold transition-all border border-amber-500/20 active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                  <span>{streakCount}</span>
                  <span className="hidden md:inline font-normal text-amber-600/80 dark:text-amber-400/80 text-[11px]">{streakCount === 1 ? t.dayUnit : t.daysUnit}</span>
                </button>
              )}

              {/* New Reflection Button */}
              <button
                id="btn-navbar-new-entry"
                onClick={onNewEntry}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-medium text-xs sm:text-sm transition-all shadow-sm active:scale-95 focus:outline-none"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">{t.newReflection}</span>
                <span className="sm:hidden">{t.newShort}</span>
              </button>
            </>
          )}

          {/* Quick Theme Toggle Button */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            title={themeMode === 'auto' ? `${t.toggleTheme} (Auto 6 PM–6 AM active; clicking switches to manual)` : t.toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors focus:outline-none active:scale-95 relative"
            aria-label={t.toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#1A73E8]" />
            )}
            {themeMode === 'auto' && (
              <span 
                title="Auto Schedule active"
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1A73E8] dark:bg-[#E8A33D] ring-2 ring-white dark:ring-[#171310]"
              />
            )}
          </button>

          {/* Avatar with Dropdown containing Settings and Logout */}
          {user && (
            <div className="relative" ref={avatarMenuRef}>
              <button
                id="btn-user-avatar-menu"
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                title={user.isAnonymous ? `${t.guestMode} - Click to link Google Account` : 'Account Menu'}
                className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full sm:rounded-2xl transition-all border active:scale-95 ${
                  isAvatarDropdownOpen
                    ? 'ring-2 ring-[#1A73E8] dark:ring-[#E8A33D] theme-bg-subtle border-transparent'
                    : user.isAnonymous
                    ? 'theme-bg-subtle hover:theme-bg-hover border-amber-500/40'
                    : 'theme-bg-subtle hover:theme-bg-hover theme-border'
                }`}
                aria-expanded={isAvatarDropdownOpen}
                aria-haspopup="true"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border theme-border object-cover ring-1 sm:ring-2 ring-white/50 dark:ring-black/50"
                    referrerPolicy="no-referrer"
                  />
                ) : user.isAnonymous ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border theme-border flex items-center justify-center theme-text-primary font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                )}
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-semibold theme-text-primary leading-tight truncate max-w-[100px]">
                    {user.isAnonymous ? t.guestModeBadge : (user.displayName || user.email?.split('@')[0] || 'User')}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 theme-text-secondary transition-transform duration-200 ${isAvatarDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Avatar Dropdown Menu */}
              {isAvatarDropdownOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 z-50 w-64 sm:w-72 rounded-2xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 flex flex-col max-h-[calc(100vh-4.5rem)] sm:max-h-[calc(100vh-5rem)] overflow-hidden"
                >
                  {/* User Profile Header */}
                  <div className="p-2.5 rounded-t-2xl theme-bg-subtle border-b theme-border shrink-0">
                    <div className="flex items-center gap-2.5">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-8 h-8 rounded-full border theme-border object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : user.isAnonymous ? (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1A73E8] to-[#7B1FA2] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold theme-text-primary truncate flex items-center gap-1.5">
                          <span>{user.isAnonymous ? t.guestMode : (user.displayName || 'Journal Keeper')}</span>
                          {user.isAnonymous && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Local
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] theme-text-secondary truncate">
                          {user.isAnonymous ? t.guestModeDisclaimer : user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Items Container with bounded height */}
                  <div
                    ref={dropdownScrollRef}
                    onScroll={checkScrollAffordance}
                    className="p-1.5 space-y-0.5 overflow-y-auto flex-1 min-h-0 overscroll-contain focus:outline-none"
                    tabIndex={-1}
                  >
                    {/* Guest Mode Permanent Link Banner */}
                    {user.isAnonymous && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2 mb-1.5 text-left">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-200">
                              {t.saveDataPermanently}
                            </div>
                            <p className="text-[10px] text-amber-700/90 dark:text-amber-300/90 leading-tight mt-0.5">
                              {t.guestModeNotice}
                            </p>
                          </div>
                        </div>
                        <button
                          id="btn-link-guest-to-google"
                          onClick={handleLinkGoogle}
                          disabled={isLinking}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-75 cursor-pointer"
                        >
                          {isLinking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{isLinking ? t.linkingAccount : t.linkGoogleAccount}</span>
                        </button>
                        {linkError && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-tight">
                            {linkError}
                          </p>
                        )}
                        {linkSuccess && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-tight flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>{t.accountLinkedSuccess}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Section 1: Journal Tools */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-2.5 pt-1 pb-0.5">
                      {t.journalTools}
                    </div>

                    {/* Gemini Memory: Ask My Life */}
                    {onOpenAskMyLife && (
                      <button
                        id="btn-dropdown-ask-my-life"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenAskMyLife();
                        }}
                        title="Natural-language semantic memory search across all journal entries"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 dark:bg-amber-400/10 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.askMyLife}</span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-blue-500/10 dark:bg-amber-400/10 text-[#1A73E8] dark:text-[#E8A33D] shrink-0 ml-2">
                          {t.aiMemory}
                        </span>
                      </button>
                    )}

                    {/* Google Places: My Memories */}
                    {onOpenMemories && (
                      <button
                        id="btn-dropdown-memories"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenMemories();
                        }}
                        title="Browse reflections grouped by city & country"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.myMemories}</span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                          {t.places}
                        </span>
                      </button>
                    )}

                    {/* Streak & Stats Option (Single consolidated streak & heatmap view) */}
                    {onOpenStreakModal && (
                      <button
                        id="btn-dropdown-streak"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenStreakModal();
                        }}
                        title="View your daily journaling streak calendar & activity heatmap"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.journalingStreak}</span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                          {streakCount} {t.streakTag}
                        </span>
                      </button>
                    )}

                    {/* Mood Trends Option */}
                    {onOpenMoodTrends && (
                      <button
                        id="btn-dropdown-mood-trends"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenMoodTrends();
                        }}
                        title="Observational emotional arc and sentiment patterns over time"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 dark:bg-purple-500/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.moodTrends}</span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-blue-500/10 dark:bg-purple-500/15 text-[#1A73E8] dark:text-[#E8A33D] shrink-0 ml-2">
                          {t.trends}
                        </span>
                      </button>
                    )}

                    {/* Google Calendar: Day Review */}
                    {onOpenCalendarReview && (
                      <button
                        id="btn-dropdown-calendar-review"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenCalendarReview();
                        }}
                        title="Summarize today's calendar meetings and day schedule into a reflection"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.googleCalendar}</span>
                        </div>
                        {user.isAnonymous ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0 ml-2 border border-amber-500/30">
                            {t.googleSignIn}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                            {t.schedule}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="border-t theme-border my-1" />

                    {/* Section 2: Account & Settings */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-2.5 pt-1 pb-0.5">
                      {t.accountAndSecurity}
                    </div>

                    {/* Settings (includes Help & Data Management) */}
                    <button
                      id="btn-dropdown-settings"
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        onOpenSettings();
                      }}
                      title="Preferences, Themes, PIN Lock, Help & Data Management"
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md theme-bg-subtle text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-xs truncate">{t.settings}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                        {t.preferencesTag}
                      </span>
                    </button>

                    {/* Lock App Option */}
                    {lockSettings.enabled && lockSettings.pinHash ? (
                      <button
                        id="btn-dropdown-lock"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          lockApp();
                        }}
                        title="Immediately lock the application — requires PIN to resume (Shortcut: Alt+L or Ctrl+Shift+L)"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 dark:bg-amber-500/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.lockJournalNow}</span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 dark:bg-amber-500/15 text-[#1A73E8] dark:text-[#E8A33D] shrink-0 ml-2 border border-[#1A73E8]/20 dark:border-[#E8A33D]/20">
                          Alt+L
                        </span>
                      </button>
                    ) : (
                      <button
                        id="btn-dropdown-lock-unconfigured"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenSettings();
                        }}
                        title="App Lock is unconfigured — Click to set up a secure PIN in Settings (Shortcut: Alt+L)"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md theme-bg-subtle text-gray-500 flex items-center justify-center shrink-0">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate">{t.lockJournalNow}</span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 ml-2 border border-amber-500/20">
                          Alt+L
                        </span>
                      </button>
                    )}

                    <div className="border-t theme-border my-1" />

                    {/* Sign Out */}
                    <button
                      id="btn-dropdown-logout"
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        logOut();
                      }}
                      title="Sign out of your account"
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs truncate">{t.signOut}</span>
                      </div>
                    </button>
                  </div>

                  {/* Scroll affordance gradient fade at bottom edge */}
                  {hasMoreBelow && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--bg-surface)] to-transparent flex items-end justify-center pb-0.5 transition-opacity duration-200">
                      <ChevronDown className="w-3.5 h-3.5 theme-text-secondary animate-pulse opacity-70" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


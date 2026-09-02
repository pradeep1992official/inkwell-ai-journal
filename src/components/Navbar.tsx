import React, { useState, useRef, useEffect } from 'react';
import {
  Feather,
  ShieldCheck,
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
  Download,
  Upload,
  TrendingUp,
  Sparkles,
  Calendar,
  MapPin
} from 'lucide-react';
import { User } from 'firebase/auth';
import { logOut } from '../lib/firebase';
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
  streakCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
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
  streakCount = 0,
}) => {
  const { theme, themeMode, toggleTheme, t, lockSettings, lockApp, startTour } = usePreferences();
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 theme-bg-surface/95 backdrop-blur-md border-b theme-border theme-text-primary transition-colors shadow-xs shrink-0">
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-gemini-display font-bold text-base sm:text-lg tracking-tight theme-text-primary flex items-center gap-1 truncate">
                  {t.appName}
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-[#1A73E8] dark:text-[#E8A33D] border border-blue-500/20">
                    {t.geminiVersion}
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium theme-bg-subtle theme-text-secondary border theme-border">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {t.vault}
                </span>
              </div>
              <p className="text-[11px] theme-text-secondary hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right actions & user profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user && (
            <>
              {/* Google Calendar Schedule & Day Review Button */}
              {onOpenCalendarReview && (
                <button
                  id="btn-navbar-calendar-review"
                  onClick={onOpenCalendarReview}
                  title="Google Calendar — What happened today? Connect schedule & summarize day"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-bold transition-all border border-blue-500/20 active:scale-95 shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
              )}

              {/* Streak Tracker Badge */}
              {onOpenStreakModal && (
                <button
                  id="btn-navbar-streak"
                  onClick={onOpenStreakModal}
                  title={`${streakCount} day journaling streak — click for detailed heatmap & stats`}
                  className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-bold transition-all border border-amber-500/20 active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                  <span>{streakCount}</span>
                  <span className="hidden md:inline font-normal text-amber-600/80 dark:text-amber-400/80 text-[11px]">days</span>
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

          {/* Dedicated Settings Button */}
          <button
            id="btn-navbar-settings"
            onClick={onOpenSettings}
            title={t.settings}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors focus:outline-none active:scale-95"
            aria-label={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Avatar with Dropdown containing Settings and Logout */}
          {user && (
            <div className="relative" ref={avatarMenuRef}>
              <button
                id="btn-user-avatar-menu"
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                title="Account Menu"
                className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full sm:rounded-2xl transition-all border active:scale-95 ${
                  isAvatarDropdownOpen
                    ? 'ring-2 ring-[#1A73E8] dark:ring-[#E8A33D] theme-bg-subtle border-transparent'
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
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border theme-border flex items-center justify-center theme-text-primary font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                )}
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-semibold theme-text-primary leading-tight truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 theme-text-secondary transition-transform duration-200 ${isAvatarDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Avatar Dropdown Menu */}
              {isAvatarDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 p-2 rounded-2xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                  {/* User Profile Header */}
                  <div className="p-2.5 rounded-xl theme-bg-subtle/70 border theme-border/60 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-9 h-9 rounded-full border theme-border object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1A73E8] to-[#7B1FA2] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold theme-text-primary truncate">
                          {user.displayName || 'Journal Keeper'}
                        </div>
                        <div className="text-[11px] theme-text-secondary truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Google Places: My Memories */}
                    {onOpenMemories && (
                      <button
                        id="btn-dropdown-memories"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenMemories();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 flex items-center justify-center theme-text-secondary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>My Memories</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Places
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5 truncate">
                            Browse reflections grouped by city
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Google Calendar: What happened today? */}
                    {onOpenCalendarReview && (
                      <button
                        id="btn-dropdown-calendar-review"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenCalendarReview();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 flex items-center justify-center theme-text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>Google Calendar</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                              Schedule
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5 truncate">
                            “What happened today?” Day Review
                          </div>
                        </div>
                      </button>
                    )}

                    {/* How to Use / User Guide Button */}
                    {onOpenHowToUse && (
                      <button
                        id="btn-dropdown-how-to-use"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenHowToUse();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-[#1A73E8]/10 dark:group-hover:bg-[#E8A33D]/15 flex items-center justify-center theme-text-secondary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center gap-1.5">
                            <span>{t.howToUse}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/10 dark:bg-amber-500/20 text-[#1A73E8] dark:text-[#E8A33D]">
                              Guide
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5 truncate">
                            {t.howToUseSubtitle}
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Interactive Guided Tour Replay Button */}
                    <button
                      id="btn-dropdown-interactive-tour"
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        startTour(0);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-[#1A73E8]/10 dark:group-hover:bg-[#E8A33D]/15 flex items-center justify-center theme-text-secondary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-tight flex items-center justify-between">
                          <span>{t.onboardingReplay}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Tour
                          </span>
                        </div>
                        <div className="text-[10px] theme-text-secondary leading-tight mt-0.5 truncate">
                          {t.onboardingReplaySubtitle}
                        </div>
                      </div>
                    </button>

                    {/* Settings Button */}
                    <button
                      id="btn-dropdown-settings"
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-[#1A73E8]/10 dark:group-hover:bg-[#E8A33D]/15 flex items-center justify-center theme-text-secondary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-tight">{t.settings}</div>
                        <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">Preferences, PIN Lock & AI</div>
                      </div>
                    </button>

                    {/* Export Vault Button */}
                    {onOpenExportVault && (
                      <button
                        id="btn-dropdown-export"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenExportVault();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-[#1A73E8]/10 dark:group-hover:bg-[#E8A33D]/15 flex items-center justify-center theme-text-secondary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>Export Vault</span>
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full theme-bg-subtle theme-text-secondary">
                              PDF/MD/JSON
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">Download full backup or entry</div>
                        </div>
                      </button>
                    )}

                    {/* Import Vault Button */}
                    {onOpenImportVault && (
                      <button
                        id="btn-dropdown-import"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenImportVault();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-[#1A73E8]/10 dark:group-hover:bg-[#E8A33D]/15 flex items-center justify-center theme-text-secondary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>{t.importData || 'Import Backup'}</span>
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full theme-bg-subtle theme-text-secondary">
                              JSON
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">Restore reflections into vault</div>
                        </div>
                      </button>
                    )}

                    {/* Streak & Stats Option (Clickable - opens heatmap/calendar modal) */}
                    {onOpenStreakModal && (
                      <button
                        id="btn-dropdown-streak"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenStreakModal();
                        }}
                        title="Click to view full streak calendar & activity heatmap"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                          <Flame className="w-4 h-4 fill-amber-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>Journaling Streak</span>
                            <span className="text-[10px] text-[#1A73E8] dark:text-[#E8A33D] font-bold group-hover:underline">
                              View Heatmap
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">{streakCount} consecutive days</div>
                        </div>
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
                        title="Observational view of your emotional patterns over time"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-purple-500/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>{t.moodTrends}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/10 dark:bg-amber-500/20 text-[#1A73E8] dark:text-[#E8A33D]">
                              Trends
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5 truncate">
                            {t.moodTrendsSubtitle}
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Lock App Option with Safe No-PIN Guard */}
                    {lockSettings.enabled && lockSettings.pinHash ? (
                      <button
                        id="btn-dropdown-lock"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          lockApp();
                        }}
                        title="Immediately lock the application"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-amber-500/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] group-hover:scale-105 transition-transform">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight">Lock Journal Now</div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">Require PIN to resume</div>
                        </div>
                      </button>
                    ) : (
                      <button
                        id="btn-dropdown-lock-unconfigured"
                        onClick={() => {
                          setIsAvatarDropdownOpen(false);
                          onOpenSettings();
                        }}
                        title="App Lock is unconfigured — Click to set up a secure PIN in Settings"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle flex items-center justify-center theme-text-secondary group-hover:text-amber-500 transition-colors">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight flex items-center justify-between">
                            <span>Lock Journal Now</span>
                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                              Setup PIN
                            </span>
                          </div>
                          <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">Set up a PIN in Settings to use this</div>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="border-t theme-border my-1.5" />

                  {/* Sign Out / Logout Button */}
                  <button
                    id="btn-dropdown-logout"
                    onClick={() => {
                      setIsAvatarDropdownOpen(false);
                      logOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-tight">{t.signOut}</div>
                      <div className="text-[10px] opacity-80 leading-tight mt-0.5">End active session</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


import React, { useState, useEffect } from 'react';
import { 
  X, 
  Palette, 
  Type, 
  Globe, 
  Check, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Cloud, 
  Clock, 
  Lock, 
  Timer, 
  HeartHandshake, 
  Download, 
  Upload, 
  ExternalLink, 
  KeyRound, 
  AlertCircle, 
  Trash2, 
  CloudSun, 
  Loader2, 
  BookOpen, 
  Sparkles,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { AppTheme, AppFontSize, AppLanguage, JournalEntry } from '../types';
import { hashPin } from '../lib/lockService';
import { fetchHistoricalWeather, resolveCoordinatesForEntry } from '../lib/weatherService';
import { saveJournalEntry } from '../lib/firestoreService';
import { DeleteAccountModal } from './DeleteAccountModal';
import { ImportDataModal } from './ImportDataModal';

export type SettingsTab = 'appearance' | 'security' | 'language' | 'context' | 'help';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userEmail?: string | null;
  entries?: JournalEntry[];
  initialTab?: SettingsTab;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  onOpenHowToUse?: () => void;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setVisible(!visible);
        }}
        className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
        title={text}
        aria-label={text}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {visible && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-50 w-52 p-2 rounded-xl text-[11px] leading-snug theme-bg-surface border theme-border shadow-lg theme-text-secondary pointer-events-none animate-in fade-in zoom-in-95">
          {text}
        </span>
      )}
    </span>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  entries = [],
  initialTab = 'appearance',
  onOpenExport,
  onOpenImport,
  onOpenHowToUse,
}) => {
  const { 
    theme, 
    setTheme, 
    themeMode,
    setThemeMode,
    fontSize, 
    setFontSize, 
    language, 
    setLanguage, 
    lockSettings,
    updateLockSettings,
    weatherEnabled,
    setWeatherEnabled,
    t,
    isSavingPrefs,
    startTour
  } = usePreferences();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Synchronize initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Weather Backfill state
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ current: number; total: number } | null>(null);
  const [backfillResult, setBackfillResult] = useState<{ updated: number; failed: number } | null>(null);

  // Eligible reflections for weather backfill:
  const eligibleBackfillEntries = entries.filter(
    (e) => !e.deletedAt && !e.metadata?.weather && resolveCoordinatesForEntry(e) !== null
  );

  const handleBackfillWeather = async () => {
    if (isBackfilling || !userId || eligibleBackfillEntries.length === 0) return;

    setIsBackfilling(true);
    setBackfillResult(null);
    setBackfillProgress({ current: 0, total: eligibleBackfillEntries.length });

    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < eligibleBackfillEntries.length; i++) {
      const entry = eligibleBackfillEntries[i];
      setBackfillProgress({ current: i + 1, total: eligibleBackfillEntries.length });

      try {
        const coords = resolveCoordinatesForEntry(entry);
        if (coords) {
          const timestamp = entry.createdAt || entry.updatedAt || Date.now();
          const weatherData = await fetchHistoricalWeather(coords.lat, coords.lng, timestamp);
          if (weatherData) {
            const updated: JournalEntry = {
              ...entry,
              metadata: {
                ...entry.metadata,
                weather: weatherData,
              },
            };
            await saveJournalEntry(userId, updated);
            updatedCount++;
          } else {
            failedCount++;
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        console.warn('Failed to backfill weather for entry:', entry.id, err);
        failedCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setBackfillResult({ updated: updatedCount, failed: failedCount });
    setIsBackfilling(false);
    setBackfillProgress(null);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themesList: Array<{
    id: AppTheme;
    name: string;
    bg: string;
    accent: string;
    text: string;
    border: string;
  }> = [
    {
      id: 'light',
      name: t.themeLight || 'Light',
      bg: '#F8FAFD',
      accent: '#1A73E8',
      text: '#1F1F1F',
      border: '#E3E8EF',
    },
    {
      id: 'dark',
      name: t.themeDark || 'Dark',
      bg: '#1A1614',
      accent: '#E8A33D',
      text: '#EDE5DB',
      border: '#38302A',
    },
    {
      id: 'paper',
      name: t.themePaper || 'Paper',
      bg: '#FAF6EF',
      accent: '#B8722E',
      text: '#2D2824',
      border: '#E6DCBA',
    },
    {
      id: 'vellum',
      name: t.themeVellum || 'Vellum',
      bg: '#EFE6D8',
      accent: '#A8623B',
      text: '#4A3B2C',
      border: '#D6C7B2',
    },
    {
      id: 'vivid',
      name: t.themeVivid || 'Vivid',
      bg: '#F5F3FF',
      accent: '#7C5CFF',
      text: '#1E1B4B',
      border: '#DDD6FE',
    },
  ];

  const fontSizesList: Array<{
    id: AppFontSize;
    name: string;
    sizeClass: string;
  }> = [
    { id: 'small', name: t.fontSmall || 'Small', sizeClass: 'text-xs' },
    { id: 'medium', name: t.fontMedium || 'Medium', sizeClass: 'text-sm' },
    { id: 'large', name: t.fontLarge || 'Large', sizeClass: 'text-base' },
  ];

  const languagesList: Array<{
    id: AppLanguage;
    name: string;
    nativeName: string;
  }> = [
    { id: 'en', name: 'English', nativeName: 'English' },
    { id: 'es', name: 'Spanish', nativeName: 'Español' },
    { id: 'fr', name: 'French', nativeName: 'Français' },
    { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const timeoutOptions: Array<{ minutes: number; label: string }> = [
    { minutes: 1, label: t.timeout1Min || '1 minute' },
    { minutes: 5, label: t.timeout5Min || '5 minutes' },
    { minutes: 15, label: t.timeout15Min || '15 minutes' },
    { minutes: 30, label: t.timeout30Min || '30 minutes' },
    { minutes: 0, label: t.timeoutNever || 'Never' },
  ];

  const handleSaveNewPin = async () => {
    setPinError(null);
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('PIN must be exactly 4 numeric digits');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError(t.pinMismatch || 'PIN codes do not match');
      return;
    }

    try {
      const pinHash = await hashPin(pinInput);
      await updateLockSettings({
        enabled: true,
        pinHash,
      });
      setPinSuccess(true);
      setIsSettingPin(false);
      setPinInput('');
      setPinConfirm('');
      setTimeout(() => setPinSuccess(false), 3000);
    } catch {
      setPinError('Failed to hash and save PIN.');
    }
  };

  const handleToggleLockEnabled = () => {
    if (lockSettings.enabled) {
      updateLockSettings({ enabled: false });
    } else {
      if (!lockSettings.pinHash) {
        setIsSettingPin(true);
      } else {
        updateLockSettings({ enabled: true });
      }
    }
  };

  const navTabs: Array<{
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'appearance', label: t.tabAppearance || 'Appearance', icon: Palette },
    { id: 'security', label: t.tabSecurity || 'Security', icon: ShieldCheck },
    { id: 'language', label: t.tabLanguage || 'Language', icon: Globe },
    { id: 'context', label: t.tabContext || 'Context', icon: CloudSun },
    { id: 'help', label: t.tabHelp || 'Help & Data', icon: BookOpen },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl h-[560px] max-h-[90vh] theme-bg-surface border theme-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b theme-border flex items-center justify-between theme-bg-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white shadow-xs">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-gemini-display font-bold text-sm sm:text-base theme-text-primary leading-snug">
                {t.settingsTitle || 'Settings & Preferences'}
              </h3>
              <p className="text-[11px] theme-text-secondary leading-none mt-0.5">
                {t.settingsSubtitle || 'Manage your theme, security, and journal tools'}
              </p>
            </div>
          </div>

          <button
            id="btn-settings-close"
            onClick={onClose}
            className="p-1.5 rounded-full theme-text-secondary hover:theme-text-primary hover:theme-bg-hover transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Sidebar Navigation + Active Tab Content */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar Tabs */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r theme-border p-2 sm:p-2.5 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 scrollbar-none bg-black/[0.02] dark:bg-white/[0.02]">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:w-full ${
                    isActive
                      ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] shadow-xs'
                      : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Area (Scrolls internally) */}
          <div className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto space-y-6 text-left">
            {/* TAB 1: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Auto Dark Theme Toggle */}
                <div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border theme-border theme-bg-subtle/70">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-amber-500/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-semibold theme-text-primary">
                          {t.themeModeAuto || 'Auto Dark Theme'}
                        </span>
                        <InfoTooltip text="Switches automatically between light mode (6 AM – 6 PM) and dark mode (6 PM – 6 AM) based on local time." />
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-auto-theme"
                      onClick={() => {
                        setThemeMode(themeMode === 'auto' ? 'manual' : 'auto');
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        themeMode === 'auto'
                          ? 'bg-[#1A73E8] dark:bg-[#E8A33D]'
                          : 'bg-black/20 dark:bg-white/20'
                      }`}
                      role="switch"
                      aria-checked={themeMode === 'auto'}
                      title={themeMode === 'auto' ? 'Disable auto theme' : 'Enable auto theme'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          themeMode === 'auto' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Theme Palette Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                      <Palette className="w-3.5 h-3.5 theme-accent-text" />
                      <span>{t.themeSection || 'Theme Palette'}</span>
                    </div>
                    {themeMode === 'auto' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border theme-border theme-text-secondary">
                        Active: {theme === 'dark' ? 'Dark (Night)' : 'Light (Day)'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {themesList.map((th) => {
                      const isSelected = theme === th.id && themeMode === 'manual';
                      return (
                        <button
                          key={th.id}
                          id={`btn-theme-${th.id}`}
                          onClick={() => {
                            setTheme(th.id);
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#1A73E8] dark:border-[#E8A33D] ring-2 ring-[#1A73E8]/30 dark:ring-[#E8A33D]/30 shadow-xs'
                              : 'border-black/10 dark:border-white/10 hover:opacity-90'
                          }`}
                          style={{ backgroundColor: th.bg, color: th.text }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                              style={{ backgroundColor: th.accent }}
                            />
                            <span className="font-semibold text-xs truncate">
                              {th.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" style={{ color: th.accent }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div className="pt-2 border-t theme-border">
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                    <Type className="w-3.5 h-3.5 theme-accent-text" />
                    <span>{t.fontSizeSection || 'Typography & Sizing'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {fontSizesList.map((fs) => {
                      const isSelected = fontSize === fs.id;
                      return (
                        <button
                          key={fs.id}
                          id={`btn-font-size-${fs.id}`}
                          onClick={() => setFontSize(fs.id)}
                          className={`py-2 px-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] font-bold shadow-2xs'
                              : 'theme-border hover:theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`${fs.sizeClass}`}>Aa</span>
                            <span className="text-xs">{fs.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* App Lock Section */}
                <div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-amber-500/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-semibold theme-text-primary">
                          {t.appLockTitle || 'App Lock (PIN)'}
                        </span>
                        <InfoTooltip text="Requires a 4-digit PIN to access your reflections when opening or returning to the app." />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lockSettings.enabled && lockSettings.pinHash && !isSettingPin && (
                        <button
                          type="button"
                          onClick={() => setIsSettingPin(true)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2"
                        >
                          Change PIN
                        </button>
                      )}
                      <button
                        type="button"
                        id="btn-toggle-app-lock"
                        onClick={handleToggleLockEnabled}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          lockSettings.enabled
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310]'
                        }`}
                      >
                        {lockSettings.enabled ? 'Disable Lock' : (t.enableAppLock || 'Enable Lock')}
                      </button>
                    </div>
                  </div>

                  {pinSuccess && (
                    <div className="p-2.5 mt-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t.reauthSuccess || 'PIN successfully updated!'}</span>
                    </div>
                  )}

                  {/* PIN Setup Form */}
                  {isSettingPin && (
                    <div className="p-4 rounded-2xl theme-bg-subtle border theme-border mt-3 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold theme-text-primary">
                        <KeyRound className="w-4 h-4 theme-accent-text" />
                        <span>{t.setPinCode || 'Set 4-Digit PIN'}</span>
                      </div>

                      {pinError && (
                        <p className="text-xs text-rose-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {pinError}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] theme-text-secondary block mb-1">{t.enterPinCode || 'Enter PIN'}</label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center font-mono text-sm py-1.5 px-2 rounded-xl theme-bg-surface border theme-border theme-text-primary focus:outline-none focus:border-[#1A73E8]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] theme-text-secondary block mb-1">{t.confirmPinCode || 'Confirm PIN'}</label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pinConfirm}
                            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center font-mono text-sm py-1.5 px-2 rounded-xl theme-bg-surface border theme-border theme-text-primary focus:outline-none focus:border-[#1A73E8]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingPin(false);
                            setPinInput('');
                            setPinConfirm('');
                            setPinError(null);
                          }}
                          className="px-3 py-1 rounded-full text-xs theme-text-secondary hover:theme-text-primary"
                        >
                          {t.cancel || 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewPin}
                          className="px-4 py-1.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-bold"
                        >
                          Save PIN
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Auto-Lock Inactivity Timeout */}
                  {lockSettings.enabled && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border mt-3">
                      <div className="flex items-center gap-2 text-xs font-semibold theme-text-primary">
                        <Timer className="w-4 h-4 theme-accent-text" />
                        <span>{t.autoLockTimeout || 'Auto-Lock Timeout'}</span>
                        <InfoTooltip text="Automatically locks the vault after this period of inactivity." />
                      </div>
                      <select
                        value={lockSettings.autoLockMinutes}
                        onChange={(e) => updateLockSettings({ autoLockMinutes: Number(e.target.value) })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl theme-bg-surface border theme-border theme-text-primary focus:outline-none focus:border-[#1A73E8] cursor-pointer"
                      >
                        {timeoutOptions.map((opt) => (
                          <option key={opt.minutes} value={opt.minutes}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Account Danger Zone */}
                <div className="pt-4 border-t border-rose-500/20">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {t.dangerZone || 'Delete Account'}
                        </p>
                        <p className="text-[11px] theme-text-secondary leading-none mt-0.5">
                          Permanently delete your profile and reflections
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-open-delete-account"
                      onClick={() => setDeleteAccountModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteAccount || 'Delete Account'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LANGUAGE */}
            {activeTab === 'language' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 theme-accent-text" />
                  <span>{t.languageSection || 'Interface Language'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {languagesList.map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        id={`btn-language-${lang.id}`}
                        onClick={() => setLanguage(lang.id)}
                        className={`px-3.5 py-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] font-semibold shadow-2xs'
                            : 'theme-border hover:theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">
                            {lang.nativeName}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">
                            {lang.name}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CONTEXT & WEATHER */}
            {activeTab === 'context' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Weather Toggle */}
                <div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                        <CloudSun className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-semibold theme-text-primary">
                          Ambient Weather & Context
                        </span>
                        <InfoTooltip text="Enriches reflections with current local conditions (temperature, condition, humidity) using Open-Meteo. Coordinates are never saved unless location tagging is active." />
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-weather-enabled"
                      onClick={() => setWeatherEnabled(!weatherEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        weatherEnabled ? 'bg-sky-600' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      role="switch"
                      aria-checked={weatherEnabled}
                      title={weatherEnabled ? 'Disable automatic weather' : 'Enable automatic weather'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          weatherEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Historical Weather Backfill Card */}
                <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold theme-text-primary">Add Weather to Past Entries</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        eligibleBackfillEntries.length > 0
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                          : 'theme-bg-surface theme-text-secondary border theme-border'
                      }`}>
                        {eligibleBackfillEntries.length > 0
                          ? `${eligibleBackfillEntries.length} eligible`
                          : 'All up-to-date'}
                      </span>
                    </div>

                    <button
                      type="button"
                      id="btn-backfill-past-weather"
                      onClick={handleBackfillWeather}
                      disabled={isBackfilling || eligibleBackfillEntries.length === 0}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 shadow-2xs ${
                        eligibleBackfillEntries.length > 0 && !isBackfilling
                          ? 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95'
                          : 'theme-bg-surface theme-text-secondary opacity-50 cursor-not-allowed border theme-border'
                      }`}
                    >
                      {isBackfilling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Backfilling...</span>
                        </>
                      ) : (
                        <span>Add Weather</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] theme-text-secondary leading-relaxed">
                    Backfills reflections that have a city or place tag using Open-Meteo archive data.
                  </p>

                  {/* Backfill Live Progress Indicator */}
                  {isBackfilling && backfillProgress && (
                    <div className="pt-2 border-t theme-border space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] theme-text-secondary">
                        <span>Backfilling reflection {backfillProgress.current} of {backfillProgress.total}...</span>
                        <span>{Math.round((backfillProgress.current / backfillProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-200"
                          style={{ width: `${(backfillProgress.current / backfillProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Backfill Result Toast */}
                  {backfillResult && !isBackfilling && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          Added historical weather to {backfillResult.updated} {backfillResult.updated === 1 ? 'reflection' : 'reflections'}
                          {backfillResult.failed > 0 ? ` (${backfillResult.failed} skipped)` : ''}.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackfillResult(null)}
                        className="p-1 hover:bg-emerald-500/15 rounded-lg text-emerald-700 dark:text-emerald-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: HELP & DATA */}
            {activeTab === 'help' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Guide & Tour Cards */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 theme-accent-text" />
                    <span>Learning & Walkthrough</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* How to Use / User Guide */}
                    {onOpenHowToUse && (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-amber-500/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold theme-text-primary">{t.howToUse || 'User Guide'}</p>
                            <p className="text-[11px] theme-text-secondary truncate">Tips, shortcuts & guide</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-settings-how-to-use"
                          onClick={() => {
                            onClose();
                            onOpenHowToUse();
                          }}
                          className="py-1 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold theme-text-primary transition-colors shrink-0 ml-2"
                        >
                          Open
                        </button>
                      </div>
                    )}

                    {/* Guided Feature Tour */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold theme-text-primary">{t.onboardingReplay || 'Interactive Tour'}</p>
                          <p className="text-[11px] theme-text-secondary truncate">Visual walkthrough</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="btn-settings-start-tour"
                        onClick={() => {
                          onClose();
                          startTour(0);
                        }}
                        className="py-1 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold theme-text-primary transition-colors shrink-0 ml-2 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Replay</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vault Data: Export & Import */}
                <div className="pt-2 border-t theme-border">
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                    <Download className="w-3.5 h-3.5 theme-accent-text" />
                    <span>Vault Data Backup</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Export Card */}
                    {onOpenExport && (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold theme-text-primary">{t.export || 'Export Vault'}</p>
                            <p className="text-[11px] theme-text-secondary truncate">PDF, Markdown or JSON</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-settings-export-vault"
                          onClick={() => {
                            onClose();
                            onOpenExport();
                          }}
                          className="py-1 px-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-semibold shadow-2xs transition-colors shrink-0 ml-2"
                        >
                          {t.export || 'Export'}
                        </button>
                      </div>
                    )}

                    {/* Import Card */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold theme-text-primary">{t.importData || 'Import Backup'}</p>
                          <p className="text-[11px] theme-text-secondary truncate">Restore from JSON</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="btn-settings-import-vault"
                        onClick={() => {
                          if (onOpenImport) {
                            onClose();
                            onOpenImport();
                          } else {
                            setImportModalOpen(true);
                          }
                        }}
                        className="py-1 px-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-semibold shadow-2xs transition-colors shrink-0 ml-2"
                      >
                        {t.importData ? t.importData.split(' ')[0] : 'Import'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mental Health Helpline */}
                <div className="pt-2 border-t theme-border">
                  <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/15 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{t.needToTalk || 'Need someone to talk to?'}</p>
                        <p className="text-[11px] opacity-85 leading-none mt-0.5">{t.helplineDirectory || 'Free, confidential crisis helplines worldwide'}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t theme-border theme-bg-subtle flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 theme-text-secondary text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isSavingPrefs ? (
                <span className="flex items-center gap-1 text-[#1A73E8] dark:text-[#E8A33D]">
                  <Cloud className="w-3 h-3 animate-pulse" />
                  Saving...
                </span>
              ) : (
                <span>Auto-saved to cloud</span>
              )}
            </span>
          </div>

          <button
            id="btn-settings-close-footer"
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-semibold text-xs shadow-2xs transition-all active:scale-95"
          >
            {t.close || 'Close'}
          </button>
        </div>
      </div>

      {/* Delete Account & Data Confirmation Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
      />

      {/* Import Backup Data Modal */}
      <ImportDataModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entries={entries}
        userId={userId}
      />
    </div>
  );
};


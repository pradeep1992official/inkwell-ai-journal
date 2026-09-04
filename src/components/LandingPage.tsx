import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Feather, 
  Mic, 
  Volume2, 
  Download, 
  Palette, 
  Globe, 
  Sparkles,
  ChevronDown,
  Check,
  BookOpen,
  User,
  Loader2
} from 'lucide-react';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';
import { usePreferences } from '../context/PreferencesContext';
import { HowToUseModal } from './HowToUseModal';
import { AppLanguage } from '../types';

interface LandingPageProps {
  onSignInSuccess?: () => void;
}

const languagesList: Array<{ id: AppLanguage; label: string; nativeName: string }> = [
  { id: 'en', label: 'English', nativeName: 'English' },
  { id: 'es', label: 'Spanish', nativeName: 'Español' },
  { id: 'fr', label: 'French', nativeName: 'Français' },
  { id: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { id: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
];

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const { t, language, setLanguage } = usePreferences();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langDropdownOpen]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in was cancelled. Please click again.');
      } else {
        setErrorMsg(err?.message || 'Authentication encountered an issue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      setErrorMsg(null);
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest sign-in failed:', err);
      setErrorMsg(err?.message || 'Could not start guest session. Please try again or use Google Sign-In.');
    } finally {
      setGuestLoading(false);
    }
  };

  const currentLangObj = languagesList.find((l) => l.id === language) || languagesList[0];

  return (
    <div className="min-h-screen theme-bg-app theme-text-primary flex flex-col justify-between selection:bg-[#1A73E8]/30 transition-colors">
      {/* Top Banner / Navigation */}
      <header className="border-b theme-border theme-bg-surface/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white font-bold shadow-sm">
              <Feather className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-gemini-display font-bold text-xl tracking-tight theme-text-primary">{t.appName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Unobtrusive Pre-Login Language Switcher */}
            <div className="relative" ref={langDropdownRef}>
              <button
                id="btn-landing-language-selector"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium theme-bg-subtle hover:theme-bg-hover theme-text-primary border theme-border transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Change Language"
                aria-label="Change Language"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                <span className="hidden sm:inline font-medium">
                  {currentLangObj.nativeName}
                </span>
                <span className="sm:hidden uppercase font-semibold text-[11px]">
                  {language}
                </span>
                <ChevronDown className={`w-3 h-3 theme-text-secondary opacity-70 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Dropdown Menu */}
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl theme-bg-surface border theme-border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold theme-text-secondary border-b theme-border mb-1">
                    Language / भाषा / மொழி
                  </div>
                  {languagesList.map((langItem) => {
                    const isSelected = language === langItem.id;
                    return (
                      <button
                        key={langItem.id}
                        id={`btn-landing-lang-${langItem.id}`}
                        onClick={() => {
                          setLanguage(langItem.id);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'theme-bg-subtle font-semibold theme-accent-text'
                            : 'theme-text-primary hover:theme-bg-hover'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="leading-tight">{langItem.nativeName}</span>
                          {langItem.nativeName !== langItem.label && (
                            <span className="text-[10px] theme-text-secondary leading-tight">{langItem.label}</span>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 theme-accent-text shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secondary Top Guest Link */}
            <button
              id="btn-landing-top-guest"
              onClick={handleGuestSignIn}
              disabled={loading || guestLoading}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary border theme-border text-xs font-medium transition-colors cursor-pointer active:scale-95 disabled:opacity-60"
              title={t.continueAsGuestSubtitle}
            >
              {guestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5 opacity-70" />}
              <span>{t.continueAsGuest}</span>
            </button>

            <button
              id="btn-landing-top-signin"
              onClick={handleSignIn}
              disabled={loading || guestLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-70 cursor-pointer"
            >
              {loading ? t.connecting : t.signInWithGoogle}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Security / Architecture Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium theme-bg-subtle theme-accent-text border theme-border mb-8 shadow-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>{t.landingBadge}</span>
        </div>

        <h1 className="font-gemini-display text-4xl sm:text-6xl font-bold tracking-tight theme-text-primary max-w-3xl leading-[1.15]">
          {t.landingHero1}{' '}
          <span className="gemini-gradient-text">
            {t.landingHeroGemini}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg theme-text-secondary max-w-2xl leading-relaxed">
          {t.landingSubtitle}
        </p>

        {/* Error notification if any */}
        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm max-w-lg flex items-start gap-3 text-left shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm">Sign-in Notice</p>
              <p className="text-xs mt-1 leading-relaxed text-rose-700 dark:text-rose-300">{errorMsg}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="px-2.5 py-1.5 rounded-lg theme-bg-subtle hover:theme-bg-hover text-xs font-medium text-rose-700 dark:text-rose-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary CTA + Secondary Guest Option */}
        <div className="mt-10 flex flex-col items-center gap-3 w-full max-w-sm sm:max-w-md">
          {/* Primary Action: Google Sign In */}
          <button
            id="btn-google-signin-hero"
            onClick={handleSignIn}
            disabled={loading || guestLoading}
            className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-75 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? t.connecting : t.signInWithGoogle}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          {/* Secondary Action: Continue as Guest (Firebase Anonymous Auth) */}
          <button
            id="btn-continue-as-guest"
            onClick={handleGuestSignIn}
            disabled={loading || guestLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full theme-bg-subtle hover:theme-bg-hover text-xs sm:text-sm font-medium theme-text-secondary hover:theme-text-primary border theme-border transition-all shadow-2xs active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            title={t.continueAsGuestSubtitle}
          >
            {guestLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <User className="w-4 h-4 theme-accent-text" />
            )}
            <span>{guestLoading ? t.connecting : t.continueAsGuest}</span>
            <span className="text-[11px] opacity-70 hidden sm:inline">— Try instantly without sign-in</span>
          </button>
        </div>

        <p className="mt-4 text-xs theme-text-secondary max-w-md">
          {t.landingAuthSub}
        </p>

        {/* Feature Highlights - 6 Distinctive Cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left w-full">
          {/* 1. Voice-to-Text Dictation */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-amber-400/20 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] mb-5">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature1Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature1Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs theme-accent-text font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature1Badge}
            </div>
          </div>

          {/* 2. Read Aloud, In Your Language */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-400/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature2Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature2Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature2Badge}
            </div>
          </div>

          {/* 3. Export Your Journal Anytime */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature3Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature3Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature3Badge}
            </div>
          </div>

          {/* 4. Five Moods, One Journal */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature4Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature4Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature4Badge}
            </div>
          </div>

          {/* 5. Speak Your Own Language */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-5">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature5Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature5Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature5Badge}
            </div>
          </div>

          {/* 6. Insights, Not Just Answers */}
          <div className="p-7 rounded-3xl theme-bg-surface border theme-border transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-pink-500/10 dark:bg-pink-400/20 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.feature6Title}</h3>
              <p className="mt-2 text-sm theme-text-secondary leading-relaxed">
                {t.feature6Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t theme-border flex items-center gap-1.5 text-xs text-pink-600 dark:text-pink-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.feature6Badge}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t theme-border py-6 text-center text-xs theme-text-secondary">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {t.footerRights}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-landing-how-to-use"
              onClick={() => setHowToUseOpen(true)}
              className="inline-flex items-center gap-1.5 hover:theme-text-primary transition-colors cursor-pointer group text-xs theme-text-secondary hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5 theme-accent-text group-hover:scale-105 transition-transform" />
              <span>{t.howToUse}</span>
            </button>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 theme-accent-text" /> {t.footerAuth}
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 theme-accent-text" /> {t.footerProxy}
            </span>
          </div>
        </div>
      </footer>

      {/* How to Use Guide Modal */}
      <HowToUseModal
        isOpen={howToUseOpen}
        onClose={() => setHowToUseOpen(false)}
      />
    </div>
  );
};

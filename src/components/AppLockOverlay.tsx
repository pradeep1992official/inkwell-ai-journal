import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, AlertCircle, RefreshCw, Feather, Keyboard } from 'lucide-react';
import { verifyPin } from '../lib/lockService';
import { signInWithGoogle } from '../lib/firebase';
import { usePreferences } from '../context/PreferencesContext';

interface AppLockOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const AppLockOverlay: React.FC<AppLockOverlayProps> = ({ isLocked, onUnlock }) => {
  const { t, lockSettings, updateLockSettings } = usePreferences();
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [reauthNotice, setReauthNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically whenever locked
  useEffect(() => {
    if (isLocked) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  const validatePin = async (pinToTest: string) => {
    if (!lockSettings.pinHash) {
      onUnlock();
      return;
    }

    const isValid = await verifyPin(pinToTest, lockSettings.pinHash);
    if (isValid) {
      setEnteredPin('');
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => {
        setEnteredPin('');
        inputRef.current?.focus();
      }, 500);
    }
  };

  // Handle number input (both on-screen pad & keyboard)
  const handleDigit = useCallback(
    (digit: string) => {
      setEnteredPin((prev) => {
        if (prev.length >= 4) return prev;
        const nextPin = prev + digit;
        setError(false);
        if (nextPin.length === 4) {
          validatePin(nextPin);
        }
        return nextPin;
      });
    },
    [lockSettings.pinHash]
  );

  const handleBackspace = useCallback(() => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleClear = useCallback(() => {
    setEnteredPin('');
    setError(false);
  }, []);

  // Handle hidden input changes (for mobile soft-keyboard, autofill, or physical keyboard typing)
  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    setEnteredPin(rawVal);
    setError(false);
    if (rawVal.length === 4) {
      validatePin(rawVal);
    }
  };

  // Forgot PIN: re-authenticate with Google and reset PIN lock
  const handleForgotPin = async () => {
    try {
      setIsReauthing(true);
      setReauthNotice(null);
      const user = await signInWithGoogle();
      if (user) {
        await updateLockSettings({ enabled: false, pinHash: null });
        onUnlock();
      }
    } catch (err: any) {
      console.warn('Re-auth for PIN reset cancelled or failed:', err);
      setReauthNotice('Google Authentication required to reset PIN.');
    } finally {
      setIsReauthing(false);
    }
  };

  // Physical keyboard & Numpad listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLocked) return;

      // Handle numbers 0-9 from top row and numpad
      if (/^[0-9]$/.test(e.key) || (e.code && e.code.startsWith('Numpad') && /^[0-9]$/.test(e.key))) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    },
    [isLocked, handleDigit, handleBackspace, handleClear]
  );

  useEffect(() => {
    if (isLocked) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLocked, handleKeyDown]);

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => inputRef.current?.focus()}
        className="fixed inset-0 z-50 theme-bg-app flex flex-col items-center justify-center p-4 selection:bg-transparent cursor-default"
      >
        {/* Hidden Input for Keyboard & Autofill Support */}
        <input
          ref={inputRef}
          id="input-pin-keyboard"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={enteredPin}
          onChange={handleHiddenInputChange}
          autoFocus
          aria-label="Enter 4-digit PIN"
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />

        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {/* Brand & Lock Badge */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-5">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="font-gemini-display font-bold text-2xl theme-text-primary tracking-tight">
            {t.appLockedTitle}
          </h2>
          <p className="mt-1.5 text-xs theme-text-secondary max-w-xs leading-relaxed">
            {t.appLockedDesc}
          </p>

          {/* 4-Digit Indicator Slots */}
          <motion.div
            animate={error ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-4 my-6 cursor-pointer"
            onClick={() => inputRef.current?.focus()}
            title="Click or use keyboard to type PIN"
          >
            {[0, 1, 2, 3].map((index) => {
              const filled = enteredPin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    filled
                      ? error
                        ? 'bg-rose-500 scale-110 shadow-sm shadow-rose-500/50'
                        : 'bg-[#1A73E8] dark:bg-[#E8A33D] scale-110 shadow-sm'
                      : 'border-2 theme-border theme-bg-surface'
                  }`}
                />
              );
            })}
          </motion.div>

          {/* Keyboard typing hint badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full theme-bg-subtle text-[11px] theme-text-secondary mb-4 border theme-border shadow-2xs">
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t.pinKeyboardHint}</span>
          </div>

          {/* Error / Notice Text */}
          {error && (
            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 mb-4 animate-shake">
              <AlertCircle className="w-3.5 h-3.5" />
              {t.incorrectPin}
            </p>
          )}

          {reauthNotice && (
            <p className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5" />
              {reauthNotice}
            </p>
          )}

          {/* Number Pad Grid */}
          <div className="grid grid-cols-3 gap-3 w-64 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                id={`pin-btn-${num}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDigit(num.toString());
                  inputRef.current?.focus();
                }}
                className="w-18 h-18 rounded-3xl theme-bg-surface hover:theme-bg-hover border theme-border font-gemini-display font-semibold text-xl theme-text-primary flex items-center justify-center transition-all active:scale-90 shadow-xs hover:border-[#1A73E8]/40 dark:hover:border-[#E8A33D]/40 cursor-pointer"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row: Clear, 0, Backspace */}
            <button
              type="button"
              id="pin-btn-clear"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
                inputRef.current?.focus();
              }}
              className="w-18 h-18 rounded-3xl theme-bg-subtle hover:theme-bg-hover border theme-border theme-text-secondary text-xs font-medium flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              Clear
            </button>

            <button
              id="pin-btn-0"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDigit('0');
                inputRef.current?.focus();
              }}
              className="w-18 h-18 rounded-3xl theme-bg-surface hover:theme-bg-hover border theme-border font-gemini-display font-semibold text-xl theme-text-primary flex items-center justify-center transition-all active:scale-90 shadow-xs hover:border-[#1A73E8]/40 dark:hover:border-[#E8A33D]/40 cursor-pointer"
            >
              0
            </button>

            <button
              id="pin-btn-backspace"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBackspace();
                inputRef.current?.focus();
              }}
              className="w-18 h-18 rounded-3xl theme-bg-subtle hover:theme-bg-hover border theme-border theme-text-secondary hover:theme-text-primary flex items-center justify-center transition-all active:scale-90 shadow-xs cursor-pointer"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Forgot PIN / Google Recovery */}
          <button
            id="btn-forgot-pin"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleForgotPin();
            }}
            disabled={isReauthing}
            className="text-xs font-medium theme-accent-text hover:underline flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isReauthing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying with Google...</span>
              </>
            ) : (
              <>
                <Feather className="w-3.5 h-3.5" />
                <span>{t.forgotPin}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePreferences } from '../context/PreferencesContext';
import { purgeAllUserData } from '../lib/firestoreService';
import { logOut } from '../lib/firebase';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userEmail?: string | null;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
}) => {
  const { t } = usePreferences();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setIsDeleting(false);
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting && !isSuccess) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, isSuccess, onClose]);

  if (!isOpen) return null;

  const isConfirmed = confirmationText.trim().toUpperCase() === 'DELETE';

  const handleConfirmDelete = async () => {
    if (!isConfirmed || !userId || isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);

      // 1. Purge all user documents in Firestore & clear localStorage
      await purgeAllUserData(userId);

      // 2. Transition to success state
      setIsSuccess(true);
      setIsDeleting(false);
    } catch (err: any) {
      console.error('Failed to purge user data:', err);
      setIsDeleting(false);
      setErrorMessage(err?.message || 'An unexpected error occurred while deleting your account. Please try again.');
    }
  };

  const handleFinalSignOut = async () => {
    try {
      await logOut();
      onClose();
      // Reload or reset navigation to root
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error signing out after deletion:', err);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isDeleting && !isSuccess) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-md theme-bg-surface border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-500/20 flex items-center justify-between bg-rose-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-gemini-display font-bold text-sm text-rose-600 dark:text-rose-400">
                {t.dangerZone}
              </h3>
              <p className="text-[11px] theme-text-secondary">
                {userEmail || 'Account Data Management'}
              </p>
            </div>
          </div>

          {!isDeleting && !isSuccess && (
            <button
              id="btn-close-delete-modal"
              onClick={onClose}
              className="p-1.5 rounded-full theme-text-secondary hover:theme-text-primary hover:theme-bg-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8 stroke-[2]" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-gemini-display font-bold text-base theme-text-primary">
                    {t.accountDeletedSuccess}
                  </h4>
                  <p className="text-xs theme-text-secondary leading-relaxed px-2">
                    {t.accountDeletedSuccessDesc}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border theme-border text-[11px] theme-text-secondary text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Journal entries & reflections erased</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Streak history and metadata removed</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Custom themes and PIN lock cleared</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Google Account untouched</span>
                  </div>
                </div>

                <button
                  id="btn-return-home-deleted"
                  onClick={handleFinalSignOut}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{t.returnToHome}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h4 className="font-gemini-display font-bold text-base theme-text-primary mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{t.deleteAccountConfirmTitle}</span>
                  </h4>
                  <p className="text-xs theme-text-secondary leading-relaxed">
                    {t.deleteAccountConfirmDesc}
                  </p>
                </div>

                {/* Notice Box */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    {t.deleteAccountGoogleNotice}
                  </p>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Confirmation Input Field */}
                <div className="space-y-2 pt-1">
                  <label 
                    htmlFor="delete-confirm-input"
                    className="block text-xs font-semibold theme-text-primary"
                  >
                    {t.typeDeleteToConfirm}
                  </label>
                  <input
                    id="delete-confirm-input"
                    type="text"
                    autoComplete="off"
                    disabled={isDeleting}
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={t.deleteInputPlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl theme-bg-subtle border border-rose-500/30 font-mono text-sm uppercase tracking-wider theme-text-primary placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    id="btn-cancel-delete-account"
                    disabled={isDeleting}
                    onClick={onClose}
                    className="flex-1 py-2 px-4 rounded-xl border theme-border theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="button"
                    id="btn-confirm-delete-account"
                    disabled={!isConfirmed || isDeleting}
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 active:scale-98"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.deletingAccount}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.permanentlyDeleteBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

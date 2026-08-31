import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  entryTitle?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entryTitle,
  isDeleting,
}) => {
  const { t } = usePreferences();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isDeleting ? undefined : onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full max-w-md theme-bg-surface border theme-border rounded-3xl shadow-2xl p-6 z-10 overflow-hidden text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-gemini-display font-bold text-lg theme-text-primary">
                {t.deleteConfirmTitle}
              </h3>
              <p className="mt-1.5 text-xs theme-text-secondary leading-relaxed">
                {t.deleteConfirmDesc}
              </p>
              {entryTitle && (
                <div className="mt-3 px-3 py-2 rounded-xl theme-bg-subtle border theme-border text-xs font-semibold theme-text-primary truncate">
                  "{entryTitle}"
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              id="btn-cancel-delete"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-full text-xs font-semibold theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>

            <button
              id="btn-confirm-delete"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : t.delete}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

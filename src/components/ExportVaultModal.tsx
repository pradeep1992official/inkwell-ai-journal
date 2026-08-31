import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, Code2, File, Check, X, Shield, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';
import { 
  exportEntryToPdf, 
  exportAllEntriesToPdf, 
  downloadEntryMarkdown, 
  downloadAllEntriesMarkdown, 
  downloadEntryPlainText, 
  downloadAllEntriesPlainText, 
  downloadEntryJson, 
  downloadAllEntriesJson 
} from '../lib/exportService';
import { usePreferences } from '../context/PreferencesContext';

interface ExportVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  currentEntry?: JournalEntry | null;
}

type ExportScope = 'current' | 'all';
type ExportFormat = 'pdf' | 'markdown' | 'text' | 'json';

export const ExportVaultModal: React.FC<ExportVaultModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentEntry,
}) => {
  const { t } = usePreferences();
  const activeEntries = useMemo(() => entries.filter((e) => !e.deletedAt), [entries]);
  const [scope, setScope] = useState<ExportScope>(currentEntry && !currentEntry.deletedAt ? 'current' : 'all');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setSuccess(false);

      if (scope === 'current' && currentEntry && !currentEntry.deletedAt) {
        if (format === 'pdf') {
          exportEntryToPdf(currentEntry);
        } else if (format === 'markdown') {
          downloadEntryMarkdown(currentEntry);
        } else if (format === 'text') {
          downloadEntryPlainText(currentEntry);
        } else if (format === 'json') {
          downloadEntryJson(currentEntry);
        }
      } else {
        if (format === 'pdf') {
          exportAllEntriesToPdf(activeEntries);
        } else if (format === 'markdown') {
          downloadAllEntriesMarkdown(activeEntries);
        } else if (format === 'text') {
          downloadAllEntriesPlainText(activeEntries);
        } else if (format === 'json') {
          downloadAllEntriesJson(activeEntries);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full max-w-lg theme-bg-surface border theme-border rounded-3xl shadow-2xl p-6 sm:p-7 z-10 overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b theme-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-amber-400/20 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gemini-display font-bold text-lg theme-text-primary">
                  {t.export}
                </h3>
                <p className="text-xs theme-text-secondary">
                  Download your reflections as clean documents or backup data
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {/* Scope Selection */}
            {currentEntry && (
              <div>
                <label className="text-xs font-semibold theme-text-secondary uppercase tracking-wider block mb-2">
                  Export Target
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScope('current')}
                    className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                      scope === 'current'
                        ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                        : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                    }`}
                  >
                    <p className="font-bold truncate">{t.exportEntry}</p>
                    <p className="text-[11px] font-normal opacity-80 mt-0.5 truncate">
                      "{currentEntry.title || 'Current reflection'}"
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                      scope === 'all'
                        ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                        : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                    }`}
                  >
                    <p className="font-bold">{t.exportAll}</p>
                    <p className="text-[11px] font-normal opacity-80 mt-0.5">
                      All {activeEntries.length} reflections
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <label className="text-xs font-semibold theme-text-secondary uppercase tracking-wider block mb-2">
                Document Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* PDF */}
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    format === 'pdf'
                      ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                      : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold theme-text-primary">PDF Document (.pdf)</p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">Formatted for printing & sharing</p>
                  </div>
                </button>

                {/* Markdown */}
                <button
                  type="button"
                  onClick={() => setFormat('markdown')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    format === 'markdown'
                      ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                      : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold theme-text-primary">Markdown (.md)</p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">Compatible with Obsidian & Notion</p>
                  </div>
                </button>

                {/* Plain Text */}
                <button
                  type="button"
                  onClick={() => setFormat('text')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    format === 'text'
                      ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                      : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold theme-text-primary">Plain Text (.txt)</p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">Lightweight universal text</p>
                  </div>
                </button>

                {/* JSON Data */}
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    format === 'json'
                      ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text'
                      : 'theme-border theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold theme-text-primary">Structured Data (.json)</p>
                    <p className="text-[11px] theme-text-secondary mt-0.5">Portable backup with full metadata</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-center gap-2.5 text-xs theme-text-secondary">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Exported files are generated entirely client-side and never leave your browser.</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-7 pt-4 border-t theme-border flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors"
            >
              {t.cancel}
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || (scope === 'current' && !currentEntry)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 text-white dark:text-[#171310]" />
                  <span>Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating...' : 'Download File'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

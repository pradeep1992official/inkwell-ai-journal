import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  Loader2, 
  Layers, 
  CopyCheck, 
  Calendar, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { JournalEntry } from '../types';
import { usePreferences } from '../context/PreferencesContext';
import { validateAndParseImportJson, ImportValidationResult } from '../lib/importService';
import { importJournalEntriesBatch } from '../lib/firestoreService';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userId?: string | null;
  onImportComplete?: (importedCount: number) => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  entries,
  userId,
  onImportComplete,
}) => {
  const { t } = usePreferences();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportValidationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showDuplicateList, setShowDuplicateList] = useState(false);
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setParseResult(null);
      setIsAnalyzing(false);
      setIsImporting(false);
      setImportSuccess(false);
      setImportedCount(0);
      setShowDuplicateList(false);
      setShowPreviewList(false);
      setGeneralError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isImporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isImporting, onClose]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setGeneralError(t.importInvalidFile || 'Please select a valid JSON backup file (.json).');
      setSelectedFile(null);
      setParseResult(null);
      return;
    }

    try {
      setIsAnalyzing(true);
      setGeneralError(null);
      setSelectedFile(file);

      const text = await file.text();
      const result = validateAndParseImportJson(text, entries, userId || 'user');
      setParseResult(result);

      if (!result.isValid) {
        setGeneralError(result.errorMessage || 'Invalid backup file structure.');
      }
    } catch (err: any) {
      console.error('Error reading file:', err);
      setGeneralError('Could not read or parse the selected file. Please ensure it is an intact JSON file.');
      setParseResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult || !parseResult.isValid || parseResult.newEntries.length === 0 || !userId) return;

    try {
      setIsImporting(true);
      setGeneralError(null);

      const { importedCount } = await importJournalEntriesBatch(userId, parseResult.newEntries);

      setImportedCount(importedCount);
      setImportSuccess(true);
      if (onImportComplete) {
        onImportComplete(importedCount);
      }
    } catch (err: any) {
      console.error('Failed to import entries:', err);
      setGeneralError(err?.message || 'Failed to save imported entries to your vault. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isImporting) onClose();
          }}
          className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full max-w-xl theme-bg-surface border theme-border rounded-3xl shadow-2xl overflow-hidden z-10 text-left flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b theme-border flex items-center justify-between bg-black/2 dark:bg-white/2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1A73E8]/10 dark:bg-[#E8A33D]/20 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gemini-display font-bold text-base theme-text-primary">
                  {t.importData || 'Import Backup Data'}
                </h3>
                <p className="text-xs theme-text-secondary">
                  {t.importDataSubtitle || 'Restore reflections from an Inkwell JSON backup'}
                </p>
              </div>
            </div>

            {!isImporting && (
              <button
                id="btn-close-import-modal"
                onClick={onClose}
                className="p-2 rounded-full theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-left">
            <AnimatePresence mode="wait">
              {importSuccess ? (
                /* Success Screen */
                <motion.div
                  key="import-success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-gemini-display font-bold text-lg theme-text-primary">
                      {t.importSuccess || 'Backup Imported Successfully'}
                    </h4>
                    <p className="text-xs theme-text-secondary max-w-sm mx-auto leading-relaxed">
                      {importedCount === 1 
                        ? '1 new reflection has been seamlessly integrated into your journal vault.'
                        : `${importedCount} new reflections have been seamlessly integrated into your journal vault.`
                      }
                    </p>
                  </div>

                  {parseResult && parseResult.duplicates.length > 0 && (
                    <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border theme-border max-w-md mx-auto text-left text-xs theme-text-secondary flex items-start gap-2.5">
                      <CopyCheck className="w-4 h-4 text-[#1A73E8] dark:text-[#E8A33D] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold theme-text-primary">
                          {parseResult.duplicates.length} duplicate {parseResult.duplicates.length === 1 ? 'entry was' : 'entries were'} skipped:
                        </span>
                        <p className="text-[11px] mt-0.5">
                          Existing entries in your vault were preserved without creating duplicates.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      id="btn-import-done"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      {t.close || 'Done'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Import Form & Analysis Step */
                <motion.div
                  key="import-form-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Non-destructive Merge Clarification Banner */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-amber-500/10 border border-blue-500/20 dark:border-amber-500/20 text-xs flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-[#1A73E8] dark:text-[#E8A33D] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-amber-200">
                        {t.importMergeNotice || 'Non-destructive Merge'}
                      </p>
                      <p className="text-[11px] text-blue-800/90 dark:text-amber-300/80 leading-relaxed mt-0.5">
                        Imported reflections are added directly to your vault. Your current reflections and settings are preserved and will not be overwritten or lost.
                      </p>
                    </div>
                  </div>

                  {/* Dropzone & File Selector */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#1A73E8] dark:border-[#E8A33D] bg-[#1A73E8]/5 dark:bg-[#E8A33D]/5 scale-[0.99]'
                        : selectedFile && parseResult?.isValid
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'theme-border hover:border-[#1A73E8] dark:hover:border-[#E8A33D] theme-bg-subtle/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-2 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin theme-accent-text" />
                        <p className="text-xs font-semibold theme-text-primary">
                          {t.importProcessing || 'Validating backup structure...'}
                        </p>
                      </div>
                    ) : selectedFile && parseResult?.isValid ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <FileJson className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold theme-text-primary">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] theme-text-secondary mt-0.5">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center theme-text-secondary">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold theme-text-primary">
                            {t.dragAndDropJson || 'Drop your Inkwell JSON backup file here'}
                          </p>
                          <p className="text-[11px] theme-text-secondary mt-0.5">
                            or <span className="underline theme-accent-text font-medium">{t.browseFile || 'browse files'}</span> from your computer
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* General Error Banner if Any */}
                  {generalError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <p className="font-semibold">{t.importInvalidFile || 'Import Failed'}</p>
                        <p className="text-[11px] opacity-90 mt-0.5">{generalError}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis Result Card */}
                  {parseResult && parseResult.isValid && (
                    <div className="space-y-3 pt-1">
                      {/* Metric Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div className="p-3 rounded-2xl theme-bg-subtle border theme-border">
                          <p className="text-[10px] uppercase font-bold tracking-wider theme-text-secondary">
                            Found in File
                          </p>
                          <p className="text-base font-bold font-gemini-display theme-text-primary mt-0.5">
                            {parseResult.totalFound}
                          </p>
                          <p className="text-[10px] theme-text-secondary">Total reflections</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                            New to Import
                          </p>
                          <p className="text-base font-bold font-gemini-display text-emerald-800 dark:text-emerald-300 mt-0.5">
                            {parseResult.newEntries.length}
                          </p>
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Ready to merge</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                            Duplicates
                          </p>
                          <p className="text-base font-bold font-gemini-display text-amber-900 dark:text-amber-300 mt-0.5">
                            {parseResult.duplicates.length}
                          </p>
                          <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80">Skipped safely</p>
                        </div>
                      </div>

                      {/* Date Range if Available */}
                      {parseResult.dateRange && (
                        <div className="p-2.5 rounded-xl theme-bg-subtle border theme-border flex items-center gap-2 text-xs theme-text-secondary">
                          <Calendar className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                          <span className="text-[11px]">
                            Timeline: {new Date(parseResult.dateRange.earliest).toLocaleDateString()} — {new Date(parseResult.dateRange.latest).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Duplicate Entries Collapsible Drawer */}
                      {parseResult.duplicates.length > 0 && (
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowDuplicateList(!showDuplicateList)}
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <CopyCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>{parseResult.duplicates.length} duplicate entries flagged (will be skipped)</span>
                            </div>
                            {showDuplicateList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {showDuplicateList && (
                            <div className="p-3 border-t border-amber-500/20 max-h-36 overflow-y-auto space-y-1.5">
                              {parseResult.duplicates.map((dup, idx) => (
                                <div key={idx} className="text-[11px] p-2 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-2">
                                  <span className="truncate font-medium theme-text-primary">
                                    "{dup.entry.title || 'Untitled'}"
                                  </span>
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                    {dup.reason === 'same_id' ? 'Matching ID' : 'Matching Content & Date'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preview of New Entries Collapsible Drawer */}
                      {parseResult.newEntries.length > 0 && (
                        <div className="rounded-2xl border theme-border theme-bg-subtle overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowPreviewList(!showPreviewList)}
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold theme-text-primary hover:theme-bg-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 theme-accent-text" />
                              <span>Preview {parseResult.newEntries.length} new reflections</span>
                            </div>
                            {showPreviewList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {showPreviewList && (
                            <div className="p-3 border-t theme-border max-h-44 overflow-y-auto space-y-2">
                              {parseResult.newEntries.map((entry) => (
                                <div key={entry.id} className="p-2.5 rounded-xl theme-bg-surface border theme-border text-left space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="text-xs font-bold theme-text-primary truncate">
                                      {entry.title || 'Untitled Reflection'}
                                    </h5>
                                    <span className="text-[10px] theme-text-secondary whitespace-nowrap">
                                      {new Date(entry.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] theme-text-secondary line-clamp-1">
                                    {entry.messages[0]?.content || entry.summary || 'No text snippet'}
                                  </p>
                                  {entry.metadata?.mood && (
                                    <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-md bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 theme-accent-text font-medium">
                                      {entry.metadata.mood}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* If 0 new entries because all were duplicates */}
                      {parseResult.newEntries.length === 0 && parseResult.totalFound > 0 && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <p className="text-[11px] leading-relaxed">
                            {t.importNoNewEntries || 'All reflections in this backup file already exist in your vault. No new entries need to be added.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t theme-border flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      id="btn-cancel-import"
                      onClick={onClose}
                      disabled={isImporting}
                      className="px-4 py-2 rounded-xl text-xs font-semibold theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors disabled:opacity-50"
                    >
                      {t.cancel}
                    </button>

                    <button
                      type="button"
                      id="btn-confirm-import-vault"
                      disabled={
                        !parseResult || 
                        !parseResult.isValid || 
                        parseResult.newEntries.length === 0 || 
                        isImporting
                      }
                      onClick={handleExecuteImport}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.saveStatusSaving || 'Importing...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {parseResult && parseResult.newEntries.length > 0
                              ? `Import ${parseResult.newEntries.length} ${parseResult.newEntries.length === 1 ? 'Reflection' : 'Reflections'}`
                              : (t.importConfirmBtn || 'Import Data')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

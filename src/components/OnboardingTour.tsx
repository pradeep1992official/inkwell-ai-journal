import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Feather,
  Smile,
  Mic,
  Search,
  BrainCircuit,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Check,
  Target
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export interface TourStepConfig {
  id: string;
  selectors: string[];
  targetName: string;
  targetLocation: string;
  titleKey: keyof typeof import('../i18n/translations').translations['en'];
  descKey: keyof typeof import('../i18n/translations').translations['en'];
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  colorClass: string;
  requiresEditor?: boolean;
  requiresSidebar?: boolean;
}

export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'new-reflection',
    selectors: [
      '#btn-navbar-new-entry',
      '#btn-empty-state-new',
      '#btn-sidebar-new-reflection',
      '#input-journal-prompt'
    ],
    targetName: '+ New Reflection Button',
    targetLocation: 'Top Navigation Bar',
    titleKey: 'tourStep1Title',
    descKey: 'tourStep1Desc',
    icon: Feather,
    badge: '1 / 6',
    colorClass: 'from-blue-500 to-indigo-600',
    requiresEditor: false,
    requiresSidebar: false,
  },
  {
    id: 'mood-and-tags',
    selectors: [
      '#btn-mood-dropdown',
      '#container-tags-bar',
      '#journal-meta-toolbar',
      '#btn-add-tag',
      '#btn-more-options-dropdown'
    ],
    targetName: 'Mood Tracker & Custom Tags',
    targetLocation: 'Editor Header Bar',
    titleKey: 'tourStep2Title',
    descKey: 'tourStep2Desc',
    icon: Smile,
    badge: '2 / 6',
    colorClass: 'from-amber-500 to-rose-500',
    requiresEditor: true,
    requiresSidebar: false,
  },
  {
    id: 'modes-and-voice',
    selectors: [
      '#btn-mode-dropdown',
      '#btn-voice-input',
      '#input-journal-prompt',
      '#reflection-input-container',
      '#btn-send-reflection'
    ],
    targetName: 'AI Modes & Voice Input Capsule',
    targetLocation: 'Bottom Reflection Bar',
    titleKey: 'tourStep3Title',
    descKey: 'tourStep3Desc',
    icon: Mic,
    badge: '3 / 6',
    colorClass: 'from-purple-500 to-pink-500',
    requiresEditor: true,
    requiresSidebar: false,
  },
  {
    id: 'vault-and-search',
    selectors: [
      '#input-sidebar-search',
      '#btn-sidebar-advanced-filters',
      '#journal-vault-sidebar',
      '#btn-toggle-sidebar'
    ],
    targetName: 'Journal Vault & Deep Search',
    targetLocation: 'Left History Sidebar',
    titleKey: 'tourStep4Title',
    descKey: 'tourStep4Desc',
    icon: Search,
    badge: '4 / 6',
    colorClass: 'from-sky-500 to-cyan-600',
    requiresEditor: false,
    requiresSidebar: true,
  },
  {
    id: 'insights-and-trends',
    selectors: [
      '#btn-summarize-insights',
      '#btn-more-options-dropdown',
      '#btn-sidebar-view-mood-trends'
    ],
    targetName: 'AI Insights & Emotional Digest',
    targetLocation: 'Top Editor Actions',
    titleKey: 'tourStep5Title',
    descKey: 'tourStep5Desc',
    icon: BrainCircuit,
    badge: '5 / 6',
    colorClass: 'from-emerald-500 to-teal-600',
    requiresEditor: true,
    requiresSidebar: false,
  },
  {
    id: 'settings-and-lock',
    selectors: [
      '#btn-user-avatar-menu',
      '#btn-navbar-settings',
      '#btn-toggle-theme'
    ],
    targetName: 'User Profile, PIN Lock & Themes',
    targetLocation: 'Top-Right Profile Menu',
    titleKey: 'tourStep6Title',
    descKey: 'tourStep6Desc',
    icon: Settings,
    badge: '6 / 6',
    colorClass: 'from-amber-600 to-orange-600',
    requiresEditor: false,
    requiresSidebar: false,
  },
];

interface OnboardingTourProps {
  ensureActiveEntry?: () => void;
  ensureSidebarOpen?: () => void;
  hasActiveEntry?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  ensureActiveEntry,
  ensureSidebarOpen,
  hasActiveEntry = false,
}) => {
  const {
    isTourActive,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    skipTour,
    startTour,
    t,
  } = usePreferences();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [activeTargetName, setActiveTargetName] = useState<string>('');
  const [placementDirection, setPlacementDirection] = useState<'below' | 'above' | 'right' | 'left' | 'center'>('center');
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentTourStep] || TOUR_STEPS[0];
  const IconComponent = step.icon;
  const isLastStep = currentTourStep === TOUR_STEPS.length - 1;

  // Auto-activate editor or sidebar prerequisites if step requires it
  useEffect(() => {
    if (!isTourActive) return;

    if (step.requiresEditor && !hasActiveEntry && ensureActiveEntry) {
      ensureActiveEntry();
    }
    if (step.requiresSidebar && ensureSidebarOpen) {
      ensureSidebarOpen();
    }
  }, [isTourActive, currentTourStep, step.requiresEditor, step.requiresSidebar, hasActiveEntry, ensureActiveEntry, ensureSidebarOpen]);

  // Find target element rect on step, dom or window change
  const updateTargetRect = useCallback(() => {
    if (!isTourActive) {
      setTargetRect(null);
      return;
    }

    let foundEl: HTMLElement | null = null;
    for (const selector of step.selectors) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el && el.offsetParent !== null) {
        foundEl = el;
        break;
      }
    }

    if (foundEl) {
      // Smoothly scroll target element into view if needed
      try {
        foundEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch {
        // Fallback gracefully
      }

      const rect = foundEl.getBoundingClientRect();
      setTargetRect(rect);
      setActiveTargetName(step.targetName);
    } else {
      setTargetRect(null);
      setActiveTargetName(step.targetName);
    }
  }, [isTourActive, step.selectors, step.targetName]);

  // Listen to window events & DOM mutations
  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Multi-stage timers to recheck after modal, sidebar, or editor animations
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 250);
    const t3 = setTimeout(updateTargetRect, 600);

    // Mutation observer to detect newly rendered elements instantly
    const observer = new MutationObserver(() => {
      updateTargetRect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, [currentTourStep, isTourActive, updateTargetRect, hasActiveEntry]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target === document.body)) {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTourStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, skipTour, nextTourStep, prevTourStep]);

  if (!isTourActive) return null;

  // Calculate smart card position and arrow direction
  let cardPositionStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 60,
  };

  if (targetRect && typeof window !== 'undefined') {
    const isMobile = window.innerWidth < 640;
    if (!isMobile) {
      const spaceBelow = window.innerHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      const spaceRight = window.innerWidth - targetRect.right;
      const spaceLeft = targetRect.left;

      if (spaceBelow >= 240) {
        // Place below target
        cardPositionStyles = {
          position: 'fixed',
          top: `${Math.min(window.innerHeight - 260, targetRect.bottom + 14)}px`,
          left: `${Math.max(16, Math.min(window.innerWidth - 400, targetRect.left - 16))}px`,
          zIndex: 60,
        };
        if (placementDirection !== 'below') setPlacementDirection('below');
      } else if (spaceAbove >= 240) {
        // Place above target
        cardPositionStyles = {
          position: 'fixed',
          bottom: `${Math.min(window.innerHeight - 80, window.innerHeight - targetRect.top + 14)}px`,
          left: `${Math.max(16, Math.min(window.innerWidth - 400, targetRect.left - 16))}px`,
          zIndex: 60,
        };
        if (placementDirection !== 'above') setPlacementDirection('above');
      } else if (spaceRight >= 380) {
        // Place to right
        cardPositionStyles = {
          position: 'fixed',
          top: `${Math.max(16, Math.min(window.innerHeight - 260, targetRect.top - 16))}px`,
          left: `${targetRect.right + 14}px`,
          zIndex: 60,
        };
        if (placementDirection !== 'right') setPlacementDirection('right');
      } else if (spaceLeft >= 380) {
        // Place to left
        cardPositionStyles = {
          position: 'fixed',
          top: `${Math.max(16, Math.min(window.innerHeight - 260, targetRect.top - 16))}px`,
          right: `${window.innerWidth - targetRect.left + 14}px`,
          zIndex: 60,
        };
        if (placementDirection !== 'left') setPlacementDirection('left');
      }
    } else {
      // Mobile - bottom dock
      if (placementDirection !== 'center') setPlacementDirection('center');
    }
  } else {
    if (placementDirection !== 'center') setPlacementDirection('center');
  }

  const titleText = (t[step.titleKey] as string) || '';
  const descText = (t[step.descKey] as string) || '';

  return (
    <AnimatePresence>
      <div id="inkwell-onboarding-tour-root" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Crisp Spotlight Cutout Scrim without any backdrop blur */}
        {targetRect ? (
          <svg className="fixed inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={Math.max(0, targetRect.left - 6)}
                  y={Math.max(0, targetRect.top - 6)}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="16"
                  ry="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.32)"
              mask="url(#tour-spotlight-mask)"
              className="cursor-pointer"
              onClick={() => skipTour()}
            />
          </svg>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 dark:bg-black/40 transition-opacity pointer-events-auto cursor-pointer"
            onClick={() => skipTour()}
            title={t.onboardingSkip}
          />
        )}

        {/* Crisp Target Highlight Spotlight Frame with glowing pulse */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: Math.max(0, targetRect.top - 6),
              left: Math.max(0, targetRect.left - 6),
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="fixed pointer-events-none rounded-2xl border-2 border-[#1A73E8] dark:border-[#E8A33D] ring-4 ring-[#1A73E8]/25 dark:ring-[#E8A33D]/25 z-55 shadow-lg"
          >
            {/* Corner Spotlight Pip */}
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A73E8] dark:bg-[#E8A33D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1A73E8] dark:bg-[#E8A33D]"></span>
            </span>
          </motion.div>
        )}

        {/* Active Tooltip Card */}
        <div style={cardPositionStyles} className="pointer-events-auto w-[calc(100vw-2rem)] sm:w-[390px] max-w-full">
          <motion.div
            ref={cardRef}
            key={currentTourStep}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="relative rounded-3xl theme-bg-surface border theme-border shadow-2xl p-4 sm:p-5 overflow-hidden"
          >
            {/* Top Accent Gradient Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${step.colorClass}`} />

            {/* Header: Target Name Pill, Step counter & Dismiss button */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${step.colorClass} text-white flex items-center justify-center shadow-xs shrink-0`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider theme-accent-text flex items-center gap-1">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{t.onboardingTourTitle}</span>
                  </div>
                  <div className="text-[11px] theme-text-secondary font-medium">
                    {t.onboardingTourStep
                      ? t.onboardingTourStep.replace('{current}', String(currentTourStep + 1)).replace('{total}', String(TOUR_STEPS.length))
                      : `Step ${currentTourStep + 1} of ${TOUR_STEPS.length}`}
                  </div>
                </div>
              </div>

              <button
                id="btn-tour-skip-corner"
                onClick={() => skipTour()}
                title={t.onboardingSkip}
                className="p-1.5 rounded-full theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlighting Target Indicator Badge */}
            <div className="mb-3 px-2.5 py-1 rounded-xl bg-blue-500/10 dark:bg-amber-400/10 border border-blue-500/20 dark:border-amber-400/20 flex items-center gap-1.5 text-xs text-[#1A73E8] dark:text-[#E8A33D] font-semibold">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {targetRect ? `Highlighting: ${step.targetName} (${step.targetLocation})` : `Target: ${step.targetName}`}
              </span>
            </div>

            {/* Step Content */}
            <div className="space-y-1.5 mb-4 text-left">
              <h4 className="text-sm sm:text-base font-bold theme-text-primary leading-snug">
                {titleText}
              </h4>
              <p className="text-xs theme-text-secondary leading-relaxed">
                {descText}
              </p>
            </div>

            {/* Step Indicators (Clickable Dots) */}
            <div className="flex items-center justify-center gap-1.5 my-3 py-1">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  id={`btn-tour-step-dot-${idx}`}
                  onClick={() => startTour(idx)}
                  title={`Jump to step ${idx + 1}: ${s.targetName}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentTourStep
                      ? 'w-6 bg-[#1A73E8] dark:bg-[#E8A33D]'
                      : idx < currentTourStep
                      ? 'w-2 bg-[#1A73E8]/40 dark:bg-[#E8A33D]/40 hover:bg-[#1A73E8]/60'
                      : 'w-2 theme-bg-subtle border theme-border hover:theme-text-primary'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons: Skip, Back, Next / Finish */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t theme-border">
              <button
                id="btn-tour-skip"
                onClick={() => skipTour()}
                className="text-xs font-semibold theme-text-secondary hover:theme-text-primary px-2 py-1.5 rounded-lg hover:theme-bg-subtle transition-colors"
              >
                {t.onboardingSkip}
              </button>

              <div className="flex items-center gap-1.5">
                {currentTourStep > 0 && (
                  <button
                    id="btn-tour-prev"
                    onClick={prevTourStep}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border theme-border text-xs font-semibold theme-text-primary hover:theme-bg-subtle transition-all active:scale-95 shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{t.onboardingPrev}</span>
                  </button>
                )}

                <button
                  id="btn-tour-next"
                  onClick={nextTourStep}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-bold transition-all active:scale-95 shadow-xs"
                >
                  <span>{isLastStep ? t.onboardingFinish : t.onboardingNext}</span>
                  {isLastStep ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

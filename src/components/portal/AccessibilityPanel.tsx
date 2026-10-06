import React, { useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Volume2,
  Eye,
  Activity,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  AccessibilityPreferences,
  SpeechSpeed,
  TextScale,
  isHoverReaderSupported,
} from '../../portal/accessibility';
import { SiteLocale, a11yPanelTranslations, useLocale } from '../../portal/locale';

export interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AccessibilityPreferences;
  onUpdatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  onResetPreferences: () => void;
  // Speech controls
  speechState: 'unsupported' | 'idle' | 'playing' | 'paused';
  onStartSpeech: () => void;
  onTogglePauseSpeech: () => void;
  onStopSpeech: () => void;
  availableVoices: SpeechSynthesisVoice[];
  triggerRef?: React.RefObject<HTMLElement | null>;
  locale?: SiteLocale;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  speechState,
  onStartSpeech,
  onTogglePauseSpeech,
  onStopSpeech,
  availableVoices,
  triggerRef,
  locale: propLocale,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { locale: contextLocale } = useLocale();
  const activeLocale = propLocale ?? contextLocale;
  const t = a11yPanelTranslations[activeLocale];

  // Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements.length) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  const speedOptions: SpeechSpeed[] = [0.75, 1, 1.25, 1.5];
  const scaleOptions: TextScale[] = ['100', '1125', '125'];
  const hoverSupported = isHoverReaderSupported();

  return (
    <div
      className="portal-a11y-ignore fixed inset-0 z-[9990] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
      aria-hidden="false"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        className="flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto border-l border-white/10 bg-[#141517] p-6 text-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-stone-400" />
            <h2
              id="a11y-panel-title"
              className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {t.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close accessibility panel"
            data-testid="a11y-close-btn"
            className="rounded p-1 text-stone-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SECTION 1: READING */}
        <section aria-labelledby="a11y-reading-title" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <Volume2 className="h-3.5 w-3.5 text-stone-400" />
            <h3
              id="a11y-reading-title"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400"
            >
              {t.readingTitle}
            </h3>
          </div>

          {/* Full Page Narrator Controls */}
          <div className="flex flex-col gap-2.5 rounded border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-white">{t.fullPageNarrator}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">
                {speechState === 'unsupported'
                  ? t.unsupported
                  : speechState === 'playing'
                    ? t.narrating
                    : speechState === 'paused'
                      ? t.paused
                      : t.ready}
              </span>
            </div>

            {speechState === 'unsupported' ? (
              <p className="font-mono text-[11px] italic text-stone-400">
                {t.unsupportedDesc}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                {speechState === 'idle' ? (
                  <button
                    type="button"
                    onClick={onStartSpeech}
                    aria-label="Start reading page"
                    data-testid="narrator-start"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-white/15 px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-white/25 focus:ring-2 focus:ring-white/40"
                  >
                    <Play className="h-3.5 w-3.5 text-emerald-400" /> {t.readPage}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onTogglePauseSpeech}
                      aria-label={speechState === 'playing' ? 'Pause narrator' : 'Resume narrator'}
                      data-testid="narrator-pause-resume"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-white/15 px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-white/25 focus:ring-2 focus:ring-white/40"
                    >
                      {speechState === 'playing' ? (
                        <>
                          <Pause className="h-3.5 w-3.5 text-amber-400" /> {t.pause}
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-400" /> {t.resume}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onStopSpeech}
                      aria-label="Stop narrator"
                      data-testid="narrator-stop"
                      className="inline-flex items-center justify-center gap-2 rounded bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-stone-300 transition-colors hover:bg-red-500/20 hover:text-red-300 focus:ring-2 focus:ring-white/40"
                    >
                      <Square className="h-3.5 w-3.5" /> {t.stop}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Language-Aware Voice Selection */}
            {availableVoices.length > 0 && (
              <div className="flex flex-col gap-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="a11y-voice-selector"
                    className="font-mono text-[9px] uppercase tracking-wider text-stone-400"
                  >
                    {t.voiceLabel}
                  </label>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-500">
                    {activeLocale === 'es' ? 'Español prioritario' : 'English prioritized'}
                  </span>
                </div>
                <select
                  id="a11y-voice-selector"
                  data-testid="a11y-voice-select"
                  aria-label="Select narrator voice"
                  value={preferences.voiceURI || ''}
                  onChange={(e) => onUpdatePreferences({ voiceURI: e.target.value || null })}
                  className="w-full rounded border border-white/10 bg-[#1a1b1d] px-2 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                >
                  <option value="">{t.defaultVoice}</option>
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speed selection */}
            <div className="flex flex-col gap-1 pt-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">
                {t.speedLabel}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {speedOptions.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    aria-pressed={preferences.speed === sp}
                    data-testid={`a11y-speed-${sp}`}
                    onClick={() => onUpdatePreferences({ speed: sp })}
                    className={`rounded border px-2 py-1 font-mono text-xs transition-colors ${
                      preferences.speed === sp
                        ? 'border-white bg-white font-semibold text-black'
                        : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reading Toggles */}
          <div className="flex flex-col gap-1.5">
            <SwitchRow
              label={t.hoverReader}
              description={t.hoverReaderDesc}
              testId="hover-reader-toggle"
              checked={preferences.hoverReader}
              disabled={!hoverSupported}
              badge={!hoverSupported ? t.browserUnsupported : undefined}
              onChange={(val) => onUpdatePreferences({ hoverReader: val })}
            />

            <SwitchRow
              label={t.spokenWordHighlight}
              description={t.spokenWordHighlightDesc}
              testId="spoken-word-highlight-toggle"
              checked={preferences.spokenWordHighlight}
              onChange={(val) => onUpdatePreferences({ spokenWordHighlight: val })}
            />

            <SwitchRow
              label={t.readingGuide}
              description={t.readingGuideDesc}
              testId="reading-guide-toggle"
              checked={preferences.readingGuide}
              onChange={(val) => onUpdatePreferences({ readingGuide: val })}
            />

            <SwitchRow
              label={t.readingMask}
              description={t.readingMaskDesc}
              testId="reading-mask-toggle"
              checked={preferences.readingMask}
              onChange={(val) => onUpdatePreferences({ readingMask: val })}
            />
          </div>
        </section>

        {/* SECTION 2: VISION */}
        <section aria-labelledby="a11y-vision-title" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <Eye className="h-3.5 w-3.5 text-stone-400" />
            <h3
              id="a11y-vision-title"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400"
            >
              {t.visionTitle}
            </h3>
          </div>

          {/* Text Size */}
          <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/5 p-3">
            <span className="font-mono text-xs text-white">{t.textSize}</span>
            <div className="grid grid-cols-3 gap-2">
              {scaleOptions.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  data-testid={`portal-text-scale-${sc}`}
                  aria-pressed={preferences.textScale === sc}
                  onClick={() => onUpdatePreferences({ textScale: sc })}
                  className={`rounded border px-2 py-1.5 font-mono text-xs transition-colors ${
                    preferences.textScale === sc
                      ? 'border-white bg-white font-semibold text-black'
                      : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'
                  }`}
                >
                  {sc === '1125' ? '112.5%' : `${sc}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Vision Toggles */}
          <div className="flex flex-col gap-1.5">
            <SwitchRow
              label={t.textSpacing}
              description={t.textSpacingDesc}
              testId="text-spacing-toggle"
              checked={preferences.textSpacing}
              onChange={(val) => onUpdatePreferences({ textSpacing: val })}
            />

            <SwitchRow
              label={t.colorSafe}
              description={t.colorSafeDesc}
              testId="color-safe-toggle"
              checked={preferences.colorSafe}
              onChange={(val) => onUpdatePreferences({ colorSafe: val })}
            />

            <SwitchRow
              label={t.highContrast}
              description={t.highContrastDesc}
              testId="high-contrast-toggle"
              checked={preferences.highContrast}
              onChange={(val) => onUpdatePreferences({ highContrast: val })}
            />

            <SwitchRow
              label={t.highlightLinks}
              description={t.highlightLinksDesc}
              testId="highlight-links-toggle"
              checked={preferences.highlightLinks}
              onChange={(val) => onUpdatePreferences({ highlightLinks: val })}
            />
          </div>
        </section>

        {/* SECTION 3: MOTION */}
        <section aria-labelledby="a11y-motion-title" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <Activity className="h-3.5 w-3.5 text-stone-400" />
            <h3
              id="a11y-motion-title"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400"
            >
              {t.motionTitle}
            </h3>
          </div>

          <SwitchRow
            label={t.reduceMotion}
            description={t.reduceMotionDesc}
            testId="reduce-motion-toggle"
            checked={preferences.reduceMotion}
            onChange={(val) => onUpdatePreferences({ reduceMotion: val })}
          />
        </section>

        {/* SECTION 4: RESET */}
        <section aria-labelledby="a11y-reset-title" className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            data-testid="a11y-reset-btn"
            onClick={onResetPreferences}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-white/20 bg-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider text-stone-300 transition-colors hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300 focus:ring-2 focus:ring-white/40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t.resetButton}
          </button>
          <span className="text-center font-mono text-[9px] text-stone-400">
            {t.resetDesc}
          </span>
        </section>
      </div>
    </div>
  );
};

interface SwitchRowProps {
  label: string;
  description?: string;
  testId: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange: (checked: boolean) => void;
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  label,
  description,
  testId,
  checked,
  disabled = false,
  badge,
  onChange,
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded border border-white/5 bg-white/[0.02] p-2.5 transition-colors ${
        disabled ? 'opacity-50' : 'hover:border-white/15'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white">{label}</span>
          {badge && (
            <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[8px] text-stone-400">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <span className="font-mono text-[10px] leading-snug text-stone-400">
            {description}
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label}`}
        disabled={disabled}
        data-testid={testId}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/40 ${
          checked ? 'bg-white' : 'bg-white/20'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#141517] shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  Box,
} from 'lucide-react';
import { useDemoTour, PortalTourStep } from '../../demo/DemoTourContext';
import { useReducedMotion } from '../../motion/useReducedMotion';

interface Point {
  x: number;
  y: number;
}

const copy = {
  regionLabel: 'Portal Guided Tour',
  stepPrefix: 'Paso',
  ofPrefix: 'de',
  closeTour: 'Cerrar tour guiado',
  exitEscape: 'Salir (Escape)',
  enterBim: 'ENTRAR AL MODELO 3D',
  skipTour: 'Omitir Tour',
  prevStep: 'Paso anterior',
  prevShort: 'Ant',
  resume: 'Reanudar',
  pause: 'Pausar',
  nextStep: 'Siguiente paso',
  nextShort: 'Sig',
  finishBim: 'Finalizar y entrar al modelo 3D',
  bimShort: '3D',
  interactionBadge: 'INTERACCIÓN',
  pauseBadge: 'PAUSA',
  step08Phase0: 'Pero un proyecto no existe solamente como información.',
  step08Phase1: 'También existe en el espacio.',
  step08Phase2: 'Exploremos el proyecto digital.',
};

export const PortalGuidedTour: React.FC = () => {
  const {
    isTourActive,
    stage,
    isPortalTourActive,
    portalStepIndex,
    isPortalTourPaused,
    portalSteps,
    nextPortalStep,
    prevPortalStep,
    togglePortalTourPause,
    exitPortalTour,
    goToStage,
  } = useDemoTour();

  const reducedMotion = useReducedMotion();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [progressRatio, setProgressRatio] = useState(0);
  const [step08Phase, setStep08Phase] = useState<0 | 1 | 2>(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const accumulatedPauseTimeRef = useRef<number>(0);

  const currentStep: PortalTourStep | undefined = portalSteps[portalStepIndex];
  const isLastStep = portalStepIndex === portalSteps.length - 1;

  // Track target element bounding rect & scroll into view
  const updateTargetRect = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // When step changes, scroll into view smoothly if needed, and reset timers
  useEffect(() => {
    if (!isTourActive || stage !== 'portal' || !isPortalTourActive || !currentStep) {
      return;
    }

    stepStartTimeRef.current = Date.now();
    accumulatedPauseTimeRef.current = 0;
    pausedAtRef.current = null;
    setProgressRatio(0);
    setStep08Phase(0);
    setIsInteracting(false);

    let isMounted = true;
    const checkAndScroll = () => {
      if (!isMounted) return;
      const element = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        const isOffScreen = rect.top < 70 || rect.bottom > window.innerHeight - 50;
        if (isOffScreen && typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'center',
          });
        }
      } else {
        setTargetRect(null);
      }
    };

    // Execute immediately and after small delay to allow tab/DOM to settle
    checkAndScroll();
    const timeout = setTimeout(checkAndScroll, 120);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [currentStep, isTourActive, stage, isPortalTourActive, reducedMotion]);

  // Update target rect on resize and scroll
  useEffect(() => {
    if (!isPortalTourActive) return;

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    const interval = setInterval(updateTargetRect, 250);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
      clearInterval(interval);
    };
  }, [isPortalTourActive, updateTargetRect]);

  // Handle temporary pause when interacting with the highlighted portal element
  useEffect(() => {
    if (!isPortalTourActive || !currentStep) return;

    const handlePointerDown = (e: PointerEvent) => {
      const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (targetElement && targetElement.contains(e.target as Node)) {
        setIsInteracting(true);
        if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = setTimeout(() => {
          setIsInteracting(false);
        }, 8000);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, [isPortalTourActive, currentStep]);

  // Auto-progress animation timer
  useEffect(() => {
    if (!isTourActive || stage !== 'portal' || !isPortalTourActive || !currentStep) {
      return;
    }

    const isEffectivelyPaused = isPortalTourPaused || isInteracting;

    if (isEffectivelyPaused) {
      if (pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
      return;
    }

    // Resumed from pause
    if (pausedAtRef.current !== null) {
      accumulatedPauseTimeRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    let animationFrameId: number;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - stepStartTimeRef.current - accumulatedPauseTimeRef.current;
      const duration = currentStep.durationMs;
      const ratio = Math.min(1, Math.max(0, elapsed / duration));

      setProgressRatio(ratio);

      // Step 08 progressive copy transitions
      if (isLastStep) {
        if (elapsed >= 5000) {
          setStep08Phase(2);
        } else if (elapsed >= 2500) {
          setStep08Phase(1);
        } else {
          setStep08Phase(0);
        }
      }

      if (ratio >= 1) {
        if (isLastStep) {
          // Hand off to BIM
          exitPortalTour();
          goToStage('bim');
        } else {
          nextPortalStep();
        }
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isTourActive,
    stage,
    isPortalTourActive,
    portalStepIndex,
    currentStep,
    isPortalTourPaused,
    isInteracting,
    isLastStep,
    nextPortalStep,
    exitPortalTour,
    goToStage,
  ]);

  // Keyboard navigation
  useEffect(() => {
    if (!isPortalTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitPortalTour();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPortalStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPortalStep();
      } else if (e.key === ' ' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        togglePortalTourPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPortalTourActive, exitPortalTour, nextPortalStep, prevPortalStep, togglePortalTourPause]);

  if (!isTourActive || stage !== 'portal' || !isPortalTourActive || !currentStep) {
    return null;
  }

  // Calculate explanation card position relative to targetRect
  const pad = 6;
  const cardWidth = typeof window !== 'undefined' ? Math.min(420, window.innerWidth - 32) : 420;
  const cardHeight = 220;

  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    width: `${cardWidth}px`,
    zIndex: 95,
  };

  let connectorStart: Point | null = null;
  let connectorEnd: Point | null = null;

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;

    let computedTop = 0;
    let computedLeft = 0;

    // Prefer below target if enough vertical space and not too low
    if (spaceBelow >= cardHeight + 30 && targetRect.top < window.innerHeight * 0.65) {
      computedTop = targetRect.bottom + 20;
      computedLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetRect.left));
      connectorStart = {
        x: Math.min(targetRect.right, Math.max(targetRect.left, computedLeft + 40)),
        y: targetRect.bottom + pad,
      };
      connectorEnd = {
        x: computedLeft + 40,
        y: computedTop,
      };
    } else if (spaceAbove >= cardHeight + 60) {
      // Place above target
      computedTop = targetRect.top - cardHeight - 20;
      computedLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetRect.left));
      connectorStart = {
        x: Math.min(targetRect.right, Math.max(targetRect.left, computedLeft + 40)),
        y: targetRect.top - pad,
      };
      connectorEnd = {
        x: computedLeft + 40,
        y: computedTop + cardHeight,
      };
    } else if (spaceRight >= cardWidth + 30) {
      // Place to right
      computedTop = Math.max(70, Math.min(window.innerHeight - cardHeight - 20, targetRect.top));
      computedLeft = targetRect.right + 20;
      connectorStart = {
        x: targetRect.right + pad,
        y: Math.min(targetRect.bottom, targetRect.top + 30),
      };
      connectorEnd = {
        x: computedLeft,
        y: computedTop + 30,
      };
    } else if (spaceLeft >= cardWidth + 30) {
      // Place to left
      computedTop = Math.max(70, Math.min(window.innerHeight - cardHeight - 20, targetRect.top));
      computedLeft = targetRect.left - cardWidth - 20;
      connectorStart = {
        x: targetRect.left - pad,
        y: Math.min(targetRect.bottom, targetRect.top + 30),
      };
      connectorEnd = {
        x: computedLeft + cardWidth,
        y: computedTop + 30,
      };
    } else {
      // Center fallback
      computedTop = Math.max(70, window.innerHeight - cardHeight - 24);
      computedLeft = Math.max(16, (window.innerWidth - cardWidth) / 2);
    }

    cardStyle = {
      ...cardStyle,
      top: `${computedTop}px`,
      left: `${computedLeft}px`,
    };
  } else {
    // Missing target fallback: center in viewport
    cardStyle = {
      ...cardStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  // Determine copy text (handles step 08 dynamic transitions)
  let activeCopy = currentStep.copy;
  if (isLastStep) {
    if (step08Phase === 0) {
      activeCopy = copy.step08Phase0;
    } else if (step08Phase === 1) {
      activeCopy = copy.step08Phase1;
    } else {
      activeCopy = copy.step08Phase2;
    }
  }

  const isPausedState = isPortalTourPaused || isInteracting;

  return (
    <div
      className="portal-guided-tour-root fixed inset-0 z-50 pointer-events-none select-none"
      role="region"
      aria-label={copy.regionLabel}
    >
      {/* Screen reader announcement for step change */}
      <div className="sr-only" role="status" aria-live="polite">
        {copy.stepPrefix} {currentStep.stepNumber} {copy.ofPrefix} {portalSteps.length}: {currentStep.title}. {activeCopy}
      </div>

      {/* SVG Mask Backdrop & Spotlight Framing */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 90 }}
        aria-hidden="true"
      >
        <defs>
          <mask id="portal-spotlight-mask">
            {/* White covers entire viewport */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black punches out hole for spotlight */}
            {targetRect && (
              <rect
                x={targetRect.left - pad}
                y={targetRect.top - pad}
                width={targetRect.width + pad * 2}
                height={targetRect.height + pad * 2}
                rx="6"
                ry="6"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop covering non-highlighted areas */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 13, 17, 0.62)"
          mask="url(#portal-spotlight-mask)"
        />

        {/* Highlight border and architectural tick marks */}
        {targetRect && (
          <g className="transition-all duration-200">
            <rect
              data-testid="portal-spotlight-frame"
              x={targetRect.left - pad}
              y={targetRect.top - pad}
              width={targetRect.width + pad * 2}
              height={targetRect.height + pad * 2}
              rx="6"
              ry="6"
              fill="none"
              stroke="#79B791"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Corner registration crosshairs for architectural aesthetic */}
            {/* Top-Left */}
            <path
              d={`M ${targetRect.left - pad - 4} ${targetRect.top - pad} L ${targetRect.left - pad + 8} ${targetRect.top - pad} M ${targetRect.left - pad} ${targetRect.top - pad - 4} L ${targetRect.left - pad} ${targetRect.top - pad + 8}`}
              stroke="#79B791"
              strokeWidth="1"
            />
            {/* Top-Right */}
            <path
              d={`M ${targetRect.right + pad - 8} ${targetRect.top - pad} L ${targetRect.right + pad + 4} ${targetRect.top - pad} M ${targetRect.right + pad} ${targetRect.top - pad - 4} L ${targetRect.right + pad} ${targetRect.top - pad + 8}`}
              stroke="#79B791"
              strokeWidth="1"
            />
            {/* Bottom-Left */}
            <path
              d={`M ${targetRect.left - pad - 4} ${targetRect.bottom + pad} L ${targetRect.left - pad + 8} ${targetRect.bottom + pad} M ${targetRect.left - pad} ${targetRect.bottom + pad - 8} L ${targetRect.left - pad} ${targetRect.bottom + pad + 4}`}
              stroke="#79B791"
              strokeWidth="1"
            />
            {/* Bottom-Right */}
            <path
              d={`M ${targetRect.right + pad - 8} ${targetRect.bottom + pad} L ${targetRect.right + pad + 4} ${targetRect.bottom + pad} M ${targetRect.right + pad} ${targetRect.bottom + pad - 8} L ${targetRect.right + pad} ${targetRect.bottom + pad + 4}`}
              stroke="#79B791"
              strokeWidth="1"
            />
          </g>
        )}

        {/* Thin architectural connector line from spotlight to explanation card */}
        {connectorStart && connectorEnd && (
          <g className="transition-all duration-200" opacity="0.75">
            <line
              x1={connectorStart.x}
              y1={connectorStart.y}
              x2={connectorEnd.x}
              y2={connectorEnd.y}
              stroke="#79B791"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={connectorStart.x} cy={connectorStart.y} r="2.5" fill="#79B791" />
            <circle cx={connectorEnd.x} cy={connectorEnd.y} r="2.5" fill="#79B791" />
          </g>
        )}
      </svg>

      {/* Explanation Card */}
      <div
        ref={cardRef}
        style={cardStyle}
        data-testid="portal-tour-card"
        className="pointer-events-auto rounded border border-[#79B791]/35 bg-[#12161f]/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-200"
      >
        {/* Top Progress Track */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden rounded-t">
          <div
            data-testid="portal-tour-progress-bar"
            className="h-full bg-[#79B791] transition-all"
            style={{
              width: `${Math.round(progressRatio * 100)}%`,
              transitionDuration: reducedMotion ? '0ms' : '120ms',
            }}
          />
        </div>

        {/* Card Header: Step Index & Title & Close */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#79B791] font-semibold">
              {currentStep.stepNumber} / 08
            </span>
            <span className="h-2 w-px bg-white/20" />
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-200 font-medium">
              {currentStep.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isPausedState && (
              <span
                data-testid="portal-tour-paused-badge"
                className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-300"
              >
                {isInteracting ? copy.interactionBadge : copy.pauseBadge}
              </span>
            )}
            <button
              onClick={exitPortalTour}
              data-testid="btn-portal-tour-close"
              aria-label={copy.closeTour}
              title={copy.exitEscape}
              className="text-stone-400 hover:text-white transition-colors p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card Body: Editorial Spanish Copy */}
        <div className="py-4">
          <p
            data-testid="portal-tour-copy"
            className="font-serif text-[15px] sm:text-[16px] font-light leading-relaxed text-stone-100 min-h-[44px]"
          >
            {activeCopy}
          </p>

          {/* Step 08 Special CTA Button */}
          {isLastStep && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                data-testid="portal-tour-enter-bim"
                onClick={() => {
                  exitPortalTour();
                  goToStage('bim');
                }}
                className="group flex w-full items-center justify-between rounded bg-[#79B791] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d0f12] shadow-lg transition-transform hover:opacity-95 active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  <span>{copy.enterBim}</span>
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </div>

        {/* Card Footer: Navigation Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <button
            onClick={exitPortalTour}
            data-testid="btn-portal-tour-skip"
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-400 hover:text-stone-200 transition-colors"
          >
            {copy.skipTour}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPortalStep}
              disabled={portalStepIndex === 0}
              data-testid="btn-portal-tour-prev"
              aria-label={copy.prevStep}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-stone-300 transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>{copy.prevShort}</span>
            </button>

            <button
              onClick={togglePortalTourPause}
              data-testid="btn-portal-tour-pause"
              aria-label={isPausedState ? copy.resume : copy.pause}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-stone-300 transition hover:bg-white/10"
            >
              {isPausedState ? (
                <>
                  <Play className="h-3 w-3 text-[#79B791]" />
                  <span>{copy.resume}</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  <span>{copy.pause}</span>
                </>
              )}
            </button>

            {!isLastStep ? (
              <button
                onClick={nextPortalStep}
                data-testid="btn-portal-tour-next"
                aria-label={copy.nextStep}
                className="flex items-center gap-1 rounded border border-[#79B791]/40 bg-[#79B791]/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#79B791] transition hover:bg-[#79B791]/25"
              >
                <span>{copy.nextShort}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={() => {
                  exitPortalTour();
                  goToStage('bim');
                }}
                data-testid="btn-portal-tour-finish"
                aria-label={copy.finishBim}
                className="flex items-center gap-1 rounded bg-[#79B791] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#0d0f12] transition hover:opacity-90"
              >
                <span>{copy.bimShort}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

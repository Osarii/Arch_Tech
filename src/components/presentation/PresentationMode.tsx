import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Pause, Play, X } from 'lucide-react';
import { getPresentationComponent, presentationChapters, presentationComponents } from '@/presentation/componentRegistry';
import { usePresentation } from '@/presentation/PresentationContext';

export const PRESENTATION_STEP_DURATION_MS = 12000;

const copy = {
  ariaLabel: 'ARCH_TECH presentation',
  header: 'ARCH_TECH / Presentation',
  explorerLabel: 'Presentation component explorer',
  exploreMode: 'Explore mode',
  exploreHeading: 'The platform, explained on demand.',
  exploreSupporting: 'Choose a component to see the real systems behind the presentation.',
  previous: 'Previous',
  next: 'Next',
  pause: 'Pause',
  resume: 'Resume',
  explore: 'Explore',
  returnToPresentation: 'Return to presentation',
  exit: 'Exit',
  what: 'WHAT IS IT?',
  how: 'HOW DOES IT WORK?',
  dataFlow: 'DATA FLOW',
  sourceFiles: 'SOURCE FILES',
  technologies: 'TECHNOLOGIES',
  fullscreenFallback: 'Fullscreen unavailable — continuing in page view.',
};

export const PresentationMode: React.FC = () => {
  const {
    isActive,
    isPaused,
    isExploring,
    chapterIndex,
    currentComponentId,
    exit,
    next,
    previous,
    setCurrentComponentId,
    setExploring,
    setPaused,
  } = usePresentation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false);
  const chapter = presentationChapters[chapterIndex];
  const activeComponent = getPresentationComponent(currentComponentId ?? chapter.componentIds[0] ?? null);
  const isLastChapter = chapterIndex === presentationChapters.length - 1;

  useEffect(() => {
    if (!isActive) return;

    overlayRef.current?.focus({ preventScroll: true });
    setFullscreenUnavailable(false);
    const overlay = overlayRef.current;
    if (!overlay?.requestFullscreen) {
      setFullscreenUnavailable(true);
      return;
    }

    void overlay.requestFullscreen().catch(() => setFullscreenUnavailable(true));
    return () => {
      if (document.fullscreenElement === overlay) void document.exitFullscreen?.();
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || isPaused || isExploring || isLastChapter) return;
    const timer = window.setTimeout(next, PRESENTATION_STEP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isActive, isExploring, isLastChapter, isPaused, next]);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exit, isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={overlayRef}
      data-testid="presentation-mode"
      role="dialog"
      aria-modal="true"
      aria-label={copy.ariaLabel}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex min-h-screen w-full overflow-y-auto bg-black px-6 py-6 text-[#EDF4ED] outline-none sm:px-10 lg:px-16"
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between gap-10 border border-[#ABD1B5]/20 bg-[#000000] p-6 sm:p-10 lg:p-14">
        <header className="flex items-center justify-between gap-6 border-b border-[#ABD1B5]/20 pb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ABD1B5]">
          <span>{copy.header}</span>
          <span>{String(chapterIndex + 1).padStart(2, '0')} / {String(presentationChapters.length).padStart(2, '0')}</span>
        </header>

        {isExploring ? (
          <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" aria-label={copy.explorerLabel}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#79B791]">{copy.exploreMode}</p>
              <h1 className="mt-4 max-w-xl text-4xl font-medium tracking-[-0.03em] sm:text-6xl">{copy.exploreHeading}</h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#ABD1B5]">{copy.exploreSupporting}</p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {presentationComponents.map((component) => (
                  <button
                    key={component.id}
                    type="button"
                    data-testid={`presentation-component-${component.id}`}
                    onClick={() => setCurrentComponentId(component.id)}
                    className={`border px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBF00] ${
                      activeComponent?.id === component.id
                        ? 'border-[#FFBF00] bg-[#FFBF00] text-black'
                        : 'border-[#ABD1B5]/25 text-[#EDF4ED] hover:border-[#79B791] hover:text-[#79B791]'
                    }`}
                  >
                    <span className="block text-[8px] tracking-[0.16em] opacity-70">{component.section}</span>
                    <span className="mt-1 block">{component.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeComponent && (
              <aside data-testid="presentation-explainer" className="border border-[#ABD1B5]/25 bg-[#ABD1B5]/[0.06] p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#79B791]">{activeComponent.section}</p>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em]">{activeComponent.label}</h2>
                <ExplainerGroup title={copy.what}>{activeComponent.purpose}</ExplainerGroup>
                <ExplainerGroup title={copy.how}>{activeComponent.technicalSummary}</ExplainerGroup>
                <ExplainerGroup title={copy.dataFlow}>{activeComponent.dataFlow}</ExplainerGroup>
                <ExplainerGroup title={copy.sourceFiles}>
                  <ul className="space-y-1 font-mono text-xs text-[#ABD1B5]">{activeComponent.sourceFiles.map((file) => <li key={file}>{file}</li>)}</ul>
                </ExplainerGroup>
                <ExplainerGroup title={copy.technologies}>
                  <div className="flex flex-wrap gap-2">{activeComponent.technologies.map((technology) => <span key={technology} className="border border-[#79B791]/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#79B791]">{technology}</span>)}</div>
                </ExplainerGroup>
              </aside>
            )}
          </section>
        ) : (
          <main className="max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#79B791]">{chapter.section}</p>
            <h1 className="mt-5 text-5xl font-medium tracking-[-0.045em] sm:text-7xl lg:text-8xl">{chapter.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#ABD1B5] sm:text-xl">{chapter.supporting}</p>
            <div className="mt-12 h-px w-24 bg-[#FFBF00]" aria-hidden="true" />
          </main>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ABD1B5]/20 pt-5">
          <div className="flex items-center gap-2">
            <ControlButton label={copy.previous} onClick={previous} disabled={chapterIndex === 0}><ChevronLeft className="h-4 w-4" /></ControlButton>
            <ControlButton label={isPaused ? copy.resume : copy.pause} onClick={() => setPaused(!isPaused)}><>{isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{isPaused ? copy.resume : copy.pause}</></ControlButton>
            <ControlButton label={isExploring ? copy.returnToPresentation : copy.explore} onClick={() => setExploring(!isExploring)}><><Compass className="h-3.5 w-3.5" />{isExploring ? copy.returnToPresentation : copy.explore}</></ControlButton>
          </div>
          <div className="flex items-center gap-2">
            {fullscreenUnavailable && <span data-testid="presentation-fullscreen-fallback" className="hidden text-xs text-[#ABD1B5] sm:inline">{copy.fullscreenFallback}</span>}
            <ControlButton label={copy.exit} onClick={exit}><><X className="h-3.5 w-3.5" />{copy.exit}</></ControlButton>
            <ControlButton label={copy.next} onClick={next} disabled={isLastChapter}><>{copy.next}<ChevronRight className="h-4 w-4" /></></ControlButton>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ExplainerGroup: React.FC<React.PropsWithChildren<{ title: string }>> = ({ children, title }) => (
  <section className="mt-6">
    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{title}</h3>
    <div className="mt-2 text-sm leading-relaxed text-[#EDF4ED]">{children}</div>
  </section>
);

const ControlButton: React.FC<React.PropsWithChildren<{ label: string; onClick: () => void; disabled?: boolean }>> = ({ children, disabled = false, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="inline-flex items-center gap-2 border border-[#ABD1B5]/35 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#EDF4ED] transition-colors hover:border-[#79B791] hover:text-[#79B791] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBF00]"
  >
    {children}
  </button>
);

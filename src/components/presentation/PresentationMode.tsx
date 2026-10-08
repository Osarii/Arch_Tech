import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  Box,
  FileCode2,
} from 'lucide-react';
import { getPresentationComponent, presentationChapters, presentationComponents, type PresentationComponent } from '@/presentation/componentRegistry';
import { usePresentation } from '@/presentation/PresentationContext';
import { speechService } from '@/presentation/speechService';
import { publicAssistant } from '@/services/publicAssistantService';

export const PRESENTATION_STEP_DURATION_MS = 14000;

const FRAGMENTS = ['BIM', 'PLANOS', 'DATOS', 'APROBACIONES', 'AVANCES', 'EQUIPOS', 'DECISIONES'];

const copy = {
  ariaLabel: 'ARCH_TECH presentation',
  explorerLabel: 'Presentation component explorer',
  brand: 'ARCH_TECH',
  exploreModeTag: 'Explore Mode · Interactive Architecture',
  exploreHeading: 'The platform, explained on demand.',
  exploreDesc:
    'Select any registered system component to inspect its verified data flow, engineering purpose, and real repository source files.',
  askArchBtn: 'ASK ARCH ABOUT THIS',
  whatTitle: 'WHAT IS IT?',
  howTitle: 'HOW DOES IT WORK?',
  dataFlowTitle: 'DATA FLOW',
  sourceFilesTitle: 'SOURCE FILES',
  technologiesTitle: 'TECHNOLOGIES',
  archResponseTitle: 'ARCH Assistant Response',
  problemTag: 'Problem · The Information Paradox',
  problemH1: 'Un proyecto puede tener toda la información necesaria...',
  problemH2: '...y aun así nadie tener la imagen completa.',
  fragmentationTag: 'Fragmentation · Loss of Shared Context',
  fragmentationH1: 'El modelo vive en un lugar. Las decisiones, en otro. Los avances, en otro.',
  questionTag: 'The Core Question',
  questionH1: '¿Y si el proyecto volviera a ser el punto donde todo se conecta?',
  solutionTag: 'Solution',
  solutionSub: 'Un solo contexto.',
  explorePlatformBtn: 'Explorar Plataforma',
  closingH1: 'One connected environment for complex development.',
  closingTag: 'FROM OPPORTUNITY TO OPERATION.',
  enterPlatformBtn: 'ENTER PLATFORM',
  restartBtn: 'RESTART PRESENTATION',
  exitBtn: 'EXIT',
  systemsSubtitle: 'Demonstrated Systems & Architecture',
  liveCoordination: 'Live System Coordination',
  step21Verified: 'Verified · ISO STEP-21',
  primaryContext: 'Primary Context',
  archTechSuffix: '· ARCH_TECH',
  hardwareProfile: 'Hardware Profile',
  hardwareValue: 'MacBook / Intel UHD 630',
  renderingEngine: 'Rendering Engine',
  renderingValue: 'WebGL 2.0 / PBR 60fps',
  captionsTag: 'Captions',
  previousBtn: 'Previous',
  pauseBtn: 'Pause',
  resumeBtn: 'Resume',
  voiceOnBtn: 'Voice ON',
  voiceOffBtn: 'Voice OFF',
  exploreBtn: 'Explore',
  returnBtn: 'Return',
  fullscreenFallback: 'Fullscreen unavailable — continuing in page view.',
  nextBtn: 'Next',
  dot: '·',
  infoWord: 'Información',
  peopleWord: 'Personas',
  bimWord: 'BIM',
  decisionsWord: 'Decisiones',
  intelWord: 'Inteligencia',
};

export const PresentationMode: React.FC = () => {
  const {
    isActive,
    isPaused,
    isExploring,
    isVoiceEnabled,
    chapterIndex,
    chapter,
    currentComponentId,
    exit,
    restart,
    next,
    previous,
    goToChapter,
    setCurrentComponentId,
    setExploring,
    setPaused,
    toggleVoice,
  } = usePresentation();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false);
  const [cinematicPhase, setCinematicPhase] = useState(0);
  const [activeSpeechCaption, setActiveSpeechCaption] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');

  const activeComponent = getPresentationComponent(currentComponentId ?? chapter.componentIds[0] ?? null);
  const isLastChapter = chapterIndex === presentationChapters.length - 1;
  const isCinematicChapter = chapterIndex === 0;

  // Request fullscreen on launch with robust fallback
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
      if (document.fullscreenElement === overlay) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, [isActive]);

  // Cinematic intro phase sequencing
  useEffect(() => {
    if (!isActive || !isCinematicChapter || isPaused || isExploring) return;

    setCinematicPhase(0);
    const t1 = setTimeout(() => setCinematicPhase(1), 3500); // Fragmentation
    const t2 = setTimeout(() => setCinematicPhase(2), 7500); // Question
    const t3 = setTimeout(() => setCinematicPhase(3), 11000); // Convergence into ARCH_TECH

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, isCinematicChapter, isPaused, isExploring]);

  // Voice narration lifecycle per chapter
  useEffect(() => {
    if (!isActive || isExploring) {
      speechService.stop();
      return;
    }

    const narrationText = chapter.narrationEs;
    setActiveSpeechCaption(narrationText);

    if (isVoiceEnabled && !isPaused) {
      speechService.speak(narrationText, {
        locale: 'es',
        onEnd: () => {
          // Voice narration completed
        },
      });
    } else {
      speechService.stop();
    }

    return () => {
      speechService.stop();
    };
  }, [isActive, chapterIndex, isVoiceEnabled, isPaused, isExploring, chapter.narrationEs]);

  // Auto-advance timer (when not paused and not exploring)
  useEffect(() => {
    if (!isActive || isPaused || isExploring || isLastChapter) return;
    const duration = isCinematicChapter ? 16000 : PRESENTATION_STEP_DURATION_MS;
    const timer = window.setTimeout(next, duration);
    return () => window.clearTimeout(timer);
  }, [isActive, isExploring, isLastChapter, isPaused, isCinematicChapter, next, chapterIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exit();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        next();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        previous();
      } else if (event.key === ' ' && event.target === overlayRef.current) {
        event.preventDefault();
        setPaused(!isPaused);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exit, isActive, isPaused, next, previous, setPaused]);

  // Ask ARCH Assistant about a specific component
  const handleAskArchAboutComponent = useCallback(
    async (component: PresentationComponent) => {
      const prompt = `¿Cómo funciona el componente "${component.label}" en ARCH_TECH y qué archivos del código lo controlan?`;
      setIsAssistantOpen(true);
      try {
        const response = await publicAssistant.sendMessage(prompt, 'es', {
          chapter: chapter.headline,
          section: component.section,
          projectContext: 'ARCH_TECH development platform',
          currentComponent: component,
          route: chapter.route,
        });
        setAssistantMessage(response.content);
      } catch {
        setAssistantMessage(`${component.label}: ${component.assistantContext}`);
      }
    },
    [chapter.headline, chapter.route]
  );

  if (!isActive) return null;

  return (
    <div
      ref={overlayRef}
      data-testid="presentation-mode"
      role="dialog"
      aria-modal="true"
      aria-label={copy.ariaLabel}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex min-h-screen w-full flex-col justify-between overflow-y-auto bg-[#07080a] p-4 text-[#EDF4ED] outline-none sm:p-8 lg:p-12 selection:bg-[#ABD1B5] selection:text-black font-sans"
    >
      {/* Top Header Bar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#ABD1B5]">
            {copy.brand}
          </span>
          <span className="h-3 w-px bg-white/20" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-400">
            {chapter.section}
          </span>
        </div>

        {/* Chapter Progress Indicators */}
        <div className="hidden sm:flex items-center gap-1.5">
          {presentationChapters.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => goToChapter(idx)}
              aria-label={`Go to chapter ${ch.number}: ${ch.headline}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === chapterIndex
                  ? 'w-6 bg-[#79B791]'
                  : idx < chapterIndex
                  ? 'w-2 bg-[#ABD1B5]/50 hover:bg-[#ABD1B5]'
                  : 'w-2 bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ABD1B5]">
          <span>
            {String(chapterIndex + 1).padStart(2, '0')} / {String(presentationChapters.length).padStart(2, '0')}
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto my-auto flex w-full max-w-7xl flex-1 flex-col justify-center py-6 sm:py-10">
        {isExploring ? (
          /* Explore Mode View */
          <section
            className="grid gap-8 lg:grid-cols-[1fr_1.2fr] items-start"
            aria-label={copy.explorerLabel}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#79B791] animate-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#79B791]">
                  {copy.exploreModeTag}
                </p>
              </div>
              <h1 className="mt-3 text-3xl font-light tracking-[-0.03em] sm:text-5xl text-white font-serif">
                {copy.exploreHeading}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-300">
                {copy.exploreDesc}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {presentationComponents.map((component) => (
                  <button
                    key={component.id}
                    type="button"
                    data-testid={`presentation-component-${component.id}`}
                    onClick={() => setCurrentComponentId(component.id)}
                    className={`group rounded-sm border p-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${
                      activeComponent?.id === component.id
                        ? 'border-[#79B791] bg-[#79B791]/15 text-white shadow-[0_0_12px_rgba(121,183,145,0.2)]'
                        : 'border-white/10 bg-white/[0.02] text-stone-300 hover:border-[#79B791]/50 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="block text-[8px] tracking-[0.16em] text-[#ABD1B5]/70 group-hover:text-[#ABD1B5]">
                      {component.section}
                    </span>
                    <span className="mt-1 block font-semibold text-stone-100">{component.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Explainer Panel */}
            {activeComponent && (
              <aside
                data-testid="presentation-explainer"
                className="rounded-lg border border-white/15 bg-[#0c0d12]/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-5"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#79B791]">
                      {activeComponent.section}
                    </span>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-serif text-white">{activeComponent.label}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAskArchAboutComponent(activeComponent)}
                    className="flex items-center gap-1.5 rounded-full border border-[#79B791]/60 bg-[#79B791]/15 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#79B791] transition-all hover:bg-[#79B791] hover:text-black"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{copy.askArchBtn}</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{copy.whatTitle}</h3>
                    <p className="mt-1 leading-relaxed text-stone-200">{activeComponent.purpose}</p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{copy.howTitle}</h3>
                    <p className="mt-1 leading-relaxed text-stone-200">{activeComponent.technicalSummary}</p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{copy.dataFlowTitle}</h3>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-[#ABD1B5] bg-black/40 p-2.5 rounded border border-white/5">
                      {activeComponent.dataFlow}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{copy.sourceFilesTitle}</h3>
                    <ul className="mt-1 space-y-1 font-mono text-[11px] text-stone-300">
                      {activeComponent.sourceFiles.map((file) => (
                        <li key={file} className="flex items-center gap-2">
                          <FileCode2 className="h-3 w-3 text-[#79B791]" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79B791]">{copy.technologiesTitle}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeComponent.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isAssistantOpen && assistantMessage && (
                  <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-[#79B791] font-mono text-[9px] uppercase tracking-[0.16em]">
                      <Sparkles className="h-3 w-3" />
                      <span>{copy.archResponseTitle}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-stone-200 bg-white/5 p-3 rounded border border-white/10">
                      {assistantMessage}
                    </p>
                  </div>
                )}
              </aside>
            )}
          </section>
        ) : isCinematicChapter ? (
          /* Chapter 1: Cinematic Intro with Animated Fragments */
          <main className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            {cinematicPhase === 0 && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#79B791]">
                  {copy.problemTag}
                </p>
                <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-[-0.04em] text-white leading-tight">
                  {copy.problemH1}
                </h1>
                <p className="font-serif italic text-2xl sm:text-3xl text-[#ABD1B5] opacity-90">
                  {copy.problemH2}
                </p>
              </div>
            )}

            {cinematicPhase === 1 && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stone-400">
                  {copy.fragmentationTag}
                </p>
                <p className="font-serif text-2xl sm:text-3xl text-stone-300">
                  {copy.fragmentationH1}
                </p>
                {/* Floating Fragment Pills */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {FRAGMENTS.map((word, idx) => (
                    <span
                      key={word}
                      style={{ animationDelay: `${idx * 150}ms` }}
                      className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-stone-200 shadow-md animate-bounce"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cinematicPhase === 2 && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#79B791]">
                  {copy.questionTag}
                </p>
                <h1 className="font-serif text-4xl sm:text-6xl font-light tracking-[-0.035em] text-white">
                  {copy.questionH1}
                </h1>
              </div>
            )}

            {cinematicPhase >= 3 && (
              <div className="space-y-8 animate-in zoom-in-90 fade-in duration-700">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[12px] uppercase tracking-[0.4em] text-[#79B791]">
                    {copy.solutionTag}
                  </span>
                  <h1 className="mt-3 font-mono text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[0.16em] text-white">
                    {copy.brand}
                  </h1>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.22em] text-[#ABD1B5]">
                  <span>{copy.infoWord}</span>
                  <span>{copy.dot}</span>
                  <span>{copy.peopleWord}</span>
                  <span>{copy.dot}</span>
                  <span>{copy.bimWord}</span>
                  <span>{copy.dot}</span>
                  <span>{copy.decisionsWord}</span>
                  <span>{copy.dot}</span>
                  <span>{copy.intelWord}</span>
                </div>
                <p className="font-serif italic text-2xl sm:text-3xl text-stone-200">
                  {copy.solutionSub}
                </p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#79B791] bg-[#79B791] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black transition-transform hover:scale-105"
                >
                  <span>{copy.explorePlatformBtn}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>
        ) : isLastChapter ? (
          /* Chapter 12: Closing */
          <main className="mx-auto flex w-full max-w-4xl flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#79B791]">
              {copy.brand}
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-[-0.04em] text-white">
              {copy.closingH1}
            </h1>
            <p className="font-mono text-sm sm:text-base uppercase tracking-[0.25em] text-[#ABD1B5]">
              {copy.closingTag}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <button
                type="button"
                onClick={exit}
                className="rounded-full border border-[#79B791] bg-[#79B791] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-lg transition-transform hover:scale-105"
              >
                {copy.enterPlatformBtn}
              </button>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{copy.restartBtn}</span>
              </button>
              <button
                type="button"
                onClick={exit}
                className="rounded-full border border-white/15 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white"
              >
                {copy.exitBtn}
              </button>
            </div>
          </main>
        ) : (
          /* Live Application Chapter (Chapters 02 - 11) */
          <main className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#79B791]">{chapter.number}</span>
                <span className="h-3 w-px bg-white/20" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#79B791]">
                  {chapter.section}
                </p>
              </div>

              <h1 className="mt-4 font-serif text-4xl sm:text-6xl font-light tracking-[-0.035em] text-white">
                {chapter.headline}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
                {chapter.supporting}
              </p>

              {/* Related Explainable Components Pills */}
              <div className="mt-8">
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                  {copy.systemsSubtitle}
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {chapter.componentIds.map((compId) => {
                    const comp = getPresentationComponent(compId);
                    if (!comp) return null;
                    return (
                      <button
                        key={compId}
                        type="button"
                        onClick={() => {
                          setCurrentComponentId(compId);
                          setExploring(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-200 transition-all hover:border-[#79B791] hover:bg-[#79B791]/10 hover:text-[#79B791]"
                      >
                        <Box className="h-3 w-3 text-[#79B791]" />
                        <span>{comp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Visual Graphic Representation */}
            <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#79B791]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
                    {copy.liveCoordination}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#79B791]">
                  {copy.step21Verified}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-md border border-white/10 bg-black/40 p-4">
                  <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-400">
                    {copy.primaryContext}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-white">
                    {chapter.headline} {copy.archTechSuffix}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-stone-300">
                    {chapter.narrationEs}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center font-mono text-[9px] uppercase tracking-[0.14em]">
                  <div className="rounded border border-white/10 p-2.5 bg-white/[0.02]">
                    <span className="block text-stone-400">{copy.hardwareProfile}</span>
                    <span className="mt-1 block font-semibold text-[#ABD1B5]">{copy.hardwareValue}</span>
                  </div>
                  <div className="rounded border border-white/10 p-2.5 bg-white/[0.02]">
                    <span className="block text-stone-400">{copy.renderingEngine}</span>
                    <span className="mt-1 block font-semibold text-[#ABD1B5]">{copy.renderingValue}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Live Captions Bar (Always Shown) */}
      <div className="mx-auto w-full max-w-7xl border-t border-white/10 pt-3 pb-2">
        <div className="flex items-start gap-3 rounded bg-black/60 px-4 py-2.5 border border-white/5">
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#79B791] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#79B791]" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#79B791]">
              {copy.captionsTag}
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-200">
            {activeSpeechCaption}
          </p>
        </div>
      </div>

      {/* Bottom Footer Controls Bar */}
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          {/* Previous */}
          <ControlButton
            label={copy.previousBtn}
            onClick={previous}
            disabled={chapterIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{copy.previousBtn}</span>
          </ControlButton>

          {/* Pause / Resume */}
          <ControlButton
            label={isPaused ? copy.resumeBtn : copy.pauseBtn}
            onClick={() => setPaused(!isPaused)}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? copy.resumeBtn : copy.pauseBtn}</span>
          </ControlButton>

          {/* Voice Toggle */}
          <ControlButton
            label={isVoiceEnabled ? copy.voiceOnBtn : copy.voiceOffBtn}
            onClick={toggleVoice}
          >
            {isVoiceEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#79B791]" /> : <VolumeX className="h-3.5 w-3.5 text-stone-500" />}
            <span className="hidden sm:inline">{isVoiceEnabled ? copy.voiceOnBtn : copy.voiceOffBtn}</span>
          </ControlButton>

          {/* Explore Mode */}
          <ControlButton
            label={isExploring ? copy.returnBtn : copy.exploreBtn}
            onClick={() => setExploring(!isExploring)}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>{isExploring ? copy.returnBtn : copy.exploreBtn}</span>
          </ControlButton>
        </div>

        <div className="flex items-center gap-2">
          {fullscreenUnavailable && (
            <span
              data-testid="presentation-fullscreen-fallback"
              className="hidden text-xs text-[#ABD1B5] sm:inline font-mono"
            >
              {copy.fullscreenFallback}
            </span>
          )}

          {/* Exit */}
          <ControlButton label={copy.exitBtn} onClick={exit}>
            <X className="h-3.5 w-3.5" />
            <span>{copy.exitBtn}</span>
          </ControlButton>

          {/* Next */}
          <ControlButton
            label={copy.nextBtn}
            onClick={next}
            disabled={isLastChapter}
          >
            <span>{copy.nextBtn}</span>
            <ChevronRight className="h-4 w-4" />
          </ControlButton>
        </div>
      </footer>
    </div>
  );
};

const ControlButton: React.FC<
  React.PropsWithChildren<{ label: string; onClick: () => void; disabled?: boolean }>
> = ({ children, disabled = false, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-200 transition-all hover:border-[#79B791] hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79B791]"
  >
    {children}
  </button>
);

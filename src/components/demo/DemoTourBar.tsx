import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCcw,
  X,
  Compass,
  Building2,
  Ruler,
  Sparkles,
} from 'lucide-react';
import { useDemoTour, BIM_TOUR_PRESETS, type DemoTourStage } from '../../demo/DemoTourContext';

const copy = {
  barLabel: 'Barra de Control del Recorrido Demo',
  brand: 'ARCH_TECH',
  tourBadge: 'RECORRIDO GUIADO',
  stageIntro: 'INTRO',
  stageLanding: 'LANDING',
  stagePortal: 'PORTAL',
  stageBim: 'BIM / 3D',
  previousStage: 'Anterior',
  nextStage: 'Siguiente',
  toLanding: 'Ver Landing',
  toPortal: 'Ir al Portal',
  toBim: 'Abrir Visor 3D',
  resetTour: 'Reiniciar',
  exitTour: 'Salir del Recorrido',
  fullscreen: 'Pantalla Completa',
  presetsLabel: 'Vistas BIM:',
};

export const DemoTourBar: React.FC = () => {
  const {
    isTourActive,
    stage,
    isFullscreen,
    activeBimPreset,
    nextStage,
    previousStage,
    goToStage,
    resetTour,
    exitTour,
    applyBimPreset,
    toggleFullscreen,
  } = useDemoTour();

  if (!isTourActive || stage === 'intro') return null;

  const stages: { id: DemoTourStage; label: string; number: string }[] = [
    { id: 'intro', label: copy.stageIntro, number: '01' },
    { id: 'landing', label: copy.stageLanding, number: '02' },
    { id: 'portal', label: copy.stagePortal, number: '03' },
    { id: 'bim', label: copy.stageBim, number: '04' },
  ];

  return (
    <aside
      data-testid="demo-tour-bar"
      aria-label={copy.barLabel}
      className="fixed bottom-4 left-1/2 z-[95] flex -translate-x-1/2 flex-col items-center gap-2 max-w-[96vw] animate-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/20 bg-[#0c0e14]/90 px-4 py-2 text-[#EDF4ED] shadow-2xl backdrop-blur-md">
        {/* Brand & Recorrido Tag */}
        <div className="flex items-center gap-2 border-r border-white/15 pr-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#ABD1B5]">
            {copy.brand}
          </span>
          <span className="h-2.5 w-px bg-white/20" />
          <span className="rounded bg-[#79B791]/15 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-[#79B791] border border-[#79B791]/30">
            {copy.tourBadge}
          </span>
        </div>

        {/* Stage Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {stages.map((st) => {
            const isActive = stage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                data-testid={`tour-stage-${st.id}`}
                onClick={() => goToStage(st.id)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                  isActive
                    ? 'border border-[#79B791] bg-[#79B791] text-black font-semibold shadow-xs'
                    : 'text-stone-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{st.number}</span>
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* BIM Presets Bar (Shown Only in BIM stage) */}
        {stage === 'bim' && (
          <div className="hidden md:flex items-center gap-1 border-l border-white/15 pl-2">
            {BIM_TOUR_PRESETS.map((preset) => {
              const isSelected = activeBimPreset === preset.id;
              const Icon =
                preset.id === 'masterplan'
                  ? Compass
                  : preset.id === 'logistics'
                  ? Building2
                  : preset.id === 'measure'
                  ? Ruler
                  : Sparkles;

              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`bim-preset-${preset.id}`}
                  onClick={() => applyBimPreset(preset.id)}
                  title={preset.description}
                  className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-[#79B791]/25 text-[#ABD1B5] border border-[#79B791]/40'
                      : 'text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-3 w-3 text-[#79B791]" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Stage Navigation */}
        <div className="flex items-center gap-1.5 border-l border-white/15 pl-2">
          {/* Previous Stage */}
          <button
            type="button"
            data-testid="tour-previous-stage"
            onClick={previousStage}
            aria-label={copy.previousStage}
            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-stone-200 hover:border-white/30 hover:bg-white/10"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{copy.previousStage}</span>
          </button>

          {/* Next Stage (if not last) */}
          {stage !== 'bim' ? (
            <button
              type="button"
              data-testid="tour-next-stage"
              onClick={nextStage}
              className="flex items-center gap-1.5 rounded-full border border-[#79B791] bg-[#79B791] px-3.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-[#8fd0aa] shadow-md"
            >
              <span>{stage === 'landing' ? copy.toPortal : copy.toBim}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            data-testid="tour-toggle-fullscreen"
            onClick={toggleFullscreen}
            aria-label={copy.fullscreen}
            title={copy.fullscreen}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-300 hover:border-white/30 hover:text-white"
          >
            {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
          </button>

          {/* Reset Tour */}
          <button
            type="button"
            data-testid="tour-reset"
            onClick={resetTour}
            aria-label={copy.resetTour}
            title={copy.resetTour}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-300 hover:border-white/30 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          {/* Exit Tour */}
          <button
            type="button"
            data-testid="tour-exit"
            onClick={exitTour}
            aria-label={copy.exitTour}
            title={copy.exitTour}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

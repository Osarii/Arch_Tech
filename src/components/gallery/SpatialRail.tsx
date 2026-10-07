import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import type { PortalProject } from '../../portal/data';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { getPreferredProjectImage } from './projectMedia';

export type SpatialRailSlide = {
  id: string;
  label: string;
  caption: string;
  category: string;
  src: string;
  fit: 'cover' | 'contain';
  aspect: 'wide' | 'technical';
};

export const buildSpatialRailSlides = (project: PortalProject): SpatialRailSlide[] => {
  const preferredImage = getPreferredProjectImage(project);
  const candidates = [
    {
      id: 'hero',
      label: 'Project cover',
      caption: 'Official project photography from the public portfolio.',
      src: preferredImage,
    },
    ...(project.media?.gallery ?? []).map((src, index) => ({
      id: `gallery-${index + 1}`,
      label: `Portfolio view ${String(index + 1).padStart(2, '0')}`,
      caption: 'Official project photography from the public portfolio.',
      src,
    })),
  ];
  const seen = new Set<string>();
  const filtered = candidates.filter((slide) => {
    if (seen.has(slide.src)) return false;
    seen.add(slide.src);
    return Boolean(slide.src);
  });
  const safeCandidates = filtered.length ? filtered : [{ id: 'hero', label: 'Project cover', caption: 'No official project photography is available.', src: '' }];
  return safeCandidates.map((slide) => ({ ...slide, category: project.category, fit: 'cover' as const, aspect: 'wide' as const }));
};

const RailImage: React.FC<{ src?: string; alt: string; loading?: 'eager' | 'lazy'; fetchPriority?: 'high' | 'low' | 'auto'; className?: string }> = ({ src, alt, loading = 'lazy', fetchPriority = 'low', className = '' }) => {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed) {
    return <div data-testid="rail-image-fallback" role="img" aria-label={`${alt} image unavailable`} className={`landing-image-fallback ${className}`}><span>GARNIER ARCHITECTURE / PROJECT MEDIA</span></div>;
  }
  return <img src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={() => setFailed(true)} className={className} />;
};

interface SpatialRailProps {
  project: PortalProject;
}

export const SpatialRail: React.FC<SpatialRailProps> = ({ project }) => {
  const slides = useMemo(() => buildSpatialRailSlides(project), [project]);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const fullscreenTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const isFullscreenOpen = fullscreenIndex !== null;
  const hasMountedRef = useRef(false);

  const selectSlide = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)));
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    selectSlide(activeIndex - 1);
  }, [activeIndex, selectSlide]);

  const handleNext = useCallback(() => {
    selectSlide(activeIndex + 1);
  }, [activeIndex, selectSlide]);

  const [isFading, setIsFading] = useState(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }
    if (reducedMotion) {
      setIsFading(false);
      return undefined;
    }
    setIsFading(true);
    const frame = window.requestAnimationFrame(() => setIsFading(false));
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, reducedMotion]);

  // Fullscreen keys belong exclusively to the global listener, even when they bubble through the rail.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isFullscreenOpen) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    },
    [isFullscreenOpen, handleNext, handlePrev]
  );

  // Keep focus, scroll locking, and keyboard ownership active for the entire fullscreen session.
  useEffect(() => {
    if (!isFullscreenOpen) return;
    const openingTrigger = fullscreenTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fullscreenCloseRef.current?.focus({ preventScroll: true });

    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setFullscreenIndex(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFullscreenIndex((prev) => (prev !== null ? Math.min(prev + 1, slides.length - 1) : null));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFullscreenIndex((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
      } else if (e.key === 'Tab') {
        const controls = fullscreenRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        const focused = document.activeElement;
        if (!fullscreenRef.current?.contains(focused) || (e.shiftKey ? focused === first : focused === last)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => {
      window.removeEventListener('keydown', onGlobalKey);
      document.body.style.overflow = previousOverflow;
      if (openingTrigger?.isConnected) {
        openingTrigger.focus({ preventScroll: true });
      }
    };
  }, [isFullscreenOpen, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];

  return (
    <section
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid="spatial-rail"
      aria-label="Spatial Rail Development Media"
      className="relative outline-none focus-visible:ring-1 focus-visible:ring-stone-600"
    >
      {/* Editorial Header / Metadata & Progress Rail */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <span
              data-testid="rail-index"
              className="font-mono text-2xl font-light tracking-tight text-white sm:text-3xl"
            >
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-stone-500">
              / {String(slides.length).padStart(2, '0')}
            </span>
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-300">
              {activeSlide.label}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">
            {activeSlide.category} · {activeSlide.caption}
          </p>
        </div>

        {/* Minimal Controls & Rail Progress */}
        <div className="flex items-center gap-5 self-start sm:self-end">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              data-testid="rail-prev-btn"
              aria-label="Previous slide"
              className="flex h-8 w-8 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white/[0.3] hover:text-white disabled:pointer-events-none disabled:opacity-20"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex === slides.length - 1}
              data-testid="rail-next-btn"
              aria-label="Next slide"
              className="flex h-8 w-8 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white/[0.3] hover:text-white disabled:pointer-events-none disabled:opacity-20"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Single editorial frame; navigation swaps only the active image. */}
      <div
        data-testid="rail-frame"
        className="relative aspect-[16/9] max-h-[65vh] w-full overflow-hidden border border-white/[0.08] bg-[#0d0d0c]"
      >
        <button
          type="button"
          onClick={(event) => {
            fullscreenTriggerRef.current = event.currentTarget;
            setFullscreenIndex(activeIndex);
          }}
          className="group relative block h-full w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
          aria-label={`Open fullscreen view of ${activeSlide.label}`}
        >
          <div className={`h-full w-full transition-opacity duration-300 ease-out ${isFading && !reducedMotion ? 'opacity-0' : 'opacity-100'}`}>
            <RailImage
              key={activeSlide.id}
              src={activeSlide.src}
              alt={`${project.title} - ${activeSlide.label}`}
              loading="eager"
              fetchPriority="high"
              className="h-full w-full select-none object-cover"
            />
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-stone-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Maximize2 className="h-2.5 w-2.5" />
            <span>Inspect</span>
          </div>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div
          data-testid="rail-progress"
          className="h-[2px] min-w-0 flex-1 overflow-hidden bg-white/[0.08]"
          aria-hidden="true"
        >
          <div
            className="h-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 sm:hidden">Use arrows to browse</span>
      </div>

      {slides.length > 1 && (
        <div data-testid="rail-thumbnails" className="mt-4 hidden gap-3 sm:flex">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => selectSlide(idx)}
              data-testid={`rail-thumb-${slide.id}`}
              aria-label={`Select ${slide.label}`}
              aria-current={idx === activeIndex ? 'true' : undefined}
              className={`group relative aspect-[16/9] w-[clamp(90px,9vw,120px)] overflow-hidden border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 ${idx === activeIndex ? 'border-white' : 'border-white/[0.12] opacity-60 hover:border-white/60 hover:opacity-100'}`}
            >
              <img
                src={slide.src}
                alt=""
                loading="lazy"
                fetchPriority="low"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div data-testid="rail-mobile-dots" className="mt-3 flex justify-center gap-1.5 sm:hidden" aria-label="Select project image">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => selectSlide(idx)}
            aria-label={`Select ${slide.label}`}
            aria-current={idx === activeIndex ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-all ${idx === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`}
          />
        ))}
      </div>

      {/* Simple Fullscreen Viewer */}
      {fullscreenIndex !== null && (
        <div
          ref={fullscreenRef}
          data-testid="rail-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen viewer"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 sm:p-6 backdrop-blur-sm"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tracking-tight text-white">
                {String(fullscreenIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-stone-300">
                {slides[fullscreenIndex].label}
              </span>
            </div>
            <button
              ref={fullscreenCloseRef}
              type="button"
              onClick={() => setFullscreenIndex(null)}
              data-testid="rail-fullscreen-close"
              aria-label="Close fullscreen view"
              className="flex h-8 w-8 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Large Image Area */}
          <div className="relative flex flex-1 items-center justify-center py-2">
            <RailImage
              src={slides[fullscreenIndex].src}
              alt={`${project.title} - ${slides[fullscreenIndex].label}`}
              className="max-h-[82vh] max-w-full select-none object-contain"
            />
          </div>

          {/* Footer Controls & Caption */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
            <p className="max-w-xl font-mono text-[9px] uppercase tracking-[0.16em] text-stone-400 sm:text-[10px]">
              {slides[fullscreenIndex].category} · {slides[fullscreenIndex].caption}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFullscreenIndex((prev) => (prev !== null ? Math.max(0, prev - 1) : 0))}
                disabled={fullscreenIndex === 0}
                data-testid="rail-fullscreen-prev"
                aria-label="Previous fullscreen image"
                className="flex h-7 w-7 items-center justify-center border border-white/[0.1] text-stone-400 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreenIndex((prev) => (prev !== null ? Math.min(slides.length - 1, prev + 1) : 0))}
                disabled={fullscreenIndex === slides.length - 1}
                data-testid="rail-fullscreen-next"
                aria-label="Next fullscreen image"
                className="flex h-7 w-7 items-center justify-center border border-white/[0.1] text-stone-400 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

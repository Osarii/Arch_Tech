import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import type { PortalProject } from '../../portal/data';
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
    return <div data-testid="rail-image-fallback" role="img" aria-label={`${alt} image unavailable`} className={`landing-image-fallback ${className}`}><span>ARCH_TECH / PROJECT MEDIA</span></div>;
  }
  return <img src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={() => setFailed(true)} className={className} />;
};

interface SpatialRailProps {
  project: PortalProject;
}

export const SpatialRail: React.FC<SpatialRailProps> = ({ project }) => {
  const slides = useMemo(() => buildSpatialRailSlides(project), [project]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const fullscreenTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const isFullscreenOpen = fullscreenIndex !== null;

  // Guard against IntersectionObserver fighting intentional button/keyboard programmatic scrolling
  const isProgrammaticScrollRef = useRef(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  // Scroll to slide smoothly and update active index atomically
  const scrollToSlide = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const clamped = Math.max(0, Math.min(index, slides.length - 1));

      isProgrammaticScrollRef.current = true;
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
      // Re-enable observer sync after smooth scroll settles
      unlockTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);

      setActiveIndex(clamped);

      const targetChild = container.children[clamped] as HTMLElement | undefined;
      if (targetChild) {
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({
            left: targetChild.offsetLeft,
            behavior: 'smooth',
          });
        } else {
          container.scrollLeft = targetChild.offsetLeft;
        }
      }
    },
    [slides.length]
  );

  const handlePrev = useCallback(() => {
    scrollToSlide(activeIndexRef.current - 1);
  }, [scrollToSlide]);

  const handleNext = useCallback(() => {
    scrollToSlide(activeIndexRef.current + 1);
  }, [scrollToSlide]);

  // Observer to track active slide as user manually drags or trackpad scrolls
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        // Pick entry with largest intersection ratio
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry) {
          const index = Number(bestEntry.target.getAttribute('data-index'));
          if (!Number.isNaN(index) && index !== activeIndexRef.current) {
            setActiveIndex(index);
          }
        }
      },
      {
        root: container,
        threshold: [0.5, 0.75, 0.9],
      }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => {
      observer.disconnect();
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, [slides]);

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
          {/* Thin Progress Rail */}
          <div
            data-testid="rail-progress"
            className="hidden h-[2px] w-28 overflow-hidden bg-white/[0.08] sm:block md:w-40"
            aria-hidden="true"
          >
            <div
              className="h-full bg-white transition-transform duration-300 ease-out will-change-transform"
              style={{
                width: '100%',
                transform: `translateX(-${100 - ((activeIndex + 1) / slides.length) * 100}%)`,
              }}
            />
          </div>

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

      {/* Horizontal Spatial Rail Track with native CSS scroll-snap */}
      <div
        ref={scrollContainerRef}
        data-testid="rail-track"
        className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-1 touch-pan-x"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, idx) => {
          const isInitial = idx === 0;
          const isNext = idx === 1;
          const isActive = idx === activeIndex;
          const shouldLoadImage = Math.abs(idx - activeIndex) <= 1;

          return (
            <div
              key={slide.id}
              data-index={idx}
              data-testid={`rail-slide-${slide.id}`}
              className={`group relative flex-none snap-start overflow-hidden border border-white/[0.08] transition-opacity duration-300 ${
                slide.aspect === 'wide'
                  ? 'w-[84vw] max-w-5xl aspect-[16/10] sm:aspect-[16/9] max-h-[58vh] bg-[#0d0d0c]'
                  : 'w-[75vw] max-w-4xl aspect-[4/3] max-h-[58vh] bg-[#090908]'
              }`}
            >
              <button
                type="button"
                onClick={(event) => {
                  fullscreenTriggerRef.current = event.currentTarget;
                  setFullscreenIndex(idx);
                }}
                className="relative block h-full w-full cursor-zoom-in text-left focus:outline-none"
                aria-label={`Open fullscreen view of ${slide.label}`}
              >
                <RailImage
                  src={shouldLoadImage ? slide.src : undefined}
                  alt={`${project.title} - ${slide.label}`}
                  loading={isInitial ? 'eager' : 'lazy'}
                  fetchPriority={isInitial ? 'high' : isNext ? 'auto' : 'low'}
                  className={`h-full w-full select-none object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.01] ${isActive ? 'opacity-100' : 'opacity-80'}`}
                />

                {/* Subtle Hover Action overlay */}
                <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-stone-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Maximize2 className="h-2.5 w-2.5" />
                  <span>Inspect</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Thin Progress Rail indicator */}
      <div
        className="mt-2 h-[2px] w-full overflow-hidden bg-white/[0.08] sm:hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-white transition-transform duration-300 ease-out will-change-transform"
          style={{
            width: '100%',
            transform: `translateX(-${100 - ((activeIndex + 1) / slides.length) * 100}%)`,
          }}
        />
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

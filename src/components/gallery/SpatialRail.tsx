import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import type { PortalProject } from '../../portal/data';

export type SpatialRailSlide = {
  id: string;
  label: string;
  caption: string;
  category: string;
  src: string;
  fit: 'cover' | 'contain';
};

export const buildSpatialRailSlides = (project: PortalProject): SpatialRailSlide[] => {
  const media = project.media;
  return [
    {
      id: 'hero',
      label: 'Facility Overview',
      caption: 'Primary operational facility and landscape integration.',
      category: 'Campus / Infrastructure Overview',
      src: project.image,
      fit: 'cover',
    },
    {
      id: 'aerial',
      label: 'Regional Context',
      caption: 'Topographic alignment, corridor access, and site boundaries.',
      category: 'Regional Context & Siting',
      src: media?.aerial || project.image,
      fit: 'cover',
    },
    {
      id: 'campusOverview',
      label: 'Campus Structure',
      caption: 'Infrastructure framework, arterial connectors, and massing.',
      category: 'Campus Infrastructure',
      src: media?.campusOverview || media?.aerial || project.image,
      fit: 'cover',
    },
    {
      id: 'masterplan',
      label: 'Masterplan',
      caption: 'Phased development plots, easements, and buffer zoning.',
      category: 'Master Planning & Phasing',
      src: media?.masterplan || project.image,
      fit: 'contain',
    },
    {
      id: 'sitePlan',
      label: 'Site Strategy',
      caption: 'Circulation geometry, loading bays, and utility corridors.',
      category: 'Site Strategy & Logistics',
      src: media?.sitePlan || project.image,
      fit: 'contain',
    },
    {
      id: 'floorPlan',
      label: 'Program Study',
      caption: 'Structural grids, core placement, and modular layout zones.',
      category: 'Spatial Programming & Layout',
      src: media?.floorPlan || project.image,
      fit: 'contain',
    },
    {
      id: 'interior',
      label: 'Operations',
      caption: 'Operational environment, high-span volume, and envelope daylighting.',
      category: 'Operations & Interior Volume',
      src: media?.interior || project.image,
      fit: 'cover',
    },
    {
      id: 'conceptBoard',
      label: 'Systems',
      caption: 'Technical assemblies, materials, MEP strategies, and structural specs.',
      category: 'Systems & Technical Specifications',
      src: media?.conceptBoard || project.image,
      fit: 'contain',
    },
  ];
};

interface SpatialRailProps {
  project: PortalProject;
}

export const SpatialRail: React.FC<SpatialRailProps> = ({ project }) => {
  const slides = buildSpatialRailSlides(project);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const railContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Scroll to slide smoothly without re-rendering JS per frame
  const scrollToSlide = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
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
      setActiveIndex(clamped);
    }
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    scrollToSlide(activeIndex - 1);
  }, [activeIndex, scrollToSlide]);

  const handleNext = useCallback(() => {
    scrollToSlide(activeIndex + 1);
  }, [activeIndex, scrollToSlide]);

  // Observer to track active slide as native scroll snaps
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!Number.isNaN(index)) {
              setActiveIndex(index);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [slides]);

  // Scoped keyboard navigation: only when rail or fullscreen is focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (fullscreenIndex !== null) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setFullscreenIndex(null);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFullscreenIndex((prev) => (prev !== null ? Math.min(prev + 1, slides.length - 1) : null));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFullscreenIndex((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    },
    [fullscreenIndex, handleNext, handlePrev, slides.length]
  );

  // Global escape key handler when fullscreen viewer is open
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenIndex(null);
      } else if (e.key === 'ArrowRight') {
        setFullscreenIndex((prev) => (prev !== null ? Math.min(prev + 1, slides.length - 1) : null));
      } else if (e.key === 'ArrowLeft') {
        setFullscreenIndex((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [fullscreenIndex, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];

  return (
    <section
      ref={railContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid="spatial-rail"
      aria-label="Spatial Rail Development Media"
      className="relative outline-none focus-visible:ring-1 focus-visible:ring-stone-600"
    >
      {/* Editorial Header / Metadata & Progress Rail */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <span
              data-testid="rail-index"
              className="font-mono text-3xl font-light tracking-tight text-white sm:text-4xl"
            >
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-stone-500">
              / {String(slides.length).padStart(2, '0')}
            </span>
            <span className="ml-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
              {activeSlide.label}
            </span>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">
            {activeSlide.category} · {activeSlide.caption}
          </p>
        </div>

        {/* Minimal Controls & Rail Progress */}
        <div className="flex items-center gap-6 self-start sm:self-end">
          {/* Thin Progress Rail */}
          <div
            data-testid="rail-progress"
            className="hidden h-[2px] w-32 overflow-hidden bg-white/[0.08] sm:block md:w-48"
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
              className="flex h-9 w-9 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white/[0.3] hover:text-white disabled:pointer-events-none disabled:opacity-20"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex === slides.length - 1}
              data-testid="rail-next-btn"
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white/[0.3] hover:text-white disabled:pointer-events-none disabled:opacity-20"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Spatial Rail Track with native CSS scroll-snap */}
      <div
        ref={scrollContainerRef}
        data-testid="rail-track"
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-1 touch-pan-x"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, idx) => {
          const isInitial = idx === 0;
          const isNext = idx === 1;
          const isActive = idx === activeIndex;

          return (
            <div
              key={slide.id}
              data-index={idx}
              data-testid={`rail-slide-${slide.id}`}
              className="group relative flex-none snap-start overflow-hidden bg-[#0d0d0c] border border-white/[0.08] transition-opacity duration-300"
              style={{
                width: 'clamp(280px, 84vw, 86%)',
                aspectRatio: '16 / 9',
              }}
            >
              <button
                type="button"
                onClick={() => setFullscreenIndex(idx)}
                className="relative block h-full w-full cursor-zoom-in text-left focus:outline-none"
                aria-label={`Open fullscreen view of ${slide.label}`}
              >
                <img
                  src={slide.src}
                  alt={`${project.title} - ${slide.label}`}
                  loading={isInitial ? 'eager' : 'lazy'}
                  // @ts-expect-error fetchpriority is valid HTML attribute in modern browsers
                  fetchpriority={isInitial ? 'high' : isNext ? 'auto' : 'low'}
                  decoding="async"
                  className={`h-full w-full select-none transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.01] ${
                    slide.fit === 'contain'
                      ? 'object-contain p-4 md:p-8 bg-[#0a0a09]'
                      : 'object-cover'
                  } ${isActive ? 'opacity-100' : 'opacity-85'}`}
                />

                {/* Subtle Hover Action overlay */}
                <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-stone-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" />
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
          data-testid="rail-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen viewer"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 sm:p-8 backdrop-blur-sm"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tracking-tight text-white">
                {String(fullscreenIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-stone-400">
                {slides[fullscreenIndex].label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenIndex(null)}
              data-testid="rail-fullscreen-close"
              aria-label="Close fullscreen view"
              className="flex h-9 w-9 items-center justify-center border border-white/[0.1] text-stone-400 transition-colors hover:border-white hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Large Image Area */}
          <div className="relative flex flex-1 items-center justify-center py-4">
            <img
              src={slides[fullscreenIndex].src}
              alt={`${project.title} - ${slides[fullscreenIndex].label}`}
              decoding="async"
              className={`max-h-[82vh] max-w-full select-none ${
                slides[fullscreenIndex].fit === 'contain' ? 'object-contain' : 'object-contain'
              }`}
            />
          </div>

          {/* Footer Controls & Caption */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
            <p className="max-w-xl font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
              {slides[fullscreenIndex].category} · {slides[fullscreenIndex].caption}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFullscreenIndex((prev) => (prev !== null ? Math.max(0, prev - 1) : 0))}
                disabled={fullscreenIndex === 0}
                data-testid="rail-fullscreen-prev"
                aria-label="Previous fullscreen image"
                className="flex h-8 w-8 items-center justify-center border border-white/[0.1] text-stone-400 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreenIndex((prev) => (prev !== null ? Math.min(slides.length - 1, prev + 1) : 0))}
                disabled={fullscreenIndex === slides.length - 1}
                data-testid="rail-fullscreen-next"
                aria-label="Next fullscreen image"
                className="flex h-8 w-8 items-center justify-center border border-white/[0.1] text-stone-400 hover:text-white disabled:pointer-events-none disabled:opacity-20"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

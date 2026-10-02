import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  X,
  Layers,
  Sparkles,
  Compass,
  Building2,
  FileCode,
  MapPin,
  Eye,
} from 'lucide-react';
import { PortalProject } from '../../portal/data';

export interface GallerySlide {
  id: string;
  title: string;
  category: string;
  src: string;
  contain?: boolean;
  tagline: string;
  description: string;
  spanClass?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const buildProjectGallerySlides = (project: PortalProject): GallerySlide[] => {
  const m = project.media;
  return [
    {
      id: 'hero',
      title: 'Facility Overview',
      category: 'Campus / Infrastructure Overview',
      src: project.image,
      contain: false,
      tagline: 'Primary Facility & Infrastructure Framework',
      description: 'Principal facility perspective establishing campus massing, operational thresholds, access spines, and building envelope.',
      spanClass: 'md:col-span-2 md:row-span-2',
      icon: Building2,
    },
    {
      id: 'aerial',
      title: 'Aerial Overview',
      category: 'Site & Regional Context',
      src: m?.aerial ?? project.image,
      contain: false,
      tagline: 'Regional Logistics & Infrastructure Spine',
      description: 'Macro environmental context, arterial transit corridors, and perimeter utility connections.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: Compass,
    },
    {
      id: 'campusOverview',
      title: 'Campus Structure',
      category: 'Circulation & Logistics Grid',
      src: m?.campusOverview ?? project.image,
      contain: false,
      tagline: 'Operational Circulation & Phasing Hierarchy',
      description: 'Building cluster organization, high-throughput freight lanes, and multi-tenant operational easements.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: Layers,
    },
    {
      id: 'masterplan',
      title: 'Masterplan',
      category: 'Planning & Zoning',
      src: m?.masterplan ?? project.image,
      contain: true,
      tagline: 'Zoning Allocation & Expansion Phasing',
      description: 'Comprehensive land-use allocation, utility easements, parcel subdivision, and future development reserve capacity.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: FileCode,
    },
    {
      id: 'sitePlan',
      title: 'Site Strategy',
      category: 'Civil & Site Strategy',
      src: m?.sitePlan ?? project.image,
      contain: true,
      tagline: 'Heavy Transport Routing & Perimeter Controls',
      description: 'Dedicated heavy-vehicle ingress, grade-separated logistics access, secure boundary perimeters, and site stormwater infrastructure.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: MapPin,
    },
    {
      id: 'floorPlan',
      title: 'Program Study',
      category: 'Operations & Phasing Layout',
      src: m?.floorPlan ?? project.image,
      contain: true,
      tagline: 'Flexible Production & Service Core Layout',
      description: 'Structural column bays, high-capacity utility cores, adaptable tenant floor plates, and emergency egress routing.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: FileCode,
    },
    {
      id: 'interior',
      title: 'Arrival & Operations Portal',
      category: 'Operational Portal & Experience',
      src: m?.interior ?? project.image,
      contain: false,
      tagline: 'Facility Access & Operations Management',
      description: 'Primary operational reception, access management portal, high-volume tenant interface, and durable public circulation.',
      spanClass: 'md:col-span-1 md:row-span-1',
      icon: Eye,
    },
    {
      id: 'conceptBoard',
      title: 'Systems & Specifications',
      category: 'Utilities & Technical Standards',
      src: m?.conceptBoard ?? project.image,
      contain: true,
      tagline: 'Durable Materials & Infrastructure Systems',
      description: 'Industrial durability standards, high-efficiency building envelope assemblies, and infrastructure specification guidelines.',
      spanClass: 'md:col-span-2 md:row-span-1',
      icon: Sparkles,
    },
  ];
};

interface ProjectGalleryProps {
  project: PortalProject;
  className?: string;
}

const AUTOPLAY_INTERVAL = 6500;

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ project, className = '' }) => {
  const slides = buildProjectGallerySlides(project);
  const total = slides.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [containOverride, setContainOverride] = useState<boolean | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const activeSlide = slides[currentIndex] ?? slides[0];

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + total) % total);
    setContainOverride(null);
  }, [total]);

  const handlePrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Autoplay timer
  useEffect(() => {
    if (!isAutoplay || isPaused || lightboxOpen || shouldReduceMotion) return;

    const timer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoplay, isPaused, lightboxOpen, shouldReduceMotion, currentIndex, goToSlide]);

  // Keep active thumbnail in view
  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;
    const activeThumb = strip.querySelector(`[data-thumb-index="${currentIndex}"]`) as HTMLElement | null;
    if (activeThumb) {
      const offset = activeThumb.offsetLeft - strip.offsetWidth / 2 + activeThumb.offsetWidth / 2;
      if (typeof strip.scrollTo === 'function') {
        strip.scrollTo({ left: offset, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
      } else {
        strip.scrollLeft = offset;
      }
    }
  }, [currentIndex, shouldReduceMotion]);

  // Scoped keyboard navigation (active only when gallery is focused or lightbox is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const isGalleryFocused = Boolean(
        galleryRef.current && (
          galleryRef.current.contains(document.activeElement) ||
          document.activeElement === galleryRef.current
        )
      );

      // Only intercept if lightbox is open OR if gallery currently has focus
      if (!lightboxOpen && !isGalleryFocused) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape' && lightboxOpen) {
        e.preventDefault();
        setLightboxOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setLightboxOpen((prev) => !prev);
        }
      } else if (e.key === ' ') {
        // Space to toggle autoplay when gallery has focus and lightbox is closed
        if (isGalleryFocused && !lightboxOpen) {
          e.preventDefault();
          setIsAutoplay((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, lightboxOpen]);

  // Calculate coverflow positions: relative offset -2, -1, 0, 1, 2
  const getRelativePosition = (index: number) => {
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const isContain = containOverride !== null ? containOverride : Boolean(activeSlide.contain);

  const isDraggingRef = useRef(false);

  return (
    <div
      ref={galleryRef}
      tabIndex={0}
      className={`project-gallery relative w-full select-none outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${className}`}
      data-testid="project-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${project.title} Development Gallery`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Editorial Header Bar */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 border border-white/20 bg-white/[0.04] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e9e5dc]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {activeSlide.category}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-400">
            Study {String(currentIndex + 1).padStart(2, '0')} <span className="text-stone-600">/</span> {String(total).padStart(2, '0')}
          </span>
        </div>

        {/* Gallery Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsAutoplay((prev) => !prev)}
            aria-label={isAutoplay ? 'Pause auto-progression' : 'Start auto-progression'}
            data-testid="gallery-autoplay-toggle"
            className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
              isAutoplay
                ? 'border-white/40 bg-white/10 text-white'
                : 'border-white/10 text-stone-400 hover:border-white/25 hover:text-stone-200'
            }`}
          >
            {isAutoplay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span className="hidden sm:inline">{isAutoplay ? 'Autoplay on' : 'Autoplay'}</span>
          </button>

          <div className="flex items-center border border-white/10 bg-[#111216]">
            <button
              type="button"
              onClick={handlePrev}
              data-testid="gallery-prev-btn"
              aria-label="Previous study"
              className="flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <button
              type="button"
              onClick={handleNext}
              data-testid="gallery-next-btn"
              aria-label="Next study"
              className="flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            data-testid="gallery-expand-btn"
            aria-label="Expand image in lightbox"
            className="flex h-8 w-8 items-center justify-center border border-white/10 bg-[#111216] text-stone-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Coverflow Stage */}
      <div className="relative mx-auto mt-8 h-[440px] max-w-7xl overflow-hidden sm:h-[540px] lg:h-[620px]">
        {/* Subtle Ambient Vignette */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0a0b0d] via-transparent to-transparent opacity-80" />

        <div className="relative flex h-full w-full items-center justify-center">
          {slides.map((slide, index) => {
            const relPos = getRelativePosition(index);
            const isCenter = relPos === 0;
            const isPrev = relPos === -1;
            const isNext = relPos === 1;
            const isVisible = Math.abs(relPos) <= 1;

            if (!isVisible) return null;

            return (
              <motion.div
                key={slide.id}
                data-testid={`gallery-slide-${slide.id}`}
                drag={isCenter && !shouldReduceMotion ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => {
                  isDraggingRef.current = true;
                }}
                onDragEnd={(_, info) => {
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 50);
                  if (info.offset.x < -40 || info.velocity.x < -300) {
                    handleNext();
                  } else if (info.offset.x > 40 || info.velocity.x > 300) {
                    handlePrev();
                  }
                }}
                className={`absolute top-0 bottom-0 flex items-center justify-center ${
                  isCenter
                    ? 'z-20 w-full cursor-grab active:cursor-grabbing px-4 sm:px-12'
                    : isPrev
                    ? 'z-10 w-[70%] -translate-x-[55%] cursor-pointer opacity-40 hover:opacity-75 sm:w-[60%] sm:-translate-x-[65%]'
                    : isNext
                    ? 'z-10 w-[70%] translate-x-[55%] cursor-pointer opacity-40 hover:opacity-75 sm:w-[60%] sm:translate-x-[65%]'
                    : 'hidden'
                }`}
                onClick={() => {
                  if (isDraggingRef.current) return;
                  if (isPrev) handlePrev();
                  else if (isNext) handleNext();
                  else if (isCenter) setLightboxOpen(true);
                }}
                initial={false}
                animate={{
                  scale: isCenter ? 1 : 0.88,
                  opacity: isCenter ? 1 : 0.45,
                  filter: isCenter ? 'blur(0px)' : 'blur(1px)',
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 260, damping: 28 }
                }
              >
                <div className="group relative h-full w-full overflow-hidden border border-white/[0.12] bg-[#0d0e12] shadow-2xl">
                  <img
                    src={slide.src}
                    alt={`${project.title} - ${slide.title}`}
                    draggable={false}
                    loading={isCenter ? 'eager' : 'eager'}
                    decoding="async"
                    fetchPriority={isCenter ? 'high' : 'low'}
                    className={`h-full w-full select-none transition-transform duration-700 ${
                      slide.contain
                        ? 'bg-[#e9e5dc] object-contain p-2 sm:p-4'
                        : 'object-cover group-hover:scale-[1.02]'
                    }`}
                  />

                  {/* Active Slide Text Overlay */}
                  {isCenter && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 sm:p-8">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-2xl">
                          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-emerald-400">
                            {slide.tagline}
                          </p>
                          <h2 className="mt-1 font-serif text-2xl font-light tracking-tight text-[#f4efe8] sm:text-4xl">
                            {slide.title}
                          </h2>
                          <p className="mt-2 text-xs leading-relaxed text-stone-300 sm:text-sm">
                            {slide.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxOpen(true);
                            }}
                            className="flex items-center gap-2 border border-white/20 bg-black/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-200 backdrop-blur-sm transition-colors hover:border-white hover:text-white"
                          >
                            <Maximize2 className="h-3 w-3" />
                            <span>Expand High-Res</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Side Slide Teaser Label */}
                  {!isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="border border-white/20 bg-black/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-stone-300">
                        {slide.title}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Thumbnail Strip */}
      <div className="mx-auto mt-6 max-w-7xl">
        <div
          ref={thumbnailStripRef}
          data-testid="gallery-thumbnail-strip"
          className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin sm:gap-3"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-thumb-index={index}
                data-testid={`gallery-thumb-${slide.id}`}
                onClick={() => goToSlide(index)}
                className={`group relative flex h-20 w-28 shrink-0 flex-col justify-end overflow-hidden border text-left transition-all sm:h-24 sm:w-36 ${
                  isActive
                    ? 'border-white bg-[#1a1c22] ring-1 ring-white/50'
                    : 'border-white/[0.1] bg-[#0e1014] opacity-60 hover:border-white/30 hover:opacity-100'
                }`}
              >
                <img
                  src={slide.src}
                  alt={slide.title}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className={`absolute inset-0 h-full w-full ${
                    slide.contain ? 'bg-[#e9e5dc] object-contain p-1' : 'object-cover'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-stone-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.12em] text-white">
                    {slide.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Interactive Bento Preview Below */}
      <div className="mx-auto mt-16 max-w-7xl border-t border-white/[0.08] pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">
              Interactive Matrix
            </p>
            <h3 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#f4efe8]">
              Development Studies
            </h3>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-stone-400">
            Select any study in the grid to instantly calibrate the dominant stage and inspect specific development layers.
          </p>
        </div>

        <div
          data-testid="gallery-bento-grid"
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:gap-4"
        >
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const IconComponent = slide.icon ?? Layers;

            return (
              <motion.div
                key={`bento-${slide.id}`}
                data-testid={`bento-tile-${slide.id}`}
                onClick={() => {
                  goToSlide(index);
                  if (typeof galleryRef.current?.scrollIntoView === 'function') {
                    galleryRef.current.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
                  }
                }}
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                className={`group relative flex flex-col justify-between overflow-hidden border p-4 transition-colors cursor-pointer ${
                  slide.spanClass ?? 'col-span-1'
                } ${
                  isActive
                    ? 'border-emerald-500/60 bg-[#12151c] ring-1 ring-emerald-500/30'
                    : 'border-white/[0.08] bg-[#0c0d11] hover:border-white/25 hover:bg-[#101217]'
                }`}
              >
                {/* Background Image Preview */}
                <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden border border-white/[0.06] bg-black">
                  <img
                    src={slide.src}
                    alt={slide.title}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
                      slide.contain ? 'bg-[#e9e5dc] object-contain p-2' : 'object-cover'
                    }`}
                  />
                  {isActive && (
                    <div className="absolute top-2 right-2 border border-emerald-400/80 bg-black/90 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
                      Active
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div>
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">
                      {String(index + 1).padStart(2, '0')} · {slide.category}
                    </span>
                    <IconComponent className="h-3.5 w-3.5 text-stone-400 group-hover:text-white" />
                  </div>
                  <h4 className="mt-1 font-serif text-xl font-light text-[#f4efe8] group-hover:text-white">
                    {slide.title}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-400">
                    {slide.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* High-Impact Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            data-testid="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} - ${activeSlide.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Lightbox Top Header */}
            <div
              className="flex items-center justify-between border-b border-white/10 px-6 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
                  {project.code}
                </span>
                <span className="text-stone-600">/</span>
                <span className="font-serif text-xl font-light text-white">
                  {project.title}
                </span>
                <span className="hidden font-mono text-[9px] uppercase tracking-widest text-emerald-400 sm:inline">
                  [{activeSlide.category}]
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setContainOverride((prev) => !Boolean(prev ?? activeSlide.contain))}
                  className="flex items-center gap-1.5 border border-white/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-stone-300 hover:border-white hover:text-white"
                >
                  {isContain ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  <span>{isContain ? 'Fit: Cover' : 'Fit: Contain'}</span>
                </button>

                <button
                  type="button"
                  data-testid="lightbox-close-btn"
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Close Lightbox"
                  className="flex h-9 w-9 items-center justify-center border border-white/20 text-stone-300 transition-colors hover:border-white hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Stage */}
            <div
              className="relative flex flex-1 items-center justify-center p-4 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev / Next Floating Arrows */}
              <button
                type="button"
                onClick={handlePrev}
                data-testid="lightbox-prev-btn"
                aria-label="Previous study"
                className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center border border-white/20 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-white hover:bg-black"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                data-testid="lightbox-next-btn"
                aria-label="Next study"
                className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center border border-white/20 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-white hover:bg-black"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <motion.div
                key={activeSlide.id}
                initial={shouldReduceMotion ? {} : { scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={shouldReduceMotion ? {} : { scale: 0.96, opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="flex max-h-[82vh] max-w-[90vw] items-center justify-center"
              >
                <img
                  src={activeSlide.src}
                  alt={activeSlide.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`max-h-[80vh] max-w-[88vw] shadow-2xl ${
                    isContain ? 'bg-[#e9e5dc] object-contain p-2 sm:p-4' : 'object-contain'
                  }`}
                />
              </motion.div>
            </div>

            {/* Lightbox Footer Bar */}
            <div
              className="flex flex-wrap items-center justify-between border-t border-white/10 bg-[#0d0e12] px-6 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-emerald-400">
                  {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {activeSlide.tagline}
                </span>
                <p className="mt-0.5 font-serif text-lg text-white">
                  {activeSlide.title}
                </p>
              </div>
              <p className="max-w-xl text-xs text-stone-400">
                {activeSlide.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

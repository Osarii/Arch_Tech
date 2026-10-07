import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { getPublicProjects, type PortalProject } from '../../portal/data';
import { preferredProjectImages, ProjectImage } from './projectMedia';
import { getLocalizedProject } from '../../portal/showcaseLocalization';

export const FEATURED_CAROUSEL_AUTOPLAY_MS = 3200;

interface FeaturedProjectCarouselProps {
  onOpenProject: (id: string) => void;
}

const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);

  return reducedMotion;
};

const FeaturedProjectSlide: React.FC<{ project: PortalProject; index: number; total: number; active: boolean; onOpenProject: (id: string) => void }> = ({ project, index, total, active, onOpenProject }) => {
  const { t } = useTranslation('common');
  const localized = getLocalizedProject(project);
  return (
    <article
      data-testid={`featured-slide-${project.id}`}
      data-active={active ? 'true' : 'false'}
      aria-roledescription={t('carousel.slideRole', 'slide')}
      aria-label={t('carousel.slideLabel', '{{current}} of {{total}}: {{title}}', { current: index + 1, total, title: project.title })}
      aria-hidden={!active}
      className={`featured-project-slide ${active ? 'featured-project-slide-active' : 'featured-project-slide-inactive'}`}
    >
      <div className="featured-project-media-shell">
        <button
          type="button"
          data-testid={`featured-project-${project.id}`}
          aria-label={t('carousel.openDossier', 'Open {{title}} project dossier', { title: project.title })}
          tabIndex={active ? 0 : -1}
          disabled={!active}
          onClick={() => onOpenProject(project.id)}
          className="group relative block h-full w-full overflow-hidden border border-white/[0.12] bg-[#111216] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
        >
          <ProjectImage project={project} alt={t('carousel.imageContext', '{{title}} development context', { title: project.title })} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} className="featured-project-slide-image absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02]" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0b0d]/95 via-[#0a0b0d]/15 to-[#0a0b0d]/10" aria-hidden="true" />
          <span className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70 sm:p-7">
            <span>{project.code}</span>
            <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          </span>
          <span className="featured-project-slide-content pointer-events-none absolute inset-x-0 bottom-0 grid min-h-[9.5rem] gap-4 p-5 text-white sm:min-h-[12rem] sm:gap-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
            <span>
              <span className="featured-project-title block max-w-3xl font-serif font-light leading-[0.98]">{project.title}</span>
              <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.16em] text-stone-300 sm:mt-4">{localized.category}</span>
              <span className="featured-project-statement mt-3 block max-w-2xl font-serif font-light leading-snug text-stone-200 sm:mt-5">{localized.statement}</span>
            </span>
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-stone-300 transition-colors group-hover:text-white group-focus-visible:text-white">
              {t('carousel.viewDossier', 'View dossier')} <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>
      </div>
    </article>
  );
};

export const FeaturedProjectCarousel: React.FC<FeaturedProjectCarouselProps> = ({ onOpenProject }) => {
  const { t } = useTranslation('common');
  const [projects] = useState<PortalProject[]>(() => getPublicProjects().filter((project) => Boolean(preferredProjectImages[project.id])));
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const hasProjects = projects.length > 0;
  const activeProject = projects[activeIndex];
  const nextIndex = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => hasProjects ? (current + direction + projects.length) % projects.length : 0);
  }, [hasProjects, projects.length]);

  useEffect(() => {
    if (reducedMotion || paused || projects.length < 2) return;
    const interval = window.setInterval(() => nextIndex(1), FEATURED_CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, [nextIndex, paused, projects.length, reducedMotion]);

  const setSlide = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, projects.length - 1)));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setSlide(projects.length - 1);
    }
  };

  const progressMarkers = useMemo(() => projects.map((project, index) => ({ project, index })), [projects]);

  if (!activeProject) {
    return (
      <div data-testid="hero-gallery" className="landing-image-fallback min-h-[30rem]" role="img" aria-label={t('carousel.fallbackAria', 'Featured project imagery unavailable')}>
        {/* i18next-instrument-ignore */}
        <span>GARNIER ARCHITECTURE / DEVELOPMENT PORTFOLIO</span>
      </div>
    );
  }

  return (
    <section
      data-testid="hero-gallery"
      aria-label={t('carousel.ariaLabel', 'Featured development carousel')}
      aria-roledescription={t('carousel.roleDescription', 'carousel')}
      tabIndex={0}
      data-autoplay={reducedMotion ? 'disabled' : 'enabled'}
      data-autoplay-ms={FEATURED_CAROUSEL_AUTOPLAY_MS}
      data-paused={paused ? 'true' : 'false'}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      className="featured-project-carousel outline-none focus-visible:ring-1 focus-visible:ring-white/60"
    >
      <div className="featured-project-stage" aria-live="polite">
        {projects.map((project, index) => <FeaturedProjectSlide key={project.id} project={project} index={index} total={projects.length} active={index === activeIndex} onOpenProject={onOpenProject} />)}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.12] pt-4">
        <div className="flex items-center gap-2" aria-label={t('carousel.chooseProject', 'Choose featured project')}>
          {progressMarkers.map(({ project, index }) => (
            <button
              key={project.id}
              type="button"
              data-testid={`featured-indicator-${project.id}`}
              aria-label={t('carousel.showProject', 'Show {{title}}', { title: project.title })}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => setSlide(index)}
              className={`h-1.5 transition-all duration-300 ${index === activeIndex ? 'w-10 bg-[#f4efe8]' : 'w-5 bg-white/25 hover:bg-white/60'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{activeProject.category}</span>
          <button type="button" data-testid="featured-carousel-prev" onClick={() => nextIndex(-1)} aria-label={t('carousel.prevProject', 'Previous featured project')} className="flex h-9 w-9 items-center justify-center border border-white/[0.15] text-stone-300 transition-colors hover:border-white/50 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" data-testid="featured-carousel-next" onClick={() => nextIndex(1)} aria-label={t('carousel.nextProject', 'Next featured project')} className="flex h-9 w-9 items-center justify-center border border-white/[0.15] text-stone-300 transition-colors hover:border-white/50 hover:text-white"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
};

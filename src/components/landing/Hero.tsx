import React from 'react';
import { ArrowDownRight, Play } from 'lucide-react';
import { FeaturedProjectCarousel } from '../gallery/FeaturedProjectCarousel';
import { Reveal } from '../motion/Reveal';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useLocale } from '../../portal/locale';

interface HeroProps {
  onViewProjects: () => void;
  onOpenProject: (id: string) => void;
  onStartPresentation?: () => void;
  onStartDemoTour?: () => void;
}

const demoTourLabel = 'INICIAR RECORRIDO';

export const Hero: React.FC<HeroProps> = ({ onViewProjects, onOpenProject, onStartPresentation, onStartDemoTour }) => {
  const { landing } = useLocale();
  const t = landing.hero;
  const handleStart = onStartDemoTour ?? onStartPresentation;

  return (
    <section id="hero" className="landing-hero relative overflow-hidden border-b border-white/[0.08] px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
      <div className="landing-hero-mark pointer-events-none absolute right-[-2rem] top-24 hidden sm:block" aria-hidden="true">
        <ArchTechLogo variant="mark" tone="celadon" theme="dark" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="landing-hero-grid grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <Reveal variant="fade-up" delay={40}>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-stone-500">{t.eyebrow}</p>
            </Reveal>
            <Reveal variant="fade-up" delay={120}>
              <h1 className="landing-hero-heading mt-7 max-w-5xl font-serif font-light leading-[0.88] tracking-[-0.045em] text-[#EDF4ED]">
                {t.headingLine1}<br /><span className="landing-hero-title-line">{t.headingLine2}</span>
              </h1>
            </Reveal>
          </div>
          <div className="landing-hero-support border-l border-white/15 pl-6 lg:mb-3">
            <Reveal variant="fade-up" delay={200}>
              <p className="max-w-sm text-base leading-7 text-stone-300">{t.body}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  data-testid="hero-view-projects"
                  onClick={onViewProjects}
                  className="arch-interactive-button group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-300 transition-colors hover:text-white"
                >
                  {t.explorePortfolio}
                  <ArrowDownRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                </button>
                {handleStart && (
                  <button
                    type="button"
                    data-testid="hero-demo-tour-start"
                    onClick={handleStart}
                    className="group inline-flex items-center gap-2 rounded-full border border-[#79B791]/50 bg-[#79B791]/10 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#79B791] transition-all hover:bg-[#79B791] hover:text-black shadow-xs"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{demoTourLabel}</span>
                  </button>
                )}
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal variant="fade" delay={280}>
          <div className="landing-hero-context mt-16 grid gap-6 border-y border-white/[0.08] py-5 lg:grid-cols-[0.6fr_1.4fr] lg:items-center">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
              <span className="text-stone-200">{t.showcaseContext}</span>
              <span className="h-px w-8 bg-white/20" aria-hidden="true" />
              <span>{t.opportunityToOperation}</span>
            </div>
            <div className="landing-hero-sectors flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 lg:justify-end">
              {t.sectors.map((sector) => <span key={sector}>{sector}</span>)}
            </div>
          </div>
        </Reveal>

        <div className="landing-hero-carousel mt-5">
          <Reveal variant="fade-up" delay={340}>
            <FeaturedProjectCarousel onOpenProject={onOpenProject} />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

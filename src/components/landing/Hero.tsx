import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { FeaturedProjectCarousel } from '../gallery/FeaturedProjectCarousel';

interface HeroProps {
  onViewProjects: () => void;
  onOpenProject: (id: string) => void;
}

const sectors = ['Free zones', 'Industrial / logistics', 'Compute + energy infrastructure', 'Corporate districts', 'Healthcare campuses', 'Masterplans'];

export const Hero: React.FC<HeroProps> = ({ onViewProjects, onOpenProject }) => (
  <section id="hero" className="landing-hero border-b border-white/[0.08] px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
    <div className="mx-auto max-w-7xl">
      <div className="landing-hero-grid grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-stone-500">ARCH_TECH / Garnier Portfolio Concept</p>
          <h1 className="landing-hero-heading mt-7 max-w-5xl font-serif font-light leading-[0.88] tracking-[-0.045em] text-[#f4efe8]">
            Development<br /><span className="landing-hero-title-line">at a larger scale.</span>
          </h1>
        </div>
        <div className="landing-hero-support border-l border-white/15 pl-6 lg:mb-3">
          <p className="max-w-sm text-base leading-7 text-stone-300">ARCH_TECH positions and advances free zones, campuses, districts and infrastructure — from first opportunity through delivery and operation.</p>
          <button
            data-testid="hero-view-projects"
            onClick={onViewProjects}
            className="group mt-7 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-300 transition-colors hover:text-white"
          >
            Explore the portfolio
            <ArrowDownRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>

      <div className="landing-hero-context mt-16 grid gap-6 border-y border-white/[0.08] py-5 lg:grid-cols-[0.6fr_1.4fr] lg:items-center">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
          <span className="text-stone-200">Official project showcase</span>
          <span className="h-px w-8 bg-white/20" aria-hidden="true" />
          <span>Opportunity to operation</span>
        </div>
        <div className="landing-hero-sectors flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 lg:justify-end">
          {sectors.map((sector) => <span key={sector}>{sector}</span>)}
        </div>
      </div>

      <div className="landing-hero-carousel mt-5">
        <FeaturedProjectCarousel onOpenProject={onOpenProject} />
      </div>
    </div>
  </section>
);

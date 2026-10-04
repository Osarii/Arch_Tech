import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface HeroProps {
  onViewProjects: () => void;
}

const heroProjects = [
  {
    image: '/projects/pacific-nexus-free-zone/aerial-overview.webp',
    title: 'Pacific Nexus Free Zone Campus',
    label: 'Free zone / Central Pacific',
    scale: 'Regional employment campus',
    index: '01',
    className: 'md:row-span-2',
  },
  {
    image: '/projects/summit-point-corporate-district/campus-overview.webp',
    title: 'Summit Point Corporate District',
    label: 'Corporate / Greater San José',
    scale: 'Corporate district',
    index: '02',
    className: '',
  },
  {
    image: '/projects/mar-vista-hospitality-district/aerial-overview.webp',
    title: 'Mar Vista Hospitality District',
    label: 'Hospitality / Pacific Coast',
    scale: 'Hospitality district',
    index: '03',
    className: '',
  },
];

const sectors = ['Free zones', 'Industrial / logistics', 'Compute + energy infrastructure', 'Corporate districts', 'Healthcare campuses', 'Masterplans'];

export const Hero: React.FC<HeroProps> = ({ onViewProjects }) => (
  <section id="hero" className="border-b border-white/[0.08] px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-stone-500">Costa Rica / Real-estate development platform</p>
          <h1 className="mt-7 max-w-5xl font-serif text-7xl font-light leading-[0.88] tracking-[-0.045em] text-[#f4efe8] sm:text-8xl lg:text-[8.5rem]">
            Development<br />at a larger scale.
          </h1>
        </div>
        <div className="border-l border-white/15 pl-6 lg:mb-3">
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

      <div className="mt-16 grid gap-6 border-y border-white/[0.08] py-5 lg:grid-cols-[0.6fr_1.4fr] lg:items-center">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
          <span className="text-stone-200">Portfolio / 2026</span>
          <span className="h-px w-8 bg-white/20" aria-hidden="true" />
          <span>Opportunity to operation</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 lg:justify-end">
          {sectors.map((sector) => <span key={sector}>{sector}</span>)}
        </div>
      </div>

      <div data-testid="hero-gallery" className="mt-5 grid gap-px bg-white/[0.08] md:h-[78vh] md:min-h-[600px] md:grid-cols-[1.9fr_1fr] md:grid-rows-2">
        {heroProjects.map((project, index) => {
          const principal = index === 0;
          return (
            <figure key={project.title} className={`group relative min-h-[300px] overflow-hidden bg-[#111216] ${project.className}`}>
              <img
                src={project.image}
                alt={project.title}
                loading={principal ? 'eager' : 'lazy'}
                fetchPriority={principal ? 'high' : 'low'}
                decoding="async"
                className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] ${principal ? '' : 'brightness-[0.82]'}`}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${principal ? 'from-black/80 via-black/5 to-black/25' : 'from-black/80 via-black/10 to-black/25'}`} />
              <div className="absolute inset-x-0 top-0 flex items-center gap-3 p-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70 sm:p-5">
                <span>{project.index}</span>
                <span className="h-px w-8 bg-white/40" aria-hidden="true" />
                <span>{principal ? 'Principal development' : 'Portfolio'}</span>
              </div>
              <figcaption className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 text-white/90 ${principal ? 'p-6 sm:p-8' : 'p-5'}`}>
                <span>
                  <span className={`block font-serif font-light leading-tight ${principal ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'}`}>{project.title}</span>
                  <span className="mt-3 block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-300">{project.label}</span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-400">{project.scale}</span>
                </span>
                <ArrowUpRight className="mb-1 h-4 w-4 shrink-0 text-stone-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  </section>
);

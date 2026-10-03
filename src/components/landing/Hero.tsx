import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface HeroProps {
  onViewProjects: () => void;
}

const heroProjects = [
  { image: '/projects/pacific-nexus-free-zone/aerial-overview.png', title: 'Pacific Nexus Free Zone Campus', label: 'Free zone / Central Pacific', className: 'md:col-span-2 md:row-span-2' },
  { image: '/projects/summit-point-corporate-district/campus-overview.jpg', title: 'Summit Point Corporate District', label: 'Corporate / Central Valley', className: '' },
  { image: '/projects/mar-vista-hospitality-district/aerial-overview.jpg', title: 'Mar Vista Hospitality District', label: 'Hospitality / Pacific Coast', className: '' },
];

const sectors = ['Free zones', 'Industrial / logistics', 'Corporate campuses', 'Mixed-use districts', 'Hospitality destinations', 'Masterplans'];

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
          <p className="max-w-sm text-base leading-7 text-stone-300">ARCH_TECH shapes the places that support work, movement, hospitality and everyday life — from first opportunity through delivery and operation.</p>
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

      <div className="mt-16 grid gap-10 border-y border-white/[0.08] py-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
          <span className="text-stone-200">Portfolio / 2026</span>
          <span className="text-stone-700">·</span>
          <span>Opportunity to operation</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 lg:justify-end">
          {sectors.map((sector) => <span key={sector}>{sector}</span>)}
        </div>
      </div>

      <div data-testid="hero-gallery" className="mt-5 grid gap-3 md:h-[72vh] md:min-h-[580px] md:grid-cols-3 md:grid-rows-2">
        {heroProjects.map((project, index) => (
          <figure key={project.title} className={`group relative min-h-[300px] overflow-hidden bg-[#111216] ${project.className}`}>
            <img
              src={project.image}
              alt={project.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 text-white/85">
              <span><span className="block font-serif text-2xl font-light sm:text-3xl">{project.title}</span><span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-300">{project.label}</span></span>
              <ArrowUpRight className="mb-1 h-4 w-4 shrink-0 text-stone-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

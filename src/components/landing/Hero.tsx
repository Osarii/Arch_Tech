import React from 'react';
import { ArrowDownRight } from 'lucide-react';

interface HeroProps {
  onViewProjects: () => void;
}

const gallery = [
  { image: '/arch_hero.jpg', title: 'Lake House', className: 'md:col-span-2 md:row-span-2' },
  { image: '/arch_openhouse.jpg', title: 'Woodland House', className: '' },
  { image: '/arch_cantilever.jpg', title: 'Cantilever Residence', className: '' },
];

export const Hero: React.FC<HeroProps> = ({ onViewProjects }) => (
  <section id="hero" className="border-b border-white/[0.08] px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-stone-500">Costa Rica / Development portfolio</p>
          <h1 className="mt-7 max-w-5xl font-serif text-7xl font-light leading-[0.88] tracking-[-0.045em] text-[#f4efe8] sm:text-8xl lg:text-[8.5rem]">
            Architecture,<br />with a longer view.
          </h1>
        </div>
        <div className="border-l border-white/15 pl-6 lg:mb-3">
          <p className="max-w-sm text-base leading-7 text-stone-300">A portfolio of places in formation, carried from land and possibility through design, decisions and delivery.</p>
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

      <div data-testid="hero-gallery" className="mt-16 grid gap-3 md:h-[72vh] md:min-h-[580px] md:grid-cols-3 md:grid-rows-2">
        {gallery.map((item, index) => (
          <figure key={item.title} className={`group relative min-h-[360px] overflow-hidden bg-[#111216] ${item.className}`}>
            <img
              src={item.image}
              alt={item.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
              <span>{String(index + 1).padStart(2, '0')} / {item.title}</span>
              <span>Selected project</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

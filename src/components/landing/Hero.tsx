import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenWorkspace: () => void;
}

const sequence = [
  {
    index: '01',
    title: 'ARCHITECTURAL STUDY',
    image: '/arch_hero.jpg',
    alt: 'Monolithic concrete pavilion beside a mountain lake',
    detail: 'Spatial composition / concrete, glass and terrain',
    position: 'center',
  },
  {
    index: '02',
    title: 'OPENBIM MODEL',
    image: '/arch_openhouse.jpg',
    alt: 'Open house architectural model in a wooded setting',
    detail: 'IfcOpenHouse / OpenBIM sample reference',
    position: 'center',
  },
  {
    index: '03',
    title: 'ARCH_TECH WORKSPACE',
    image: '/arch_cantilever.jpg',
    alt: 'Concrete cantilever building study',
    detail: 'Browser workflow / inspect, modify, export',
    position: 'center',
  },
];

export const Hero: React.FC<HeroProps> = ({ onOpenWorkspace }) => {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const section = sequenceRef.current;
      if (!section || window.innerWidth < 768) return;

      const { top, height } = section.getBoundingClientRect();
      const scrollRange = Math.max(1, height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -top / scrollRange));
      const nextIndex = Math.min(sequence.length - 1, Math.floor(progress * sequence.length));

      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleMobileScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const firstPanel = event.currentTarget.firstElementChild as HTMLElement | null;
    if (!firstPanel) return;

    const nextIndex = Math.min(
      sequence.length - 1,
      Math.max(0, Math.round(event.currentTarget.scrollLeft / (firstPanel.offsetWidth + 12))),
    );
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  };

  const selectPanel = (index: number) => {
    setActiveIndex(index);
  };

  const movePanel = (direction: -1 | 1) => {
    selectPanel((activeIndex + direction + sequence.length) % sequence.length);
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 px-6 sm:px-8 lg:px-12 border-b border-white/[0.08] overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 243, 239, 0.25) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-28 left-8 text-stone-600 font-mono text-[10px] select-none tracking-widest">[ DATUM: + 00.00m ]</div>
        <div className="absolute top-28 right-8 text-stone-600 font-mono text-[10px] select-none tracking-widest">[ SCHEMA: IFC4 / ISO 16739 ]</div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Architectural Editorial Header */}
        <div className="space-y-6 max-w-5xl mb-12">
          <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em]">
            OPENBIM // ARCHITECTURAL COMPUTING
          </div>

          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-light tracking-[-0.04em] text-[#f4efe8] leading-[0.95] font-sans">
            ARCH_TECH
          </h1>

          <p className="text-2xl sm:text-3xl lg:text-4xl text-[#d4cebe] font-serif font-light leading-snug tracking-tight max-w-3xl">
            Design, inspect and modify IFC models in the browser.
          </p>

          <p className="text-sm sm:text-base text-stone-400 font-sans tracking-wide max-w-xl">
            OpenBIM tools for architectural workflows.
          </p>

          <div className="pt-4">
            <button
              onClick={onOpenWorkspace}
              data-testid="hero-btn-open-workspace"
              className="group inline-flex items-center space-x-3 px-8 py-4 bg-[#f4efe8] hover:bg-white text-[#0a0b0d] text-xs font-mono uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.99] shadow-2xl"
            >
              <span>ENTER WORKSPACE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>

        <div ref={sequenceRef} data-testid="hero-sequence" className="relative mt-12 md:min-h-[230vh]">
          <div className="md:sticky md:top-0 md:flex md:h-screen md:max-h-[780px] md:min-h-[640px] md:items-center">
            <div className="w-full">
              <div
                className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:h-[70vh] md:gap-2 md:overflow-visible md:pb-0"
                onScroll={handleMobileScroll}
              >
                {sequence.map((panel, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={panel.index}
                      type="button"
                      data-testid={`hero-sequence-panel-${index}`}
                      aria-label={`Show ${panel.index} / ${panel.title}`}
                      onMouseEnter={() => selectPanel(index)}
                      onFocus={() => selectPanel(index)}
                      onClick={() => selectPanel(index)}
                      className={`group relative h-[68svh] min-h-[460px] min-w-[82vw] snap-center overflow-hidden border border-white/[0.12] bg-[#0c0d11] text-left md:h-full md:min-h-0 md:min-w-0 md:basis-0 md:transition-[flex] md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'md:flex-[4]' : 'md:flex-1'}`}
                    >
                      <img
                        src={panel.image}
                        alt={panel.alt}
                        className={`absolute inset-0 h-full w-full object-cover grayscale-[12%] contrast-[1.05] transition-transform duration-1000 ease-out ${isActive ? 'scale-[1.04]' : 'scale-[1.01]'}`}
                        style={{ objectPosition: panel.position }}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-[#060709]/10 to-[#060709]/20" />
                      <div
                        className="absolute inset-0 bg-[#08090b]/65 transition-[clip-path] duration-700 ease-out"
                        style={{ clipPath: isActive ? 'inset(100% 0 0 0)' : 'inset(0 0 0 0)' }}
                      />
                      <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-6 transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80 md:opacity-0'}`}>
                        <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-stone-300">
                          {panel.index} / {panel.title}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                          {panel.detail}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-6 border-t border-white/[0.12] pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
                <span data-testid="hero-sequence-counter" className="shrink-0 text-stone-300">
                  {sequence[activeIndex].index} / 03
                </span>
                <div className="flex flex-1 items-center gap-1.5" aria-label="Architectural sequence progress">
                  {sequence.map((panel, index) => (
                    <button
                      key={panel.index}
                      type="button"
                      aria-label={`Go to ${panel.index} / ${panel.title}`}
                      onClick={() => selectPanel(index)}
                      className={`h-px flex-1 transition-colors duration-500 ${activeIndex === index ? 'bg-stone-200' : 'bg-white/20 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous sequence panel"
                    onClick={() => movePanel(-1)}
                    className="p-2 text-stone-500 transition-colors hover:text-stone-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next sequence panel"
                    onClick={() => movePanel(1)}
                    className="p-2 text-stone-500 transition-colors hover:text-stone-100"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

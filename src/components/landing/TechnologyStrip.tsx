import React from 'react';

export const TechnologyStrip: React.FC = () => {
  return (
    <section id="technology" className="py-16 px-6 sm:px-8 lg:px-12 bg-[#08090b] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-stone-500 font-mono text-[11px] uppercase tracking-[0.25em]">
          CORE TECHNOLOGY STACK
        </div>

        <div className="text-sm sm:text-base font-mono tracking-[0.2em] uppercase text-stone-300 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="text-stone-200">IFC4</span>
          <span className="text-stone-600">·</span>
          <span className="text-stone-200">web-ifc</span>
          <span className="text-stone-600">·</span>
          <span className="text-stone-200">That Open</span>
          <span className="text-stone-600">·</span>
          <span className="text-stone-200">Three.js</span>
        </div>

        <div className="text-stone-400 font-mono text-[11px] uppercase tracking-wider text-center md:text-right">
          CLIENT-SIDE RUNTIME // ISO 16739
        </div>
      </div>
    </section>
  );
};

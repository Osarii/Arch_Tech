import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ProjectShowcaseProps {
  onOpenWorkspace: () => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ onOpenWorkspace }) => {
  const models = [
    {
      id: 'openhouse',
      code: 'MODEL 01',
      title: 'IfcOpenHouse',
      typology: 'OpenBIM Sample Model',
      standard: 'IFC4 / ISO 16739',
      specs: '111 KB · 1 Storey · 13 physical elements',
      image: '/arch_openhouse.jpg',
      renderType: 'Concept',
    },
    {
      id: 'generated',
      code: 'MODEL 02',
      title: 'Arch_Tech Generated Building',
      typology: 'Parametric Multi-Storey Model',
      standard: 'IFC4 / ISO 16739',
      specs: 'Authored via Generation Service',
      image: '/arch_cantilever.jpg',
      renderType: 'Concept',
    },
  ];

  return (
    <section id="models" className="py-28 px-6 sm:px-8 lg:px-12 bg-[#0b0c10] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08] mb-16">
          <div>
            <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em] mb-3">
              04 // SELECTED MODELS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#f4efe8] font-sans">
              Curated model library.
            </h2>
          </div>
          <button
            onClick={onOpenWorkspace}
            className="group inline-flex items-center space-x-2 text-stone-400 hover:text-stone-100 font-mono text-xs uppercase tracking-[0.18em] transition-colors"
          >
            <span>LAUNCH VIEWER</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Large Image-Based Architectural Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {models.map((item) => (
            <div
              key={item.id}
              onClick={onOpenWorkspace}
              className="cursor-pointer group border border-white/[0.08] bg-[#0c0d12] overflow-hidden"
            >
              {/* Large Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] grayscale-[10%]"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#0a0b0d]/90 border border-white/10 font-mono text-[10px] text-stone-300 uppercase tracking-widest">
                    {item.code}
                  </span>
                  <span className="px-2.5 py-1 bg-[#0a0b0d]/90 border border-white/10 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                    {item.renderType}
                  </span>
                </div>
                {/* Subtle Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-[#f4efe8] text-[#0a0b0d] font-mono text-xs uppercase tracking-[0.18em]">
                    LOAD MODEL →
                  </span>
                </div>
              </div>

              {/* Minimal Metadata */}
              <div className="p-6 space-y-4 border-t border-white/[0.08] bg-[#0d0e13]">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-light text-[#f4efe8] font-serif group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-xs font-mono text-stone-400">
                    {item.typology}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono text-stone-400">
                  <span>{item.standard}</span>
                  <span>{item.specs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

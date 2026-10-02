import React from 'react';

export const Workflow: React.FC = () => {
  const steps = [
    {
      number: '01',
      phase: 'IMPORT',
      subtitle: 'Client WASM Ingestion',
      description: 'Stream local .ifc file into web-ifc WebAssembly memory. Zero cloud transmission.',
    },
    {
      number: '02',
      phase: 'INSPECT',
      subtitle: 'Spatial Coordination',
      description: 'Traverse project hierarchy, query entity properties, and slice orthographic 2D floor plans.',
    },
    {
      number: '03',
      phase: 'EDIT',
      subtitle: 'Non-Destructive Edits',
      description: 'Apply 3D translations, relative rotations, or parametric storey generation to a transactional proxy layer.',
    },
    {
      number: '04',
      phase: 'EXPORT',
      subtitle: 'STEP-21 Persistence',
      description: 'Execute detached semantic verification before exporting pure ISO 10303-21 IFC files.',
    },
  ];

  return (
    <section id="workflow" className="py-28 px-6 sm:px-8 lg:px-12 bg-[#090a0d] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08] mb-16">
          <div>
            <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em] mb-3">
              03 // WORKFLOW
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#f4efe8] font-sans">
              The engineering pipeline.
            </h2>
          </div>
          <div className="text-stone-400 font-mono text-xs uppercase tracking-widest">
            FOUR-STAGE DETERMINISTIC LIFECYCLE
          </div>
        </div>

        {/* Horizontal Architectural Diagram (Not cards) */}
        <div className="relative pt-8">
          {/* Continuous Architectural Datum Rule */}
          <div className="hidden lg:block absolute top-[52px] left-0 right-0 h-[1px] bg-white/[0.12]" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={step.number} className="space-y-6 group">
                {/* Architectural Node on Datum */}
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border border-white/20 bg-[#090a0d] flex items-center justify-center font-mono text-[10px] text-stone-300 group-hover:border-white transition-colors">
                    {idx + 1}
                  </div>
                  <span className="font-mono text-xs text-stone-400 tracking-widest uppercase">
                    PHASE {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2 border-l border-white/[0.08] lg:border-l-0 pl-4 lg:pl-0">
                  <h3 className="text-2xl font-light text-[#f4efe8] font-serif group-hover:text-white transition-colors">
                    {step.phase}
                  </h3>
                  <div className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                    {step.subtitle}
                  </div>
                  <p className="text-sm text-stone-400 leading-relaxed font-sans pt-2">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

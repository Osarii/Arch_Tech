import React from 'react';
import { useTranslation } from 'react-i18next';

export const Capabilities: React.FC = () => {
  const { t } = useTranslation('landing');
  const capabilities = [
    {
      index: '01',
      title: t('capabilitiesSection.items.inspect.title', 'Inspect IFC'),
      lead: t('capabilitiesSection.items.inspect.lead', 'Client-side spatial parsing and property extraction.'),
      description: t(
        'capabilitiesSection.items.inspect.description',
        'Load and parse ISO 16739 IFC4 and IFC2x3 files directly in browser memory via native WebAssembly. Traverse full spatial containment trees, query property sets, and generate orthographic 2D floor plans at storey elevations without cloud dependencies.'
      ),
      specs: [
        t('capabilitiesSection.items.inspect.specs.0', 'IFC4 & IFC2x3 Ingestion'),
        t('capabilitiesSection.items.inspect.specs.1', 'Storey-by-Storey 2D Slicing'),
        t('capabilitiesSection.items.inspect.specs.2', 'Full Attribute & Pset Inspector'),
      ],
    },
    {
      index: '02',
      title: t('capabilitiesSection.items.modify.title', 'Modify models'),
      lead: t('capabilitiesSection.items.modify.lead', 'Non-destructive proxy transforms and transactional audit logs.'),
      description: t(
        'capabilitiesSection.items.modify.description',
        'Execute 3D coordinate translations, relative vector rotations, and element deletions. Every modification is isolated in a non-destructive proxy layer and logged chronologically in an immutable JSON ChangeSet with full undo and redo capability.'
      ),
      specs: [
        t('capabilitiesSection.items.modify.specs.0', 'Transactional Proxy Layer'),
        t('capabilitiesSection.items.modify.specs.1', 'Relative Coordinate Deltas'),
        t('capabilitiesSection.items.modify.specs.2', 'JSON ChangeSet History'),
      ],
    },
    {
      index: '03',
      title: t('capabilitiesSection.items.generate.title', 'Generate & export'),
      lead: t('capabilitiesSection.items.generate.lead', 'Parametric building synthesis and detached ISO 10303-21 persistence.'),
      description: t(
        'capabilitiesSection.items.generate.description',
        'Synthesize multi-storey structural frames from parametric parameters with strict spatial hierarchy rules. A secondary grounded assistant handles spatial queries and storey synthesis before detached round-trip semantic validation ensures clean, verified IFC export.'
      ),
      specs: [
        t('capabilitiesSection.items.generate.specs.0', 'Deterministic IFC4 Authoring'),
        t('capabilitiesSection.items.generate.specs.1', 'Secondary Grounded Assistant'),
        t('capabilitiesSection.items.generate.specs.2', 'Idempotent STEP-21 Export'),
      ],
    },
  ];

  return (
    <section id="capabilities" className="py-28 px-6 sm:px-8 lg:px-12 bg-[#0b0c10] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08] mb-16">
          <div>
            <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em] mb-3">
              {t('capabilitiesSection.eyebrow', '02 // CAPABILITIES')}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#f4efe8] font-sans">
              {t('capabilitiesSection.heading', 'Architectural capabilities.')}
            </h2>
          </div>
          <div className="text-stone-400 font-mono text-xs uppercase tracking-widest">
            {t('capabilitiesSection.subtitle', 'THREE CORE OPENBIM MODULES')}
          </div>
        </div>

        {/* 3 Large Editorial Rows */}
        <div className="divide-y divide-white/[0.08]">
          {capabilities.map((item) => (
            <div
              key={item.index}
              className="py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start group transition-colors duration-300 hover:bg-white/[0.01]"
            >
              {/* Row Index */}
              <div className="lg:col-span-2">
                <span className="font-mono text-xs text-stone-500 uppercase tracking-widest">
                  {t('capabilitiesSection.module', 'MODULE {{index}}', { index: item.index })}
                </span>
              </div>

              {/* Title & Lead */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-3xl sm:text-4xl font-light text-[#f4efe8] tracking-tight font-serif group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm font-mono text-stone-400 uppercase tracking-wider">
                  {item.lead}
                </p>
              </div>

              {/* Detailed Description & Spec Points */}
              <div className="lg:col-span-5 space-y-6">
                <p className="text-sm sm:text-base text-stone-300 font-sans leading-relaxed">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.specs.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 text-[11px] font-mono text-stone-400 border border-white/[0.08] bg-white/[0.02]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

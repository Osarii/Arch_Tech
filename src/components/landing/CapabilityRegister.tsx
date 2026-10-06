import React from 'react';
import { Reveal } from '../motion/Reveal';
import { useLocale } from '../../portal/locale';

export const CapabilityRegister: React.FC = () => {
  const { landing } = useLocale();
  const t = landing.capabilities;

  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="border-b border-black/15 bg-[#EDF4ED] px-6 py-20 text-[#000000] sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal variant="fade-up">
          <div className="grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">{t.eyebrow}</p>
              <h2 id="capabilities-title" className="mt-5 max-w-4xl font-serif text-5xl font-light tracking-tight sm:text-7xl">
                {t.heading}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-600">{t.description}</p>
          </div>
        </Reveal>

        <div className="grid border-b border-black/15 sm:grid-cols-2">
          {t.items.map((capability) => (
            <article key={capability.number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-black/15 py-6 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:pr-8 sm:odd:border-r sm:odd:pr-8 sm:even:pl-8 lg:grid-cols-[4rem_1fr] lg:py-8">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500">{capability.number}</p>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#000000]">{capability.label}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">{capability.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

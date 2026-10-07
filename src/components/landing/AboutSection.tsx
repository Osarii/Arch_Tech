import React from 'react';
import { Reveal } from '../motion/Reveal';
import { MetricCounter } from '../motion/MetricCounter';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useLocale } from '../../portal/locale';

export const aboutFacts = [
  { value: '30 YEARS', label: 'Real-estate development experience' },
  { value: 'COSTA RICA', label: 'Primary market' },
  { value: 'INTEGRATED', label: 'Development approach' },
  { value: 'DESIGN → DELIVERY', label: 'End-to-end project perspective' },
] as const;

export const AboutSection: React.FC = () => {
  const { landing } = useLocale();
  const t = landing.about;

  return (
    <section id="about" aria-labelledby="about-title" className="landing-about border-b border-black/15 bg-[#EDF4ED] px-6 py-20 text-[#000000] sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="landing-about-grid grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-16">
          <div>
            <Reveal variant="fade-up">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">{t.eyebrow}</p>
              <h2 id="about-title" className="landing-about-heading mt-5 max-w-3xl font-serif font-light leading-[0.96] tracking-tight">{t.heading}</h2>
              <p className="mt-8 max-w-2xl border-l border-black/20 pl-5 text-base leading-7 text-stone-700 sm:text-lg">
                {t.body1}
              </p>
              <p className="mt-6 max-w-2xl text-sm leading-6 text-stone-600">
                {t.body2}
              </p>
            </Reveal>
          </div>

          <Reveal variant="fade-up" delay={120}>
            <figure className="landing-about-media relative overflow-hidden border border-[#000000]/35 bg-[#ABD1B5]">
              <ArchTechLogo variant="mark" tone="full-color" theme="inherit" className="landing-about-mark pointer-events-none absolute right-4 top-4 z-10" />
              <img
                src="/about/garnier-values.webp"
                alt={t.mediaAlt || 'Interior workplace environment from the official Garnier public portfolio'}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <figcaption className="border-t border-[#000000]/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{t.sourceCaption}</figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="mt-14 grid border-y border-black/15 sm:grid-cols-2 lg:grid-cols-4">
          {t.facts.map((fact, index) => (
            <div key={fact.value} className="border-b border-black/15 px-0 py-5 last:border-b-0 sm:px-5 sm:even:border-l lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
              <Reveal variant="fade-up" delay={index * 60}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#000000]">
                  <MetricCounter value={fact.value} />
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-5 text-stone-600">{fact.label}</p>
              </Reveal>
            </div>
          ))}
        </div>

        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">{t.factualContext}</p>
      </div>
    </section>
  );
};

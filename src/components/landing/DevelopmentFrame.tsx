import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { useLocale } from '../../portal/locale';

interface DevelopmentFrameProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const DevelopmentFrame: React.FC<DevelopmentFrameProps> = ({ onLogin }) => {
  const { landing } = useLocale();
  const t = landing.development;

  return (
    <section id="development" className="border-b border-white/[0.08] bg-[#000000] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal variant="fade-up">
          <div className="grid gap-8 border-b border-white/[0.08] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">{t.eyebrow}</p>
              <h2 className="mt-5 max-w-4xl font-serif text-5xl font-light tracking-tight text-[#EDF4ED] sm:text-7xl">
                {t.heading}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-400">{t.description}</p>
          </div>
        </Reveal>
        <div className="grid divide-y divide-white/[0.08] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {t.stages.map((stage, index) => (
            <Reveal key={stage.number} variant="fade-up" delay={index * 60}>
              <article className="py-8 lg:px-7 lg:py-10 first:lg:pl-0 last:lg:pr-0">
                <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500">{stage.number} / {stage.label}</p>
                <h3 className="mt-10 font-serif text-3xl font-light text-[#EDF4ED] sm:text-4xl">{stage.title}</h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">{stage.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal variant="fade-up" delay={250}>
          <div className="mt-14 grid gap-8 border-t border-white/[0.08] pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">{t.privatePortalEyebrow}</p>
              <h3 className="mt-5 max-w-3xl font-serif text-4xl font-light text-[#EDF4ED] sm:text-5xl">{t.privatePortalHeading}</h3>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-400">{t.privatePortalDescription}</p>
            </div>
            <button
              data-testid="development-portal-link"
              onClick={(event) => onLogin(event.currentTarget)}
              className="arch-interactive-button group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 transition-colors hover:text-white"
            >
              {t.enterPortal} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';

const stages = [
  { number: '01', label: 'Opportunity', title: 'Read the ground.', body: 'Land, context, market and the operating idea establish the direction before a plan is drawn.' },
  { number: '02', label: 'Structure', title: 'Build the framework.', body: 'Program, movement, landscape and phasing give each development a structure that can grow with its purpose.' },
  { number: '03', label: 'Delivery', title: 'Carry decisions forward.', body: 'A clear development path keeps intent visible as the project advances through design, coordination and delivery.' },
  { number: '04', label: 'Operation', title: 'Make the place last.', body: 'Long-term value is shaped by how a place works, adapts and remains useful after the first opening.' },
];

interface DevelopmentFrameProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const DevelopmentFrame: React.FC<DevelopmentFrameProps> = ({ onLogin }) => (
  <section id="development" className="border-b border-white/[0.08] bg-[#0b0c10] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
    <div className="mx-auto max-w-7xl">
      <Reveal variant="fade-up">
        <div className="grid gap-8 border-b border-white/[0.08] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">The development lifecycle</p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl font-light tracking-tight text-[#f4efe8] sm:text-7xl">From opportunity to operation.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-400">The work is a sequence of decisions that connects land, program, delivery and the life of a place over time.</p>
        </div>
      </Reveal>
      <div className="grid divide-y divide-white/[0.08] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {stages.map((stage, index) => (
          <Reveal key={stage.number} variant="fade-up" delay={index * 60}>
            <article className="py-8 lg:px-7 lg:py-10 first:lg:pl-0 last:lg:pr-0">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500">{stage.number} / {stage.label}</p>
              <h3 className="mt-10 font-serif text-3xl font-light text-[#f4efe8] sm:text-4xl">{stage.title}</h3>
              <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">{stage.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal variant="fade-up" delay={250}>
        <div className="mt-14 grid gap-8 border-t border-white/[0.08] pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Private project portal</p>
            <h3 className="mt-5 max-w-3xl font-serif text-4xl font-light text-[#f4efe8] sm:text-5xl">The public portfolio is the beginning of the conversation.</h3>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-400">Clients follow the working life of their development through a private view of progress, decisions, documents and the next milestone.</p>
          </div>
          <button data-testid="development-portal-link" onClick={(event) => onLogin(event.currentTarget)} className="arch-interactive-button group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 transition-colors hover:text-white">Enter project portal <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></button>
        </div>
      </Reveal>
    </div>
  </section>
);

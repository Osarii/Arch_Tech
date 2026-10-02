import React from 'react';
import { ArrowRight } from 'lucide-react';

const stages = [
  { number: '01', label: 'Position', title: 'Read the opportunity.', body: 'Every development begins with a clear reading of landscape, context and the life the place needs to support.' },
  { number: '02', label: 'Shape', title: 'Make the next decision visible.', body: 'Design gives the project a shared direction, from the first spatial study to the choices that define its character.' },
  { number: '03', label: 'Advance', title: 'Carry intent into delivery.', body: 'A project gains value when its decisions remain legible as it moves through coordination, documentation and delivery.' },
];

interface DevelopmentFrameProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const DevelopmentFrame: React.FC<DevelopmentFrameProps> = ({ onLogin }) => (
  <section id="development" className="border-b border-white/[0.08] bg-[#0b0c10] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 border-b border-white/[0.08] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Development approach</p>
          <h2 className="mt-5 max-w-4xl font-serif text-5xl font-light tracking-tight text-[#f4efe8] sm:text-7xl">From possibility to place.</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-400">The portfolio is read as a sequence of decisions, giving clients a clear view of where a project is and what comes next.</p>
      </div>
      <div className="grid divide-y divide-white/[0.08] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {stages.map((stage) => (
          <article key={stage.number} className="py-8 lg:px-8 lg:py-10 first:lg:pl-0 last:lg:pr-0">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stone-500">{stage.number} / {stage.label}</p>
            <h3 className="mt-10 font-serif text-3xl font-light text-[#f4efe8] sm:text-4xl">{stage.title}</h3>
            <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">{stage.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-14 grid gap-8 border-t border-white/[0.08] pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Private project portal</p>
          <h3 className="mt-5 max-w-3xl font-serif text-4xl font-light text-[#f4efe8] sm:text-5xl">The public register is the beginning of the conversation.</h3>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-400">Clients follow the working life of their project through a private view of progress, decisions, documents and the next milestone.</p>
        </div>
        <button data-testid="development-portal-link" onClick={(event) => onLogin(event.currentTarget)} className="group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 transition-colors hover:text-white">Enter project portal <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></button>
      </div>
    </div>
  </section>
);

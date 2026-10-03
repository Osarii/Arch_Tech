import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getPublicProjects } from '../../portal/data';

interface ProjectShowcaseProps {
  onOpenProject: (id: string) => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ onOpenProject }) => {
  const [projects] = useState(getPublicProjects);
  return (
    <section id="projects" className="bg-[#e9e5dc] px-6 py-24 text-[#171714] sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Development portfolio</p>
            <h2 className="mt-5 max-w-5xl font-serif text-5xl font-light tracking-tight sm:text-7xl">A portfolio built for consequence.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-600">Free zones, logistics campuses, corporate developments, mixed-use districts, hospitality destinations and masterplans across Costa Rica.</p>
        </div>

        <div className="mt-14 grid gap-px bg-black/15 md:grid-cols-2">
          {projects.map((project, index) => (
            <button
              key={project.id}
              data-testid={`public-project-${project.id}`}
              onClick={() => onOpenProject(project.id)}
              className={`group bg-[#e9e5dc] p-5 text-left transition-colors hover:bg-[#ded9cf] sm:p-7 ${index === 0 ? 'md:col-span-2 md:grid md:grid-cols-[1fr_1.25fr] md:gap-8' : ''}`}
            >
              <span className={`flex items-center justify-between font-mono text-[10px] text-stone-500 ${index === 0 ? 'md:col-span-2' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><span>{project.market ?? 'Costa Rica'}</span></span>
              <span className={index === 0 ? 'mt-5 block md:mt-0' : 'mt-5 block'}>
                <span className="relative block aspect-[16/9] overflow-hidden bg-stone-300">
                  <img src={project.media?.aerial ?? project.image} alt="" loading="lazy" fetchPriority="low" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </span>
              </span>
              <span className={index === 0 ? 'mt-6 block md:mt-0' : 'mt-6 block'}>
                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{project.category}</span>
                <span className="mt-3 block font-serif text-3xl font-light sm:text-4xl">{project.title}</span>
                <span className="mt-5 grid gap-3 border-t border-black/15 pt-4 text-xs leading-5 text-stone-600 sm:grid-cols-2">
                  <span><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500">Stage</span><span className="mt-1 block">{project.publicStage ?? project.phase}</span></span>
                  <span><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500">Scale</span><span className="mt-1 block">{project.scale ?? 'Development study'}</span></span>
                </span>
                <span className="mt-7 inline-flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-600">View development <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

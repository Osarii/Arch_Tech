import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getPortalSnapshot } from '../../portal/data';

interface ProjectShowcaseProps {
  onOpenProject: (id: string) => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ onOpenProject }) => {
  const [projects] = useState(() => getPortalSnapshot().projects.filter((project) => !project.archived));
  return (
  <section id="projects" className="bg-[#e9e5dc] px-6 py-24 text-[#171714] sm:px-8 lg:px-12 lg:py-32">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Selected projects</p>
          <h2 className="mt-5 font-serif text-5xl font-light tracking-tight sm:text-7xl">Places shaped for what comes next.</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-600">A considered portfolio of residential projects, each moving through its own sequence of site, design and decision.</p>
      </div>

      <div className="mt-14 divide-y divide-black/15 border-y border-black/15">
        {projects.map((project, index) => (
          <button
            key={project.id}
            data-testid={`public-project-${project.id}`}
            onClick={() => onOpenProject(project.id)}
            className="group grid w-full gap-6 py-8 text-left md:grid-cols-[80px_1fr_1.2fr_auto] md:items-center"
          >
            <span className="font-mono text-[10px] text-stone-500">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <span className="block font-serif text-3xl font-light sm:text-4xl">{project.title}</span>
              <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{project.publicStage ?? project.phase}</span>
            </span>
            <span className="relative aspect-[16/8] overflow-hidden bg-stone-300">
              <img src={project.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
            </span>
            <span className="flex items-center gap-3"><span className="hidden text-right font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500 lg:block">{project.market ?? 'Costa Rica'}</span><ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
          </button>
        ))}
      </div>
    </div>
  </section>
  );
};

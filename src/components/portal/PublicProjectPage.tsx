import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { getPublicProject } from '../../portal/data';
import { SpatialRail } from '../gallery/SpatialRail';
import { NavigationProps, NotFoundPage } from './PortalCommon';
import { Reveal } from '../motion/Reveal';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { ProjectUpdatesTimeline } from '../news/ProjectUpdatesTimeline';

export const PublicProjectPage: React.FC<NavigationProps & { projectId: string }> = ({
  projectId,
  onNavigate,
}) => {
  const project = getPublicProject(projectId);
  if (!project) return <NotFoundPage onNavigate={onNavigate} />;

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b0d] text-[#f4efe8]">
      <header className="border-b border-white/[0.12]">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 sm:px-8 lg:px-12">
          <button onClick={() => onNavigate('/')} aria-label="GARNIER ARCHITECTURE home" className="transition-opacity hover:opacity-80">
            <ArchTechLogo variant="mark" tone="mint-cream" theme="dark" />
          </button>
          <p className="hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 sm:flex">
            <ArchTechLogo variant="mark" tone="mint-cream" theme="dark" className="landing-project-detail-mark" />
            <span className="h-px w-8 bg-white/25" aria-hidden="true" />
            <span>Portfolio Showcase / Concept Prototype</span>
            <span className="text-stone-700">/</span>
            <span className="text-stone-300">{project.code}</span>
          </p>
          <button
            onClick={() => onNavigate('/login')}
            className="arch-interactive-link col-start-3 justify-self-end font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 hover:text-white"
          >
            Project Portal
          </button>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-10">
          <button
            onClick={() => onNavigate('/')}
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" /> Development portfolio
          </button>
          <div className="mt-6 grid gap-8 border-t border-white/[0.12] pt-6 lg:grid-cols-[1.45fr_1fr] lg:gap-0 lg:pt-0">
            <div className="lg:py-8 lg:pr-12">
              <Reveal variant="fade-up" delay={50}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  {project.code} / {project.category}
                </p>
                <h1 className="mt-4 max-w-3xl font-serif text-4xl font-light leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                  {project.title}
                </h1>
                <p className="mt-6 max-w-xl border-l border-white/[0.15] pl-5 text-base leading-7 text-stone-300">
                  {project.summary}
                </p>
              </Reveal>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 text-sm lg:grid-cols-1 lg:gap-x-0 lg:border-l lg:border-white/[0.12] lg:pl-8">
              {[
                ['Market', project.market ?? 'Costa Rica'],
                ['Development', project.developmentType ?? project.category],
                ['Current stage', project.publicStage ?? project.phase],
                ['Context', project.context ?? 'Costa Rica'],
                ['Scale', project.scale ?? 'Project study'],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className="grid gap-1.5 border-t border-white/[0.1] py-3.5 lg:grid-cols-[7rem_1fr] lg:gap-4 lg:border-t-0 lg:border-b lg:py-4 lg:first:pt-8 lg:last:border-b-0"
                >
                  <Reveal variant="fade-up" delay={index * 40}>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">
                      <span className="mr-2 text-stone-600">{String(index + 1).padStart(2, '0')}</span>
                      {label}
                    </dt>
                    <dd className="text-stone-200">{value}</dd>
                  </Reveal>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-12 sm:px-8 lg:px-12 lg:pb-16">
          <div className="border-t border-white/[0.12] pt-5">
            <Reveal variant="fade-up" delay={120}>
              <SpatialRail project={project} />
            </Reveal>
          </div>
        </div>
        <section
          aria-labelledby="project-intent"
          className="mx-auto max-w-7xl border-t border-white/[0.12] px-6 py-12 sm:px-8 lg:grid lg:grid-cols-[0.35fr_1fr] lg:gap-10 lg:px-12 lg:py-16"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">01 / Brief</p>
            <h2 id="project-intent" className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
              Project intent
            </h2>
          </div>
          <div className="mt-8 border-l border-white/[0.18] pl-5 sm:pl-7 lg:mt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Development mandate</p>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-stone-200 sm:text-2xl sm:leading-9">
              {project.statement}
            </p>
          </div>
        </section>
        <section aria-labelledby="long-view" className="border-y border-white/[0.08] bg-[#101215]">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[0.35fr_1fr] lg:gap-10 lg:px-12 lg:py-16">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">02 / Horizon</p>
              <h2 id="long-view" className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
                Long view
              </h2>
            </div>
            <div className="grid gap-6 border-l border-white/[0.18] pl-5 sm:pl-7 lg:grid-cols-[10rem_1fr] lg:gap-10">
              <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-stone-500">
                Long-term development strategy
              </p>
              <p className="max-w-3xl font-serif text-3xl font-light leading-tight text-stone-100 sm:text-4xl">
                {project.longView ?? 'Clear decisions, durable materials and a place that can remain useful over time.'}
              </p>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="development-path"
          className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:grid lg:grid-cols-[0.35fr_1fr] lg:gap-10 lg:px-12 lg:py-16"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">03 / Register</p>
            <h2 id="development-path" className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
              Development path
            </h2>
          </div>
          <div className="mt-8 lg:mt-0">
            <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-4 border-y border-white/[0.12] px-3 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 sm:grid-cols-[4rem_minmax(0,1fr)_8rem] sm:gap-6 sm:px-4">
              <span>Seq.</span>
              <span>Milestone</span>
              <span className="text-right">Status</span>
            </div>
            <ol>
              {project.milestones.map((milestone, index) => (
                <Reveal key={milestone.label} variant="fade-up" delay={index * 40} as="li">
                  <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-white/[0.1] px-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_8rem] sm:gap-6 sm:px-4">
                    <span className="font-mono text-sm text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                    <span className="font-serif text-xl font-light text-stone-100 sm:text-2xl">{milestone.label}</span>
                    <span className="text-right font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">
                      {milestone.status}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
        <ProjectUpdatesTimeline projectId={projectId} onNavigate={onNavigate} />
      </main>
    </div>
  );
};

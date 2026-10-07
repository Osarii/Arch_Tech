import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getPublicProjects } from '../../portal/data';
import { ProjectImage } from '../gallery/projectMedia';
import { Reveal } from '../motion/Reveal';
import { WireframeToSolid } from '../motion/WireframeToSolid';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useLocale } from '../../portal/locale';
import { getLocalizedProject } from '../../portal/showcaseLocalization';

interface ProjectShowcaseProps {
  onOpenProject: (id: string) => void;
}

const Field: React.FC<{ label: string; value: string; labelAlways?: boolean }> = ({ label, value, labelAlways }) => (
  <span className="block">
    <span className={`block font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500 ${labelAlways ? '' : 'lg:hidden'}`}>{label}</span>
    <span className={`mt-1 block text-sm leading-5 text-stone-700 ${labelAlways ? '' : 'lg:mt-0'}`}>{value}</span>
  </span>
);

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ onOpenProject }) => {
  const [projects] = useState(getPublicProjects);
  const [featuredRaw, ...register] = projects;
  const featured = featuredRaw ? getLocalizedProject(featuredRaw) : null;
  const { locale, landing } = useLocale();
  const t = landing.projects;

  return (
    <section id="projects" className="landing-projects-section bg-[#EDF4ED] px-6 py-24 text-[#000000] sm:px-8 lg:px-12 lg:py-32">
      <div className="landing-projects-inner mx-auto max-w-7xl">
        <Reveal variant="fade-up">
          <div className="landing-projects-header grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <ArchTechLogo variant="mark" tone="muted-teal" theme="inherit" className="landing-projects-mark pointer-events-none" />
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">{t.eyebrow}</p>
              </div>
              <h2 className="landing-projects-heading mt-5 max-w-5xl font-serif font-light tracking-tight">{t.heading}</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-600">{t.description}</p>
          </div>
        </Reveal>

        {featured && (
          <Reveal variant="fade-up" delay={80}>
            <button
              key={featured.id}
              data-testid={`public-project-${featured.id}`}
              onClick={() => onOpenProject(featured.id)}
              className="landing-projects-featured group mt-12 block w-full text-left"
            >
              <span className="relative block aspect-[16/9] overflow-hidden bg-stone-300 md:aspect-[21/9]">
                <WireframeToSolid tag="GARNIER ARCHITECTURE // PRINCIPAL-01" trigger="auto" className="h-full w-full">
                  <ProjectImage project={featured} usage="showcase" alt={`${featured.title} development context`} loading="lazy" fetchPriority="low" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
                </WireframeToSolid>
              </span>
              <span className="mt-6 block border-b border-black/15 pb-10">
                <span className="flex items-start justify-between gap-6">
                  <span className="block">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{t.principalBadge}{featured.category}</span>
                    <span className="mt-3 block max-w-4xl font-serif text-4xl font-light leading-[1.02] sm:text-6xl lg:text-7xl">{featured.title}</span>
                  </span>
                  <ArrowUpRight className="mt-1 hidden h-6 w-6 shrink-0 text-stone-700 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:block" />
                </span>
                <span className="mt-8 grid gap-5 border-t border-black/15 pt-5 sm:grid-cols-3">
                  <Field labelAlways label={t.market} value={featured.market ?? 'Costa Rica'} />
                  <Field labelAlways label={t.stage} value={featured.publicStage ?? featured.phase} />
                  <Field labelAlways label={t.scale} value={featured.scale ?? 'Development study'} />
                </span>
              </span>
            </button>
          </Reveal>
        )}

        <Reveal variant="fade" delay={120}>
          <div className="landing-projects-register-header hidden grid-cols-[3rem_14rem_1.3fr_1fr_1fr_1fr_2rem] gap-8 border-b border-black/15 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500 lg:grid">
            <span>{t.numberLabel || 'No.'}</span>
            <span>{locale === 'es' ? 'Ubicación' : 'Site'}</span>
            <span>{locale === 'es' ? 'Desarrollo' : 'Development'}</span>
            <span>{t.market}</span>
            <span>{t.stage}</span>
            <span>{t.scale}</span>
            <span />
          </div>
        </Reveal>
        <div>
          {register.map((projectRaw, i) => {
            const project = getLocalizedProject(projectRaw);
            return (
              <Reveal key={project.id} variant="fade-up" delay={i * 45}>
                <button
                  data-testid={`public-project-${project.id}`}
                  onClick={() => onOpenProject(project.id)}
                  className="landing-projects-register-row group grid w-full gap-5 border-b border-black/15 py-6 text-left transition-colors hover:bg-[#ABD1B5] sm:grid-cols-[14rem_1fr] lg:grid-cols-[3rem_14rem_1.3fr_1fr_1fr_1fr_2rem] lg:items-center lg:gap-8"
                >
                  <span className="hidden font-mono text-[10px] text-stone-500 lg:block">{String(i + 2).padStart(2, '0')}</span>
                  <span className="relative block aspect-[16/10] overflow-hidden bg-stone-300">
                    <ProjectImage project={project} alt={`${project.title} development context`} loading="lazy" fetchPriority="low" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </span>
                  <span className="grid gap-5 sm:contents">
                    <span className="block sm:col-start-2 lg:col-start-auto">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{project.category}</span>
                      <span className="mt-2 block font-serif text-2xl font-light leading-tight sm:text-3xl">{project.title}</span>
                    </span>
                    <span className="grid gap-4 sm:col-start-2 sm:grid-cols-3 lg:contents">
                      <Field label={t.market} value={project.market ?? 'Costa Rica'} />
                      <Field label={t.stage} value={project.publicStage ?? project.phase} />
                      <Field label={t.scale} value={project.scale ?? 'Development study'} />
                    </span>
                  </span>
                  <ArrowUpRight className="hidden h-4 w-4 text-stone-600 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:block" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

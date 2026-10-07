import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot, getPortalUser, getProjectsForUser } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';
import { useLocale } from '../../portal/locale';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { NavigationProps } from '../../components/portal/PortalCommon';
import { PortalShell, usePortalShell } from '../../components/portal/PortalShell';

export const ArchitectInsightsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('architect');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal } = useLocale();

  const [, setSnapshot] = useState(getPortalSnapshot);
  const architect = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');

  const totalProjects = projects.length;
  const averageProgress = totalProjects
    ? Math.round(projects.reduce((total, p) => total + p.progress, 0) / totalProjects)
    : 0;

  const allApprovals = projects.flatMap((p) => p.approvals);
  const pendingApprovalsCount = allApprovals.filter((a) => a.status === 'Pending').length;
  const resolvedApprovalsCount = allApprovals.filter((a) => a.status !== 'Pending').length;

  const allMilestones = projects.flatMap((p) => p.milestones);
  const upcomingMilestonesCount = allMilestones.filter((m) => m.status === 'Upcoming').length;
  const completeMilestonesCount = allMilestones.filter((m) => m.status === 'Complete').length;

  const totalDeliverables = projects.reduce((total, p) => total + p.documents.length, 0);

  const phaseCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.phase] = (acc[p.phase] ?? 0) + 1;
    return acc;
  }, {});

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {architectPortal.insightsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {architectPortal.insightsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {architectPortal.insightsSubtitle}
        </p>
      </div>

      {/* KPI Workload Strip */}
      <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('workloadSummaryAria', 'Studio workload summary')}>
        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('activeAssignments', 'Active assignments')}</p>
          <p className="mt-3 font-serif text-4xl">{totalProjects.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{t('developmentsInStudio', 'developments in studio')}</p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('studioProgress', 'Studio progress')}</p>
          <p className="mt-3 font-serif text-4xl">{averageProgress}%</p>
          <p className="mt-1 text-xs text-stone-600">{t('averageCompletion', 'average completion')}</p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('clientDecisions', 'Client decisions')}</p>
          <p className="mt-3 font-serif text-4xl">{pendingApprovalsCount.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">
            {t('resolvedSignOffs', '{{count}} resolved sign-offs', { count: resolvedApprovalsCount })}
          </p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('milestoneSequence', 'Milestone sequence')}</p>
          <p className="mt-3 font-serif text-4xl">{upcomingMilestonesCount.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">
            {t('completedCount', '{{count}} completed', { count: completeMilestonesCount })}
          </p>
        </div>
      </section>

      {/* Development Phases */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_1.4fr]" aria-label={t('phaseConcentrationAria', 'Phase concentration')}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('phaseConcentration', 'Phase concentration')}</p>
          <h2 className="mt-4 font-serif text-3xl">{t('activeStudioStages', 'Active studio stages.')}</h2>
          <p className="mt-3 text-sm text-stone-600">
            {t('phaseConcentrationDesc', 'Workload distribution across architectural phases from brief and site study through documentation.')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(phaseCounts).map(([phase, count]) => (
            <div key={phase} className="border-l border-black/20 pl-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{phase}</p>
              <p className="mt-2 font-serif text-3xl">{String(count).padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-stone-600">{t('projectsCount', '{{count}} project(s)', { count })}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Progress Signal */}
      <section className="space-y-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('studioDeliveryBreakdown', 'Studio delivery breakdown')}</p>
          <h2 className="mt-2 font-serif text-3xl">{t('progressByDevelopment', 'Progress by development.')}</h2>
        </div>

        <div className="space-y-4 divide-y divide-black/15 border-y border-black/15">
          {projects.map((project) => (
            <div key={project.id} className="pt-4 pb-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-center">
              <div>
                <p className="font-serif text-2xl">{project.title}</p>
                <p className="text-xs text-stone-600">{project.phase} · {t('nextLabel', 'Next:')} {project.nextMilestone}</p>
              </div>
              <div>
                <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 mb-1.5">
                  <span>{t('completion', 'Completion')}</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="portal-progress-track h-px bg-black/15">
                  <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/architect/projects/${project.id}`)}
                  className="border border-black px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
                >
                  {t('manage', 'Manage')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deliverables summary */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-black/15 pt-8">
        <div>
          <p className="font-serif text-xl">{t('technicalPackages', 'Technical packages & deliverables')}</p>
          <p className="text-xs text-stone-600">
            {t('deliverablesIssuedDesc', '{{count}} drawings, specs, and documents currently issued across assigned work.', { count: totalDeliverables })}
          </p>
        </div>
        <button
          onClick={() => navigate('/architect/documents')}
          className="border border-black px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
        >
          {t('viewDeliverables', 'View deliverables →')}
        </button>
      </section>
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role="architect" onNavigate={onNavigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

import React, { useEffect, useState } from 'react';
import { getPortalSnapshot, getPortalUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export const ClientInsightsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { clientPortal } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const client = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = snapshot.projects.filter(
    (project) => !project.archived && client?.projectIds.includes(project.id),
  );

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const totalProjects = projects.length;
  const averageProgress = totalProjects
    ? Math.round(projects.reduce((total, p) => total + p.progress, 0) / totalProjects)
    : 0;

  const totalDocuments = projects.reduce((total, p) => total + p.documents.length, 0);
  const allApprovals = projects.flatMap((p) => p.approvals);
  const pendingApprovalsCount = allApprovals.filter((a) => a.status === 'Pending').length;
  const approvedCount = allApprovals.filter((a) => a.status === 'Approved').length;

  const allMilestones = projects.flatMap((p) => p.milestones);
  const completeMilestonesCount = allMilestones.filter((m) => m.status === 'Complete').length;
  const upcomingMilestonesCount = allMilestones.filter((m) => m.status === 'Upcoming').length;

  const phaseCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.phase] = (acc[p.phase] ?? 0) + 1;
    return acc;
  }, {});

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {clientPortal.insightsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {clientPortal.insightsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {clientPortal.insightsSubtitle}
        </p>
      </div>

      {/* KPI Tiles */}
      <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Client portfolio KPIs">
        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Active portfolio</p>
          <p className="mt-3 font-serif text-4xl">{totalProjects.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">assigned developments</p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Average progress</p>
          <p className="mt-3 font-serif text-4xl">{averageProgress}%</p>
          <p className="mt-1 text-xs text-stone-600">across all projects</p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Decisions required</p>
          <p className="mt-3 font-serif text-4xl">{pendingApprovalsCount.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{approvedCount} approvals resolved</p>
        </div>

        <div className="portal-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Completed milestones</p>
          <p className="mt-3 font-serif text-4xl">{completeMilestonesCount.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{upcomingMilestonesCount} upcoming delivery events</p>
        </div>
      </section>

      {/* Development Stages Distribution */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_1.4fr]" aria-label="Stage distribution">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development stages</p>
          <h2 className="mt-4 font-serif text-3xl">Active phase distribution.</h2>
          <p className="mt-3 text-sm text-stone-600">
            Current concentration of development phases across your active portfolio.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(phaseCounts).map(([phase, count]) => (
            <div key={phase} className="border-l border-black/20 pl-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{phase}</p>
              <p className="mt-2 font-serif text-3xl">{String(count).padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-stone-600">development{count === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Progress Signal */}
      <section className="space-y-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Project progress signals</p>
          <h2 className="mt-2 font-serif text-3xl">Progress by development.</h2>
        </div>

        <div className="space-y-4 divide-y divide-black/15 border-y border-black/15">
          {projects.map((project) => (
            <div key={project.id} className="pt-4 pb-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-center">
              <div>
                <p className="font-serif text-2xl">{project.title}</p>
                <p className="text-xs text-stone-600">{project.phase} · Next: {project.nextMilestone}</p>
              </div>
              <div>
                <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 mb-1.5">
                  <span>Completion</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="portal-progress-track h-px bg-black/15">
                  <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  className="border border-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:border-black"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deliverables summary */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-black/15 pt-8">
        <div>
          <p className="font-serif text-xl">Aggregated deliverables vault</p>
          <p className="text-xs text-stone-600">
            {totalDocuments} documents and technical specifications accessible across your portfolio.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="border border-black/20 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
        >
          View documents vault →
        </button>
      </section>
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role="client" onNavigate={onNavigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

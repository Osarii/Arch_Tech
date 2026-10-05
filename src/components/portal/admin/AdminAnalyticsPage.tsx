import React, { useEffect, useState } from 'react';
import { getPortalSnapshot } from '../../../portal/data';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { ExternalContextPanel, NavigationProps } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const AdminAnalyticsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell } = usePortalShell();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);

  const pendingApprovals = db.approvals.filter(
    (approval) => approval.status === 'Pending' && activeProjects.some((p) => p.id === approval.projectId),
  );
  const upcomingMilestones = db.milestones.filter(
    (milestone) => milestone.status === 'Upcoming' && activeProjects.some((p) => p.id === milestone.projectId),
  );

  const stageCounts = activeProjects.reduce<Record<string, number>>(
    (counts, project) => ({ ...counts, [project.phase]: (counts[project.phase] ?? 0) + 1 }),
    {},
  );
  const averageProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length)
    : 0;

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          Administration / Analytics
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          Portfolio analytics & signals.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          Executive KPIs, stage distribution, and deterministic progress telemetry across all active developments.
        </p>
      </div>

      {/* KPI Overview Strip */}
      <section className="admin-kpi-strip grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio overview">
        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Active projects</p>
          <p className="mt-3 font-serif text-5xl">{activeProjects.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">currently active</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Average progress</p>
          <p className="mt-3 font-serif text-5xl">{averageProgress}%</p>
          <p className="mt-1 text-sm text-stone-600">across active work</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Pending approvals</p>
          <p className="mt-3 font-serif text-5xl">{pendingApprovals.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">requiring review</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Upcoming milestones</p>
          <p className="mt-3 font-serif text-5xl">{upcomingMilestones.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">in the active sequence</p>
        </div>
      </section>

      {/* Development stages */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_1.2fr]" aria-label="Development stages">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development stages</p>
          <h2 className="mt-4 font-serif text-4xl">Where the portfolio stands.</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Active project concentration categorized by development phase from preliminary study through documentation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <div key={stage} className="border-l border-black/20 pl-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{stage}</p>
              <p className="mt-3 font-serif text-3xl">{String(count).padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-stone-600">active project{count === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project progress chart */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[0.75fr_1.25fr]" aria-label="Project progress chart">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Live portfolio signal</p>
          <h2 className="mt-4 font-serif text-4xl">Progress by development.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            A direct view of current progress from the active project register.
          </p>
        </div>
        <div
          data-testid="project-progress-chart"
          role="img"
          aria-label="Project progress by development"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          {activeProjects.map((project) => (
            <div key={project.id} className="min-w-0">
              <div className="flex h-40 items-end border-b border-l border-black/20 px-2">
                <div
                  className="w-full bg-[#2D2E2C] transition-[height]"
                  style={{ height: `${Math.max(4, project.progress)}%` }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500">
                {project.title}
              </p>
              <p className="mt-1 font-serif text-2xl">{project.progress}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* Weather telemetry panel */}
      <ExternalContextPanel />
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role="admin" onNavigate={onNavigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

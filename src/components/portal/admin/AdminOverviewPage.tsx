import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, CheckCircle2, Layers, Sparkles, Users } from 'lucide-react';
import { getPortalSnapshot } from '../../../portal/data';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import {
  CreateProjectModal,
  ExternalContextPanel,
  NavigationProps,
} from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const AdminOverviewPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [createOpen, setCreateOpen] = useState(false);
  const [operationFeedback, setOperationFeedback] = useState('');
  const createTriggerRef = useRef<HTMLButtonElement>(null);

  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);
  const reviewProjects = activeProjects.filter((project) =>
    project.approvals.some((approval) => approval.status === 'Pending'),
  );
  const pendingApprovals = db.approvals
    .filter((approval) => approval.status === 'Pending' && activeProjects.some((p) => p.id === approval.projectId))
    .map((approval) => ({
      ...approval,
      projectTitle: activeProjects.find((p) => p.id === approval.projectId)?.title ?? approval.projectId,
    }));
  const upcomingMilestones = db.milestones
    .filter((milestone) => milestone.status === 'Upcoming' && activeProjects.some((p) => p.id === milestone.projectId))
    .map((milestone) => ({
      ...milestone,
      projectTitle: activeProjects.find((p) => p.id === milestone.projectId)?.title ?? milestone.projectId,
    }));
  const recentActivity = db.updates
    .filter((update) => activeProjects.some((p) => p.id === update.projectId))
    .slice(0, 6)
    .map((update) => ({
      ...update,
      projectTitle: activeProjects.find((p) => p.id === update.projectId)?.title ?? update.projectId,
    }));

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
      {/* Header section */}
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {adminPortal.overviewEyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">
          {adminPortal.overviewHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {adminPortal.overviewSubtitle}
        </p>
      </div>

      {/* Quick Action Bar */}
      <section className="flex flex-wrap items-center gap-4 py-2">
        <button
          ref={createTriggerRef}
          onClick={() => {
            setCreateOpen(true);
            setOperationFeedback('');
          }}
          className="admin-primary-action bg-[#171714] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-stone-800"
        >
          {adminPortal.createNewProject}
        </button>
        <p className="text-sm text-stone-600">{adminPortal.createProjectDescription}</p>
        {operationFeedback && (
          <p role="status" className="basis-full text-sm text-stone-600">
            {operationFeedback}
          </p>
        )}
      </section>

      {/* KPI Overview Strip */}
      <section className="admin-kpi-strip grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio overview">
        <button
          type="button"
          onClick={() => navigate('/admin/projects')}
          className="admin-overview-tile bg-[#E6DED2] p-6 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{adminPortal.activeProjects}</p>
          <p className="mt-3 font-serif text-5xl">{activeProjects.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">{adminPortal.currentlyActive}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="admin-overview-tile bg-[#E6DED2] p-6 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{adminPortal.averageProgress}</p>
          <p className="mt-3 font-serif text-5xl">{averageProgress}%</p>
          <p className="mt-1 text-sm text-stone-600">{adminPortal.acrossActiveWork}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/approvals')}
          className="admin-overview-tile bg-[#E6DED2] p-6 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{adminPortal.pendingApprovals}</p>
          <p className="mt-3 font-serif text-5xl">{pendingApprovals.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">{adminPortal.requiringReview}</p>
        </button>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{adminPortal.upcomingMilestones}</p>
          <p className="mt-3 font-serif text-5xl">{upcomingMilestones.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">{adminPortal.inActiveSequence}</p>
        </div>
      </section>

      {/* External Weather Context */}
      <ExternalContextPanel />

      {/* Review and delivery signals */}
      <section className="grid gap-12 border-b border-black/15 pb-12 lg:grid-cols-2" aria-label="Review and delivery signals">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Decisions requiring review</p>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500 hover:text-black"
            >
              Full queue →
            </button>
          </div>
          {reviewProjects.length ? (
            reviewProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/admin/projects/${project.id}`)}
                className="mt-5 flex w-full items-center justify-between border-b border-black/10 pb-4 text-left hover:text-stone-700"
              >
                <span>
                  <span className="block font-serif text-2xl">{project.title}</span>
                  <span className="mt-1 block text-sm text-stone-500">
                    {project.approvals
                      .filter((approval) => approval.status === 'Pending')
                      .map((approval) => approval.title)
                      .join(' · ')}
                  </span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">Review</span>
              </button>
            ))
          ) : (
            <p className="mt-5 max-w-sm text-sm leading-6 text-stone-600">No project decisions are waiting for review.</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Upcoming milestones</p>
            <span className="font-mono text-[9px] uppercase text-stone-500">Scheduled sequence</span>
          </div>
          {upcomingMilestones.length ? (
            upcomingMilestones.slice(0, 5).map((milestone) => (
              <p key={`${milestone.projectId}-${milestone.label}`} className="mt-5 flex justify-between gap-4 border-b border-black/10 pb-3 text-sm">
                <span>{milestone.projectTitle} · {milestone.label}</span>
                <span className="font-mono text-[9px] uppercase text-stone-500">Upcoming</span>
              </p>
            ))
          ) : (
            <p className="mt-5 max-w-sm text-sm leading-6 text-stone-600">No upcoming milestones are scheduled.</p>
          )}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="grid gap-12 border-b border-black/15 pb-12 lg:grid-cols-2">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Recent activity</h2>
          {recentActivity.length ? (
            recentActivity.slice(0, 5).map((update) => (
              <p key={`${update.projectId}-${update.date}-${update.title}`} className="mt-4 flex justify-between gap-4 border-b border-black/10 pb-2 text-sm">
                <span>{update.projectTitle} · {update.title}</span>
                <span className="font-mono text-[9px] text-stone-500">{update.date}</span>
              </p>
            ))
          ) : (
            <p className="mt-4 text-sm text-stone-600">No recent updates.</p>
          )}
        </div>

        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development controls</h2>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Create, assign and advance projects from the register. Open any project or its model directly from the portfolio workspaces.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/projects')}
              className="border border-black px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
            >
              Open project register →
            </button>
            <button
              onClick={() => navigate('/admin/people')}
              className="border border-black/20 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:border-black"
            >
              Manage people & roles →
            </button>
          </div>
        </div>
      </section>

      {/* Deeper Workspaces Grid */}
      <section className="pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Administration workspaces</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <button
            onClick={() => navigate('/admin/projects')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Layers className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-lg">Project Register</p>
            <p className="mt-1 text-xs text-stone-600">Search, filter, sort and manage development portfolio.</p>
          </button>

          <button
            onClick={() => navigate('/admin/people')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Users className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-lg">People & Access</p>
            <p className="mt-1 text-xs text-stone-600">Account creation, roles, and project assignments.</p>
          </button>

          <button
            onClick={() => navigate('/admin/approvals')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <CheckCircle2 className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-lg">Approvals Queue</p>
            <p className="mt-1 text-xs text-stone-600">Global decision tracking and notification log.</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <BarChart2 className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-lg">Analytics & Signals</p>
            <p className="mt-1 text-xs text-stone-600">Stage distribution, progress chart and metrics.</p>
          </button>

          <button
            onClick={() => navigate('/admin/assistant')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Sparkles className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-lg">Enterprise AI</p>
            <p className="mt-1 text-xs text-stone-600">Full BIM assistant access and tools.</p>
          </button>
        </div>
      </section>

      {/* Modal */}
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(feedback) => {
          refresh();
          setOperationFeedback(feedback);
        }}
        triggerRef={createTriggerRef}
      />
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

import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, CheckCircle2, Layers, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import {
  getLocalizedApprovalTitle,
  getLocalizedMilestoneLabel,
  getLocalizedUpdate,
} from '../../../portal/showcaseLocalization';

export const AdminOverviewPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('admin');
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
      <div className="grid gap-6 border-b border-[var(--portal-border)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--portal-muted)]">
            {adminPortal.overviewEyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-light tracking-tight sm:text-6xl text-[var(--portal-text)]">
            {adminPortal.overviewHeading}
          </h1>
        </div>
        <p className="max-w-md font-mono text-xs leading-relaxed text-[var(--portal-muted)]">
          {adminPortal.overviewSubtitle}
        </p>
      </div>

      {/* Quick Action Bar */}
      <section className="flex flex-wrap items-center gap-4 py-1">
        <button
          ref={createTriggerRef}
          onClick={() => {
            setCreateOpen(true);
            setOperationFeedback('');
          }}
          className="admin-primary-action bg-[var(--portal-text)] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--portal-surface)] hover:opacity-90 transition-opacity"
        >
          {adminPortal.createNewProject}
        </button>
        <p className="font-mono text-xs text-[var(--portal-muted)]">{adminPortal.createProjectDescription}</p>
        {operationFeedback && (
          <p role="status" className="basis-full font-mono text-xs text-[var(--portal-accent)]">
            {operationFeedback}
          </p>
        )}
      </section>

      {/* KPI Overview Strip */}
      <section className="admin-kpi-strip grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('portfolioOverview', 'Portfolio overview')}>
        <button
          type="button"
          onClick={() => navigate('/admin/projects')}
          className="admin-overview-tile group flex flex-col justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{adminPortal.activeProjects}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('portfolioBadge', 'PORTFOLIO')}</span>
          </div>
          <p className="admin-kpi-value my-4 font-sans text-5xl font-light tracking-[-0.03em] tabular-nums text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {activeProjects.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--portal-accent)]" />
            <span>{adminPortal.currentlyActive}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="admin-overview-tile group flex flex-col justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{adminPortal.averageProgress}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('avgBadge', 'AVG')}</span>
          </div>
          <p className="admin-kpi-value my-4 font-sans text-5xl font-light tracking-[-0.03em] tabular-nums text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {averageProgress}%
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--portal-accent)]" />
            <span>{adminPortal.acrossActiveWork}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/approvals')}
          className="admin-overview-tile group flex flex-col justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{adminPortal.pendingApprovals}</span>
            <span className={`h-2 w-2 rounded-full ${pendingApprovals.length > 0 ? 'bg-[#FFBF00]' : 'bg-[var(--portal-accent)]'}`} />
          </div>
          <p className="admin-kpi-value my-4 font-sans text-5xl font-light tracking-[-0.03em] tabular-nums text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {pendingApprovals.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span>{adminPortal.requiringReview}</span>
          </p>
        </button>

        <div className="admin-overview-tile flex flex-col justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{adminPortal.upcomingMilestones}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('queueBadge', 'QUEUE')}</span>
          </div>
          <p className="admin-kpi-value my-4 font-sans text-5xl font-light tracking-[-0.03em] tabular-nums text-[var(--portal-text)]">
            {upcomingMilestones.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span>{adminPortal.inActiveSequence}</span>
          </p>
        </div>
      </section>

      {/* External Weather Context */}
      <ExternalContextPanel />

      {/* Review and delivery signals */}
      <section className="grid gap-8 border-b border-[var(--portal-border)] pb-12 lg:grid-cols-2" aria-label={t('reviewDeliverySignals', 'Review and delivery signals')}>
        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-6">
          <div className="flex items-center justify-between border-b border-[var(--portal-border)] pb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('decisionsReview', 'Decisions requiring review')}</p>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--portal-muted)] hover:text-[var(--portal-text)] transition-colors"
            >
              {t('fullQueue', 'Full queue →')}
            </button>
          </div>
          {reviewProjects.length ? (
            reviewProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/admin/projects/${project.id}`)}
                className="mt-4 flex w-full items-center justify-between border-b border-[var(--portal-border)] pb-3 text-left hover:text-[var(--portal-accent)] transition-colors last:border-0"
              >
                <span>
                  <span className="block font-serif text-xl text-[var(--portal-text)]">{project.title}</span>
                  <span className="mt-1 block font-mono text-xs text-[var(--portal-muted)]">
                    {project.approvals
                      .filter((approval) => approval.status === 'Pending')
                      .map((approval) => getLocalizedApprovalTitle(approval.title, approval.projectId))
                      .join(' · ')}
                  </span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--portal-muted)]">{t('review', 'Review')}</span>
              </button>
            ))
          ) : (
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--portal-muted)]">{t('noDecisionsWaitingReview', 'No project decisions are waiting for review.')}</p>
          )}
        </div>

        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-6">
          <div className="flex items-center justify-between border-b border-[var(--portal-border)] pb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('upcomingMilestones', 'Upcoming milestones')}</p>
            <span className="font-mono text-[9px] uppercase text-[var(--portal-muted)]">{t('scheduledSequence', 'Scheduled sequence')}</span>
          </div>
          {upcomingMilestones.length ? (
            upcomingMilestones.slice(0, 5).map((milestone) => (
              <p key={`${milestone.projectId}-${milestone.label}`} className="mt-4 flex justify-between gap-4 border-b border-[var(--portal-border)] pb-3 text-sm text-[var(--portal-text)] last:border-0">
                <span className="truncate">{milestone.projectTitle} · {getLocalizedMilestoneLabel(milestone.label, milestone.projectId)}</span>
                <span className="font-mono text-[9px] uppercase text-[var(--portal-muted)] shrink-0">{t('upcoming', 'Upcoming')}</span>
              </p>
            ))
          ) : (
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--portal-muted)]">{t('noUpcomingMilestones', 'No upcoming milestones are scheduled.')}</p>
          )}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="grid gap-8 border-b border-[var(--portal-border)] pb-12 lg:grid-cols-2">
        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-6">
          <h2 className="border-b border-[var(--portal-border)] pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('recentActivity', 'Recent activity')}</h2>
          {recentActivity.length ? (
            recentActivity.slice(0, 5).map((update) => (
              <p key={`${update.projectId}-${update.date}-${update.title}`} className="mt-4 flex justify-between gap-4 border-b border-[var(--portal-border)] pb-2 text-sm text-[var(--portal-text)] last:border-0">
                <span className="truncate">{update.projectTitle} · {getLocalizedUpdate(update).title}</span>
                <span className="font-mono text-[9px] text-[var(--portal-muted)] shrink-0">{update.date}</span>
              </p>
            ))
          ) : (
            <p className="mt-4 text-sm text-[var(--portal-muted)]">{t('noRecentUpdates', 'No recent updates.')}</p>
          )}
        </div>

        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-6">
          <h2 className="border-b border-[var(--portal-border)] pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('developmentControls', 'Development controls')}</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--portal-muted)]">
            {t('developmentControlsDesc', 'Create, assign and advance projects from the register. Open any project or its model directly from the portfolio workspaces.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/projects')}
              className="border border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--portal-text)] hover:border-[var(--portal-accent)] transition-colors"
            >
              {t('openProjectRegister', 'Open project register →')}
            </button>
            <button
              onClick={() => navigate('/admin/people')}
              className="border border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--portal-text)] hover:border-[var(--portal-accent)] transition-colors"
            >
              {t('managePeopleRoles', 'Manage people & roles →')}
            </button>
          </div>
        </div>
      </section>

      {/* Deeper Workspaces Grid */}
      <section className="pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('adminWorkspaces', 'Administration workspaces')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <button
            onClick={() => navigate('/admin/projects')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <Layers className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-lg text-[var(--portal-text)]">{t('projectRegister', 'Project Register')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('projectRegisterDesc', 'Search, filter, sort and manage development portfolio.')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/people')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <Users className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-lg text-[var(--portal-text)]">{t('peopleAccess', 'People & Access')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('peopleAccessDesc', 'Account creation, roles, and project assignments.')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/approvals')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <CheckCircle2 className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-lg text-[var(--portal-text)]">{t('approvalsQueue', 'Approvals Queue')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('approvalsQueueDesc', 'Global decision tracking and notification log.')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <BarChart2 className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-lg text-[var(--portal-text)]">{t('analyticsSignals', 'Analytics & Signals')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('analyticsSignalsDesc', 'Stage distribution, progress chart and metrics.')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/assistant')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <Sparkles className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-lg text-[var(--portal-text)]">{t('enterpriseAi', 'Enterprise AI')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('enterpriseAiDesc', 'Full BIM assistant access and tools.')}</p>
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

import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Layers, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot, getPortalUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { projectService } from '../../../services/projectService';
import { projectWorkflowService } from '../../../services/projectWorkflowService';
import { userService } from '../../../services/userService';
import {
  NavigationProps,
  ProjectIdentityButton,
  PortalEmptyState,
} from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export const ClientOverviewPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('client');
  const { clientPortal, portalCommon } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [operationFeedback, setOperationFeedback] = useState('');
  const [operationFailed, setOperationFailed] = useState(false);

  const client = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = snapshot.projects.filter(
    (project) => !project.archived && client?.projectIds.includes(project.id),
  );
  const updates = projects
    .flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title })))
    .slice(0, 3);
  const upcomingMilestones = projects.flatMap((project) =>
    project.milestones
      .filter((milestone) => milestone.status === 'Upcoming')
      .map((milestone) => ({ ...milestone, projectTitle: project.title })),
  );
  const pendingApprovals = projects.flatMap((project) =>
    project.approvals
      .filter((approval) => approval.status === 'Pending')
      .map((approval) => ({ ...approval, projectTitle: project.title })),
  );
  const notifications = snapshot.db.notifications.filter(
    (notification) =>
      notification.userId === client?.id && projects.some((project) => project.id === notification.projectId),
  );

  const averageProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
    : 0;

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const respondToApproval = async (projectId: string, title: string, status: 'Approved' | 'Rejected') => {
    try {
      const updated = await projectWorkflowService.updateApproval(projectId, title, status);
      if (!updated) throw new Error(t('approvalReadBackError', 'Approval could not be read back after saving.'));
      setOperationFailed(false);
      setOperationFeedback(status === 'Approved' ? t('approvalRecorded', 'Approval recorded.') : t('changesRequested', 'Changes requested.'));
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : t('approvalSaveError', 'Approval could not be saved.'));
    }
  };

  const content = (
    <div className="space-y-14">
      {/* Header section */}
      <div className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">{clientPortal.overviewEyebrow}</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">
            {clientPortal.overviewHeading}
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-600">
          {clientPortal.overviewSubtitle}
        </p>
      </div>

      {/* Overview Signal Tiles */}
      <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('summaryAria', 'Portfolio summary')}>
        <button
          type="button"
          onClick={() => navigate('/dashboard/projects')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{clientPortal.assignedProjects}</p>
          <p className="mt-3 font-serif text-4xl">{projects.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{clientPortal.activeDevelopments}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard/insights')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{clientPortal.portfolioProgress}</p>
          <p className="mt-3 font-serif text-4xl">{averageProgress}%</p>
          <p className="mt-1 text-xs text-stone-600">{clientPortal.averageCompletion}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard/approvals')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{clientPortal.pendingApprovals}</p>
          <p className="mt-3 font-serif text-4xl">{pendingApprovals.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{clientPortal.decisionsWaiting}</p>
        </button>

        <div className="portal-overview-tile bg-[#E6DED2] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{clientPortal.nextMilestone}</p>
          <p className="mt-3 truncate font-serif text-2xl" title={projects[0]?.nextMilestone ?? 'None pending'}>
            {projects[0]?.nextMilestone ?? '—'}
          </p>
          <p className="mt-1 text-xs text-stone-600">{clientPortal.keyDeliveryEvent}</p>
        </div>
      </section>

      {/* Concise Assigned Projects Section */}
      <section id="portal-section-projects" aria-labelledby="client-projects-title">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="client-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {clientPortal.yourProjects}
            </h2>
            <p className="mt-1 text-xs text-stone-600">{projects.length} {clientPortal.developmentsInScope}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/projects')}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-600 hover:text-black"
          >
            <span>{clientPortal.viewAllProjects}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {projects.slice(0, 3).map((project) => (
              <article key={project.id} className="grid gap-5 py-5 sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-center">
                <ProjectIdentityButton
                  project={project}
                  onNavigate={navigate}
                  detailPath={(id) => `/dashboard/projects/${id}`}
                  testId={`dashboard-project-${project.id}`}
                  meta={<>{project.phase} · {project.progress}% {portalCommon.complete}</>}
                />
                <div>
                  <p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    <span>{portalCommon.progress}</span>
                    <span>{project.progress}%</span>
                  </p>
                  <div className="portal-progress-track h-px bg-black/15">
                    <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-stone-600">{t('nextLabel', 'Next:')} {project.nextMilestone}</p>
                  {project.approvals.some((approval) => approval.status === 'Pending') && (
                    <p className="portal-status-pending mt-2 font-mono text-[9px] uppercase tracking-[0.12em]">
                      {clientPortal.pendingDecision}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 sm:justify-end">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    className="border border-black/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]"
                  >
                    {portalCommon.openProject}
                  </button>
                  <button
                    onClick={() => navigate('/workspace')}
                    className="bg-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white"
                  >
                    {portalCommon.open3DModel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PortalEmptyState message={t('noAssignedProjects', 'No active projects assigned to your account.')} />
        )}
      </section>

      {/* Decisions & Milestones summary */}
      <section className="grid gap-12 border-t border-black/15 py-10 lg:grid-cols-2" aria-label={t('decisionsAria', 'Client decisions')}>
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('decisionsAttention', 'Decisions requiring your attention')}</p>
            <button
              onClick={() => navigate('/dashboard/approvals')}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500 hover:text-black"
            >
              {t('allApprovals', 'All approvals →')}
            </button>
          </div>
          {pendingApprovals.length ? (
            pendingApprovals.slice(0, 3).map((approval) => (
              <div key={`${approval.projectId}-${approval.title}`} className="mt-5 border-b border-black/10 pb-4">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-serif text-xl">{approval.title}</p>
                    <p className="mt-1 text-xs text-stone-500">{approval.projectTitle}</p>
                  </div>
                  <span className="portal-status-pending font-mono text-[9px] uppercase tracking-[0.14em]">{t('pending', 'Pending')}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Approved')}
                    className="bg-black px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white"
                  >
                    {t('approve', 'Approve')}
                  </button>
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Rejected')}
                    className="border border-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em]"
                  >
                    {t('requestChanges', 'Request changes')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="mt-5 text-sm text-stone-600">{t('noDecisionsWaiting', 'No decisions are waiting for you.')}</p>
          )}
          {operationFeedback && (
            <p role={operationFailed ? 'alert' : 'status'} className="mt-3 text-sm text-stone-600">
              {operationFeedback}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('upcomingMilestones', 'Upcoming milestones')}</p>
            <span className="font-mono text-[9px] uppercase text-stone-500">{t('activeRoadmap', 'Active roadmap')}</span>
          </div>
          {upcomingMilestones.length ? (
            upcomingMilestones.slice(0, 4).map((milestone) => (
              <p key={`${milestone.projectId}-${milestone.label}`} className="mt-5 flex justify-between gap-5 border-b border-black/10 pb-3 text-sm">
                <span>{milestone.projectTitle} · {milestone.label}</span>
                <span className="font-mono text-[9px] uppercase text-stone-500">{t('upcoming', 'Upcoming')}</span>
              </p>
            ))
          ) : (
            <p className="mt-5 text-sm text-stone-600">{t('milestonesAppear', 'Milestones will appear here as projects advance.')}</p>
          )}
        </div>
      </section>

      {/* Recent Updates & Notifications */}
      <section className="grid gap-12 border-t border-black/15 py-10 lg:grid-cols-2">
        <div id="portal-section-updates">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('recentUpdates', 'Recent project updates')}</p>
          {updates.length ? (
            updates.map((update) => (
              <button
                key={`${update.projectId}-${update.date}-${update.title}`}
                onClick={() => navigate(`/dashboard/projects/${update.projectId}`)}
                className="mt-5 block w-full border-b border-black/10 pb-4 text-left hover:text-stone-700"
              >
                <span className="font-mono text-[10px] text-stone-500">{update.date} · {update.projectTitle}</span>
                <span className="mt-1 block font-serif text-xl">{update.title}</span>
                <span className="mt-1 block text-xs leading-5 text-stone-600">{update.body}</span>
              </button>
            ))
          ) : (
            <p className="mt-5 text-sm text-stone-600">{t('noRecentUpdates', 'No recent updates.')}</p>
          )}
        </div>

        <div id="portal-section-notifications">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('notifications', 'Notifications')}</p>
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={`${notification.date}-${notification.message}`}
                onClick={() => navigate(`/dashboard/projects/${notification.projectId}`)}
                className="mt-5 flex w-full justify-between gap-5 border-b border-black/10 pb-4 text-left text-sm hover:text-stone-700"
              >
                <span>{notification.message}</span>
                <span className="shrink-0 font-mono text-[9px] text-stone-500">{notification.date} · {t('open', 'Open')}</span>
              </button>
            ))
          ) : (
            <p className="mt-5 text-sm text-stone-600">{t('upToDate', 'You are up to date.')}</p>
          )}
        </div>
      </section>

      {/* Deeper Workspaces Grid */}
      <section className="border-t border-black/15 pt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('workspacesAndServices', 'Workspaces & services')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Layers className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('projectRegister', 'Project Register')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('projectRegisterDesc', 'Full portfolio of assigned developments and details.')}</p>
          </button>

          <button
            onClick={() => navigate('/dashboard/documents')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <FileText className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('documentVault', 'Document Vault')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('documentVaultDesc', 'Aggregated deliverables, specs and official references.')}</p>
          </button>

          <button
            onClick={() => navigate('/dashboard/approvals')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <CheckCircle2 className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('approvals', 'Approvals')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('approvalsDesc', 'Dedicated decision queue and change requests.')}</p>
          </button>

          <button
            onClick={() => navigate('/dashboard/assistant')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Sparkles className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('aiAssistant', 'AI Assistant')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('aiAssistantDesc', 'Natural language BIM intelligence and model queries.')}</p>
          </button>
        </div>
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

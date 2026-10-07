import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Layers, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPortalUser, getProjectsForUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, ProjectIdentityButton, PortalEmptyState, portalStatusClass } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import {
  getLocalizedApprovalTitle,
  getLocalizedMilestoneLabel,
  getLocalizedMilestoneStatus,
  getLocalizedProjectField,
  getLocalizedUpdate,
} from '../../../portal/showcaseLocalization';

export const ArchitectOverviewPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('architect');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal, clientPortal, portalCommon } = useLocale();

  const [, setRemoteVersion] = useState(0);
  const architect = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');
  const projectsForReview = projects.filter((project) =>
    project.approvals.some((approval) => approval.status === 'Pending'),
  );
  const averageProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
    : 0;
  const milestones = projects.flatMap((project) =>
    project.milestones
      .filter((milestone) => milestone.status !== 'Complete')
      .map((milestone) => ({ ...milestone, projectTitle: project.title })),
  );
  const approvals = projects.flatMap((project) =>
    project.approvals
      .filter((approval) => approval.status === 'Pending')
      .map((approval) => ({ ...approval, projectTitle: project.title })),
  );
  const activity = projects
    .flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title })))
    .slice(0, 3);

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(() =>
      setRemoteVersion((version) => version + 1),
    );
  }, []);

  const content = (
    <div className="space-y-12">
      {/* Header section */}
      <div className="grid gap-6 border-b border-[var(--portal-border)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--portal-muted)]">
            {architectPortal.overviewEyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-light tracking-tight sm:text-6xl text-[var(--portal-text)]">
            {architectPortal.overviewHeading}
          </h1>
        </div>
        <p className="max-w-md font-mono text-xs leading-relaxed text-[var(--portal-muted)]">
          {architectPortal.overviewSubtitle}
        </p>
      </div>

      {/* Workload Tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('workloadAria', 'Architect workload')}>
        <button
          type="button"
          onClick={() => navigate('/architect/projects')}
          className="portal-overview-tile group flex flex-col justify-between rounded-sm p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{architectPortal.assignedWorkload}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('studioBadge', 'STUDIO')}</span>
          </div>
          <p className="my-4 font-serif text-4xl font-light tracking-tight text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {projects.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--portal-accent)]" />
            <span>{architectPortal.activeProjects}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/architect/insights')}
          className="portal-overview-tile group flex flex-col justify-between rounded-sm p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{architectPortal.averageProgress}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('avgBadge', 'AVG')}</span>
          </div>
          <p className="my-4 font-serif text-4xl font-light tracking-tight text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {averageProgress}%
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--portal-accent)]" />
            <span>{architectPortal.acrossAssignedWork}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/architect/approvals')}
          className="portal-overview-tile group flex flex-col justify-between rounded-sm p-5 text-left transition-all hover:border-[var(--portal-accent)] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{architectPortal.clientDecisions}</span>
            <span className={`h-2 w-2 rounded-full ${approvals.length > 0 ? 'bg-[#FFBF00]' : 'bg-[var(--portal-accent)]'}`} />
          </div>
          <p className="my-4 font-serif text-4xl font-light tracking-tight text-[var(--portal-text)] group-hover:text-[var(--portal-accent)] transition-colors">
            {approvals.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span>{architectPortal.responsesPending}</span>
          </p>
        </button>

        <div className="portal-overview-tile flex flex-col justify-between rounded-sm p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{architectPortal.nextMilestones}</span>
            <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-60">{t('queueBadge', 'QUEUE')}</span>
          </div>
          <p className="my-4 font-serif text-4xl font-light tracking-tight text-[var(--portal-text)]">
            {milestones.length.toString().padStart(2, '0')}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
            <span>{architectPortal.inActiveSequence}</span>
          </p>
        </div>
      </section>

      {/* Top Assigned Projects Section */}
      <section id="portal-section-projects" aria-labelledby="architect-projects-title">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="architect-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--portal-muted)]">
              {architectPortal.assignedProjects}
            </h2>
            <span className="font-mono text-[10px] text-[var(--portal-muted)]">
              {t('activeAndPending', '{{active}} active · {{pending}} decisions pending', {
                active: projects.length.toString().padStart(2, '0'),
                pending: projectsForReview.length.toString().padStart(2, '0'),
              })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/architect/projects')}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portal-muted)] hover:text-[var(--portal-text)]"
          >
            <span>{clientPortal.viewAllProjects}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length ? (
          <div className="divide-y divide-[var(--portal-border)] border-y border-[var(--portal-border)]">
            {projects.slice(0, 3).map((project) => (
              <article key={project.id} className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_170px_auto] lg:items-center">
                <ProjectIdentityButton
                  project={project}
                  onNavigate={navigate}
                  detailPath={(id) => `/architect/projects/${id}`}
                  meta={<>{getLocalizedProjectField(project.id, 'phase', project.phase)} · {project.progress}%</>}
                />
                <div>
                  <p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--portal-muted)]">
                    <span>{portalCommon.progress}</span>
                    <span>{project.progress}%</span>
                  </p>
                  <div className="portal-progress-track h-1 bg-[var(--portal-border)] overflow-hidden rounded-full">
                    <div className="portal-progress-fill h-1 bg-[var(--portal-accent)]" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-[var(--portal-muted)]">{t('nextLabel', 'Next:')} {getLocalizedProjectField(project.id, 'nextMilestone', project.nextMilestone)}</p>
                  {project.approvals.some((approval) => approval.status === 'Pending') && (
                    <p className="portal-status-pending mt-2 font-mono text-[9px] uppercase">
                      {t('clientResponsePending', 'Client response pending')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    onClick={() => navigate(`/architect/projects/${project.id}`)}
                    className="border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--portal-text)] hover:border-[var(--portal-accent)] transition-colors"
                  >
                    {portalCommon.openProject}
                  </button>
                  <button
                    onClick={() => navigate('/workspace')}
                    className="bg-[var(--portal-text)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--portal-surface)] hover:opacity-90 transition-opacity"
                  >
                    {portalCommon.open3DModel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PortalEmptyState message={t('noProjectsStudio', 'No projects currently assigned to this studio.')} />
        )}
      </section>

      {/* Decisions, Milestones & Approvals preview */}
      <section id="portal-section-activity" className="grid gap-8 border-t border-[var(--portal-border)] pt-10 lg:grid-cols-3">
        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('decisionsReview', 'Decisions requiring review')}</p>
          {projectsForReview.length ? (
            projectsForReview.map((project) => (
              <button
                key={project.id}
                data-testid={`architect-review-${project.id}`}
                onClick={() => navigate(`/architect/projects/${project.id}`)}
                className="mt-4 block w-full text-left font-serif text-xl text-[var(--portal-text)] hover:text-[var(--portal-accent)] transition-colors border-b border-[var(--portal-border)] pb-2 last:border-0"
              >
                {project.title}
              </button>
            ))
          ) : (
            <p className="mt-4 text-sm text-[var(--portal-muted)]">{t('noDecisionsWaitingReview', 'No project decisions are waiting for review.')}</p>
          )}
        </div>

        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('upcomingMilestones', 'Upcoming milestones')}</p>
          {milestones.slice(0, 3).map((milestone) => (
            <button
              key={`${milestone.projectId}-${milestone.label}`}
              onClick={() => navigate(`/architect/projects/${milestone.projectId}`)}
              className="mt-4 flex w-full justify-between gap-4 text-left text-sm text-[var(--portal-text)] hover:text-[var(--portal-accent)] transition-colors border-b border-[var(--portal-border)] pb-2 last:border-0"
            >
              <span className="truncate">{milestone.projectTitle} · {getLocalizedMilestoneLabel(milestone.label, milestone.projectId)}</span>
              <span className={`${portalStatusClass(milestone.status)} shrink-0 font-mono text-[9px] uppercase`}>
                {getLocalizedMilestoneStatus(milestone.status)}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('pendingClientApprovals', 'Pending client approvals')}</p>
          {approvals.slice(0, 3).map((approval) => (
            <button
              key={`${approval.projectId}-${approval.title}`}
              data-testid={`architect-approval-${approval.projectId}`}
              onClick={() => navigate(`/architect/projects/${approval.projectId}`)}
              className="mt-4 block w-full text-left text-sm text-[var(--portal-text)] hover:text-[var(--portal-accent)] transition-colors border-b border-[var(--portal-border)] pb-2 last:border-0 truncate"
            >
              {approval.projectTitle} · {getLocalizedApprovalTitle(approval.title, approval.projectId)}
            </button>
          ))}
        </div>
      </section>

      {/* Activity preview */}
      {activity.length > 0 && (
        <section className="border-t border-[var(--portal-border)] pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('recentStudioActivity', 'Recent studio activity')}</p>
          <div className="mt-4 divide-y divide-[var(--portal-border)] border-y border-[var(--portal-border)]">
            {activity.map((update) => (
              <button
                key={`${update.projectId}-${update.date}-${update.title}`}
                onClick={() => navigate(`/architect/projects/${update.projectId}`)}
                className="flex w-full justify-between gap-4 py-3 text-left text-sm text-[var(--portal-text)] hover:text-[var(--portal-accent)] transition-colors"
              >
                <span>{update.projectTitle} · {getLocalizedUpdate(update).title}</span>
                <span className="font-mono text-[9px] text-[var(--portal-muted)]">{update.date}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Deeper Workspaces Grid */}
      <section className="border-t border-[var(--portal-border)] pt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--portal-muted)]">{t('architectWorkspaces', 'Architect workspaces')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/architect/projects')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <Layers className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-xl text-[var(--portal-text)]">{t('projectRegister', 'Project Register')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('projectRegisterDesc', 'Full assigned project register and 3D CAD models.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/approvals')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <CheckCircle2 className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-xl text-[var(--portal-text)]">{t('clientDecisions', 'Client Decisions')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('clientDecisionsDesc', 'Approval queue and coordination sign-offs.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/documents')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <FileText className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-xl text-[var(--portal-text)]">{t('deliverables', 'Deliverables')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('deliverablesDesc', 'Technical drawings, specs, and issued packages.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/assistant')}
            className="group rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-5 text-left transition-all hover:border-[var(--portal-accent)]"
          >
            <Sparkles className="h-5 w-5 text-[var(--portal-muted)] group-hover:text-[var(--portal-accent)] transition-colors" />
            <p className="mt-4 font-serif text-xl text-[var(--portal-text)]">{t('bimAssistant', 'BIM Assistant')}</p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">{t('bimAssistantDesc', 'Generative massing plans, spatial search and tools.')}</p>
          </button>
        </div>
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

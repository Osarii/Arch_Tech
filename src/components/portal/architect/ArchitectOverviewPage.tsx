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
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {architectPortal.overviewEyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">
          {architectPortal.overviewHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {architectPortal.overviewSubtitle}
        </p>
      </div>

      {/* Workload Tiles */}
      <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('workloadAria', 'Architect workload')}>
        <button
          type="button"
          onClick={() => navigate('/architect/projects')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{architectPortal.assignedWorkload}</p>
          <p className="mt-3 font-serif text-3xl">{projects.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{architectPortal.activeProjects}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/architect/insights')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{architectPortal.averageProgress}</p>
          <p className="mt-3 font-serif text-3xl">{averageProgress}%</p>
          <p className="mt-1 text-xs text-stone-600">{architectPortal.acrossAssignedWork}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/architect/approvals')}
          className="portal-overview-tile bg-[#E6DED2] p-5 text-left transition-colors hover:bg-[#ded4c6]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{architectPortal.clientDecisions}</p>
          <p className="mt-3 font-serif text-3xl">{approvals.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{architectPortal.responsesPending}</p>
        </button>

        <div className="portal-overview-tile bg-[#E6DED2] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">{architectPortal.nextMilestones}</p>
          <p className="mt-3 font-serif text-3xl">{milestones.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-xs text-stone-600">{architectPortal.inActiveSequence}</p>
        </div>
      </section>

      {/* Top Assigned Projects Section */}
      <section id="portal-section-projects" aria-labelledby="architect-projects-title">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="architect-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {architectPortal.assignedProjects}
            </h2>
            <span className="font-mono text-[10px] text-stone-500">
              {t('activeAndPending', '{{active}} active · {{pending}} decisions pending', {
                active: projects.length.toString().padStart(2, '0'),
                pending: projectsForReview.length.toString().padStart(2, '0'),
              })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/architect/projects')}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-600 hover:text-black"
          >
            <span>{clientPortal.viewAllProjects}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {projects.slice(0, 3).map((project) => (
              <article key={project.id} className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_170px_auto] lg:items-center">
                <ProjectIdentityButton
                  project={project}
                  onNavigate={navigate}
                  detailPath={(id) => `/architect/projects/${id}`}
                  meta={<>{getLocalizedProjectField(project.id, 'phase', project.phase)} · {project.progress}%</>}
                />
                <div>
                  <p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    <span>{portalCommon.progress}</span>
                    <span>{project.progress}%</span>
                  </p>
                  <div className="portal-progress-track h-px bg-black/15">
                    <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-stone-600">{t('nextLabel', 'Next:')} {getLocalizedProjectField(project.id, 'nextMilestone', project.nextMilestone)}</p>
                  {project.approvals.some((approval) => approval.status === 'Pending') && (
                    <p className="portal-status-pending mt-2 font-mono text-[9px] uppercase">
                      {t('clientResponsePending', 'Client response pending')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    onClick={() => navigate(`/architect/projects/${project.id}`)}
                    className="border border-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]"
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
          <PortalEmptyState message={t('noProjectsStudio', 'No projects currently assigned to this studio.')} />
        )}
      </section>

      {/* Decisions, Milestones & Approvals preview */}
      <section id="portal-section-activity" className="grid gap-10 border-t border-black/15 pt-10 lg:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('decisionsReview', 'Decisions requiring review')}</p>
          {projectsForReview.length ? (
            projectsForReview.map((project) => (
              <button
                key={project.id}
                data-testid={`architect-review-${project.id}`}
                onClick={() => navigate(`/architect/projects/${project.id}`)}
                className="mt-4 block w-full text-left font-serif text-2xl hover:text-stone-500"
              >
                {project.title}
              </button>
            ))
          ) : (
            <p className="mt-4 text-sm text-stone-600">{t('noDecisionsWaitingReview', 'No project decisions are waiting for review.')}</p>
          )}
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('upcomingMilestones', 'Upcoming milestones')}</p>
          {milestones.slice(0, 3).map((milestone) => (
            <button
              key={`${milestone.projectId}-${milestone.label}`}
              onClick={() => navigate(`/architect/projects/${milestone.projectId}`)}
              className="mt-4 flex w-full justify-between gap-4 text-left text-sm hover:text-stone-500 border-b border-black/10 pb-2"
            >
              <span>{milestone.projectTitle} · {getLocalizedMilestoneLabel(milestone.label, milestone.projectId)}</span>
              <span className={`${portalStatusClass(milestone.status)} font-mono text-[9px] uppercase text-stone-500`}>
                {getLocalizedMilestoneStatus(milestone.status)}
              </span>
            </button>
          ))}
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('pendingClientApprovals', 'Pending client approvals')}</p>
          {approvals.slice(0, 3).map((approval) => (
            <button
              key={`${approval.projectId}-${approval.title}`}
              data-testid={`architect-approval-${approval.projectId}`}
              onClick={() => navigate(`/architect/projects/${approval.projectId}`)}
              className="mt-4 block w-full text-left text-sm hover:text-stone-500 border-b border-black/10 pb-2"
            >
              {approval.projectTitle} · {getLocalizedApprovalTitle(approval.title, approval.projectId)}
            </button>
          ))}
        </div>
      </section>

      {/* Activity preview */}
      {activity.length > 0 && (
        <section className="border-t border-black/15 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('recentStudioActivity', 'Recent studio activity')}</p>
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
            {activity.map((update) => (
              <button
                key={`${update.projectId}-${update.date}-${update.title}`}
                onClick={() => navigate(`/architect/projects/${update.projectId}`)}
                className="flex w-full justify-between gap-4 py-3 text-left text-sm hover:text-stone-500"
              >
                <span>{update.projectTitle} · {getLocalizedUpdate(update).title}</span>
                <span className="font-mono text-[9px] text-stone-500">{update.date}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Deeper Workspaces Grid */}
      <section className="border-t border-black/15 pt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('architectWorkspaces', 'Architect workspaces')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/architect/projects')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Layers className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('projectRegister', 'Project Register')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('projectRegisterDesc', 'Full assigned project register and 3D CAD models.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/approvals')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <CheckCircle2 className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('clientDecisions', 'Client Decisions')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('clientDecisionsDesc', 'Approval queue and coordination sign-offs.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/documents')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <FileText className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('deliverables', 'Deliverables')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('deliverablesDesc', 'Technical drawings, specs, and issued packages.')}</p>
          </button>

          <button
            onClick={() => navigate('/architect/assistant')}
            className="border border-black/15 bg-white/40 p-5 text-left transition-colors hover:bg-white/70"
          >
            <Sparkles className="h-5 w-5 text-stone-600" />
            <p className="mt-4 font-serif text-xl">{t('bimAssistant', 'BIM Assistant')}</p>
            <p className="mt-1 text-xs text-stone-600">{t('bimAssistantDesc', 'Generative massing plans, spatial search and tools.')}</p>
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

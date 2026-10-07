import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot, getPortalUser, getProjectsForUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { projectWorkflowService } from '../../../services/projectWorkflowService';
import { userService } from '../../../services/userService';
import { NavigationProps, PortalEmptyState, portalStatusClass } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const ArchitectApprovalsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('architect');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal } = useLocale();

  const [, setSnapshot] = useState(getPortalSnapshot);
  const [operationFeedback, setOperationFeedback] = useState('');
  const [operationFailed, setOperationFailed] = useState(false);

  const architect = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');
  const projectsForReview = projects.filter((project) =>
    project.approvals.some((approval) => approval.status === 'Pending'),
  );
  const approvals = projects.flatMap((project) =>
    project.approvals.map((approval) => ({
      ...approval,
      projectTitle: project.title,
      projectCode: project.code,
    })),
  );

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
  const resolvedApprovals = approvals.filter((a) => a.status !== 'Pending');

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const respondToApproval = async (
    projectId: string,
    title: string,
    status: 'Approved' | 'Pending',
  ) => {
    try {
      const updated = await projectWorkflowService.updateApproval(projectId, title, status);
      if (!updated) throw new Error(t('approvalReadBackError', 'Approval could not be read back after saving.'));
      setOperationFailed(false);
      setOperationFeedback(status === 'Approved' ? t('approvalResolved', 'Approval marked as resolved.') : t('approvalReopened', 'Approval reopened.'));
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : t('approvalUpdateError', 'Approval could not be updated.'));
    }
  };

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {architectPortal.approvalsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {architectPortal.approvalsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {architectPortal.approvalsSubtitle}
        </p>
      </div>

      {operationFeedback && (
        <div
          role={operationFailed ? 'alert' : 'status'}
          className={`border px-4 py-3 text-sm ${
            operationFailed
              ? 'border-red-400 bg-red-50 text-red-800'
              : 'border-emerald-400 bg-emerald-50 text-emerald-900'
          }`}
        >
          {operationFeedback}
        </div>
      )}

      {/* Decisions requiring review by project */}
      <section aria-labelledby="architect-review-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="architect-review-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('projectsAwaitingDecisions', 'Projects awaiting client decisions')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('projectsCount', '{{count}} projects', { count: projectsForReview.length })}
          </span>
        </div>

        {projectsForReview.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsForReview.map((project) => (
              <div key={project.id} className="border border-black/15 bg-white/40 p-5">
                <button
                  data-testid={`architect-review-${project.id}`}
                  onClick={() => navigate(`/architect/projects/${project.id}`)}
                  className="block w-full text-left font-serif text-2xl hover:text-stone-500"
                >
                  {project.title}
                </button>
                <p className="mt-2 text-xs text-stone-600">
                  {t('decisionsPendingReviewCount', '{{count}} decision(s) pending client review', {
                    count: project.approvals.filter((a) => a.status === 'Pending').length,
                  })}
                </p>
                <button
                  onClick={() => navigate(`/architect/projects/${project.id}`)}
                  className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-600 hover:text-black"
                >
                  <span>{t('openDossier', 'Open dossier →')}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-600">{t('noDecisionsWaitingReview', 'No project decisions are waiting for review.')}</p>
        )}
      </section>

      {/* Pending approvals queue */}
      <section id="portal-section-approvals" aria-labelledby="architect-queue-title" className="border-t border-black/15 pt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="architect-queue-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('pendingApprovalsQueue', 'Pending client approvals queue')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('pendingCount', '{{count}} pending', { count: pendingApprovals.length })}
          </span>
        </div>

        {pendingApprovals.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {pendingApprovals.map((approval) => (
              <div
                key={`${approval.projectId}-${approval.title}`}
                className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <button
                    data-testid={`architect-approval-${approval.projectId}`}
                    onClick={() => navigate(`/architect/projects/${approval.projectId}`)}
                    className="block text-left font-serif text-2xl hover:text-stone-500"
                  >
                    {approval.projectTitle} · {approval.title}
                  </button>
                  <p className="mt-1 text-xs text-stone-500">
                    {approval.projectCode} · {t('clientResponsePending', 'Client response pending')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="portal-status-pending font-mono text-[9px] uppercase tracking-[0.12em]">
                    {t('pending', 'Pending')}
                  </span>
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Approved')}
                    className="border border-black px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
                  >
                    {t('resolve', 'Resolve')}
                  </button>
                  <button
                    onClick={() => navigate(`/architect/projects/${approval.projectId}`)}
                    className="border border-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:border-black"
                  >
                    {t('view', 'View')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState message={t('allClientDecisionsResolved', 'All client decisions across your studio projects have been resolved.')} />
        )}
      </section>

      {/* Resolved approvals list */}
      <section className="border-t border-black/15 pt-10" aria-labelledby="architect-resolved-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="architect-resolved-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('resolvedApprovalsHistory', 'Resolved approvals history')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('recordedCount', '{{count}} recorded', { count: resolvedApprovals.length })}
          </span>
        </div>

        {resolvedApprovals.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {resolvedApprovals.map((approval) => (
              <div
                key={`${approval.projectId}-${approval.title}`}
                className="flex items-center justify-between gap-4 py-4 text-sm"
              >
                <div>
                  <span className="font-serif text-lg">{approval.title}</span>
                  <span className="ml-3 font-mono text-[10px] text-stone-500">{approval.projectTitle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${portalStatusClass(approval.status)} font-mono text-[9px] uppercase tracking-[0.14em]`}>
                    {approval.status}
                  </span>
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Pending')}
                    className="font-mono text-[9px] uppercase text-stone-500 hover:text-black"
                  >
                    {t('reopen', 'Reopen')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-600">{t('noResolvedApprovalsRecorded', 'No resolved approvals recorded yet.')}</p>
        )}
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

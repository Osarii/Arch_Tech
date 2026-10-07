import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot } from '../../../portal/data';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, PortalEmptyState, portalStatusClass } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { getLocalizedApprovalTitle, getLocalizedNotificationMessage } from '../../../portal/showcaseLocalization';

export const AdminApprovalsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('admin');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);

  const pendingApprovals = db.approvals
    .filter((approval) => approval.status === 'Pending' && activeProjects.some((p) => p.id === approval.projectId))
    .map((approval) => ({
      ...approval,
      projectTitle: activeProjects.find((p) => p.id === approval.projectId)?.title ?? approval.projectId,
    }));

  const allApprovals = db.approvals.map((approval) => ({
    ...approval,
    projectTitle: activeProjects.find((p) => p.id === approval.projectId)?.title ?? approval.projectId,
  }));

  const notifications = db.notifications;

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {adminPortal.approvalsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {adminPortal.approvalsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {adminPortal.approvalsSubtitle}
        </p>
      </div>

      {/* Pending approvals queue */}
      <section id="portal-section-approvals" aria-labelledby="admin-pending-approvals-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="admin-pending-approvals-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('pendingProjectReviews', 'Pending project reviews')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('awaitingActionCount', '{{count}} awaiting action', {
              count: pendingApprovals.length,
            })}
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
                    onClick={() => navigate(`/admin/projects/${approval.projectId}`)}
                    className="text-left font-serif text-2xl hover:text-stone-500"
                  >
                    {approval.projectTitle} · {getLocalizedApprovalTitle(approval.title, approval.projectId)}
                  </button>
                  <p className="mt-1 text-xs text-stone-500">
                    {t('decisionPendingWorkflow', 'Decision pending in development workflow')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="portal-status-pending font-mono text-[9px] uppercase tracking-[0.14em]">
                    {t('pending', 'Pending')}
                  </span>
                  <button
                    onClick={() => navigate(`/admin/projects/${approval.projectId}`)}
                    className="border border-black px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
                  >
                    {t('review', 'Review')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState message={t('noProjectDecisionsWaiting', 'No project decisions are currently waiting for review.')} />
        )}
      </section>

      {/* Global Approvals Register & Notifications */}
      <section className="grid gap-12 border-t border-black/15 pt-10 lg:grid-cols-2">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {t('globalApprovalsRegister', 'Global approvals register')}
            </h2>
            <span className="font-mono text-[9px] uppercase text-stone-500">
              {t('totalCount', '{{count}} total', { count: allApprovals.length })}
            </span>
          </div>
          <div className="divide-y divide-black/10 border-y border-black/10">
            {allApprovals.map((approval) => (
              <div
                key={`${approval.projectId}-${approval.title}`}
                className="flex items-center justify-between gap-4 py-3.5 text-sm"
              >
                <div>
                  <span className="font-serif text-lg">{getLocalizedApprovalTitle(approval.title, approval.projectId)}</span>
                  <span className="ml-3 font-mono text-[10px] text-stone-500">{approval.projectTitle}</span>
                </div>
                <span className={`${portalStatusClass(approval.status)} font-mono text-[9px] uppercase tracking-[0.12em]`}>
                  {approval.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {t('platformNotificationContext', 'Platform notification context')}
            </h2>
            <span className="font-mono text-[9px] uppercase text-stone-500">{t('auditLog', 'Audit log')}</span>
          </div>
          <div className="divide-y divide-black/10 border-y border-black/10">
            {notifications.map((notification) => (
              <div
                key={`${notification.userId}-${notification.date}-${notification.message}`}
                className="flex items-start justify-between gap-4 py-3 text-sm"
              >
                <span className="leading-snug text-stone-700">{getLocalizedNotificationMessage(notification.message)}</span>
                <span className="shrink-0 font-mono text-[9px] text-stone-500">{notification.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
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

import React, { useEffect, useState } from 'react';
import { getPortalSnapshot, getPortalUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { projectService } from '../../../services/projectService';
import { projectWorkflowService } from '../../../services/projectWorkflowService';
import { userService } from '../../../services/userService';
import { NavigationProps, PortalEmptyState, portalStatusClass } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export const ClientApprovalsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { clientPortal } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [operationFeedback, setOperationFeedback] = useState('');
  const [operationFailed, setOperationFailed] = useState(false);

  const client = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = snapshot.projects.filter(
    (project) => !project.archived && client?.projectIds.includes(project.id),
  );

  const pendingApprovals = projects.flatMap((project) =>
    project.approvals
      .filter((approval) => approval.status === 'Pending')
      .map((approval) => ({ ...approval, projectTitle: project.title, projectCode: project.code })),
  );

  const resolvedApprovals = projects.flatMap((project) =>
    project.approvals
      .filter((approval) => approval.status !== 'Pending')
      .map((approval) => ({ ...approval, projectTitle: project.title, projectCode: project.code })),
  );

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const respondToApproval = async (projectId: string, title: string, status: 'Approved' | 'Rejected') => {
    try {
      const updated = await projectWorkflowService.updateApproval(projectId, title, status);
      if (!updated) throw new Error('Approval could not be read back after saving.');
      setOperationFailed(false);
      setOperationFeedback(status === 'Approved' ? 'Approval recorded.' : 'Changes requested.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Approval could not be saved.');
    }
  };

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {clientPortal.approvalsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {clientPortal.approvalsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {clientPortal.approvalsSubtitle}
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

      {/* Pending decisions section */}
      <section aria-labelledby="pending-approvals-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="pending-approvals-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            Pending client decisions
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {pendingApprovals.length.toString().padStart(2, '0')} requiring attention
          </span>
        </div>

        {pendingApprovals.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {pendingApprovals.map((approval) => (
              <div
                key={`${approval.projectId}-${approval.title}`}
                className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="portal-status-pending font-mono text-[9px] uppercase tracking-[0.14em]">
                      Pending response
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">
                      {approval.projectTitle} ({approval.projectCode})
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-3xl">{approval.title}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    Decision required to advance this project milestone into the active documentation queue.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Approved')}
                    className="bg-black px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white hover:bg-stone-800"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => respondToApproval(approval.projectId, approval.title, 'Rejected')}
                    className="border border-black/20 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] hover:border-black"
                  >
                    Request changes
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${approval.projectId}`)}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500 hover:text-black ml-2"
                  >
                    View dossier →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState message="No decisions are currently waiting for your attention." />
        )}
      </section>

      {/* Resolved decisions history */}
      <section className="border-t border-black/15 pt-10" aria-labelledby="resolved-approvals-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="resolved-approvals-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            Resolved decisions history
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {resolvedApprovals.length.toString().padStart(2, '0')} recorded
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
                <span className={`${portalStatusClass(approval.status)} font-mono text-[9px] uppercase tracking-[0.14em]`}>
                  {approval.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-600">No resolved approvals recorded yet.</p>
        )}
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

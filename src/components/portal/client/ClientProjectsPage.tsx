import React, { useEffect, useState } from 'react';
import { getPortalSnapshot, getPortalUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, ProjectIdentityButton, PortalEmptyState } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const ClientProjectsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
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

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          Client workspace / Projects
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          Assigned projects.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          Full register of active developments currently assigned to your organization, with progress, milestones, and 3D models.
        </p>
      </div>

      <section id="portal-section-projects" aria-labelledby="client-projects-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="client-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            Project register
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {projects.length.toString().padStart(2, '0')} active developments
          </span>
        </div>

        {projects.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {projects.map((project) => (
              <article
                key={project.id}
                className="grid gap-5 py-6 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center"
              >
                <ProjectIdentityButton
                  project={project}
                  onNavigate={navigate}
                  detailPath={(id) => `/dashboard/projects/${id}`}
                  testId={`dashboard-project-${project.id}`}
                  meta={<>{project.phase} · {project.progress}% complete</>}
                />
                <div>
                  <p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </p>
                  <div className="portal-progress-track h-px bg-black/15">
                    <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-stone-600">Next: {project.nextMilestone}</p>
                  {project.approvals.some((approval) => approval.status === 'Pending') && (
                    <p className="portal-status-pending mt-2 font-mono text-[9px] uppercase tracking-[0.12em]">
                      Pending decision
                    </p>
                  )}
                </div>
                <div className="flex gap-3 sm:justify-end">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    className="border border-black/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] hover:border-black"
                  >
                    Open project
                  </button>
                  <button
                    onClick={() => navigate('/workspace')}
                    className="bg-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white hover:bg-stone-800"
                  >
                    3D model
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PortalEmptyState message="No active projects assigned to your account." />
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

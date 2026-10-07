import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPortalUser, getProjectsForUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, ProjectIdentityButton, PortalEmptyState } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const ArchitectProjectsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('architect');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal, portalCommon } = useLocale();

  const [, setRemoteVersion] = useState(0);
  const architect = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');
  const projectsForReview = projects.filter((project) =>
    project.approvals.some((approval) => approval.status === 'Pending'),
  );

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(() =>
      setRemoteVersion((version) => version + 1),
    );
  }, []);

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {architectPortal.projectsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {architectPortal.projectsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {architectPortal.projectsSubtitle}
        </p>
      </div>

      <section id="portal-section-projects" aria-labelledby="architect-projects-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="architect-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('assignedProjectRegister', 'Assigned project register')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('activeAndPending', '{{active}} active · {{pending}} decisions pending', {
              active: projects.length.toString().padStart(2, '0'),
              pending: projectsForReview.length.toString().padStart(2, '0'),
            })}
          </span>
        </div>

        {projects.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {projects.map((project) => (
              <article
                key={project.id}
                className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_170px_auto] lg:items-center"
              >
                <ProjectIdentityButton
                  project={project}
                  onNavigate={navigate}
                  detailPath={(id) => `/architect/projects/${id}`}
                  meta={<>{project.phase} · {project.progress}%</>}
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

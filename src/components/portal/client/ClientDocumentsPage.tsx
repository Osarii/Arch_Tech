import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { getPortalSnapshot, getPortalUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, PortalEmptyState } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export const ClientDocumentsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { clientPortal, portalCommon } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const client = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = snapshot.projects.filter(
    (project) => !project.archived && client?.projectIds.includes(project.id),
  );

  const documents = projects.flatMap((project) =>
    project.documents.map((doc) => ({
      ...doc,
      projectId: project.id,
      projectTitle: project.title,
      projectCode: project.code,
    })),
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
          {clientPortal.documentsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {clientPortal.documentsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {clientPortal.documentsSubtitle}
        </p>
      </div>

      <section id="portal-section-documents" aria-labelledby="client-documents-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="client-documents-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            Available deliverables
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {documents.length.toString().padStart(2, '0')} documents issued
          </span>
        </div>

        {documents.length ? (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {documents.map((document) => (
              <div
                key={`${document.projectId}-${document.name}`}
                className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 border border-black/15 bg-white/40 text-stone-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-2xl leading-tight">{document.name}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                      {document.projectTitle} ({document.projectCode}) · {document.meta}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Available</span>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${document.projectId}`)}
                    className="border border-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:border-black"
                  >
                    {portalCommon.openProject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState message="No documents have been issued for your assigned projects yet." />
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

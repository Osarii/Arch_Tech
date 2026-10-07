import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot, getPortalUser, getProjectsForUser } from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps, PortalEmptyState } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const ArchitectDocumentsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('architect');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal, portalCommon } = useLocale();

  const [, setSnapshot] = useState(getPortalSnapshot);
  const architect = getPortalUser(portalAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');

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
          {architectPortal.documentsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {architectPortal.documentsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {architectPortal.documentsSubtitle}
        </p>
      </div>

      <section id="portal-section-documents" aria-labelledby="architect-documents-title">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="architect-documents-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('studioDeliverables', 'Studio deliverables')}
          </h2>
          <span className="font-mono text-[10px] text-stone-500">
            {t('issuedCount', '{{count}} issued', { count: documents.length })}
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
                    <button
                      onClick={() => navigate(`/architect/projects/${document.projectId}`)}
                      className="text-left font-serif text-2xl leading-tight hover:text-stone-500"
                    >
                      {document.name}
                    </button>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                      {`${document.projectTitle} (${document.projectCode}) · ${document.meta}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">{t('issued', 'Issued')}</span>
                  <button
                    onClick={() => navigate(`/architect/projects/${document.projectId}`)}
                    className="border border-black px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
                  >
                    {portalCommon.openProject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PortalEmptyState message={t('noDocumentsIssued', "No documents have been issued for this studio's assigned developments.")} />
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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationProps, PortalAIAssistantView } from '../../components/portal/PortalCommon';
import { PortalShell, usePortalShell } from '../../components/portal/PortalShell';
import { useLocale } from '../../portal/locale';

export const ClientAssistantPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('client');
  const { portalAi } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {t('workspaceEyebrow', 'Client workspace / Assistant')}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            {portalAi.heading}
          </h1>
        </div>
        <p className="max-w-md font-mono text-[11px] text-stone-600 dark:text-stone-400">
          {portalAi.subtitle}
        </p>
      </div>

      <PortalAIAssistantView role="client" onNavigate={navigate} />
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

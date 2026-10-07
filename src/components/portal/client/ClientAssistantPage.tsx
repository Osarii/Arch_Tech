import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationProps, PortalAIAssistantView } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export const ClientAssistantPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('client');
  const { portalAi } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;

  const content = (
    <div className="space-y-10">
      <div className="border-b border-black/15 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {t('workspaceEyebrow', 'Client workspace / Assistant')}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {portalAi.heading}.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
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

import React from 'react';
import { useLocale } from '../../../portal/locale';
import { PortfolioInsightsPanel } from './PortfolioInsightsPanel';
import { NavigationProps, PortalAIAssistantView } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const AdminAssistantPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const content = (
    <div className="space-y-10">
      <div className="border-b border-black/15 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {adminPortal.assistantEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {adminPortal.assistantHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {adminPortal.assistantSubtitle}
        </p>
      </div>

      <PortfolioInsightsPanel onNavigate={navigate} />
      <PortalAIAssistantView role="admin" onNavigate={navigate} />
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

import React from 'react';
import { useLocale } from '../../portal/locale';
import { PortfolioInsightsPanel } from '../../components/portal/admin/PortfolioInsightsPanel';
import { NavigationProps, PortalAIAssistantView } from '../../components/portal/PortalCommon';
import { PortalShell, usePortalShell } from '../../components/portal/PortalShell';

export const AdminAssistantPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const content = (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {adminPortal.assistantEyebrow}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            {adminPortal.assistantHeading}
          </h1>
        </div>
        <p className="max-w-md font-mono text-[11px] text-stone-600 dark:text-stone-400">
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

import React from 'react';
import { useLocale } from '../../../portal/locale';
import { NavigationProps, PortalAIAssistantView } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const ArchitectAssistantPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { architectPortal } = useLocale();

  const content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {architectPortal.assistantEyebrow}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            {architectPortal.assistantHeading}
          </h1>
        </div>
        <p className="max-w-md font-mono text-[11px] text-stone-600 dark:text-stone-400">
          {architectPortal.assistantSubtitle}
        </p>
      </div>

      <PortalAIAssistantView role="architect" onNavigate={navigate} />
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

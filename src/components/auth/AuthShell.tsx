import React from 'react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useTranslation } from 'react-i18next';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ title, description, children }) => {
  const { t } = useTranslation('common');
  return (
  <main className="flex min-h-screen items-center justify-center bg-[#000000] px-5 py-10 font-sans text-[#EDF4ED]">
    <section className="w-full max-w-md border border-[#ABD1B5]/30 bg-[#000000] p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between gap-6 border-b border-[#ABD1B5]/25 pb-5">
        <ArchTechLogo variant="mark" tone="mint-cream" theme="dark" label="GARNIER ARCHITECTURE" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.privateAccess', 'Private access')}</span>
      </div>
      <h1 className="mt-8 font-serif text-5xl font-light tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#ABD1B5]">{description}</p>
      {children}
    </section>
  </main>
  );
};

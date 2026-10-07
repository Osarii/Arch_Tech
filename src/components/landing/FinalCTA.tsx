import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onOpenWorkspace: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenWorkspace }) => {
  const { t } = useTranslation('landing');
  return (
    <section className="py-32 px-6 sm:px-8 lg:px-12 bg-[#090a0d] border-b border-white/[0.08] relative overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 243, 239, 0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* i18next-instrument-ignore */}
        <div className="absolute top-8 left-8 text-stone-600 font-mono text-[10px] select-none">[ REF: SEC-07 ]</div>
        {/* i18next-instrument-ignore */}
        <div className="absolute bottom-8 right-8 text-stone-600 font-mono text-[10px] select-none">[ STATUS: READY ]</div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em]">
          {t('finalCta.eyebrow', 'START WORKING')}
        </div>

        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-light text-[#f4efe8] tracking-tight font-sans">
          {t('finalCta.heading', 'Open your model.')}
        </h2>

        <p className="text-lg sm:text-xl text-stone-400 font-serif font-light max-w-xl mx-auto leading-relaxed">
          {t('finalCta.body', 'Design, inspect and modify IFC models directly in your browser.')}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenWorkspace}
            data-testid="final-cta-btn-open-workspace"
            className="group inline-flex items-center space-x-3 px-8 py-4 bg-[#f4efe8] hover:bg-white text-[#0a0b0d] text-xs font-mono uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.99] shadow-2xl"
          >
            <span>{t('finalCta.enterWorkspace', 'ENTER WORKSPACE')}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </button>
        </div>

        <div className="text-xs font-mono text-stone-400 tracking-wider pt-4">
          {t('finalCta.standards', '100% Client-Side WebAssembly · Open Standard IFC4 & IFC2x3')}
        </div>
      </div>
    </section>
  );
};

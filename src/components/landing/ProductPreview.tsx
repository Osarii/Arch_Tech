import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

interface ProductPreviewProps {
  onOpenWorkspace: () => void;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({ onOpenWorkspace }) => {
  const { t } = useTranslation('landing');
  return (
    <section id="product" className="py-28 px-6 sm:px-8 lg:px-12 bg-[#090a0d] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Index */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08] mb-12">
          <div>
            <div className="text-stone-500 font-mono text-xs uppercase tracking-[0.25em] mb-3">
              {t('productPreview.eyebrow', '01 // THE WORKSPACE')}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#f4efe8] font-sans">
              {t('productPreview.heading', 'One workspace.')} <br />
              <span className="font-serif italic text-stone-300">{t('productPreview.subheading', 'IFC from inspection to export.')}</span>
            </h2>
          </div>
          <button
            onClick={onOpenWorkspace}
            className="group inline-flex items-center space-x-2 text-stone-400 hover:text-stone-100 font-mono text-xs uppercase tracking-[0.18em] transition-colors"
          >
            <span>{t('productPreview.enterWorkspace', 'ENTER WORKSPACE')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Real Workspace Screenshot */}
        <div
          onClick={onOpenWorkspace}
          className="cursor-pointer group relative border border-white/[0.1] bg-[#0c0d12] overflow-hidden"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
            <img
              src="/workspace_preview.png"
              alt={t('productPreview.screenshotAlt', 'Arch_Tech BIM Workspace Screenshot')}
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              loading="lazy"
            />
            {/* Subtle Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="px-6 py-3 bg-[#f4efe8] text-[#0a0b0d] font-mono text-xs uppercase tracking-[0.2em]">
                {t('productPreview.enterWorkspaceArrow', 'ENTER WORKSPACE →')}
              </span>
            </div>
          </div>

          {/* Minimal Architectural Caption */}
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.08] bg-[#0d0e13] font-mono text-[11px] text-stone-400">
            <div className="flex items-center space-x-3">
              <span className="text-stone-300 font-medium tracking-wider">{t('productPreview.captionFig', 'FIG 02.00 // BIM LAB V1 RUNTIME')}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400">{t('productPreview.captionDesc', 'SPATIAL BIM TREE, ELEMENT INSPECTOR & 3D VIEWPORT')}</span>
            </div>
            {/* i18next-instrument-ignore */}
            <div className="text-stone-400 uppercase tracking-widest">
              WEB-IFC WASM · ISO 16739
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

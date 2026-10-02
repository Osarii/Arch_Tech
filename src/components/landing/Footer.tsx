import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenWorkspace: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenWorkspace }) => {
  return (
    <footer className="bg-[#07080a] py-20 px-6 sm:px-8 lg:px-12 text-stone-400 font-sans border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/[0.06]">
          {/* Brand & Studio Statement */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm tracking-[0.25em] uppercase text-stone-100 font-medium">
                ARCH_TECH
              </span>
              <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase border-l border-white/10 pl-3">
                OPENBIM STUDIO
              </span>
            </div>

            <p className="text-sm text-stone-400 max-w-md leading-relaxed font-sans pt-2">
              Design, inspect and modify IFC models in the browser. High-performance client-side OpenBIM engineering tools for modern architectural workflows.
            </p>

            <div className="text-xs font-mono text-stone-400 pt-2">
              IFC4 & IFC2x3 · ISO 16739 OPEN STANDARD · LOCAL CLIENT EXECUTION
            </div>
          </div>

          {/* Quick Index */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-stone-300 font-medium">
              INDEX
            </div>
            <ul className="space-y-2.5 text-xs font-mono">
              <li>
                <a href="#product" className="text-stone-400 hover:text-stone-100 transition-colors">
                  01 // PRODUCT
                </a>
              </li>
              <li>
                <a href="#capabilities" className="text-stone-400 hover:text-stone-100 transition-colors">
                  02 // CAPABILITIES
                </a>
              </li>
              <li>
                <a href="#workflow" className="text-stone-400 hover:text-stone-100 transition-colors">
                  03 // WORKFLOW
                </a>
              </li>
              <li>
                <a href="#models" className="text-stone-400 hover:text-stone-100 transition-colors">
                  04 // SELECTED MODELS
                </a>
              </li>
              <li>
                <a href="#technology" className="text-stone-400 hover:text-stone-100 transition-colors">
                  05 // TECHNOLOGY
                </a>
              </li>
            </ul>
          </div>

          {/* Standards & Direct Access */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-stone-300 font-medium">
              WORKSPACE
            </div>
            <button
              onClick={onOpenWorkspace}
              className="group inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-stone-300 hover:text-white"
            >
              <span>ENTER WORKSPACE</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <div className="text-[11px] font-mono text-stone-400 space-y-1">
              <div>COLOPHON: CORMORANT GARAMOND</div>
              <div>PLUS JAKARTA SANS & JETBRAINS MONO</div>
            </div>
          </div>
        </div>

        {/* Colophon & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-stone-400">
          <div>
            © 2026 ARCH_TECH STUDIO. ALL RIGHTS RESERVED.
          </div>
          <div>
            100% LOCAL-FIRST CLIENT · ZERO TELEMETRY TRACKING
          </div>
        </div>
      </div>
    </footer>
  );
};

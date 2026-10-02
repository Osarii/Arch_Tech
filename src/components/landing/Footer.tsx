import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FooterProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const Footer: React.FC<FooterProps> = ({ onLogin }) => (
  <footer className="border-t border-white/[0.08] bg-[#07080a] px-6 py-16 text-stone-400 sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-7xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-sm tracking-[0.25em] text-stone-100">ARCH_TECH</p>
        <p className="mt-4 max-w-md font-serif text-2xl font-light text-stone-300">Architecture presented with clarity, from first study to final issue.</p>
      </div>
      <div className="space-y-5 sm:text-right">
        <button onClick={(event) => onLogin(event.currentTarget)} className="group inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 hover:text-white">Client Login <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></button>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-600">© 2026 ARCH_TECH</p>
      </div>
    </div>
  </footer>
);

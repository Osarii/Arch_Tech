import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface LandingNavbarProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const viewProjects = () => {
    setMobileMenuOpen(false);
    document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });
  };
  const viewCapabilities = () => {
    setMobileMenuOpen(false);
    document.querySelector('#capabilities')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#0a0b0d]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <a href="#hero" className="font-mono text-sm tracking-[0.25em] text-stone-100">ARCH_TECH</a>
        <div className="hidden items-center gap-9 sm:flex">
          <button onClick={viewProjects} className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">Projects</button>
          <button data-testid="capabilities-link" onClick={viewCapabilities} className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">Capabilities</button>
          <button data-testid="client-login-link" onClick={(event) => onLogin(event.currentTarget)} className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-100 transition-colors hover:border-white hover:bg-white hover:text-black">Project Portal</button>
        </div>
        <button onClick={() => setMobileMenuOpen((open) => !open)} className="p-2 text-stone-300 sm:hidden" aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="space-y-3 border-t border-white/10 bg-[#0a0b0d] px-6 py-6 sm:hidden">
          <button onClick={viewProjects} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">Projects</button>
          <button onClick={viewCapabilities} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">Capabilities</button>
          <button onClick={(event) => onLogin(event.currentTarget)} className="block w-full border border-white/20 px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-white">Project Portal</button>
        </div>
      )}
    </nav>
  );
};

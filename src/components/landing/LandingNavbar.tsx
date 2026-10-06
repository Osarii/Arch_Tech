import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useScrollProgress } from '../motion/useScrollProgress';

interface LandingNavbarProps {
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isScrolled } = useScrollProgress('[data-landing-scroll-container]');

  const viewProjects = () => {
    setMobileMenuOpen(false);
    document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });
  };
  const viewCapabilities = () => {
    setMobileMenuOpen(false);
    document.querySelector('#capabilities')?.scrollIntoView({ behavior: 'smooth' });
  };
  const viewSection = (id: string) => {
    setMobileMenuOpen(false);
    document.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`landing-navbar fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled
          ? 'border-b border-white/[0.12] bg-[#0a0b0d]/95 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md'
          : 'border-b border-white/[0.08] bg-[#0a0b0d]/90 backdrop-blur-md'
      }`}
    >
      <div className="landing-navbar-inner mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <a href="#hero" aria-label="GARNIER ARCHITECTURE home" className="text-stone-100 transition-opacity hover:opacity-90"><ArchTechLogo variant="mark" theme="dark" /></a>
        <div className="landing-navbar-links hidden items-center gap-9 lg:flex">
          <button onClick={viewProjects} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">Projects</button>
          <button data-testid="capabilities-link" onClick={viewCapabilities} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">Capabilities</button>
          <button data-testid="about-link" onClick={() => viewSection('about')} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">About</button>
          <button data-testid="team-link" onClick={() => viewSection('team')} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">Team</button>
          <button data-testid="client-login-link" onClick={(event) => onLogin(event.currentTarget)} className="arch-interactive-button border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-100 transition-colors hover:border-white hover:bg-white hover:text-black">Project Portal</button>
        </div>
        <button onClick={() => setMobileMenuOpen((open) => !open)} className="p-2 text-stone-300 lg:hidden" aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="space-y-3 border-t border-white/10 bg-[#0a0b0d] px-6 py-6 lg:hidden">
          <button onClick={viewProjects} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">Projects</button>
          <button onClick={viewCapabilities} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">Capabilities</button>
          <button onClick={() => viewSection('about')} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">About</button>
          <button onClick={() => viewSection('team')} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">Team</button>
          <button onClick={(event) => onLogin(event.currentTarget)} className="block w-full border border-white/20 px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-white">Project Portal</button>
        </div>
      )}
    </nav>
  );
};

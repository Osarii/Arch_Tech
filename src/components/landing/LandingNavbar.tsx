import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

interface LandingNavbarProps {
  onOpenWorkspace: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenWorkspace }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Selected Models', href: '#models' },
    { label: 'Technology', href: '#technology' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0b0d]/90 backdrop-blur-md border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <a href="#hero" className="flex items-center space-x-3 group">
            <span className="font-mono text-sm tracking-[0.25em] uppercase text-stone-100 font-medium">
              ARCH_TECH
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest text-stone-400 uppercase border-l border-white/10 pl-3">
              STUDIO // OPENBIM
            </span>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="text-xs font-mono uppercase tracking-[0.18em] text-stone-400 hover:text-stone-100 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center space-x-4">
          <button
            onClick={onOpenWorkspace}
            data-testid="landing-btn-open-workspace"
            className="group inline-flex items-center space-x-2 px-5 py-2.5 rounded-none bg-stone-100 hover:bg-white text-[#0a0b0d] text-xs font-mono uppercase tracking-[0.15em] transition-all duration-300 active:scale-[0.99]"
          >
            <span>ENTER WORKSPACE</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-400 hover:text-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0e12] border-b border-white/[0.08] px-6 py-8 space-y-5">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-xs font-mono uppercase tracking-[0.2em] text-stone-300 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWorkspace();
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-stone-100 text-[#0a0b0d] text-xs font-mono uppercase tracking-[0.15em]"
            >
              <span>ENTER WORKSPACE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

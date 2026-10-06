import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';

interface FooterProps {
  onLogin: (trigger?: HTMLElement) => void;
}

const footerGroups = [
  {
    label: 'Explore',
    items: [
      { label: 'Projects', href: '#projects', testId: 'footer-projects-link' },
      { label: 'Capabilities', href: '#capabilities', testId: 'footer-capabilities-link' },
      { label: 'About', href: '#about', testId: 'footer-about-link' },
      { label: 'Team', href: '#team', testId: 'footer-team-link' },
    ],
  },
];

const scrollBehavior = (): ScrollBehavior => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'smooth';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
};

export const Footer: React.FC<FooterProps> = ({ onLogin }) => {
  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.querySelector<HTMLElement>(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  const scrollToTop = () => {
    const landingContainer = document.querySelector<HTMLElement>('[data-landing-scroll-container]');
    if (!landingContainer) return;

    if (typeof landingContainer.scrollTo === 'function') {
      landingContainer.scrollTo({ top: 0, behavior: scrollBehavior() });
    } else {
      landingContainer.scrollTop = 0;
    }
  };

  return (
    <footer className="landing-footer border-t border-white/[0.08] bg-[#07080a] px-6 py-16 text-stone-400 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="landing-footer-intro grid gap-8 border-b border-white/[0.1] pb-12 lg:grid-cols-[1fr_minmax(20rem,0.68fr)] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">GARNIER ARCHITECTURE / closing statement</p>
            <h2 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.92] tracking-tight text-stone-100 sm:text-7xl lg:text-8xl">Built for complex development.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-stone-400">Development, infrastructure and digital project delivery from first opportunity through long-term operation.</p>
        </div>

        <div className="grid gap-10 border-b border-white/[0.1] py-12 lg:grid-cols-[minmax(12rem,0.6fr)_1fr] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Directory</p>
            <p className="mt-5 max-w-xs font-serif text-2xl font-light leading-tight text-stone-300">A clear route through the public experience.</p>
          </div>

          <nav aria-label="Footer directory" className="grid gap-10 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{group.label}</p>
                <div className="mt-5 grid gap-3">
                  {group.items.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      data-testid={item.testId}
                      onClick={(event) => scrollToSection(event, item.href)}
                      className="landing-footer-link inline-flex w-fit font-mono text-[10px] uppercase tracking-[0.16em] text-stone-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-stone-100"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Platform</p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  data-testid="footer-portal-link"
                  onClick={(event) => onLogin(event.currentTarget)}
                  className="landing-footer-link inline-flex w-fit font-mono text-left text-[10px] uppercase tracking-[0.16em] text-stone-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-stone-100"
                >
                  Project Portal <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">OpenBIM</span>
                <a
                  href="#capabilities"
                  data-testid="footer-workflow-link"
                  onClick={(event) => scrollToSection(event, '#capabilities')}
                  className="landing-footer-link inline-flex w-fit font-mono text-[10px] uppercase tracking-[0.16em] text-stone-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-stone-100"
                >
                  Development Workflow
                </a>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Context</p>
              <div className="mt-5 grid gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
                <span>Costa Rica</span>
                <span>Garnier &amp; Garnier Showcase</span>
                <span>Concept Prototype</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="landing-footer-wordmark overflow-hidden border-b border-white/[0.1] py-12 sm:py-16 lg:py-20">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-600">GARNIER ARCHITECTURE / public development platform</p>
          <ArchTechLogo variant="stacked" theme="dark" className="arch-tech-logo-footer mt-6" label="GARNIER ARCHITECTURE" />
        </div>

        <div className="flex flex-col gap-6 pt-6 text-[9px] font-mono uppercase tracking-[0.16em] text-stone-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>© 2026 GARNIER ARCHITECTURE</p>
          <p>Development / Infrastructure / Digital Delivery</p>
          <p>Concept showcase</p>
          <button
            type="button"
            data-testid="footer-back-to-top"
            onClick={scrollToTop}
            className="landing-footer-link w-fit text-stone-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-stone-100"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
};

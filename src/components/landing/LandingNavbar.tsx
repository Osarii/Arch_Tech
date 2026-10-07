import React, { useState } from 'react';
import { Menu, X, Sliders } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useScrollProgress } from '../motion/useScrollProgress';
import { useLocale } from '../../portal/locale';

interface LandingNavbarProps {
  onLogin: (trigger?: HTMLElement) => void;
  onNavigate?: (path: string) => void;
  onOpenA11y?: () => void;
  isA11yPanelOpen?: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLogin,
  onNavigate,
  onOpenA11y,
  isA11yPanelOpen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isScrolled } = useScrollProgress('[data-landing-scroll-container]');
  const { locale, setLocale, landing } = useLocale();
  const t = landing.navbar;

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
  const viewNews = () => {
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate('/news');
    else window.history.pushState({}, '', '/news');
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
        <a href="#hero" aria-label={t.homeAria || 'GARNIER ARCHITECTURE home'} className="text-stone-100 transition-opacity hover:opacity-90">
          <ArchTechLogo variant="mark" tone="mint-cream" theme="dark" />
        </a>

        <div className="landing-navbar-links hidden items-center gap-7 lg:flex">
          <button onClick={viewProjects} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">
            {t.projects}
          </button>
          <button data-testid="capabilities-link" onClick={viewCapabilities} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">
            {t.capabilities}
          </button>
          <button data-testid="about-link" onClick={() => viewSection('about')} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">
            {t.about}
          </button>
          <button data-testid="team-link" onClick={() => viewSection('team')} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">
            {t.team}
          </button>
          <button onClick={viewNews} className="arch-interactive-link font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-white">
            {t.updates}
          </button>

          {/* Compact Desktop EN / ES Language Toggle */}
          <div
            data-testid="lang-selector"
            role="group"
            aria-label={t.langSelection || 'Language selection'}
            className="flex items-center rounded border border-white/20 bg-white/5 p-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-300"
          >
            {/* i18next-instrument-ignore */}
            <button
              type="button"
              data-testid="lang-btn-en"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
              className={`rounded px-2 py-0.5 transition-colors ${
                locale === 'en' ? 'bg-white font-semibold text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              EN
            </button>
            {/* i18next-instrument-ignore */}
            <button
              type="button"
              data-testid="lang-btn-es"
              onClick={() => setLocale('es')}
              aria-pressed={locale === 'es'}
              className={`rounded px-2 py-0.5 transition-colors ${
                locale === 'es' ? 'bg-white font-semibold text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              ES
            </button>
          </div>

          {/* Accessibility Controls Trigger */}
          <button
            type="button"
            data-testid="accessibility-panel-trigger"
            aria-label={t.a11yControls}
            aria-expanded={isA11yPanelOpen}
            onClick={onOpenA11y}
            className="inline-flex items-center gap-1.5 rounded border border-white/20 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-300 transition-colors hover:border-white hover:text-white focus:outline-none focus:ring-1 focus:ring-white/40"
          >
            <Sliders className="h-3.5 w-3.5 text-stone-400" />
            <span className="hidden xl:inline">{t.a11yShort || 'A11y'}</span>
          </button>

          <button
            data-testid="client-login-link"
            onClick={(event) => onLogin(event.currentTarget)}
            className="arch-interactive-button border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-100 transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            {t.projectPortal}
          </button>
        </div>

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="p-2 text-stone-300 lg:hidden"
          aria-label={t.toggleMenu}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="space-y-3 border-t border-white/10 bg-[#0a0b0d] px-6 py-6 lg:hidden">
          <button onClick={viewProjects} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
            {t.projects}
          </button>
          <button onClick={viewCapabilities} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
            {t.capabilities}
          </button>
          <button onClick={() => viewSection('about')} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
            {t.about}
          </button>
          <button onClick={() => viewSection('team')} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
            {t.team}
          </button>
          <button onClick={viewNews} className="block w-full py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300">
            {t.updates}
          </button>

          <div className="flex items-center justify-between border-y border-white/10 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">{t.langToggle || 'Language / Idioma'}</span>
            <div className="flex items-center rounded border border-white/20 bg-white/5 p-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-300">
              {/* i18next-instrument-ignore */}
              <button
                type="button"
                data-testid="mobile-lang-btn-en"
                onClick={() => setLocale('en')}
                className={`rounded px-2.5 py-1 ${locale === 'en' ? 'bg-white font-semibold text-black' : 'text-stone-400'}`}
              >
                EN
              </button>
              {/* i18next-instrument-ignore */}
              <button
                type="button"
                data-testid="mobile-lang-btn-es"
                onClick={() => setLocale('es')}
                className={`rounded px-2.5 py-1 ${locale === 'es' ? 'bg-white font-semibold text-black' : 'text-stone-400'}`}
              >
                ES
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-accessibility-trigger"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenA11y?.();
            }}
            className="flex w-full items-center justify-between border border-white/20 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-200"
          >
            <span>{t.a11yControls}</span>
            <Sliders className="h-4 w-4" />
          </button>

          <button
            onClick={(event) => onLogin(event.currentTarget)}
            className="block w-full border border-white/20 px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-white"
          >
            {t.projectPortal}
          </button>
        </div>
      )}
    </nav>
  );
};

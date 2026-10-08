import React, { useState } from 'react';
import { Menu, Moon, Sun, X, Sliders } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { useScrollProgress } from '../motion/useScrollProgress';
import { useLocale } from '../../portal/locale';

const presentationLabel = 'PRESENTACIÓN';

interface LandingNavbarProps {
  onLogin: (trigger?: HTMLElement) => void;
  onNavigate?: (path: string) => void;
  onOpenA11y?: () => void;
  isA11yPanelOpen?: boolean;
  lightTheme?: boolean;
  onToggleTheme?: () => void;
  onStartPresentation?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLogin,
  onNavigate,
  onOpenA11y,
  isA11yPanelOpen,
  lightTheme = false,
  onToggleTheme,
  onStartPresentation,
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
        lightTheme
          ? isScrolled
            ? 'border-b border-black/[0.12] bg-[#f8f7f5]/95 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md text-stone-900'
            : 'border-b border-black/[0.08] bg-[#f8f7f5]/90 backdrop-blur-md text-stone-900'
          : isScrolled
            ? 'border-b border-white/[0.12] bg-[#0a0b0d]/95 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md text-[#EDF4ED]'
            : 'border-b border-white/[0.08] bg-[#0a0b0d]/90 backdrop-blur-md text-[#EDF4ED]'
      }`}
    >
      <div className="landing-navbar-inner mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Visual Brand Anchor */}
        <a
          href="#hero"
          aria-label={t.homeAria || 'GARNIER ARCHITECTURE home'}
          className={`group flex items-center gap-3.5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            lightTheme ? 'text-black focus-visible:outline-black' : 'text-stone-100 focus-visible:outline-[#ABD1B5]'
          }`}
        >
          <ArchTechLogo
            variant="mark"
            tone={lightTheme ? 'black' : 'mint-cream'}
            theme={lightTheme ? 'light' : 'dark'}
            label="GARNIER ARCHITECTURE"
            className="h-7 w-7 transition-transform duration-200 group-hover:scale-105"
          />
          <div className="flex flex-col text-left">
            {/* i18next-instrument-ignore */}
            <span
              className={`font-mono text-[11.5px] font-semibold tracking-[0.22em] uppercase leading-none ${
                lightTheme ? 'text-black' : 'text-stone-100'
              }`}
            >
              GARNIER
            </span>
            {/* i18next-instrument-ignore */}
            <span
              className={`font-mono text-[8px] tracking-[0.3em] uppercase leading-none mt-1 ${
                lightTheme ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              ARCHITECTURE
            </span>
          </div>
        </a>

        {/* Intentionally Grouped Primary Navigation */}
        <div className="landing-navbar-links hidden items-center gap-8 lg:flex">
          <button
            onClick={viewProjects}
            className={`font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 ${
              lightTheme ? 'text-stone-600 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            {t.projects}
          </button>
          <button
            data-testid="capabilities-link"
            onClick={viewCapabilities}
            className={`font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 ${
              lightTheme ? 'text-stone-600 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            {t.capabilities}
          </button>
          <button
            data-testid="about-link"
            onClick={() => viewSection('about')}
            className={`font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 ${
              lightTheme ? 'text-stone-600 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            {t.about}
          </button>
          <button
            data-testid="team-link"
            onClick={() => viewSection('team')}
            className={`font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 ${
              lightTheme ? 'text-stone-600 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            {t.team}
          </button>
          <button
            onClick={viewNews}
            className={`font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 ${
              lightTheme ? 'text-stone-600 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            {t.updates}
          </button>
        </div>

        {/* Secondary Utility Cluster + Primary CTA */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Secondary Utility Controls Group */}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 backdrop-blur-xs ${
              lightTheme
                ? 'border-black/15 bg-black/[0.03]'
                : 'border-white/15 bg-white/[0.04]'
            }`}
          >
            {/* Locale switch */}
            <div
              data-testid="lang-selector"
              role="group"
              aria-label={t.langSelection || 'Language selection'}
              className="flex items-center rounded-full font-mono text-[9px] uppercase tracking-wider p-0.5"
            >
              {/* i18next-instrument-ignore */}
              <button
                type="button"
                data-testid="lang-btn-en"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={`rounded-full px-2 py-0.5 transition-all ${
                  locale === 'en'
                    ? lightTheme
                      ? 'landing-navbar-lang-active font-semibold'
                      : 'landing-navbar-lang-active font-semibold'
                    : lightTheme
                      ? 'text-stone-500 hover:text-black'
                      : 'text-stone-400 hover:text-white'
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
                className={`rounded-full px-2 py-0.5 transition-all ${
                  locale === 'es'
                    ? lightTheme
                      ? 'landing-navbar-lang-active font-semibold'
                      : 'landing-navbar-lang-active font-semibold'
                    : lightTheme
                      ? 'text-stone-500 hover:text-black'
                      : 'text-stone-400 hover:text-white'
                }`}
              >
                ES
              </button>
            </div>

            <span className={`h-3 w-px ${lightTheme ? 'bg-black/10' : 'bg-white/10'}`} aria-hidden="true" />

            {/* Theme toggle */}
            <button
              type="button"
              data-testid="public-theme-toggle"
              onClick={onToggleTheme}
              aria-label={lightTheme ? 'Use dark theme' : 'Use light theme'}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                lightTheme
                  ? 'text-stone-600 hover:text-black hover:bg-black/5'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title={lightTheme ? 'Use dark theme' : 'Use light theme'}
            >
              {lightTheme ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>

            <span className={`h-3 w-px ${lightTheme ? 'bg-black/10' : 'bg-white/10'}`} aria-hidden="true" />

            {/* Accessibility trigger */}
            <button
              type="button"
              data-testid="accessibility-panel-trigger"
              aria-label={t.a11yControls}
              aria-expanded={isA11yPanelOpen}
              onClick={onOpenA11y}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors relative ${
                isA11yPanelOpen
                  ? 'text-[#79B791]'
                  : lightTheme
                    ? 'text-stone-600 hover:text-black hover:bg-black/5'
                    : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title={t.a11yControls}
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>
          </div>

          {onStartPresentation && (
            <button
              type="button"
              data-testid="presentation-start"
              onClick={onStartPresentation}
              className={`border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                lightTheme
                  ? 'border-black/30 text-black hover:border-[#79B791] hover:text-[#4e8064]'
                  : 'border-[#ABD1B5]/40 text-[#EDF4ED] hover:border-[#79B791] hover:text-[#79B791]'
              }`}
            >
              {presentationLabel}
            </button>
          )}

          {/* Strong Project Portal CTA */}
          <button
            data-testid="client-login-link"
            onClick={(event) => onLogin(event.currentTarget)}
            className={`rounded-full border px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 ${
              lightTheme
                ? 'border-black bg-black text-white hover:bg-stone-800 shadow-xs'
                : 'border-[#ABD1B5]/60 bg-[#ABD1B5]/15 text-[#EDF4ED] hover:border-[#ABD1B5] hover:bg-[#ABD1B5] hover:text-black shadow-[0_0_16px_rgba(171,209,181,0.15)]'
            }`}
          >
            {t.projectPortal}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className={`p-2 lg:hidden transition-colors ${lightTheme ? 'text-stone-800' : 'text-stone-300'}`}
          aria-label={t.toggleMenu}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Responsive mobile collapse */}
      {mobileMenuOpen && (
        <div
          className={`space-y-3 border-t px-6 py-6 lg:hidden ${
            lightTheme ? 'border-black/10 bg-[#f8f7f5]' : 'border-white/10 bg-[#0a0b0d]'
          }`}
        >
          <button
            onClick={viewProjects}
            className={`block w-full py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] ${
              lightTheme ? 'text-stone-800' : 'text-stone-300'
            }`}
          >
            {t.projects}
          </button>
          <button
            onClick={viewCapabilities}
            className={`block w-full py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] ${
              lightTheme ? 'text-stone-800' : 'text-stone-300'
            }`}
          >
            {t.capabilities}
          </button>
          <button
            onClick={() => viewSection('about')}
            className={`block w-full py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] ${
              lightTheme ? 'text-stone-800' : 'text-stone-300'
            }`}
          >
            {t.about}
          </button>
          <button
            onClick={() => viewSection('team')}
            className={`block w-full py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] ${
              lightTheme ? 'text-stone-800' : 'text-stone-300'
            }`}
          >
            {t.team}
          </button>
          <button
            onClick={viewNews}
            className={`block w-full py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] ${
              lightTheme ? 'text-stone-800' : 'text-stone-300'
            }`}
          >
            {t.updates}
          </button>

          <div className={`flex items-center justify-between border-y py-3 ${lightTheme ? 'border-black/10' : 'border-white/10'}`}>
            <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${lightTheme ? 'text-stone-600' : 'text-stone-400'}`}>
              {t.langToggle || 'Language / Idioma'}
            </span>
            <div
              className={`flex items-center rounded-full border p-0.5 font-mono text-[9px] uppercase tracking-wider ${
                lightTheme ? 'border-black/20 bg-black/5 text-stone-800' : 'border-white/20 bg-white/5 text-stone-300'
              }`}
            >
              {/* i18next-instrument-ignore */}
              <button
                type="button"
                data-testid="mobile-lang-btn-en"
                onClick={() => setLocale('en')}
                className={`rounded-full px-2.5 py-1 ${
                  locale === 'en'
                    ? lightTheme ? 'bg-black font-semibold text-white' : 'bg-white font-semibold text-black'
                    : lightTheme ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                EN
              </button>
              {/* i18next-instrument-ignore */}
              <button
                type="button"
                data-testid="mobile-lang-btn-es"
                onClick={() => setLocale('es')}
                className={`rounded-full px-2.5 py-1 ${
                  locale === 'es'
                    ? lightTheme ? 'bg-black font-semibold text-white' : 'bg-white font-semibold text-black'
                    : lightTheme ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                ES
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-theme-toggle"
            onClick={() => {
              onToggleTheme?.();
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] rounded-sm ${
              lightTheme ? 'border-black/15 text-stone-900 bg-black/[0.02]' : 'border-white/20 text-stone-200 bg-white/[0.02]'
            }`}
          >
            <span>{lightTheme ? 'Dark mode' : 'Light mode'}</span>
            {lightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            type="button"
            data-testid="mobile-accessibility-trigger"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenA11y?.();
            }}
            className={`flex w-full items-center justify-between border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] rounded-sm ${
              lightTheme ? 'border-black/15 text-stone-900 bg-black/[0.02]' : 'border-white/20 text-stone-200 bg-white/[0.02]'
            }`}
          >
            <span>{t.a11yControls}</span>
            <Sliders className="h-4 w-4" />
          </button>

          {onStartPresentation && (
            <button
              type="button"
              data-testid="mobile-presentation-start"
              onClick={() => {
                setMobileMenuOpen(false);
                onStartPresentation();
              }}
              className={`flex w-full items-center justify-between border px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] rounded-sm ${
                lightTheme ? 'border-[#79B791] text-black bg-[#79B791]/10' : 'border-[#79B791]/70 text-[#79B791] bg-[#79B791]/10'
              }`}
            >
              <span>{presentationLabel}</span>
              <span aria-hidden="true">↗</span>
            </button>
          )}

          <button
            onClick={(event) => onLogin(event.currentTarget)}
            className={`block w-full border px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.18em] rounded-sm ${
              lightTheme ? 'border-black bg-black text-white' : 'border-[#ABD1B5] bg-[#ABD1B5]/20 text-[#EDF4ED]'
            }`}
          >
            {t.projectPortal}
          </button>
        </div>
      )}
    </nav>
  );
};

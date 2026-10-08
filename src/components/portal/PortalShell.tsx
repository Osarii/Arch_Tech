import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  LogOut,
  Moon,
  Sun,
  Sliders,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  FileText,
  CheckCircle2,
  BarChart2,
  Users,
  Newspaper,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useInRouterContext, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { PortalRole, getPortalUser } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  projects: Building2,
  documents: FileText,
  approvals: CheckCircle2,
  insights: BarChart2,
  analytics: BarChart2,
  people: Users,
  news: Newspaper,
  assistant: Sparkles,
};
import { roleHome } from '../../router/guards';
import { useAccessibility } from '../../portal/useAccessibility';
import { AccessibilityPanel } from './AccessibilityPanel';
import { AccessibilityOverlay } from './AccessibilityOverlay';
import { useLocale, SiteLocale, portalShellTranslations } from '../../portal/locale';

export interface PortalShellProps {
  role: PortalRole;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
  children?: React.ReactNode;
}

export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
}

export const PORTAL_NAV_ITEMS: Record<PortalRole, NavItemConfig[]> = {
  client: [
    { key: 'overview', label: 'Overview', path: '/dashboard' },
    { key: 'projects', label: 'Projects', path: '/dashboard/projects' },
    { key: 'documents', label: 'Documents', path: '/dashboard/documents' },
    { key: 'approvals', label: 'Approvals', path: '/dashboard/approvals' },
    { key: 'insights', label: 'Insights', path: '/dashboard/insights' },
    { key: 'assistant', label: 'Assistant', path: '/dashboard/assistant' },
  ],
  architect: [
    { key: 'overview', label: 'Overview', path: '/architect' },
    { key: 'projects', label: 'Projects', path: '/architect/projects' },
    { key: 'approvals', label: 'Approvals', path: '/architect/approvals' },
    { key: 'documents', label: 'Documents', path: '/architect/documents' },
    { key: 'insights', label: 'Insights', path: '/architect/insights' },
    { key: 'assistant', label: 'Assistant', path: '/architect/assistant' },
  ],
  admin: [
    { key: 'overview', label: 'Overview', path: '/admin' },
    { key: 'projects', label: 'Projects', path: '/admin/projects' },
    { key: 'people', label: 'People', path: '/admin/people' },
    { key: 'approvals', label: 'Approvals', path: '/admin/approvals' },
    { key: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { key: 'news', label: 'News', path: '/admin/news' },
    { key: 'assistant', label: 'Assistant', path: '/admin/assistant' },
  ],
};

export const getPortalNavItems = (role: PortalRole, locale: SiteLocale = 'en'): NavItemConfig[] => {
  const dictionary = portalShellTranslations[locale]?.nav ?? portalShellTranslations.en.nav;
  return PORTAL_NAV_ITEMS[role].map((item) => ({
    ...item,
    label: (dictionary as Record<string, string>)[item.key] ?? item.label,
  }));
};

export interface PortalShellContextValue {
  insideShell: boolean;
  navigate: (path: string) => void;
}

export const PortalShellContext = createContext<PortalShellContextValue>({
  insideShell: false,
  navigate: (path: string) => {
    if (typeof window !== 'undefined') window.location.pathname = path;
  },
});

export const usePortalShell = () => useContext(PortalShellContext);

interface ShellCoreProps extends PortalShellProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const PortalShellCore: React.FC<ShellCoreProps> = ({
  role,
  onSignOut,
  children,
  currentPath,
  navigate,
}) => {
  const { portalShell, locale, setLocale } = useLocale();
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('arch-tech-portal-theme') === 'dark';
    } catch {
      return false;
    }
  });

  const {
    preferences,
    updatePreferences,
    resetPreferences,
    isA11yPanelOpen,
    setIsA11yPanelOpen,
    a11yTriggerRef,
    speechState,
    startSpeech,
    stopSpeech,
    toggleSpeechPause,
    availableVoices,
    speechHighlightRect,
    pointerY,
    hoverRect,
    announcement,
    activeLocale,
  } = useAccessibility({ currentPath });

  // Theme synchronization
  useEffect(() => {
    document.documentElement.classList.toggle('portal-dark', dark);
    try {
      window.localStorage.setItem('arch-tech-portal-theme', dark ? 'dark' : 'light');
    } catch {
      // theme in memory
    }
  }, [dark]);

  const hasActivePreferences =
    preferences.speed !== 1 ||
    preferences.hoverReader ||
    !preferences.spokenWordHighlight ||
    preferences.readingGuide ||
    preferences.readingMask ||
    preferences.textScale !== '100' ||
    preferences.textSpacing ||
    preferences.colorSafe ||
    preferences.highContrast ||
    preferences.highlightLinks ||
    preferences.reduceMotion;

  const navItems = PORTAL_NAV_ITEMS[role].map((item) => ({
    ...item,
    label: (portalShell.nav as Record<string, string>)[item.key] ?? item.label,
  }));
  const homePath = roleHome(role);
  const session = portalAuth.getSession();
  const currentUser = session ? getPortalUser(session.email) : null;

  const handleSignOut = () => {
    stopSpeech();
    if (onSignOut) {
      onSignOut();
    } else {
      portalAuth.signOut();
      navigate('/');
    }
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const roleLabel = portalShell.roles[role];

  return (
    <PortalShellContext.Provider value={{ insideShell: true, navigate }}>
      <div className={`portal-surface ${role === 'admin' ? 'portal-admin' : ''} flex h-screen w-full overflow-hidden bg-[var(--portal-bg)] text-[var(--portal-text)]`}>
        {/* Mobile slide-over drawer backdrop & drawer */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform bg-[var(--portal-surface)] transition-transform duration-200 ease-in-out md:hidden ${
            mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--portal-border)] px-4 shrink-0">
            <div className="flex items-center gap-2">
              <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="h-5 w-5" />
              <span className="font-serif text-sm font-semibold tracking-tight text-[var(--portal-text)]">{portalShell.brandName || 'ARCH_TECH'}</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label={portalShell.closeNavigation || 'Close navigation'}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--portal-border)] text-[var(--portal-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-2.5 border-b border-[var(--portal-border)] shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
              {roleLabel}
            </span>
          </div>
          <nav aria-label={`${role} mobile navigation`} className="p-3 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isExact = currentPath === item.path;
              const isSub =
                item.path !== homePath &&
                (currentPath === item.path || currentPath.startsWith(item.path + '/'));
              const isActive = isExact || isSub;
              const Icon = NAV_ICONS[item.key] ?? LayoutDashboard;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    isActive
                      ? 'border-l-2 border-[var(--portal-accent)] bg-[var(--portal-surface-raised)] font-semibold text-[var(--portal-text)]'
                      : 'text-[var(--portal-muted)] hover:bg-[var(--portal-surface-raised)] hover:text-[var(--portal-text)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Persistent Left Navigation Rail */}
        <aside
          data-tour-id="portal-tour-perspectives"
          aria-label={`${role} navigation rail`}
          className="portal-rail hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-r border-[var(--portal-border)] bg-[var(--portal-surface)] z-20 h-screen"
        >
          {/* Top Brand Block */}
          <div className="shrink-0 border-b border-[var(--portal-border)] p-4 lg:p-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label={portalShell.homeAria || 'ARCH_TECH home'}
              className="block w-full text-left transition-opacity hover:opacity-85"
            >
              <ArchTechLogo
                variant="full"
                theme={dark ? 'dark' : 'light'}
                className="portal-sidebar-logo block"
              />
            </button>
            <div className="mt-3.5 space-y-0.5">
              <span className="block font-serif text-xs font-semibold tracking-tight text-[var(--portal-text)] leading-snug">
                {roleLabel}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--portal-muted)] opacity-80 leading-normal">
                {portalShell.showcaseEyebrow}
              </span>
            </div>
          </div>

          {/* Navigation Items with Lucide Icons */}
          <nav
            aria-label={`${role} navigation`}
            className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-none"
          >
            {navItems.map((item) => {
              const isExact = currentPath === item.path;
              const isSub =
                item.path !== homePath &&
                (currentPath === item.path || currentPath.startsWith(item.path + '/'));
              const isActive = isExact || isSub;
              const Icon = NAV_ICONS[item.key] ?? LayoutDashboard;

              return (
                <button
                  key={item.key}
                  type="button"
                  data-testid={`portal-nav-${item.key}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => navigate(item.path)}
                  className={`portal-nav-item flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? 'border-l-2 border-[var(--portal-accent)] bg-[var(--portal-surface-raised)] font-semibold text-[var(--portal-text)] shadow-xs'
                      : 'text-[var(--portal-muted)] hover:bg-[var(--portal-surface-raised)] hover:text-[var(--portal-text)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" /><span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar: Utility Controls Stacked Vertically Above User Identity */}
          <div className="shrink-0 border-t border-[var(--portal-border)] p-3 lg:p-3.5 space-y-1.5 bg-[var(--portal-surface)]">
            {/* 1. Theme toggle */}
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              aria-label={dark ? portalShell.useLightMode : portalShell.useDarkMode}
              data-testid="theme-toggle"
              title={dark ? portalShell.useLightMode : portalShell.useDarkMode}
              className="group flex h-8 w-full items-center justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface)] px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--portal-muted)] transition-all hover:border-[var(--portal-border-strong)] hover:bg-[var(--portal-surface-raised)] hover:text-[var(--portal-text)] focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)]"
            >
              <span className="flex items-center gap-2">
                {dark ? <Sun className="h-3.5 w-3.5 shrink-0 text-[var(--portal-accent)]" /> : <Moon className="h-3.5 w-3.5 shrink-0" />}
                <span className="leading-none">{dark ? (portalShell.light || 'Light') : (portalShell.dark || 'Dark')}</span>
              </span>
              <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-65 group-hover:opacity-100">
                {dark ? 'DARK' : 'LIGHT'}
              </span>
            </button>

            {/* 2. Accessibility control */}
            <button
              ref={a11yTriggerRef}
              type="button"
              onClick={() => setIsA11yPanelOpen(true)}
              aria-label={portalShell.openA11y}
              aria-expanded={isA11yPanelOpen}
              data-testid="accessibility-panel-trigger"
              title={portalShell.openA11y}
              className={`group flex h-8 w-full items-center justify-between rounded-sm border px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-all focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)] ${
                hasActivePreferences
                  ? 'border-[var(--portal-accent)] bg-[var(--portal-accent-soft)] text-[var(--portal-text)] font-semibold shadow-xs'
                  : 'border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-muted)] hover:border-[var(--portal-border-strong)] hover:bg-[var(--portal-surface-raised)] hover:text-[var(--portal-text)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-none">{portalShell.a11y || 'Accesibilidad'}</span>
              </span>
              {hasActivePreferences ? (
                <span className="flex items-center gap-1 font-mono text-[8px] text-[var(--portal-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFBF00]" aria-label={portalShell.adjustmentsActive} />
                  {/* i18next-instrument-ignore */}
                  <span>ACT</span>
                </span>
              ) : (
                /* i18next-instrument-ignore */
                <span className="font-mono text-[8px] text-[var(--portal-muted)] opacity-65 group-hover:opacity-100">
                  A11Y
                </span>
              )}
            </button>

            {/* 3. Locale switch: ES / EN */}
            <div
              data-testid="lang-selector"
              role="group"
              aria-label={portalShell.languageAria || 'Language selection'}
              className="flex h-8 w-full items-center justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface)] px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--portal-muted)]"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--portal-muted)]" />
                <span className="leading-none">{locale === 'es' ? 'Idioma' : 'Language'}</span>
              </span>
              <div className="flex items-center rounded-2xs border border-[var(--portal-border)] p-0.5 bg-[var(--portal-surface-raised)] font-mono text-[8px] tracking-normal">
                {/* i18next-instrument-ignore */}
                <button
                  type="button"
                  data-testid="lang-btn-es"
                  onClick={() => setLocale('es')}
                  aria-label={portalShell.spanish || 'Español'}
                  title={portalShell.spanish || 'Español'}
                  aria-pressed={locale === 'es'}
                  className={`px-2 py-0.5 rounded-3xs transition-colors ${
                    locale === 'es'
                      ? 'bg-[var(--portal-text)] text-[var(--portal-surface)] font-bold shadow-2xs'
                      : 'text-[var(--portal-muted)] hover:text-[var(--portal-text)]'
                  }`}
                >
                  {portalShell.es || 'ES'}
                </button>
                <span className="text-[var(--portal-border)] text-[7px] select-none px-0.5">/</span>
                {/* i18next-instrument-ignore */}
                <button
                  type="button"
                  data-testid="lang-btn-en"
                  onClick={() => setLocale('en')}
                  aria-label={portalShell.english || 'English'}
                  title={portalShell.english || 'English'}
                  aria-pressed={locale === 'en'}
                  className={`px-2 py-0.5 rounded-3xs transition-colors ${
                    locale === 'en'
                      ? 'bg-[var(--portal-text)] text-[var(--portal-surface)] font-bold shadow-2xs'
                      : 'text-[var(--portal-muted)] hover:text-[var(--portal-text)]'
                  }`}
                >
                  {portalShell.en || 'EN'}
                </button>
              </div>
            </div>

            {/* 4. Sign out */}
            <button
              type="button"
              data-testid="sign-out-btn"
              onClick={handleSignOut}
              aria-label={portalShell.signOut}
              title={portalShell.signOut}
              className="group flex h-8 w-full items-center justify-between rounded-sm border border-transparent px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--portal-muted)] transition-all hover:border-[var(--portal-border)] hover:bg-[var(--portal-surface-raised)] hover:text-[var(--portal-text)] focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)]"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                <span className="leading-none">{portalShell.signOut}</span>
              </span>
              {/* i18next-instrument-ignore */}
              <span className="font-mono text-[8px] opacity-40 group-hover:opacity-90">
                ESC
              </span>
            </button>

            {/* User identity below utility controls with clear separation */}
            {currentUser && (
              <div className="border-t border-[var(--portal-border)]/60 pt-2.5 mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-2xs border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] font-mono text-[9px] font-bold text-[var(--portal-accent)]">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1 font-mono text-[9px] leading-tight text-[var(--portal-muted)]">
                    <span className="block truncate font-medium text-[var(--portal-text)]">
                      {currentUser.name}
                    </span>
                    <span className="mt-0.5 block truncate opacity-75">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right side: Mobile Header (on small screens only) + Main Scrollable Content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Mobile Top Bar (hidden on md and up) */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 md:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label={portalShell.openNavigation || 'Open navigation menu'}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--portal-border)] text-[var(--portal-text)]"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="h-5 w-5" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
                  {roleLabel}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-[1560px]">
              {children ?? <Outlet />}
            </div>
          </main>
        </div>

        {/* Presentation-only reading overlay (Reading guide, mask, single word highlight) */}
        <AccessibilityOverlay
          highlightRect={speechHighlightRect || hoverRect}
          readingGuide={preferences.readingGuide}
          readingMask={preferences.readingMask}
          pointerY={pointerY}
          announcement={announcement}
        />

        {/* Unified GARNIER ARCHITECTURE accessibility panel */}
        <AccessibilityPanel
          isOpen={isA11yPanelOpen}
          onClose={() => setIsA11yPanelOpen(false)}
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          onResetPreferences={resetPreferences}
          speechState={speechState}
          onStartSpeech={startSpeech}
          onTogglePauseSpeech={toggleSpeechPause}
          onStopSpeech={stopSpeech}
          availableVoices={availableVoices}
          triggerRef={a11yTriggerRef}
          locale={activeLocale}
        />
      </div>
    </PortalShellContext.Provider>
  );
};

const ShellInnerWithRouter: React.FC<PortalShellProps> = (props) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const navigate = (path: string) => {
    if (props.onNavigate) {
      props.onNavigate(path);
    } else {
      routerNavigate(path);
    }
  };
  return <PortalShellCore {...props} currentPath={location.pathname} navigate={navigate} />;
};

const ShellInnerWithoutRouter: React.FC<PortalShellProps> = (props) => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return roleHome(props.role);
    const path = window.location.pathname;
    const home = roleHome(props.role);
    return path.startsWith(home) ? path : home;
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (props.onNavigate) {
      props.onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  return <PortalShellCore {...props} currentPath={currentPath} navigate={navigate} />;
};

export const PortalShell: React.FC<PortalShellProps> = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <ShellInnerWithRouter {...props} />;
  }
  return <ShellInnerWithoutRouter {...props} />;
};

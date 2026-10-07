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
  const { portalShell } = useLocale();
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
  const activeNavItem = navItems.find((n) => currentPath === n.path || (n.path !== homePath && currentPath.startsWith(n.path + '/')));

  return (
    <PortalShellContext.Provider value={{ insideShell: true, navigate }}>
      <div className={`portal-surface ${role === 'admin' ? 'portal-admin' : ''} flex h-screen w-full overflow-hidden bg-[#D6CBB9] bg-[var(--portal-bg)] text-[var(--portal-text)]`}>
        {/* Mobile slide-over drawer backdrop & drawer */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[var(--portal-surface)] transition-transform duration-200 ease-in-out md:hidden ${
            mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--portal-border)] px-4">
            <div className="flex items-center gap-2">
              <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="h-5 w-5" />
              <span className="font-serif text-sm font-semibold tracking-tight text-[var(--portal-text)]">{portalShell.brandName || 'GARNIER'}</span>
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
          <div className="px-4 py-2.5 border-b border-[var(--portal-border)]">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
              {roleLabel}
            </span>
          </div>
          <nav aria-label={`${role} mobile navigation`} className="p-3 space-y-1">
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
          aria-label={`${role} navigation rail`}
          className="portal-rail hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-r border-[var(--portal-border)] bg-[var(--portal-surface)] z-20"
        >
          {/* Top Mark & Brand Title */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--portal-border)] px-4 lg:px-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label={portalShell.homeAria || 'GARNIER ARCHITECTURE home'}
              className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
            >
              <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="arch-tech-logo-portal h-6 w-6" />
              <div className="min-w-0">
                <span className="block font-serif text-xs font-semibold tracking-tight text-[var(--portal-text)] truncate">
                  {portalShell.brandName || 'GARNIER'}
                </span>
                <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-[var(--portal-muted)] truncate">
                  {portalShell.showcaseEyebrow}
                </span>
              </div>
            </button>
            <span className="rounded border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--portal-muted)]">
              {roleLabel}
            </span>
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

          {/* User Status / Bottom identity */}
          {currentUser && (
            <div className="border-t border-[var(--portal-border)] p-3">
              <div className="truncate font-mono text-[9px] text-[var(--portal-muted)]">
                <span className="block truncate font-medium text-[var(--portal-text)]">{currentUser.name}</span>
                <span className="block truncate opacity-75">{currentUser.email}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Right side: Top Utility Bar + Scrollable Content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <header className="portal-header flex h-14 shrink-0 items-center justify-between border-b border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label={portalShell.openNavigation || 'Open navigation menu'}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--portal-border)] text-[var(--portal-text)] md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 md:hidden">
                <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="h-5 w-5" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
                  {roleLabel}
                </span>
              </div>

              {/* Breadcrumb / current location on desktop */}
              <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
                <button
                  type="button"
                  onClick={() => navigate(homePath)}
                  className="transition-colors hover:text-[var(--portal-text)]"
                >
                  {portalShell.homeNav[role]}
                </button>
                <span>/</span>
                <span className="text-[var(--portal-text)] font-semibold">
                  {activeNavItem?.label ?? roleLabel}
                </span>
              </div>
            </div>

            {/* Top Utility Controls */}
            <div className="flex items-center gap-3 sm:gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--portal-muted)]">
              {currentUser && (
                <span className="hidden font-mono text-[9px] text-[var(--portal-muted)] xl:inline-block">
                  {currentUser.name}
                </span>
              )}

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={dark ? portalShell.useLightMode : portalShell.useDarkMode}
                data-testid="theme-toggle"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--portal-text)]"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{dark ? portalShell.light : portalShell.dark}</span>
              </button>

              {/* Accessibility control */}
              <button
                ref={a11yTriggerRef}
                type="button"
                onClick={() => setIsA11yPanelOpen(true)}
                aria-label={portalShell.openA11y}
                aria-expanded={isA11yPanelOpen}
                data-testid="accessibility-panel-trigger"
                className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 transition-colors ${
                  hasActivePreferences
                    ? 'border-[var(--portal-accent)] bg-[var(--portal-accent-soft)] text-[var(--portal-text)] font-semibold'
                    : 'border-[var(--portal-border)] bg-transparent text-[var(--portal-muted)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)]'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{portalShell.a11y}</span>
                {hasActivePreferences && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFBF00]" aria-label={portalShell.adjustmentsActive} />
                )}
              </button>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-[var(--portal-muted)] hover:text-[var(--portal-text)] transition-colors"
              >
                <span>{portalShell.signOut}</span>
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LogOut, Moon, Sun, Sliders } from 'lucide-react';
import { useInRouterContext, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { PortalRole, getPortalUser } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';
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

  const roleLabel = portalShell.roles[role];

  return (
    <PortalShellContext.Provider value={{ insideShell: true, navigate }}>
      <div className={`portal-surface ${role === 'admin' ? 'portal-admin' : ''} h-screen overflow-y-auto bg-[#D6CBB9] text-[#211E1A]`}>
        <header className="portal-header border-b border-black/20 bg-[#ABD1B5]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="GARNIER ARCHITECTURE home"
                className="flex items-center gap-3 text-left text-[#211E1A]"
              >
                <ArchTechLogo variant="mark" theme={dark ? 'dark' : 'light'} className="arch-tech-logo-portal" />
                <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-stone-400 sm:inline">
                  {portalShell.showcaseEyebrow}
                </span>
              </button>
              <span className="hidden rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-300 md:inline-block">
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600">
              <button
                type="button"
                onClick={() => navigate(homePath)}
                className="transition-colors hover:text-black"
              >
                {portalShell.homeNav[role]}
              </button>

              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={dark ? portalShell.useLightMode : portalShell.useDarkMode}
                data-testid="theme-toggle"
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{' '}
                {dark ? portalShell.light : portalShell.dark}
              </button>

              {/* Compact GARNIER ARCHITECTURE accessibility control */}
              <button
                ref={a11yTriggerRef}
                type="button"
                onClick={() => setIsA11yPanelOpen(true)}
                aria-label={portalShell.openA11y}
                aria-expanded={isA11yPanelOpen}
                data-testid="accessibility-panel-trigger"
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 transition-colors ${
                  hasActivePreferences
                    ? 'border-black/30 bg-black/10 text-black font-semibold'
                    : 'border-black/10 bg-transparent text-stone-500 hover:text-black hover:border-black/30'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{portalShell.a11y}</span>
                {hasActivePreferences && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label={portalShell.adjustmentsActive} />
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                {portalShell.signOut} <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-navigation bar with real routes */}
          <div className="border-t border-black/15 bg-[#79B791]/35">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
              <nav
                aria-label={`${role} navigation`}
                className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none"
              >
                {navItems.map((item) => {
                  const isExact = currentPath === item.path;
                  const isSub =
                    item.path !== homePath &&
                    (currentPath === item.path || currentPath.startsWith(item.path + '/'));
                  const isActive = isExact || isSub;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-testid={`portal-nav-${item.key}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => navigate(item.path)}
                      className={`whitespace-nowrap px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                        isActive
                          ? 'border-b-2 border-black font-semibold text-black'
                          : 'text-stone-600 hover:text-black'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {currentUser && (
                <span className="hidden font-mono text-[9px] text-stone-400 lg:inline-block">
                  {currentUser.name} ({currentUser.email})
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
          {children ?? <Outlet />}
        </main>

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

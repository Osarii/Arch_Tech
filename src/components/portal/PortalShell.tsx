import React, { createContext, useContext, useEffect, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useInRouterContext, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { PortalRole, getPortalUser } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';
import { roleHome } from '../../router/guards';

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
    { key: 'assistant', label: 'Assistant', path: '/admin/assistant' },
  ],
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
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('arch-tech-portal-theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [textScale, setTextScale] = useState<'100' | '1125' | '125'>(() => {
    if (typeof window === 'undefined') return '100';
    try {
      const stored = window.localStorage.getItem('arch-tech-portal-text-scale');
      return stored === '1125' || stored === '125' ? stored : '100';
    } catch {
      return '100';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('portal-dark', dark);
    try {
      window.localStorage.setItem('arch-tech-portal-theme', dark ? 'dark' : 'light');
    } catch {
      // Theme preference is optional; current mode remains in memory.
    }
  }, [dark]);

  useEffect(() => {
    document.documentElement.classList.remove('portal-scale-1125', 'portal-scale-125');
    if (textScale !== '100') document.documentElement.classList.add(`portal-scale-${textScale}`);
    try {
      window.localStorage.setItem('arch-tech-portal-text-scale', textScale);
    } catch {
      // Text preference remains active in memory.
    }
  }, [textScale]);

  const navItems = PORTAL_NAV_ITEMS[role];
  const homePath = roleHome(role);
  const session = portalAuth.getSession();
  const currentUser = session ? getPortalUser(session.email) : null;

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      portalAuth.signOut();
      navigate('/');
    }
  };

  const roleLabel =
    role === 'admin'
      ? 'Executive Administration'
      : role === 'architect'
        ? 'Architect Studio'
        : 'Client Workspace';

  return (
    <PortalShellContext.Provider value={{ insideShell: true, navigate }}>
      <div className={`portal-surface ${role === 'admin' ? 'portal-admin' : ''} min-h-screen bg-[#D6CBB9] text-[#211E1A]`}>
        <header className="portal-header border-b border-black/10 bg-[#2D2E2C]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="ARCH_TECH home"
                className="flex items-center gap-3 text-left text-[#211E1A]"
              >
                <ArchTechLogo variant="full" theme="dark" />
                <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-stone-400 sm:inline">
                  Garnier Portfolio Concept
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
                {role === 'admin' ? 'Register' : role === 'architect' ? 'Workboard' : 'Projects'}
              </button>

              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={dark ? 'Use light mode' : 'Use dark mode'}
                data-testid="theme-toggle"
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{' '}
                {dark ? 'Light' : 'Dark'}
              </button>

              <div className="hidden items-center gap-1 border-l border-black/15 pl-3 sm:flex" aria-label="Text size">
                {(['100', '1125', '125'] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    data-testid={`portal-text-scale-${scale}`}
                    aria-pressed={textScale === scale}
                    onClick={() => setTextScale(scale)}
                    className={`font-mono text-[9px] transition-colors hover:text-black ${
                      textScale === scale ? 'text-black font-semibold' : 'text-stone-500'
                    }`}
                  >
                    {scale === '1125' ? '112.5%' : `${scale}%`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                Sign out <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-navigation bar with real routes */}
          <div className="border-t border-black/10 bg-[#252624]/60">
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

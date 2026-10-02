import React, { Suspense, useEffect, useRef, useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import {
  DashboardPage,
  DashboardProjectPage,
  AdminDashboardPage,
  ArchitectDashboardPage,
  LoginOverlay,
  NotFoundPage,
  PublicProjectPage,
} from './components/portal/PortalPages';
import { demoAuth } from './portal/demoAuth';
import { getPortalUser, getProjectsForUser, PortalRole } from './portal/data';

const Workspace = React.lazy(() => import('./components/layout/Workspace').then((module) => ({ default: module.Workspace })));

const legacyWorkspaceRequested = () => {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'workspace'
    || params.get('app') === 'true'
    || window.location.hash === '#workspace'
    || window.location.hash === '#/workspace';
};

const readRoute = () => legacyWorkspaceRequested() ? '/workspace' : window.location.pathname || '/';

const roleHome = (role?: PortalRole) => role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard';

const RoleRedirect: React.FC<{ path: string; onRedirect: (path: string) => void }> = ({ path, onRedirect }) => {
  useEffect(() => {
    window.history.replaceState({}, '', path);
    onRedirect(path);
  }, [path, onRedirect]);
  return null;
};

export const App: React.FC = () => {
  const initialRoute = readRoute();
  const [route, setRoute] = useState(initialRoute === '/login' ? '/' : initialRoute);
  const [loginOpen, setLoginOpen] = useState(initialRoute === '/login');
  const loginTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = readRoute();
      if (nextRoute === '/login') {
        window.history.replaceState({}, '', '/');
        setRoute('/');
        setLoginOpen(true);
        return;
      }
      setRoute(nextRoute);
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const openLogin = (trigger?: HTMLElement) => {
    loginTriggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
    window.setTimeout(() => loginTriggerRef.current?.focus(), 0);
  };

  const navigate = (path: string) => {
    if (path === '/login') {
      window.history.replaceState({}, '', '/');
      setRoute('/');
      openLogin();
      return;
    }
    setLoginOpen(false);
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const signOut = () => {
    demoAuth.signOut();
    navigate('/');
  };

  const handleLoginSuccess = () => navigate(roleHome(demoAuth.getSession()?.role));

  const session = demoAuth.getSession();
  const dashboardProjectMatch = route.match(/^\/dashboard\/projects\/([^/]+)$/);
  const architectProjectMatch = route.match(/^\/architect\/projects\/([^/]+)$/);
  const adminProjectMatch = route.match(/^\/admin\/projects\/([^/]+)$/);
  const publicProjectMatch = route.match(/^\/projects\/([^/]+)$/);
  const needsAuth = ['/dashboard', '/architect', '/admin', '/workspace'].includes(route)
    || !!dashboardProjectMatch || !!architectProjectMatch || !!adminProjectMatch;

  if (route === '/') {
    return (
      <>
        <LandingPage onNavigate={navigate} onLogin={(trigger) => openLogin(trigger)} />
        <LoginOverlay open={loginOpen} onClose={closeLogin} onSuccess={handleLoginSuccess} />
      </>
    );
  }
  if (publicProjectMatch) return <PublicProjectPage projectId={publicProjectMatch[1]} onNavigate={navigate} />;

  if (needsAuth && !session && !legacyWorkspaceRequested()) {
    return (
      <>
        <LandingPage onNavigate={navigate} onLogin={(trigger) => openLogin(trigger)} />
        <LoginOverlay open onClose={() => navigate('/')} onSuccess={handleLoginSuccess} />
      </>
    );
  }

  const protectedRole = route === '/admin' || adminProjectMatch ? 'admin' : route === '/architect' || architectProjectMatch ? 'architect' : route === '/dashboard' || dashboardProjectMatch ? 'client' : undefined;
  const assignedProjectMatch = dashboardProjectMatch || architectProjectMatch;
  const assignedProjectForbidden = assignedProjectMatch && (session?.role === 'client' || session?.role === 'architect')
    && !getProjectsForUser(getPortalUser(session?.email ?? '')?.id ?? '').some((project) => project.id === assignedProjectMatch[1]);
  const roleMismatch = Boolean((protectedRole && session && session.role !== protectedRole) || assignedProjectForbidden);
  if (roleMismatch && session) return <RoleRedirect path={roleHome(session.role)} onRedirect={setRoute} />;

  if (route === '/dashboard') return <DashboardPage onNavigate={navigate} onSignOut={signOut} />;
  if (route === '/architect') return <ArchitectDashboardPage onNavigate={navigate} onSignOut={signOut} />;
  if (route === '/admin') return <AdminDashboardPage onNavigate={navigate} onSignOut={signOut} />;
  if (dashboardProjectMatch) {
    return (
      <DashboardProjectPage
        projectId={dashboardProjectMatch[1]}
        onNavigate={navigate}
        onSignOut={signOut}
        onOpenWorkspace={() => navigate('/workspace')}
        role="client"
      />
    );
  }
  if (architectProjectMatch || adminProjectMatch) {
    const isAdmin = !!adminProjectMatch;
    return <DashboardProjectPage projectId={(isAdmin ? adminProjectMatch : architectProjectMatch)![1]} onNavigate={navigate} onSignOut={signOut} onOpenWorkspace={() => navigate('/workspace')} homePath={isAdmin ? '/admin' : '/architect'} role={isAdmin ? 'admin' : 'architect'} />;
  }

  if (route === '/workspace') {
    return (
      <div className="relative h-full w-full">
        <button
          onClick={() => navigate(session ? roleHome(session.role) : '/')}
          data-testid="btn-back-to-landing"
          className="fixed bottom-4 left-4 z-50 flex items-center space-x-1 rounded border border-white/10 bg-[#181c26]/90 px-2 py-1 font-mono text-[11px] text-stone-300 shadow-sm backdrop-blur transition hover:bg-[#222736] hover:text-white"
          title={session ? 'Return to client dashboard' : 'Return to architectural portfolio'}
        >
          <span>← {session ? 'Dashboard' : 'Projects'}</span>
        </button>
        <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#0d0f12] font-mono text-xs text-stone-400">Opening model workspace…</div>}>
          <Workspace />
        </Suspense>
      </div>
    );
  }

  return <NotFoundPage onNavigate={navigate} />;
};

export default App;

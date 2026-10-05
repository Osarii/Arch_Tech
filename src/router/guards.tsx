import React from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { ForbiddenPage, LoginOverlay, NotFoundPage } from '../components/portal/PortalPages';
import { getPortalProject, getPortalUser, getProjectsForUser, PortalRole } from '../portal/data';
import { portalAuth } from '../portal/demoAuth';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';

export const roleHome = (role?: PortalRole) => role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard';

export const legacyWorkspaceRequested = () => {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'workspace'
    || params.get('app') === 'true'
    || window.location.hash === '#workspace'
    || window.location.hash === '#/workspace';
};

const AuthGate: React.FC = () => {
  const navigate = useNavigate();
  const completeLogin = () => navigate(roleHome(portalAuth.getSession()?.role), { replace: true });
  return <LoginOverlay open onClose={() => navigate('/')} onSuccess={completeLogin} />;
};

export const ProtectedRoute: React.FC = () => {
  if (legacyWorkspaceRequested()) return <Outlet />;

  const [validating, setValidating] = React.useState(() => {
    return authService.isRemote() && !portalAuth.getSession() && Boolean(portalAuth.getCandidateSession());
  });

  React.useEffect(() => {
    if (!validating) return;
    let active = true;
    void authService
      .validateSession()
      .finally(() => {
        if (!active) return;
        setValidating(false);
      });
    return () => {
      active = false;
    };
  }, [validating]);

  if (validating) return null;

  const session = portalAuth.getSession();
  if (session) return <Outlet />;
  return <AuthGate />;
};

export const RoleRoute: React.FC<{ role: PortalRole }> = ({ role }) => {
  const session = portalAuth.getSession();
  if (!session) return <AuthGate />;
  if (session.role !== role) return <Navigate to="/403" replace />;
  return <Outlet />;
};

let lastApiBaseUrl: string | undefined = undefined;
let projectsHydrated = false;
let inflightProjectsPromise: Promise<void> | null = null;
let usersHydrated = false;
let inflightUsersPromise: Promise<void> | null = null;

export const resetRouterHydration = () => {
  lastApiBaseUrl = undefined;
  projectsHydrated = false;
  inflightProjectsPromise = null;
  usersHydrated = false;
  inflightUsersPromise = null;
};

const checkEnv = () => {
  const currentBase = projectService.isRemote() ? (import.meta.env.VITE_API_BASE_URL || 'remote') : 'local';
  if (currentBase !== lastApiBaseUrl) {
    lastApiBaseUrl = currentBase;
    projectsHydrated = false;
    inflightProjectsPromise = null;
    usersHydrated = false;
    inflightUsersPromise = null;
  }
};

export const isProjectsHydrated = () => {
  checkEnv();
  return !projectService.isRemote() || projectsHydrated;
};

export const ensureProjectsHydrated = async (): Promise<void> => {
  checkEnv();
  if (!projectService.isRemote() || projectsHydrated) return;
  if (inflightProjectsPromise) return inflightProjectsPromise;
  inflightProjectsPromise = (async () => {
    try {
      await projectService.list();
      projectsHydrated = true;
    } catch {
      projectsHydrated = true;
    }
  })().finally(() => {
    inflightProjectsPromise = null;
  });
  return inflightProjectsPromise;
};

export const ensureUsersHydrated = async (): Promise<void> => {
  checkEnv();
  if (!userService.isRemote() || usersHydrated) return;
  if (inflightUsersPromise) return inflightUsersPromise;
  inflightUsersPromise = (async () => {
    try {
      await userService.list();
      usersHydrated = true;
    } catch {
      usersHydrated = true;
    }
  })().finally(() => {
    inflightUsersPromise = null;
  });
  return inflightUsersPromise;
};

export const AccessibleProjectRoute: React.FC<{ role: PortalRole }> = ({ role }) => {
  const session = portalAuth.getSession();
  const { projectId = '' } = useParams();
  checkEnv();

  const isRemote = projectService.isRemote() || userService.isRemote();
  const needsProjects = projectService.isRemote() && !projectsHydrated;
  const needsUser = userService.isRemote() && role !== 'admin' && !usersHydrated;

  const [ready, setReady] = React.useState(!isRemote || (!needsProjects && !needsUser));

  React.useEffect(() => {
    checkEnv();
    if (ready || !isRemote) return;
    let active = true;
    const tasks: Promise<unknown>[] = [];
    if (projectService.isRemote() && !projectsHydrated) {
      tasks.push(ensureProjectsHydrated());
    }
    if (userService.isRemote() && role !== 'admin' && !usersHydrated) {
      tasks.push(ensureUsersHydrated());
    }
    void Promise.all(tasks).finally(() => {
      if (!active) return;
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [ready, isRemote, role, session]);

  if (!session) return <AuthGate />;
  if (!ready) return null;

  const project = projectId ? getPortalProject(projectId) : undefined;
  if (!project) return <Navigate to="/404" replace />;

  if (role === 'admin') return <Outlet />;

  const user = getPortalUser(session.email);
  const allowed = Boolean(projectId && user && getProjectsForUser(user.id).some((p) => p.id === projectId));
  if (!allowed) return <Navigate to="/403" replace />;
  return <Outlet />;
};

export const ForbiddenRoute: React.FC = () => {
  const navigate = useNavigate();
  return <ForbiddenPage onNavigate={navigate} />;
};

export const NotFoundRoute: React.FC = () => {
  const navigate = useNavigate();
  return <NotFoundPage onNavigate={navigate} />;
};

export const PublicLandingRoute: React.FC<{ onLogin: (trigger?: HTMLElement) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  if (legacyWorkspaceRequested()) return <Outlet />;
  return <LandingPage onNavigate={navigate} onLogin={onLogin} />;
};

import React from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { LandingPage } from '../pages/public/LandingPage';
import { ForbiddenPage, NotFoundPage, ServiceUnavailablePage } from '../components/portal/PortalCommon';
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

const AuthGate: React.FC = () => <Navigate to="/login" replace />;

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
let inflightProjectsPromise: Promise<boolean> | null = null;
let usersHydrated = false;
let inflightUsersPromise: Promise<boolean> | null = null;

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

export const isUsersHydrated = () => {
  checkEnv();
  return !userService.isRemote() || usersHydrated;
};

export const ensureProjectsHydrated = async (): Promise<boolean> => {
  checkEnv();
  if (!projectService.isRemote() || projectsHydrated) return true;
  if (inflightProjectsPromise) return inflightProjectsPromise;
  inflightProjectsPromise = (async () => {
    try {
      await projectService.list();
      projectsHydrated = true;
      return true;
    } catch {
      projectsHydrated = false;
      return false;
    }
  })().finally(() => {
    inflightProjectsPromise = null;
  });
  return inflightProjectsPromise;
};

export const ensureUsersHydrated = async (): Promise<boolean> => {
  checkEnv();
  if (!userService.isRemote() || usersHydrated) return true;
  if (inflightUsersPromise) return inflightUsersPromise;
  inflightUsersPromise = (async () => {
    try {
      await userService.list();
      usersHydrated = true;
      return true;
    } catch {
      usersHydrated = false;
      return false;
    }
  })().finally(() => {
    inflightUsersPromise = null;
  });
  return inflightUsersPromise;
};

export const AccessibleProjectRoute: React.FC<{ role: PortalRole }> = ({ role }) => {
  const session = portalAuth.getSession();
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  checkEnv();

  const isRemote = projectService.isRemote() || userService.isRemote();
  const needsProjects = projectService.isRemote() && !projectsHydrated;
  const needsUser = userService.isRemote() && role !== 'admin' && !usersHydrated;

  const [loading, setLoading] = React.useState(Boolean(isRemote && (needsProjects || needsUser)));
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [retryIndex, setRetryIndex] = React.useState(0);

  React.useEffect(() => {
    checkEnv();
    const currentNeedsProjects = projectService.isRemote() && !projectsHydrated;
    const currentNeedsUser = userService.isRemote() && role !== 'admin' && !usersHydrated;
    if (!isRemote || (!currentNeedsProjects && !currentNeedsUser)) {
      setLoading(false);
      setLoadError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    const runHydration = async () => {
      const tasks: Promise<boolean>[] = [];
      if (currentNeedsProjects) {
        tasks.push(ensureProjectsHydrated());
      }
      if (currentNeedsUser) {
        tasks.push(ensureUsersHydrated());
      }
      const results = await Promise.all(tasks);
      if (!active) return;
      if (results.some((success) => !success)) {
        setLoadError('Failed to connect to the remote project service.');
      } else {
        setLoadError(null);
      }
      setLoading(false);
    };

    void runHydration();

    return () => {
      active = false;
    };
  }, [isRemote, role, session, retryIndex]);

  if (!session) return <AuthGate />;
  if (loading) return null;
  if (loadError) {
    return (
      <ServiceUnavailablePage
        onNavigate={navigate}
        onRetry={() => setRetryIndex((i) => i + 1)}
        message="Unable to verify remote project existence and access permissions. Please check your network connection and try again."
      />
    );
  }

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

export const PublicLandingRoute: React.FC = () => {
  const navigate = useNavigate();
  if (legacyWorkspaceRequested()) return <Outlet />;
  return <LandingPage onNavigate={navigate} onLogin={() => navigate('/login')} />;
};

import React from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { LoginOverlay, NotFoundPage } from '../components/portal/PortalPages';
import { getPortalUser, getProjectsForUser, PortalRole } from '../portal/data';
import { portalAuth } from '../portal/demoAuth';

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
  const session = portalAuth.getSession();
  if (session || legacyWorkspaceRequested()) return <Outlet />;
  return <AuthGate />;
};

export const RoleRoute: React.FC<{ role: PortalRole }> = ({ role }) => {
  const session = portalAuth.getSession();
  if (!session) return <AuthGate />;
  if (session.role !== role) return <Navigate to={roleHome(session.role)} replace />;
  return <Outlet />;
};

export const AccessibleProjectRoute: React.FC<{ role: PortalRole }> = ({ role }) => {
  const session = portalAuth.getSession();
  const { projectId } = useParams();
  if (!session) return <AuthGate />;
  if (role === 'admin') return <Outlet />;
  const user = getPortalUser(session.email);
  const allowed = Boolean(projectId && user && getProjectsForUser(user.id).some((project) => project.id === projectId));
  if (!allowed) return <Navigate to={roleHome(role)} replace />;
  return <Outlet />;
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

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import {
  AdminDashboardPage,
  ArchitectDashboardPage,
  DashboardPage,
  DashboardProjectPage,
  LoginOverlay,
  PublicProjectPage,
} from '../components/portal/PortalPages';
import { portalAuth } from '../portal/demoAuth';
import { roleHome, ProtectedRoute, RoleRoute, AccessibleProjectRoute, legacyWorkspaceRequested, NotFoundRoute } from './guards';

const Workspace = React.lazy(() => import('../components/layout/Workspace').then((module) => ({ default: module.Workspace })));

const WorkspaceRoute: React.FC = () => {
  const navigate = useNavigate();
  const session = portalAuth.getSession();
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
};

const RootRoute: React.FC<{ onLogin: (trigger?: HTMLElement) => void; onNavigate: (path: string) => void }> = ({ onLogin, onNavigate }) => {
  if (legacyWorkspaceRequested()) return <WorkspaceRoute />;
  return <LandingPage onNavigate={onNavigate} onLogin={onLogin} />;
};

const PublicProjectRoute: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { projectId = '' } = useParams();
  return <PublicProjectPage projectId={projectId} onNavigate={onNavigate} />;
};

const DashboardProjectRoute: React.FC<{ role: 'client' | 'architect' | 'admin' }> = ({ role }) => {
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const homePath = roleHome(role);
  return <DashboardProjectPage projectId={projectId} onNavigate={navigate} onSignOut={() => { portalAuth.signOut(); navigate('/'); }} onOpenWorkspace={() => navigate('/workspace')} homePath={homePath} role={role} />;
};

const RoutedApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(() => new URLSearchParams(location.search).get('login') === '1');
  const loginTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('login') === '1') setLoginOpen(true);
  }, [location.search]);

  const openLogin = (trigger?: HTMLElement) => {
    loginTriggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
    if (location.pathname === '/' && location.search) navigate('/', { replace: true });
    window.setTimeout(() => loginTriggerRef.current?.focus(), 0);
  };

  const completeLogin = () => {
    setLoginOpen(false);
    navigate(roleHome(portalAuth.getSession()?.role), { replace: true });
  };

  const handleNavigate = (path: string) => {
    if (path === '/login') {
      openLogin();
      if (location.pathname !== '/') navigate('/?login=1', { replace: true });
      return;
    }
    navigate(path);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute onLogin={openLogin} onNavigate={handleNavigate} />} />
        <Route path="/login" element={<Navigate to="/?login=1" replace />} />
        <Route path="/projects/:projectId" element={<PublicProjectRoute onNavigate={handleNavigate} />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="client" />}>
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} onSignOut={() => { portalAuth.signOut(); navigate('/'); }} />} />
            <Route element={<AccessibleProjectRoute role="client" />}>
              <Route path="/dashboard/projects/:projectId" element={<DashboardProjectRoute role="client" />} />
            </Route>
          </Route>
          <Route element={<RoleRoute role="architect" />}>
            <Route path="/architect" element={<ArchitectDashboardPage onNavigate={handleNavigate} onSignOut={() => { portalAuth.signOut(); navigate('/'); }} />} />
            <Route element={<AccessibleProjectRoute role="architect" />}>
              <Route path="/architect/projects/:projectId" element={<DashboardProjectRoute role="architect" />} />
            </Route>
          </Route>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboardPage onNavigate={handleNavigate} onSignOut={() => { portalAuth.signOut(); navigate('/'); }} />} />
            <Route element={<AccessibleProjectRoute role="admin" />}>
              <Route path="/admin/projects/:projectId" element={<DashboardProjectRoute role="admin" />} />
            </Route>
          </Route>
          <Route path="/workspace" element={<WorkspaceRoute />} />
        </Route>
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
      <LoginOverlay open={loginOpen} onClose={closeLogin} onSuccess={completeLogin} />
    </>
  );
};

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <RoutedApp />
  </BrowserRouter>
);

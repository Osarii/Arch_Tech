import React, { Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { ProjectRouteTransition, useProjectRouteTransition } from '../components/motion';
import {
  AdminAnalyticsPage,
  AdminApprovalsPage,
  AdminAssistantPage,
  AdminOverviewPage,
  AdminNewsPage,
  AdminPeoplePage,
  AdminProjectsPage,
  ArchitectApprovalsPage,
  ArchitectAssistantPage,
  ArchitectDocumentsPage,
  ArchitectInsightsPage,
  ArchitectOverviewPage,
  ArchitectProjectsPage,
  ClientApprovalsPage,
  ClientAssistantPage,
  ClientDocumentsPage,
  ClientInsightsPage,
  ClientOverviewPage,
  ClientProjectsPage,
  DashboardProjectPage,
  LoginOverlay,
  PortalShell,
  PublicProjectPage,
  ServiceUnavailablePage,
} from '../components/portal/PortalPages';
import { getPublicProject } from '../portal/data';
import { portalAuth } from '../portal/demoAuth';
import { projectService } from '../services/projectService';
import { NewsArchivePage } from '../components/news/NewsArchivePage';
import { NewsDetailPage } from '../components/news/NewsDetailPage';
import {
  AccessibleProjectRoute,
  ensureProjectsHydrated,
  ForbiddenRoute,
  isProjectsHydrated,
  legacyWorkspaceRequested,
  NotFoundRoute,
  ProtectedRoute,
  RoleRoute,
  roleHome,
} from './guards';

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
  const isRemote = projectService.isRemote();
  const [loading, setLoading] = useState(Boolean(isRemote && !isProjectsHydrated()));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    if (!isRemote || isProjectsHydrated()) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(null);
    void ensureProjectsHydrated().then((success) => {
      if (!active) return;
      if (!success) {
        setLoadError('Failed to load project records.');
      } else {
        setLoadError(null);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isRemote, retryIndex]);

  if (loading) return null;
  if (loadError) {
    return (
      <ServiceUnavailablePage
        onNavigate={onNavigate}
        onRetry={() => setRetryIndex((i) => i + 1)}
        message="Unable to verify project existence. Please check your network connection and try again."
      />
    );
  }

  const project = getPublicProject(projectId);
  if (!project) return <Navigate to="/404" replace />;
  return <PublicProjectPage projectId={projectId} onNavigate={onNavigate} />;
};

const NewsDetailRoute: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { updateId = '' } = useParams();
  return <NewsDetailPage updateId={decodeURIComponent(updateId)} onNavigate={onNavigate} />;
};

const DashboardProjectRoute: React.FC<{ role: 'client' | 'architect' | 'admin' }> = ({ role }) => {
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const homePath = roleHome(role);
  return (
    <DashboardProjectPage
      projectId={projectId}
      onNavigate={navigate}
      onSignOut={() => { portalAuth.signOut(); navigate('/'); }}
      onOpenWorkspace={() => navigate('/workspace')}
      homePath={homePath}
      role={role}
    />
  );
};

const RoutedApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transitionState, navigateWithTransition } = useProjectRouteTransition(navigate, location.pathname);
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
    navigateWithTransition(path);
  };

  const handleSignOut = () => {
    portalAuth.signOut();
    navigate('/');
  };

  return (
    <>
      <ProjectRouteTransition state={transitionState} />
      <Routes>
        <Route path="/" element={<RootRoute onLogin={openLogin} onNavigate={handleNavigate} />} />
        <Route path="/login" element={<Navigate to="/?login=1" replace />} />
        <Route path="/projects/:projectId" element={<PublicProjectRoute onNavigate={handleNavigate} />} />
        <Route path="/news" element={<NewsArchivePage onNavigate={handleNavigate} />} />
        <Route path="/news/:updateId" element={<NewsDetailRoute onNavigate={handleNavigate} />} />
        <Route path="/403" element={<ForbiddenRoute />} />
        <Route path="/404" element={<NotFoundRoute />} />
        <Route element={<ProtectedRoute />}>
          {/* CLIENT WORKSPACES */}
          <Route element={<RoleRoute role="client" />}>
            <Route element={<PortalShell role="client" onNavigate={handleNavigate} onSignOut={handleSignOut} />}>
              <Route path="/dashboard" element={<ClientOverviewPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/dashboard/projects" element={<ClientProjectsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/dashboard/documents" element={<ClientDocumentsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/dashboard/approvals" element={<ClientApprovalsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/dashboard/insights" element={<ClientInsightsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/dashboard/assistant" element={<ClientAssistantPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route element={<AccessibleProjectRoute role="client" />}>
                <Route path="/dashboard/projects/:projectId" element={<DashboardProjectRoute role="client" />} />
              </Route>
            </Route>
          </Route>

          {/* ARCHITECT WORKSPACES */}
          <Route element={<RoleRoute role="architect" />}>
            <Route element={<PortalShell role="architect" onNavigate={handleNavigate} onSignOut={handleSignOut} />}>
              <Route path="/architect" element={<ArchitectOverviewPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/architect/projects" element={<ArchitectProjectsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/architect/approvals" element={<ArchitectApprovalsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/architect/documents" element={<ArchitectDocumentsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/architect/insights" element={<ArchitectInsightsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/architect/assistant" element={<ArchitectAssistantPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route element={<AccessibleProjectRoute role="architect" />}>
                <Route path="/architect/projects/:projectId" element={<DashboardProjectRoute role="architect" />} />
              </Route>
            </Route>
          </Route>

          {/* ADMIN WORKSPACES */}
          <Route element={<RoleRoute role="admin" />}>
            <Route element={<PortalShell role="admin" onNavigate={handleNavigate} onSignOut={handleSignOut} />}>
              <Route path="/admin" element={<AdminOverviewPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/projects" element={<AdminProjectsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/people" element={<AdminPeoplePage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/approvals" element={<AdminApprovalsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/news" element={<AdminNewsPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route path="/admin/assistant" element={<AdminAssistantPage onNavigate={handleNavigate} onSignOut={handleSignOut} />} />
              <Route element={<AccessibleProjectRoute role="admin" />}>
                <Route path="/admin/projects/:projectId" element={<DashboardProjectRoute role="admin" />} />
              </Route>
            </Route>
          </Route>

          <Route path="/workspace" element={<WorkspaceRoute />} />
        </Route>
        <Route path="*" element={<Navigate to="/404" replace />} />
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

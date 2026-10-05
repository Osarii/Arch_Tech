import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { Hero } from '../src/components/landing/Hero';
import { LandingPage } from '../src/components/landing/LandingPage';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { ProjectShowcase } from '../src/components/landing/ProjectShowcase';
import { getPortalProject, getPortalSnapshot, updatePortalDatabase } from '../src/portal/data';
import { portalAuth } from '../src/portal/demoAuth';
import {
  DashboardPage,
  DashboardProjectPage,
  AdminDashboardPage,
  ArchitectDashboardPage,
  LoginOverlay,
  PublicProjectPage,
} from '../src/components/portal/PortalPages';

vi.mock('../src/components/layout/Workspace', () => ({
  Workspace: () => <div data-testid="workspace">BIM Workspace</div>,
}));

describe('ARCH_TECH client architecture portal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    document.documentElement.classList.remove('portal-dark');
  });

  it('renders a projects-only public landing with project portal access', () => {
    const onNavigate = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onLogin={onLogin} />);

    expect(screen.getByRole('heading', { name: /Development at a larger scale/ })).toBeDefined();
    expect(screen.getByText('Development portfolio')).toBeDefined();
    expect(screen.getByText('From opportunity to operation.')).toBeDefined();
    expect(screen.getByText('A portfolio built for consequence.')).toBeDefined();
    expect(screen.getAllByText('Pacific Nexus Free Zone Campus').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Summit Point Corporate District').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mar Vista Hospitality District').length).toBeGreaterThan(0);
    expect(screen.getByText('Caribbean AI Compute Campus')).toBeDefined();
    expect(screen.getByText('Guanacaste Renewable Compute Campus')).toBeDefined();
    expect(screen.getByText('Pacific Regional Medical Campus')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Structure for complex development.' })).toBeDefined();
    for (const label of ['SITE + LAND STRATEGY', 'MASTERPLANNING', 'INFRASTRUCTURE FRAMEWORK', 'DEVELOPMENT COORDINATION', 'DIGITAL PROJECT DELIVERY', 'OPERATIONAL CONTINUITY']) {
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(screen.getAllByTestId(/^public-project-/)).toHaveLength(6);
    expect(screen.getByText('Private project portal')).toBeDefined();
    expect(screen.getByText('Structured project information and OpenBIM coordination where useful.')).toBeDefined();

    fireEvent.click(screen.getByTestId('client-login-link'));
    expect(onLogin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: /Project Portal/i }).at(-1)!);
    expect(onLogin).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByTestId('development-portal-link'));
    expect(onLogin).toHaveBeenCalledTimes(3);
  });

  it('uses a simple three-image architectural hero without sticky scroll state', () => {
    const onViewProjects = vi.fn();
    const onOpenProject = vi.fn();
    render(<Hero onViewProjects={onViewProjects} onOpenProject={onOpenProject} />);

    expect(screen.getByTestId('hero-gallery').querySelectorAll('img')).toHaveLength(3);
    expect(screen.getByTestId('hero-gallery').className).not.toContain('sticky');
    expect(screen.getByText('Pacific Nexus Free Zone Campus')).toBeDefined();
    fireEvent.click(screen.getByTestId('hero-view-projects'));
    expect(onViewProjects).toHaveBeenCalledTimes(1);

    for (const project of [
      ['Pacific Nexus Free Zone Campus', 'pacific-nexus-free-zone'],
      ['Summit Point Corporate District', 'summit-point-corporate-district'],
      ['Mar Vista Hospitality District', 'mar-vista-hospitality-district'],
    ]) {
      const [title, id] = project;
      const panel = screen.getByRole('button', { name: `Open ${title} project` });
      expect(panel).toBeDefined();
      fireEvent.click(panel);
      expect(onOpenProject).toHaveBeenLastCalledWith(id);
    }
  });

  it('routes hero development panels to their public project dossiers', () => {
    const onNavigate = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onLogin={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Pacific Nexus Free Zone Campus project' }));
    expect(onNavigate).toHaveBeenCalledWith('/projects/pacific-nexus-free-zone');
  });

  it('opens public project details from the selected projects list', () => {
    const onOpenProject = vi.fn();
    render(<ProjectShowcase onOpenProject={onOpenProject} />);

    fireEvent.click(screen.getByTestId('public-project-pacific-nexus-free-zone'));
    expect(onOpenProject).toHaveBeenCalledWith('pacific-nexus-free-zone');

    const onNavigate = vi.fn();
    render(<PublicProjectPage projectId="pacific-nexus-free-zone" onNavigate={onNavigate} />);
    expect(screen.getAllByText('Pacific Nexus Free Zone Campus').length).toBeGreaterThan(0);
    expect(screen.getByText('Project intent')).toBeDefined();
    expect(screen.getByText('Development path')).toBeDefined();
    expect(screen.getAllByText('Costa Rica · Central Pacific').length).toBeGreaterThan(0);

    cleanup();
    render(<PublicProjectPage projectId="summit-point-corporate-district" onNavigate={onNavigate} />);
    expect(screen.getByText('Summit Point Corporate District')).toBeDefined();
    expect(screen.getByText('Corporate district')).toBeDefined();
    expect(screen.getByText('Long view')).toBeDefined();
  });

  it('keeps portal authentication isolated inside the login overlay', () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<LoginOverlay open onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect((screen.getByTestId('login-email') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('login-password') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'mariana.solano@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'incorrect' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(screen.getByRole('alert').textContent).toContain('Check the email');
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'client-access' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(window.localStorage.getItem('arch-tech-portal-session')).not.toBeNull();
  });

  it('closes the login overlay with escape and backdrop, and traps focus', () => {
    const onClose = vi.fn();
    const { rerender } = render(<LoginOverlay open onClose={onClose} onSuccess={vi.fn()} />);

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close login');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId('login-submit'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<LoginOverlay open onClose={onClose} onSuccess={vi.fn()} />);
    fireEvent.mouseDown(screen.getAllByRole('presentation').at(-1)!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows client projects, progress, phase, milestone and latest updates', () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(screen.getByText('Your projects')).toBeDefined();
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Design development/).length).toBeGreaterThan(0);
    expect(screen.getByText('Decisions requiring your attention')).toBeDefined();
    expect(screen.getByText('Upcoming milestones')).toBeDefined();
    expect(screen.getByText('Recent project updates')).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Approve' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    expect(screen.getByText('Request changes')).toBeDefined();
  });

  it('limits architect data and exposes the admin register', () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    const architectNavigate = vi.fn();
    render(<ArchitectDashboardPage onNavigate={architectNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Assigned projects')).toBeDefined();
    expect(screen.getByRole('region', { name: 'Architect workload' })).toBeDefined();
    expect(screen.getAllByText('Pacific Nexus Free Zone Campus').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Summit Point Corporate District').length).toBeGreaterThan(0);
    expect(screen.queryByText('Pacific Regional Medical Campus')).toBeNull();
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    expect(document.querySelectorAll('.portal-overview-tile')).toHaveLength(4);
    fireEvent.click(screen.getByTestId('architect-approval-pacific-nexus-free-zone'));
    expect(architectNavigate).toHaveBeenCalledWith('/architect/projects/pacific-nexus-free-zone');

    cleanup();
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByText('All projects / assignments')).toBeDefined();
    expect(screen.getAllByText('Pacific Regional Medical Campus').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sebastián Araya').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Material palette').length).toBeGreaterThan(0);
    const adminSurface = screen.getByText('All projects / assignments').closest('.portal-surface');
    expect(adminSurface?.className).toContain('portal-admin');
    expect(adminSurface?.className).toContain('bg-[#D6CBB9]');
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).querySelector('.font-serif')?.className).toContain('text-5xl');
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).className).toContain('admin-kpi-strip');
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).querySelectorAll('.admin-overview-tile')).toHaveLength(4);
    expect(document.querySelector('.portal-register-row')).toBeDefined();
    expect(screen.getByTestId('admin-open-model-pacific-nexus-free-zone').className).toContain('admin-action');
  });

  it('uses objective admin signals and reviews only projects with pending approvals', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    updatePortalDatabase((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === 'caribbean-ai-compute-campus' ? { ...project, progress: 1 } : project),
      approvals: current.approvals.filter((approval) => approval.projectId !== 'caribbean-ai-compute-campus'),
    }));
    const { db, projects } = getPortalSnapshot();
    const activeProjects = projects.filter((project) => !project.archived);
    const expectedAverage = Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length);
    const expectedPending = db.approvals.filter((approval) => approval.status === 'Pending' && activeProjects.some((project) => project.id === approval.projectId)).length;
    const expectedUpcoming = db.milestones.filter((milestone) => milestone.status === 'Upcoming' && activeProjects.some((project) => project.id === milestone.projectId)).length;
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    const portfolioOverview = screen.getByRole('region', { name: 'Portfolio overview' });
    expect(within(portfolioOverview).getByText('Active projects')).toBeDefined();
    expect(within(portfolioOverview).getByText(activeProjects.length.toString().padStart(2, '0'))).toBeDefined();
    expect(within(portfolioOverview).getByText('Average progress')).toBeDefined();
    expect(within(portfolioOverview).getByText(`${expectedAverage}%`)).toBeDefined();
    expect(within(portfolioOverview).getByText('Pending approvals')).toBeDefined();
    expect(within(portfolioOverview).getByText(expectedPending.toString().padStart(2, '0'))).toBeDefined();
    expect(within(portfolioOverview).getByText('Upcoming milestones')).toBeDefined();
    expect(within(portfolioOverview).getByText(expectedUpcoming.toString().padStart(2, '0'))).toBeDefined();
    expect(screen.queryByText('Project health')).toBeNull();
    expect(screen.queryByText('Operational controls')).toBeNull();
    expect(screen.getByText('Create projects, manage people, assignments and approvals.')).toBeDefined();

    const reviewSignals = screen.getByRole('region', { name: 'Review and delivery signals' });
    expect(within(reviewSignals).getByText('Decisions requiring review')).toBeDefined();
    expect(within(reviewSignals).getByText('Pacific Nexus Free Zone Campus')).toBeDefined();
    expect(within(reviewSignals).getByText('Material palette')).toBeDefined();
    expect(within(reviewSignals).queryByText('Caribbean AI Compute Campus')).toBeNull();

    updatePortalDatabase((current) => ({
      ...current,
      approvals: current.approvals.map((approval) => ({ ...approval, status: 'Approved' as const })),
    }));
    cleanup();
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    const emptyReviewSignals = screen.getByRole('region', { name: 'Review and delivery signals' });
    expect(within(emptyReviewSignals).getByText('No project decisions are waiting for review.')).toBeDefined();
    expect(within(emptyReviewSignals).getByText('Upcoming milestones')).toBeDefined();
  });

  it('creates projects through the admin portal form', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    const adminNavigate = vi.fn();
    render(<AdminDashboardPage onNavigate={adminNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Active projects')).toBeDefined();
    expect(screen.getByText('Decisions requiring review')).toBeDefined();
    expect(screen.getByText('Development stages')).toBeDefined();
    expect(screen.getAllByText('Pending approvals').length).toBeGreaterThan(0);
    expect(screen.getByText('Recent activity')).toBeDefined();
    expect(screen.getByText('across active work')).toBeDefined();
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    fireEvent.click(screen.getByTestId('admin-open-model-pacific-nexus-free-zone'));
    expect(adminNavigate).toHaveBeenCalledWith('/workspace');
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByRole('dialog', { name: 'New project.' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Portal Annex' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '24' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create project' }).at(-1)!);
    expect(screen.getAllByText('Portal Annex').length).toBeGreaterThan(0);
    const createdProject = getPortalSnapshot().projects.find((project) => project.title === 'Portal Annex');
    expect(createdProject?.published).toBe(false);
    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    expect(screen.queryByText('Portal Annex')).toBeNull();

    cleanup();
    render(<PublicProjectPage projectId={createdProject!.id} onNavigate={vi.fn()} />);
    expect(screen.getByText('Project not found.')).toBeDefined();

    cleanup();
    render(<DashboardProjectPage projectId={createdProject!.id} onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="admin" homePath="/admin" />);
    fireEvent.click(screen.getByTestId('toggle-publication'));
    expect(getPortalSnapshot().projects.find((project) => project.id === createdProject!.id)?.published).toBe(true);
    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    expect(screen.getByText('Portal Annex')).toBeDefined();
  });

  it('validates admin project creation inputs', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    const openCreateProject = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
      return screen.getByRole('dialog', { name: 'New project.' });
    };
    const submitCreateProject = () => fireEvent.click(screen.getAllByRole('button', { name: 'Create project' }).at(-1)!);

    openCreateProject();
    expect((screen.getByLabelText('Category') as HTMLInputElement).value).toBe('Development · New project');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close create project' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'New project.' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Create project' }));
    openCreateProject();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Edge Development Campus  ' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '  Compute infrastructure  ' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '0' } });
    submitCreateProject();
    const zeroProject = getPortalSnapshot().projects.find((project) => project.title === 'Edge Development Campus');
    expect(zeroProject).toMatchObject({ title: 'Edge Development Campus', category: 'Compute infrastructure', progress: 0, published: false });

    openCreateProject();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Full Delivery Campus' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '  Regional development  ' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '100' } });
    submitCreateProject();
    expect(getPortalSnapshot().projects.find((project) => project.title === 'Full Delivery Campus')).toMatchObject({ category: 'Regional development', progress: 100 });

    const projectCountBeforeInvalid = getPortalSnapshot().projects.length;
    for (const invalidProgress of ['-1', '101', 'not-a-number', '']) {
      openCreateProject();
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: `Invalid ${invalidProgress || 'blank'}` } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Development' } });
      fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: invalidProgress } });
      submitCreateProject();
      expect(getPortalSnapshot().projects).toHaveLength(projectCountBeforeInvalid);
      expect(screen.getByRole('alert').textContent).toContain('progress value from 0 to 100');
      fireEvent.click(screen.getByRole('button', { name: 'Close create project' }));
    }

    for (const invalidField of ['title', 'category'] as const) {
      openCreateProject();
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: invalidField === 'title' ? '   ' : 'Valid title' } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: invalidField === 'category' ? '   ' : 'Development' } });
      fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '24' } });
      submitCreateProject();
      expect(getPortalSnapshot().projects).toHaveLength(projectCountBeforeInvalid);
      fireEvent.click(screen.getByRole('button', { name: 'Close create project' }));
    }
  });

  it('limits admin assignments to active users and active projects', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    const initial = getPortalSnapshot().db;
    const activeProject = initial.projects.find((project) => project.id === 'pacific-nexus-free-zone');
    const activeClient = initial.users.find((user) => user.role === 'client' && user.status === 'active');
    const activeArchitect = initial.users.find((user) => user.role === 'architect' && user.status === 'active');
    if (!activeProject || !activeClient || !activeArchitect) throw new Error('Expected canonical assignment fixtures');

    updatePortalDatabase((current) => ({
      ...current,
      users: current.users.map((user) => user.id === activeClient.id || user.id === activeArchitect.id ? { ...user, projectIds: [] } : user),
    }));
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    const clientAssignment = screen.getByTestId(`admin-assignment-${activeProject.id}-${activeClient.id}`);
    const architectAssignment = screen.getByTestId(`admin-assignment-${activeProject.id}-${activeArchitect.id}`);
    fireEvent.click(clientAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeClient.id)?.projectIds).toContain(activeProject.id);
    fireEvent.click(clientAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeClient.id)?.projectIds).not.toContain(activeProject.id);
    fireEvent.click(architectAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeArchitect.id)?.projectIds).toContain(activeProject.id);
    fireEvent.click(architectAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeArchitect.id)?.projectIds).not.toContain(activeProject.id);

    updatePortalDatabase((current) => ({
      ...current,
      users: current.users.map((user) => user.id === activeClient.id ? { ...user, status: 'inactive' } : user),
    }));
    const beforeInactiveAttempt = [...(getPortalSnapshot().db.users.find((user) => user.id === activeClient.id)?.projectIds ?? [])];
    fireEvent.click(clientAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeClient.id)?.projectIds).toEqual(beforeInactiveAttempt);

    updatePortalDatabase((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === activeProject.id ? { ...project, archived: true } : project),
    }));
    const beforeArchivedAttempt = [...(getPortalSnapshot().db.users.find((user) => user.id === activeArchitect.id)?.projectIds ?? [])];
    fireEvent.click(architectAssignment);
    expect(getPortalSnapshot().db.users.find((user) => user.id === activeArchitect.id)?.projectIds).toEqual(beforeArchivedAttempt);

    cleanup();
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.queryByTestId(`admin-assignment-project-${activeProject.id}`)).toBeNull();
    expect(screen.queryByTestId(`admin-assignment-${activeProject.id}-${activeClient.id}`)).toBeNull();
    expect(screen.getByText(activeClient.name)).toBeDefined();
  });

  it('redirects each portal role to its protected dashboard', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('client-login-link'));
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'sebastian.araya@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'architect-access' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/architect');
    expect(screen.getByText('Assigned projects')).toBeDefined();

    cleanup();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    render(<App />);
    fireEvent.click(screen.getByTestId('client-login-link'));
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'andrea.quesada@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'admin-access' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/admin');
    expect(screen.getByText('The project register.')).toBeDefined();
  });

  it('quick logs into each role from Portal Access', () => {
    for (const [role, path] of [['client', '/dashboard'], ['architect', '/architect'], ['admin', '/admin']] as const) {
      cleanup();
      window.localStorage.clear();
      window.history.replaceState({}, '', '/');
      render(<App />);
      fireEvent.click(screen.getByTestId('client-login-link'));
      expect(screen.getByRole('button', { name: `${role[0].toUpperCase()}${role.slice(1)} access` })).toBeDefined();
      fireEvent.click(screen.getByTestId(`quick-login-${role}`));
      expect(window.location.pathname).toBe(path);
    }
  });

  it('quick login reads role users from the current portal snapshot', () => {
    window.localStorage.setItem('arch-tech-portal-state', JSON.stringify({ users: [{ id: 'runtime-architect', name: 'Runtime Architect', email: 'runtime@arch-tech.studio', password: 'runtime-demo', role: 'architect', projectIds: ['pacific-nexus-free-zone'], status: 'active' }] }));
    render(<LoginOverlay open onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByTestId('quick-login-architect'));
    expect(portalAuth.getSession()?.email).toBe('runtime@arch-tech.studio');
    expect(portalAuth.getSession()?.role).toBe('architect');
  });

  it('migrates stale portal storage to the current portfolio', () => {
    const staleIds = ['lake' + '-house', 'woodland' + '-house', 'cantilever' + '-residence'];
    const staleAssets = ['/arch_' + 'hero.jpg', '/arch_' + 'openhouse.jpg', '/arch_' + 'cantilever.jpg'];
    window.localStorage.setItem('arch-tech-portal-state', JSON.stringify({
      projects: staleIds.map((id, index) => ({ id, title: ['Lake', 'Woodland', 'Cantilever'][index] + (index === 2 ? ' Residence' : ' House'), image: staleAssets[index] })),
      users: [{ id: 'portal-client', projectIds: staleIds }],
      updates: staleIds.map((projectId) => ({ projectId, date: '01 JAN 2026', title: 'Stale update', body: 'Removed project data.' })),
    }));

    const snapshot = getPortalSnapshot();
    expect(snapshot.projects.map((project) => project.id)).toEqual([
      'pacific-nexus-free-zone',
      'summit-point-corporate-district',
      'mar-vista-hospitality-district',
      'caribbean-ai-compute-campus',
      'guanacaste-renewable-compute-campus',
      'pacific-regional-medical-campus',
    ]);
    expect(snapshot.db.users.find((user) => user.id === 'portal-client')?.projectIds).toEqual(['pacific-nexus-free-zone', 'mar-vista-hospitality-district']);
    const migratedStorage = window.localStorage.getItem('arch-tech-portal-state') ?? '';
    expect(staleIds.every((id) => !migratedStorage.includes(id))).toBe(true);
    expect(staleAssets.every((asset) => !migratedStorage.includes(asset))).toBe(true);
  });

  it('role navigation controls point to real dashboard sections', () => {
    const cases = [
      { role: 'client' as const, renderPage: () => <DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />, sections: ['projects', 'updates', 'documents', 'notifications'] },
      { role: 'architect' as const, renderPage: () => <ArchitectDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />, sections: ['projects', 'activity', 'milestones', 'documents', 'approvals'] },
      { role: 'admin' as const, renderPage: () => <AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />, sections: ['projects', 'people', 'approvals', 'activity'] },
    ];
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    for (const item of cases) {
      cleanup();
      window.localStorage.clear();
      portalAuth.signIn(item.role === 'client' ? 'mariana.solano@arch-tech.studio' : item.role === 'architect' ? 'sebastian.araya@arch-tech.studio' : 'andrea.quesada@arch-tech.studio', item.role === 'client' ? 'client-access' : item.role === 'architect' ? 'architect-access' : 'admin-access');
      render(item.renderPage());
      for (const section of item.sections) {
        const button = screen.getByTestId(`portal-nav-${section === 'projects' ? 'projects' : section}`);
        const target = button.getAttribute('aria-controls');
        expect(target && document.getElementById(target)).toBeDefined();
        fireEvent.click(button);
      }
    }
    expect(scrollIntoView).toHaveBeenCalled();
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('redirects an authenticated role away from another role route', async () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    window.history.replaceState({}, '', '/admin');
    render(<App />);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/architect');
      expect(screen.getByText('Assigned projects')).toBeDefined();
    });
  });

  it('protects unassigned architect project details', async () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    window.history.replaceState({}, '', '/architect/projects/pacific-regional-medical-campus');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/architect'));
    expect(screen.getByText('Assigned projects')).toBeDefined();
    expect(screen.queryByText('Pacific Regional Medical Campus')).toBeNull();
  });

  it('allows assigned client project details and blocks unassigned direct URLs', async () => {
    window.localStorage.setItem('arch-tech-portal-state', JSON.stringify({ users: [{ id: 'runtime-client', name: 'Runtime Client', email: 'runtime-client@arch-tech.studio', password: 'runtime-demo', role: 'client', projectIds: ['pacific-nexus-free-zone'], status: 'active' }] }));
    portalAuth.signIn('runtime-client@arch-tech.studio', 'runtime-demo');
    window.history.replaceState({}, '', '/dashboard/projects/pacific-nexus-free-zone');
    render(<App />);
    expect(screen.getByText('Current phase')).toBeDefined();

    cleanup();
    window.history.replaceState({}, '', '/dashboard/projects/pacific-regional-medical-campus');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(screen.getByText('Projects in progress.')).toBeDefined();
  });

  it('provides all project detail sections and opens the existing workspace', () => {
    const onOpenWorkspace = vi.fn();
    expect(getPortalProject('pacific-nexus-free-zone')?.approvals[0].title).toBe('Material palette');
    render(
      <DashboardProjectPage
        projectId="pacific-nexus-free-zone"
        onNavigate={vi.fn()}
        onSignOut={vi.fn()}
        onOpenWorkspace={onOpenWorkspace}
      />,
    );

    expect(screen.getByText('Current phase')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-updates'));
    expect(screen.getByText('Material study issued')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-milestones'));
    expect(screen.getByText('Client design review')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-documents'));
    expect(screen.getByText('Design development set')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-model'));
    fireEvent.click(screen.getByTestId('open-3d-model'));
    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
  });

  it('keeps client approvals actionable and gives staff management controls', () => {
    render(<DashboardProjectPage projectId="pacific-nexus-free-zone" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="client" />);
    fireEvent.click(screen.getByTestId('project-tab-approvals'));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(screen.getByText('Approved')).toBeDefined();

    cleanup();
    render(<DashboardProjectPage projectId="pacific-nexus-free-zone" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="architect" homePath="/architect" />);
    expect(screen.getByTestId('role-management-panel')).toBeDefined();
    expect(screen.queryByTestId('toggle-publication')).toBeNull();
    fireEvent.change(screen.getByLabelText('Update title'), { target: { value: 'Coordination note' } });
    fireEvent.change(screen.getByLabelText('Update body'), { target: { value: 'Team review completed.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish update' }));
    fireEvent.click(screen.getByTestId('project-tab-updates'));
    expect(screen.getByText('Coordination note')).toBeDefined();
    expect(getPortalSnapshot().db.updates.find((update) => update.title === 'Coordination note')?.date).toBe(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    fireEvent.change(screen.getByLabelText('New milestone'), { target: { value: 'Coordination issue' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add milestone' }));
    fireEvent.change(screen.getByLabelText('New document'), { target: { value: 'Coordination set' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));
    fireEvent.change(screen.getByLabelText('New approval'), { target: { value: 'Client coordination review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request approval' }));
    fireEvent.click(screen.getByTestId('project-tab-milestones'));
    expect(screen.getByText('Coordination issue')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-documents'));
    expect(screen.getByText('Coordination set')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-approvals'));
    expect(screen.getByText('Client coordination review')).toBeDefined();

    cleanup();
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<DashboardProjectPage projectId="pacific-nexus-free-zone" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="admin" homePath="/admin" />);
    const beforeTitleOnlySave = getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone');
    fireEvent.change(screen.getByLabelText('Project title'), { target: { value: 'Pacific Nexus Free Zone Campus Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save status' }));
    const afterTitleOnlySave = getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone');
    expect(afterTitleOnlySave?.title).toBe('Pacific Nexus Free Zone Campus Updated');
    expect(afterTitleOnlySave?.progress).toBe(beforeTitleOnlySave?.progress);
    expect(afterTitleOnlySave?.phase).toBe(beforeTitleOnlySave?.phase);
    expect(afterTitleOnlySave?.published).toBe(beforeTitleOnlySave?.published);
  });

  it('validates project progress and trims management inputs', () => {
    render(<DashboardProjectPage projectId="pacific-nexus-free-zone" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="architect" homePath="/architect" />);
    const progressInput = screen.getByLabelText('Project progress');
    const saveStatus = screen.getByRole('button', { name: 'Save status' });

    fireEvent.change(progressInput, { target: { value: '0' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone')?.progress).toBe(0);

    fireEvent.change(progressInput, { target: { value: '100' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone')?.progress).toBe(100);

    for (const invalidValue of ['-1', '101']) {
      fireEvent.change(progressInput, { target: { value: invalidValue } });
      fireEvent.click(saveStatus);
      expect(getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone')?.progress).toBe(100);
      expect(screen.getByRole('alert').textContent).toBe('Progress must be a number from 0 to 100.');
    }
    fireEvent.change(progressInput, { target: { value: 'not-a-number' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'pacific-nexus-free-zone')?.progress).toBe(100);

    fireEvent.change(screen.getByLabelText('Update title'), { target: { value: '  Coordination note  ' } });
    fireEvent.change(screen.getByLabelText('Update body'), { target: { value: '  Team review completed.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish update' }));
    const snapshotAfterUpdate = getPortalSnapshot();
    expect(snapshotAfterUpdate.db.updates.find((update) => update.title === 'Coordination note')).toMatchObject({ title: 'Coordination note', body: 'Team review completed.' });

    fireEvent.change(screen.getByLabelText('New milestone'), { target: { value: '  Coordination issue  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add milestone' }));
    fireEvent.change(screen.getByLabelText('New document'), { target: { value: '  Coordination set  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));
    fireEvent.change(screen.getByLabelText('New approval'), { target: { value: '  Client coordination review  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request approval' }));
    const snapshotAfterText = getPortalSnapshot();
    expect(snapshotAfterText.db.milestones.some((milestone) => milestone.label === 'Coordination issue')).toBe(true);
    expect(snapshotAfterText.db.documents.some((document) => document.name === 'Coordination set')).toBe(true);
    expect(snapshotAfterText.db.approvals.some((approval) => approval.title === 'Client coordination review')).toBe(true);

    const beforeWhitespaceOnly = getPortalSnapshot().db;
    fireEvent.change(screen.getByLabelText('Update title'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Update body'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish update' }));
    fireEvent.change(screen.getByLabelText('New milestone'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add milestone' }));
    fireEvent.change(screen.getByLabelText('New document'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));
    fireEvent.change(screen.getByLabelText('New approval'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request approval' }));
    const afterWhitespaceOnly = getPortalSnapshot().db;
    expect(afterWhitespaceOnly.updates).toHaveLength(beforeWhitespaceOnly.updates.length);
    expect(afterWhitespaceOnly.milestones).toHaveLength(beforeWhitespaceOnly.milestones.length);
    expect(afterWhitespaceOnly.documents).toHaveLength(beforeWhitespaceOnly.documents.length);
    expect(afterWhitespaceOnly.approvals).toHaveLength(beforeWhitespaceOnly.approvals.length);
  });

  it('provides a persistent portal theme switch', () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    expect(window.localStorage.getItem('arch-tech-portal-theme')).toBe('dark');
  });

  it('keeps the portal usable when theme persistence fails', () => {
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(() => fireEvent.click(screen.getByTestId('theme-toggle'))).not.toThrow();
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    setItem.mockRestore();
  });

  it('does not expose notifications for missing or inaccessible projects', () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    const client = getPortalSnapshot().db.users.find((user) => user.email === 'mariana.solano@arch-tech.studio');
    if (!client) throw new Error('Expected canonical client fixture');
    updatePortalDatabase((current) => ({
      ...current,
      notifications: [...current.notifications, { userId: client.id, projectId: 'missing-project', message: 'Stale notification', date: '04 OCT 2026' }],
    }));

    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(screen.queryByText('Stale notification')).toBeNull();
  });

  it('routes login to dashboard, project detail and workspace', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('client-login-link'));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'mariana.solano@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'client-access' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.getByText('Projects in progress.')).toBeDefined();

    fireEvent.click(screen.getByTestId('dashboard-project-pacific-nexus-free-zone'));
    expect(window.location.pathname).toBe('/dashboard/projects/pacific-nexus-free-zone');
    fireEvent.click(screen.getByTestId('project-tab-model'));
    fireEvent.click(screen.getByTestId('open-3d-model'));
    expect(window.location.pathname).toBe('/workspace');
    expect(await screen.findByTestId('workspace')).toBeDefined();
  });

  it('requires a session for production workspace navigation but preserves the dev entry', async () => {
    window.history.replaceState({}, '', '/workspace');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Portal Access' })).toBeDefined();
    expect(screen.queryByTestId('workspace')).toBeNull();

    cleanup();
    window.history.replaceState({}, '', '/?view=workspace');
    render(<App />);
    expect(await screen.findByTestId('workspace')).toBeDefined();
  });

  it('opens landing login from navbar and footer, then restores trigger focus', async () => {
    render(<App />);

    const navLogin = screen.getByTestId('client-login-link');
    fireEvent.click(navLogin);
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Close login'));
    await waitFor(() => expect(document.activeElement).toBe(navLogin));

    fireEvent.click(screen.getAllByRole('button', { name: /Project Portal/i }).at(-1)!);
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.mouseDown(screen.getAllByRole('presentation').at(-1)!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('guards private routes with the isolated portal login', () => {
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Portal Access' })).toBeDefined();
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.queryByText('Projects in progress.')).toBeNull();
  });

  it('keeps the public navigation compact', () => {
    render(<LandingNavbar onLogin={vi.fn()} />);
    expect(screen.getByText('Projects')).toBeDefined();
    expect(screen.getByTestId('capabilities-link')).toBeDefined();
    expect(screen.getByTestId('client-login-link').textContent).toContain('Project Portal');
  });

  it('scrolls to the capability register from desktop and mobile navigation', () => {
    render(<LandingPage onNavigate={vi.fn()} onLogin={vi.fn()} />);
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    fireEvent.click(screen.getByTestId('capabilities-link'));
    expect(document.getElementById('capabilities')).toBeDefined();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Capabilities' }).at(-1)!);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);

    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });
});

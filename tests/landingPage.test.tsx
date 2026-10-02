import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { Hero } from '../src/components/landing/Hero';
import { LandingPage } from '../src/components/landing/LandingPage';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { ProjectShowcase } from '../src/components/landing/ProjectShowcase';
import { getPortalProject } from '../src/portal/data';
import { demoAuth } from '../src/portal/demoAuth';
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

  it('renders a projects-only public landing with client login', () => {
    const onNavigate = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onLogin={onLogin} />);

    expect(screen.getByText(/Architecture,/i)).toBeDefined();
    expect(screen.getByText('Selected projects')).toBeDefined();
    expect(screen.getByText('From possibility to place.')).toBeDefined();
    expect(screen.getAllByText('Lake House').length).toBeGreaterThan(0);
    expect(screen.queryByText(/OpenBIM|IFC|engineering pipeline/i)).toBeNull();

    fireEvent.click(screen.getByTestId('client-login-link'));
    expect(onLogin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: /Client Login/i }).at(-1)!);
    expect(onLogin).toHaveBeenCalledTimes(2);
  });

  it('uses a simple three-image architectural hero without sticky scroll state', () => {
    render(<Hero onViewProjects={vi.fn()} />);

    expect(screen.getByTestId('hero-gallery').querySelectorAll('img')).toHaveLength(3);
    expect(screen.getByTestId('hero-gallery').className).not.toContain('sticky');
    expect(screen.getByText('01 / Lake House')).toBeDefined();
  });

  it('opens public project details from the selected projects list', () => {
    const onOpenProject = vi.fn();
    render(<ProjectShowcase onOpenProject={onOpenProject} />);

    fireEvent.click(screen.getByTestId('public-project-lake-house'));
    expect(onOpenProject).toHaveBeenCalledWith('lake-house');

    const onNavigate = vi.fn();
    render(<PublicProjectPage projectId="lake-house" onNavigate={onNavigate} />);
    expect(screen.getAllByText('Lake House').length).toBeGreaterThan(0);
    expect(screen.getByText('Project intent')).toBeDefined();
    expect(screen.getByText('Development path')).toBeDefined();
    expect(screen.getAllByText('Costa Rica · Central Valley').length).toBeGreaterThan(0);
  });

  it('keeps demo authentication isolated inside the login overlay', () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<LoginOverlay open onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'incorrect' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(screen.getByRole('alert').textContent).toContain('Check the demo email');
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'studio-demo' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('arch-tech-demo-session')).not.toBeNull();
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
    demoAuth.signIn('client@arch-tech.studio', 'studio-demo');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(screen.getByText('Client projects')).toBeDefined();
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Design development').length).toBeGreaterThan(0);
    expect(screen.getByText('Latest update')).toBeDefined();
    expect(screen.getByText('Next milestone')).toBeDefined();
  });

  it('limits architect data and exposes the admin register', () => {
    demoAuth.signIn('architect@arch-tech.studio', 'architect-demo');
    render(<ArchitectDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByText('Assigned projects')).toBeDefined();
    expect(screen.getAllByText('Lake House').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cantilever Residence').length).toBeGreaterThan(0);
    expect(screen.queryByText('Woodland House')).toBeNull();

    cleanup();
    demoAuth.signIn('admin@arch-tech.studio', 'admin-demo');
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByText('All projects / assignments')).toBeDefined();
    expect(screen.getAllByText('Woodland House').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demo Architect').length).toBeGreaterThan(0);
    expect(screen.getByText('Material palette')).toBeDefined();
  });

  it('creates projects through the admin portal form', () => {
    demoAuth.signIn('admin@arch-tech.studio', 'admin-demo');
    const adminNavigate = vi.fn();
    render(<AdminDashboardPage onNavigate={adminNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Portfolio overview')).toBeDefined();
    expect(screen.getByText('Project health / attention')).toBeDefined();
    expect(screen.getByText('Development stages')).toBeDefined();
    expect(screen.getByText('Pending approvals')).toBeDefined();
    expect(screen.getByText('Recent activity')).toBeDefined();
    expect(screen.getByText('average progress across active work')).toBeDefined();
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    fireEvent.click(screen.getByTestId('admin-open-model-lake-house'));
    expect(adminNavigate).toHaveBeenCalledWith('/workspace');
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByRole('dialog', { name: 'New project.' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Portal Annex' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '24' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create project' }).at(-1)!);
    expect(screen.getAllByText('Portal Annex').length).toBeGreaterThan(0);
    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    expect(screen.getByText('Portal Annex')).toBeDefined();
  });

  it('redirects each demo role to its protected dashboard', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('client-login-link'));
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'architect@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'architect-demo' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/architect');
    expect(screen.getByText('Assigned projects')).toBeDefined();

    cleanup();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    render(<App />);
    fireEvent.click(screen.getByTestId('client-login-link'));
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'admin@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'admin-demo' } });
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/admin');
    expect(screen.getByText('The project register.')).toBeDefined();
  });

  it('quick logs into each demo role from Portal Access', () => {
    for (const [role, path] of [['client', '/dashboard'], ['architect', '/architect'], ['admin', '/admin']] as const) {
      cleanup();
      window.localStorage.clear();
      window.history.replaceState({}, '', '/');
      render(<App />);
      fireEvent.click(screen.getByTestId('client-login-link'));
      fireEvent.click(screen.getByTestId(`quick-login-${role}`));
      expect(window.location.pathname).toBe(path);
    }
  });

  it('quick login reads role users from the current portal snapshot', () => {
    window.localStorage.setItem('arch-tech-portal-state', JSON.stringify({ users: [{ id: 'runtime-architect', name: 'Runtime Architect', email: 'runtime@arch-tech.studio', password: 'runtime-demo', role: 'architect', projectIds: ['lake-house'], status: 'active' }] }));
    render(<LoginOverlay open onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByTestId('quick-login-architect'));
    expect(demoAuth.getSession()?.email).toBe('runtime@arch-tech.studio');
    expect(demoAuth.getSession()?.role).toBe('architect');
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
      demoAuth.signIn(`${item.role}@arch-tech.studio`, item.role === 'client' ? 'studio-demo' : item.role === 'architect' ? 'architect-demo' : 'admin-demo');
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
    demoAuth.signIn('architect@arch-tech.studio', 'architect-demo');
    window.history.replaceState({}, '', '/admin');
    render(<App />);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/architect');
      expect(screen.getByText('Assigned projects')).toBeDefined();
    });
  });

  it('protects unassigned architect project details', async () => {
    demoAuth.signIn('architect@arch-tech.studio', 'architect-demo');
    window.history.replaceState({}, '', '/architect/projects/woodland-house');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/architect'));
    expect(screen.getByText('Assigned projects')).toBeDefined();
    expect(screen.queryByText('Woodland House')).toBeNull();
  });

  it('provides all project detail sections and opens the existing workspace', () => {
    const onOpenWorkspace = vi.fn();
    expect(getPortalProject('lake-house')?.approvals[0].title).toBe('Material palette');
    render(
      <DashboardProjectPage
        projectId="lake-house"
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
    render(<DashboardProjectPage projectId="lake-house" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="client" />);
    fireEvent.click(screen.getByTestId('project-tab-approvals'));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(screen.getByText('Approved')).toBeDefined();

    cleanup();
    render(<DashboardProjectPage projectId="lake-house" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="architect" homePath="/architect" />);
    expect(screen.getByTestId('role-management-panel')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Update title'), { target: { value: 'Coordination note' } });
    fireEvent.change(screen.getByLabelText('Update body'), { target: { value: 'Team review completed.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish update' }));
    fireEvent.click(screen.getByTestId('project-tab-updates'));
    expect(screen.getByText('Coordination note')).toBeDefined();
  });

  it('provides a persistent portal theme switch', () => {
    demoAuth.signIn('client@arch-tech.studio', 'studio-demo');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    expect(window.localStorage.getItem('arch-tech-portal-theme')).toBe('dark');
  });

  it('routes login to dashboard, project detail and workspace', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('client-login-link'));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByTestId('login-submit'));
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.getByText('Projects in progress.')).toBeDefined();

    fireEvent.click(screen.getByTestId('dashboard-project-lake-house'));
    expect(window.location.pathname).toBe('/dashboard/projects/lake-house');
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

    fireEvent.click(screen.getAllByRole('button', { name: /Client Login/i }).at(-1)!);
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.mouseDown(screen.getAllByRole('presentation').at(-1)!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('guards private routes with the isolated demo login', () => {
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Portal Access' })).toBeDefined();
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.queryByText('Projects in progress.')).toBeNull();
  });

  it('keeps the public navigation compact', () => {
    render(<LandingNavbar onLogin={vi.fn()} />);
    expect(screen.getByText('Projects')).toBeDefined();
    expect(screen.getByTestId('client-login-link').textContent).toContain('Client Login');
  });
});

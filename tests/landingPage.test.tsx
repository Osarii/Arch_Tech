import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { Hero } from '../src/components/landing/Hero';
import { LandingPage } from '../src/components/landing/LandingPage';
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { ProjectShowcase } from '../src/components/landing/ProjectShowcase';
import { AboutSection, aboutFacts } from '../src/components/landing/AboutSection';
import { TeamSection, teamMembers } from '../src/components/landing/TeamSection';
import { ArchTechLogo } from '../src/components/brand/ArchTechLogo';
import { createPortalProjectRecord, createPortalUser, getPortalProject, getPortalSnapshot, resetPortalUsers, updatePortalDatabase } from '../src/portal/data';
import { portalAuth } from '../src/portal/demoAuth';
import {
  AdminAnalyticsPage,
  AdminDashboardPage,
  AdminPeoplePage,
  AdminProjectsPage,
  ArchitectDashboardPage,
  DashboardPage,
  DashboardProjectPage,
  LoginOverlay,
  PortalShell,
  PublicProjectPage,
} from '../src/components/portal/PortalPages';
import { resetRouterHydration } from '../src/router/guards';

vi.mock('../src/components/layout/Workspace', () => ({
  Workspace: () => <div data-testid="workspace">BIM Workspace</div>,
}));

describe('GARNIER ARCHITECTURE client architecture portal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPortalUsers();
    resetRouterHydration();
    window.history.replaceState({}, '', '/');
    document.documentElement.classList.remove('portal-dark');
  });

  afterEach(() => {
    portalAuth.signOut();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('renders a projects-only public landing with project portal access', () => {
    const onNavigate = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onLogin={onLogin} />);

    expect(screen.getByRole('heading', { name: /Development at a larger scale/ })).toBeDefined();
    expect(screen.getByText(/Six official Garnier developments/)).toBeDefined();
    expect(screen.getByText('From opportunity to operation.')).toBeDefined();
    expect(screen.getByText('A portfolio built for consequence.')).toBeDefined();
    expect(screen.getAllByText('Zona Franca La Lima').length).toBeGreaterThan(0);
    expect(screen.getAllByText('El Cafetal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Waldorf Astoria').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Centro Corporativo La Sabana').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Santa Ana Country Club').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Universidad Latina').length).toBeGreaterThan(0);
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

  it('renders the About section with verified company positioning facts', () => {
    render(<AboutSection />);

    expect(screen.getByRole('heading', { name: 'Development is more than the building.' })).toBeDefined();
    expect(screen.getByText(/30 years of real-estate development experience in Costa Rica/)).toBeDefined();
    for (const fact of aboutFacts) {
      expect(screen.getByText(fact.value)).toBeDefined();
      expect(screen.getByText(fact.label)).toBeDefined();
    }
    expect(screen.getByRole('img', { name: /official Garnier public portfolio/i }).getAttribute('src')).toBe('/about/garnier-values.webp');
    expect(screen.getByRole('img').parentElement?.className).toContain('landing-about-media');
  });

  it('renders the eight current public team members with unique local portraits', () => {
    render(<TeamSection />);

    expect(screen.getByRole('heading', { name: 'The people behind the development.' })).toBeDefined();
    const groupPhoto = screen.getByRole('img', { name: 'Garnier & Garnier leadership team gathered in an outdoor courtyard' });
    expect(groupPhoto.getAttribute('src')).toBe('/team/garnier-team-group.png');
    expect(groupPhoto.getAttribute('loading')).toBe('lazy');
    expect(groupPhoto.getAttribute('decoding')).toBe('async');
    expect(teamMembers).toHaveLength(8);
    const portraitPaths = teamMembers.map((member) => member.portrait);
    expect(new Set(portraitPaths).size).toBe(teamMembers.length);
    expect(portraitPaths.every((path) => path.startsWith('/team/'))).toBe(true);
    for (const member of teamMembers) {
      expect(screen.getByRole('img', { name: `${member.name}, ${member.role}` })).toBeDefined();
    }
    expect(document.querySelectorAll('.landing-team-portrait')).toHaveLength(8);
    expect([...document.querySelectorAll('.landing-team-portrait')].every((frame) => frame.className.includes('landing-team-portrait'))).toBe(true);
  });

  it('renders a six-project featured carousel with stable frames, controls and Garnier portfolio imagery', () => {
    const onViewProjects = vi.fn();
    const onOpenProject = vi.fn();
    render(<Hero onViewProjects={onViewProjects} onOpenProject={onOpenProject} />);

    const carousel = screen.getByTestId('hero-gallery');
    expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
    expect(carousel.getAttribute('data-autoplay-ms')).toBe('3200');
    expect(carousel.className).not.toContain('sticky');
    expect(screen.getAllByTestId(/^featured-indicator-/)).toHaveLength(6);
    expect(screen.getAllByTestId(/^featured-project-/)).toHaveLength(6);
    expect(carousel.querySelector('img')?.getAttribute('src')).toContain('/garnier-cover.');
    const featuredImageSources = [...carousel.querySelectorAll('img[data-project-image]')].map((image) => image.getAttribute('src'));
    expect(featuredImageSources).toHaveLength(6);
    expect(new Set(featuredImageSources).size).toBe(6);
    const featuredSlides = [...carousel.querySelectorAll('[data-testid^="featured-slide-"]')];
    expect(featuredSlides).toHaveLength(6);
    expect(featuredSlides.every((slide) => !slide.hasAttribute('hidden'))).toBe(true);
    expect(featuredSlides.filter((slide) => slide.getAttribute('data-active') === 'true')).toHaveLength(1);
    expect(featuredSlides.filter((slide) => slide.getAttribute('aria-hidden') === 'true')).toHaveLength(5);
    const featuredShells = [...carousel.querySelectorAll('.featured-project-media-shell')];
    expect(featuredShells).toHaveLength(6);
    expect(featuredShells.every((shell) => shell.className.includes('featured-project-media-shell'))).toBe(true);
    const featuredButtons = screen.getAllByTestId(/^featured-project-/) as HTMLButtonElement[];
    expect(featuredButtons.filter((button) => !button.disabled)).toHaveLength(1);
    expect((screen.getByTestId('featured-project-zona-franca-la-lima') as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTestId('featured-project-el-cafetal') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Zona Franca La Lima')).toBeDefined();
    fireEvent.click(screen.getByTestId('hero-view-projects'));
    expect(onViewProjects).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('featured-carousel-next'));
    expect(screen.getByText('El Cafetal')).toBeDefined();
    expect(screen.getByTestId('featured-indicator-el-cafetal').getAttribute('aria-current')).toBe('true');
    expect((screen.getByTestId('featured-project-zona-franca-la-lima') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('featured-project-el-cafetal') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByText('Zona Franca La Lima')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Open Zona Franca La Lima project dossier' }));
    expect(onOpenProject).toHaveBeenLastCalledWith('zona-franca-la-lima');
    fireEvent.mouseEnter(carousel);
    expect(carousel.getAttribute('data-paused')).toBe('true');
    fireEvent.mouseLeave(carousel);
    expect(carousel.getAttribute('data-paused')).toBe('false');
  });

  it('disables autoplay when reduced motion is preferred', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    render(<Hero onViewProjects={vi.fn()} onOpenProject={vi.fn()} />);
    expect(screen.getByTestId('hero-gallery').getAttribute('data-autoplay')).toBe('disabled');
    window.matchMedia = originalMatchMedia;
  });

  it('keeps the La Lima carousel cover separate from the portfolio showcase image', () => {
    render(<Hero onViewProjects={vi.fn()} onOpenProject={vi.fn()} />);
    const carouselImage = screen.getByTestId('featured-project-zona-franca-la-lima').querySelector('img')?.getAttribute('src');
    expect(carouselImage).toBe('/projects/zona-franca-la-lima/garnier-cover.webp');

    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    const showcaseImage = screen.getByTestId('public-project-zona-franca-la-lima').querySelector('img')?.getAttribute('src');
    expect(showcaseImage).toBe('/projects/zona-franca-la-lima/garnier-01.webp');
    expect(showcaseImage).not.toBe(carouselImage);
    expect(showcaseImage?.startsWith('/projects/zona-franca-la-lima/')).toBe(true);
  });

  it('renders the supplied GARNIER ARCHITECTURE mark and full lockup variants', () => {
    const { rerender } = render(<ArchTechLogo variant="mark" theme="light" />);
    expect(document.querySelector('.arch-tech-logo-mark img')?.getAttribute('src')).toBe('/brand/garnier-architecture/03_symbol_monochrome_graphite_transparent.png');
    expect(screen.queryByText('ARCH_TECH')).toBeNull();

    rerender(<ArchTechLogo variant="full" theme="dark" />);
    expect(document.querySelector('.arch-tech-logo-full img')?.getAttribute('src')).toBe('/brand/garnier-architecture/04_symbol_monochrome_stone_transparent.png');
    expect(screen.getByText('GARNIER')).toBeDefined();
    expect(screen.getByText('ARCHITECTURE')).toBeDefined();
  });

  it('uses the reusable supplied brand lockup in landing and portal headers', () => {
    render(<LandingNavbar onLogin={vi.fn()} />);
    const landingHome = screen.getByRole('link', { name: 'GARNIER ARCHITECTURE home' });
    expect(landingHome.querySelector('.arch-tech-logo-full img')?.getAttribute('src')).toBe('/brand/garnier-architecture/04_symbol_monochrome_stone_transparent.png');

    cleanup();
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    const portalHome = screen.getByRole('button', { name: 'GARNIER ARCHITECTURE home' });
    expect(portalHome.querySelector('.arch-tech-logo-full img')?.getAttribute('src')).toBe('/brand/garnier-architecture/04_symbol_monochrome_stone_transparent.png');
    expect(screen.getByText('Portfolio Showcase / Concept Prototype')).toBeDefined();
  });

  it('routes hero development panels to their public project dossiers', () => {
    const onNavigate = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onLogin={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Zona Franca La Lima project dossier' }));
    expect(onNavigate).toHaveBeenCalledWith('/projects/zona-franca-la-lima');
  });

  it('opens public project details from the selected projects list', () => {
    const onOpenProject = vi.fn();
    render(<ProjectShowcase onOpenProject={onOpenProject} />);

    fireEvent.click(screen.getByTestId('public-project-zona-franca-la-lima'));
    expect(onOpenProject).toHaveBeenCalledWith('zona-franca-la-lima');
    const projectImage = screen.getByTestId('public-project-zona-franca-la-lima').querySelector('img');
    expect(projectImage?.getAttribute('src')).toBe('/projects/zona-franca-la-lima/garnier-01.webp');
    fireEvent.error(projectImage!);
    expect(screen.getByTestId('project-image-fallback-zona-franca-la-lima')).toBeDefined();

    const onNavigate = vi.fn();
    render(<PublicProjectPage projectId="zona-franca-la-lima" onNavigate={onNavigate} />);
    expect(screen.getAllByText('Zona Franca La Lima').length).toBeGreaterThan(0);
    expect(screen.getByText('Project intent')).toBeDefined();
    expect(screen.getByText('Development path')).toBeDefined();
    expect(screen.getAllByText('Costa Rica · La Lima, Cartago').length).toBeGreaterThan(0);

    cleanup();
    render(<PublicProjectPage projectId="el-cafetal" onNavigate={onNavigate} />);
    expect(screen.getByText('El Cafetal')).toBeDefined();
    expect(screen.getAllByText(/Corporate center · Office campus/).length).toBeGreaterThan(0);
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

  it('displays user-facing error on remote login network failure without unhandled rejection', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));
    const onSuccess = vi.fn();
    render(<LoginOverlay open onClose={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'client@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'password-123' } });
    fireEvent.click(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Network offline');
    });
    expect(onSuccess).not.toHaveBeenCalled();

    // Also test quick-login error handling
    fireEvent.click(screen.getByTestId('quick-login-admin'));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Network offline');
    });
    expect(onSuccess).not.toHaveBeenCalled();
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

  it('registers an active client without project assignments', async () => {
    const onSuccess = vi.fn();
    render(<LoginOverlay open onClose={vi.fn()} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    fireEvent.change(screen.getByTestId('register-name'), { target: { value: 'New Portal Client' } });
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'new.client@arch-tech.studio' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'client-password' } });
    fireEvent.change(screen.getByTestId('register-confirm-password'), { target: { value: 'client-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(getPortalSnapshot().db.users).toEqual(expect.arrayContaining([expect.objectContaining({ email: 'new.client@arch-tech.studio', role: 'client', status: 'active', projectIds: [] })]));
  });

  it('shows client projects, progress, phase, milestone and latest updates', async () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    render(<DashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(screen.getByText('Your projects')).toBeDefined();
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Showcase review/).length).toBeGreaterThan(0);
    expect(screen.getByText('Decisions requiring your attention')).toBeDefined();
    expect(screen.getByText('Upcoming milestones')).toBeDefined();
    expect(screen.getByText('Recent project updates')).toBeDefined();
    expect(document.querySelector('.portal-project-thumbnail')).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Approve' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    await waitFor(() => expect(screen.getByText('No decisions are waiting for you.')).toBeDefined());
  });

  it('limits architect data and exposes the admin register', () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    const architectNavigate = vi.fn();
    render(<ArchitectDashboardPage onNavigate={architectNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Assigned projects')).toBeDefined();
    expect(screen.getByRole('region', { name: 'Architect workload' })).toBeDefined();
    expect(screen.getAllByText('Zona Franca La Lima').length).toBeGreaterThan(0);
    expect(screen.getAllByText('El Cafetal').length).toBeGreaterThan(0);
    expect(screen.queryByText('Universidad Latina')).toBeNull();
    expect(document.querySelectorAll('.portal-project-thumbnail').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    expect(document.querySelectorAll('.portal-overview-tile')).toHaveLength(4);
    fireEvent.click(screen.getByTestId('architect-approval-zona-franca-la-lima'));
    expect(architectNavigate).toHaveBeenCalledWith('/architect/projects/zona-franca-la-lima');

    cleanup();
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminProjectsPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getByText('All projects / assignments')).toBeDefined();
    expect(screen.getAllByText('Universidad Latina').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.portal-project-thumbnail').length).toBeGreaterThan(0);
    const adminSurface = screen.getByText('All projects / assignments').closest('.portal-surface');
    expect(adminSurface?.className).toContain('portal-admin');
    expect(adminSurface?.className).toContain('bg-[#D6CBB9]');
    expect(document.querySelector('.portal-register-row')).toBeDefined();
    expect(screen.getByTestId('admin-open-model-zona-franca-la-lima').className).toContain('admin-action');
    cleanup();
    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getAllByText('Sebastián Araya').length).toBeGreaterThan(0);
    cleanup();
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    expect(screen.getAllByText('Showcase framing').length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).querySelector('.font-serif')?.className).toContain('text-5xl');
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).className).toContain('admin-kpi-strip');
    expect(screen.getByRole('region', { name: 'Portfolio overview' }).querySelectorAll('.admin-overview-tile')).toHaveLength(4);
    expect(screen.getByRole('region', { name: 'Review and delivery signals' }).className).not.toContain('portal-review-section');
  });

  it('uses objective admin signals and reviews only projects with pending approvals', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    updatePortalDatabase((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === 'centro-corporativo-sabana' ? { ...project, progress: 1 } : project),
      approvals: current.approvals.filter((approval) => approval.projectId !== 'centro-corporativo-sabana'),
    }));
    const { db, projects } = getPortalSnapshot();
    const activeProjects = projects.filter((project) => !project.archived);
    const expectedAverage = Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length);
    const expectedPending = db.approvals.filter((approval) => approval.status === 'Pending' && activeProjects.some((project) => project.id === approval.projectId)).length;
    const expectedUpcoming = db.milestones.filter((milestone) => milestone.status === 'Upcoming' && activeProjects.some((project) => project.id === milestone.projectId)).length;
    render(<AdminDashboardPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    const portfolioOverview = screen.getByRole('region', { name: 'Portfolio overview' });
    expect(within(portfolioOverview).getByText('Active projects')).toBeDefined();
    expect(within(portfolioOverview).getAllByText(activeProjects.length.toString().padStart(2, '0')).length).toBeGreaterThan(0);
    expect(within(portfolioOverview).getByText('Average progress')).toBeDefined();
    expect(within(portfolioOverview).getByText(`${expectedAverage}%`)).toBeDefined();
    expect(within(portfolioOverview).getByText('Pending approvals')).toBeDefined();
    expect(within(portfolioOverview).getAllByText(expectedPending.toString().padStart(2, '0')).length).toBeGreaterThan(0);
    expect(within(portfolioOverview).getByText('Upcoming milestones')).toBeDefined();
    expect(within(portfolioOverview).getAllByText(expectedUpcoming.toString().padStart(2, '0')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Project health')).toBeNull();
    expect(screen.queryByText('Operational controls')).toBeNull();
    expect(screen.getByText('Create projects, manage people, assignments and approvals.')).toBeDefined();

    const reviewSignals = screen.getByRole('region', { name: 'Review and delivery signals' });
    expect(within(reviewSignals).getByText('Decisions requiring review')).toBeDefined();
    expect(within(reviewSignals).getByText('Zona Franca La Lima')).toBeDefined();
    expect(within(reviewSignals).getAllByText('Showcase framing').length).toBeGreaterThan(0);
    expect(within(reviewSignals).queryByText('Centro Corporativo La Sabana')).toBeNull();

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

  it('supports admin search, derived filters, sorting, clearing and empty results', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminProjectsPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    expect(screen.getByText('6 of 6 active projects')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'Zona Franca' } });
    expect(screen.getByText('1 of 6 active projects')).toBeDefined();
    expect(screen.getAllByText('Zona Franca La Lima').length).toBeGreaterThan(0);
    const register = document.getElementById('portal-section-projects');
    expect(register).toBeDefined();
    expect(within(register!).queryByText('El Cafetal')).toBeNull();

    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'no matching project' } });
    expect(screen.getByText('No projects match the current search and filters.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('6 of 6 active projects')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Filter projects'), { target: { value: 'pending' } });
    expect(screen.getByText('2 of 6 active projects')).toBeDefined();
    expect(within(register!).getByText('Zona Franca La Lima')).toBeDefined();
    expect(within(register!).getByText('Santa Ana Country Club')).toBeDefined();
    expect(within(register!).queryByText('Centro Corporativo La Sabana')).toBeNull();

    fireEvent.change(screen.getByLabelText('Filter projects'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Sort projects'), { target: { value: 'progress-desc' } });
    const descendingRows = [...document.querySelectorAll('.portal-register-row')];
    expect(descendingRows[0]?.textContent).toContain('Santa Ana Country Club');
    fireEvent.change(screen.getByLabelText('Sort projects'), { target: { value: 'progress-asc' } });
    const ascendingRows = [...document.querySelectorAll('.portal-register-row')];
    expect(ascendingRows[0]?.textContent).toContain('Centro Corporativo La Sabana');
    fireEvent.change(screen.getByLabelText('Sort projects'), { target: { value: 'phase' } });
    const phaseRows = [...document.querySelectorAll('.portal-register-row')];
    expect(phaseRows[0]?.textContent).toContain('Showcase review');
  });

  it('uses framed lazy project media and provides a fallback when an image fails', () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminProjectsPage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    const thumbnail = document.querySelector('.portal-project-thumbnail') as HTMLImageElement;
    expect(thumbnail.getAttribute('loading')).toBe('lazy');
    expect(thumbnail.getAttribute('decoding')).toBe('async');
    fireEvent.error(thumbnail);
    expect(screen.getByLabelText('Project image unavailable')).toBeDefined();
  });

  it('creates projects through the admin portal form', async () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    const adminNavigate = vi.fn();
    render(<AdminDashboardPage onNavigate={adminNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Active projects')).toBeDefined();
    expect(screen.getByText('Decisions requiring review')).toBeDefined();
    expect(screen.getAllByText('Pending approvals').length).toBeGreaterThan(0);
    expect(screen.getByText('Recent activity')).toBeDefined();
    expect(screen.getByText('across active work')).toBeDefined();
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('portal-dark')).toBe(true);
    cleanup();
    render(<AdminAnalyticsPage onNavigate={adminNavigate} onSignOut={vi.fn()} />);
    expect(screen.getByText('Development stages')).toBeDefined();
    cleanup();
    render(<AdminProjectsPage onNavigate={adminNavigate} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByTestId('admin-open-model-zona-franca-la-lima'));
    expect(adminNavigate).toHaveBeenCalledWith('/workspace');
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByRole('dialog', { name: 'New project.' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Portal Annex' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '24' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create project' }).at(-1)!);
    await waitFor(() => expect(screen.getAllByText('Portal Annex').length).toBeGreaterThan(0));
    const createdProject = getPortalSnapshot().projects.find((project) => project.title === 'Portal Annex');
    expect(createdProject?.published).toBe(false);
    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    expect(screen.queryByText('Portal Annex')).toBeNull();

    cleanup();
    render(<PublicProjectPage projectId={createdProject!.id} onNavigate={vi.fn()} />);
    expect(screen.getByText('Page not found.')).toBeDefined();

    cleanup();
    render(<DashboardProjectPage projectId={createdProject!.id} onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="admin" homePath="/admin" />);
    fireEvent.click(screen.getByTestId('toggle-publication'));
    expect(getPortalSnapshot().projects.find((project) => project.id === createdProject!.id)?.published).toBe(true);
    cleanup();
    render(<ProjectShowcase onOpenProject={vi.fn()} />);
    expect(screen.getByText('Portal Annex')).toBeDefined();
  });

  it('creates an active portal user from Admin people management', async () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Operations Client' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'operations.client@arch-tech.studio' } });
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'operations-password' } });
    fireEvent.click(screen.getByTestId('create-user'));
    await waitFor(() => expect(screen.getByText('Operations Client was added as an active client.')).toBeDefined());
    expect(getPortalSnapshot().db.users).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Operations Client', role: 'client', status: 'active' })]));
  });

  it('validates admin project creation inputs', async () => {
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
    await waitFor(() => expect(getPortalSnapshot().projects.some((project) => project.title === 'Edge Development Campus')).toBe(true));
    const zeroProject = getPortalSnapshot().projects.find((project) => project.title === 'Edge Development Campus');
    expect(zeroProject).toMatchObject({ title: 'Edge Development Campus', category: 'Compute infrastructure', progress: 0, published: false });

    openCreateProject();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Full Delivery Campus' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '  Regional development  ' } });
    fireEvent.change(screen.getByLabelText('Initial progress'), { target: { value: '100' } });
    submitCreateProject();
    await waitFor(() => expect(getPortalSnapshot().projects.find((project) => project.title === 'Full Delivery Campus')).toMatchObject({ category: 'Regional development', progress: 100 }));

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
    const activeProject = initial.projects.find((project) => project.id === 'zona-franca-la-lima');
    const activeClient = initial.users.find((user) => user.role === 'client' && user.status === 'active');
    const activeArchitect = initial.users.find((user) => user.role === 'architect' && user.status === 'active');
    if (!activeProject || !activeClient || !activeArchitect) throw new Error('Expected canonical assignment fixtures');

    updatePortalDatabase((current) => ({
      ...current,
      users: current.users.map((user) => user.id === activeClient.id || user.id === activeArchitect.id ? { ...user, projectIds: [] } : user),
    }));
    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

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
    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);
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
    createPortalUser({ name: 'Runtime Architect', email: 'runtime@arch-tech.studio', password: 'runtime-demo', role: 'architect', projectIds: ['zona-franca-la-lima'], status: 'active' });
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
      'zona-franca-la-lima',
      'el-cafetal',
      'santa-ana-country-club',
      'waldorf-astoria',
      'centro-corporativo-sabana',
      'universidad-latina',
    ]);
    expect(snapshot.db.users.find((user) => user.id === 'portal-client')?.projectIds).toEqual(['zona-franca-la-lima', 'waldorf-astoria']);
    const migratedStorage = window.localStorage.getItem('arch-tech-portal-state') ?? '';
    expect(staleIds.every((id) => !migratedStorage.includes(id))).toBe(true);
    expect(staleAssets.every((asset) => !migratedStorage.includes(asset))).toBe(true);
  });

  it('role navigation controls point to real routed workspaces', () => {
    const cases = [
      {
        role: 'client' as const,
        navItems: [
          { key: 'overview', path: '/dashboard' },
          { key: 'projects', path: '/dashboard/projects' },
          { key: 'documents', path: '/dashboard/documents' },
          { key: 'approvals', path: '/dashboard/approvals' },
          { key: 'insights', path: '/dashboard/insights' },
          { key: 'assistant', path: '/dashboard/assistant' },
        ],
      },
      {
        role: 'architect' as const,
        navItems: [
          { key: 'overview', path: '/architect' },
          { key: 'projects', path: '/architect/projects' },
          { key: 'approvals', path: '/architect/approvals' },
          { key: 'documents', path: '/architect/documents' },
          { key: 'insights', path: '/architect/insights' },
          { key: 'assistant', path: '/architect/assistant' },
        ],
      },
      {
        role: 'admin' as const,
        navItems: [
          { key: 'overview', path: '/admin' },
          { key: 'projects', path: '/admin/projects' },
          { key: 'people', path: '/admin/people' },
          { key: 'approvals', path: '/admin/approvals' },
          { key: 'analytics', path: '/admin/analytics' },
          { key: 'assistant', path: '/admin/assistant' },
        ],
      },
    ];
    for (const item of cases) {
      cleanup();
      window.localStorage.clear();
      portalAuth.signIn(
        item.role === 'client'
          ? 'mariana.solano@arch-tech.studio'
          : item.role === 'architect'
            ? 'sebastian.araya@arch-tech.studio'
            : 'andrea.quesada@arch-tech.studio',
        item.role === 'client'
          ? 'client-access'
          : item.role === 'architect'
            ? 'architect-access'
            : 'admin-access',
      );
      const onNavigate = vi.fn();
      render(<PortalShell role={item.role} onNavigate={onNavigate} onSignOut={vi.fn()} />);
      const overviewButton = screen.getByTestId('portal-nav-overview');
      expect(overviewButton.getAttribute('aria-current')).toBe('page');
      for (const nav of item.navItems) {
        const button = screen.getByTestId(`portal-nav-${nav.key}`);
        expect(button).toBeDefined();
        fireEvent.click(button);
        expect(onNavigate).toHaveBeenCalledWith(nav.path);
        expect(button.getAttribute('aria-current')).toBe('page');
      }
    }
  });

  it('redirects an authenticated role away from another role route to 403', async () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    window.history.replaceState({}, '', '/admin');
    render(<App />);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
      expect(screen.getByText('403 / Access restricted')).toBeDefined();
    });
    fireEvent.click(screen.getByTestId('return-workspace'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/architect');
      expect(screen.getByText('Assigned projects')).toBeDefined();
    });
  });

  it('validates persisted remote session on reload before granting access and rejects stale roles', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify({
      email: 'stale-admin@arch-tech.studio',
      name: 'Stale Admin',
      role: 'admin',
    }));

    const serverUser = {
      id: 'portal-user-demoted',
      name: 'Stale Admin',
      email: 'stale-admin@arch-tech.studio',
      password: 'password',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: [],
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/users') {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
    });
    expect(portalAuth.getSession()?.role).toBe('client');
    fireEvent.click(screen.getByTestId('return-workspace'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  it('rejects remote reload for deactivated user and displays login gate', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify({
      email: 'deactivated@arch-tech.studio',
      name: 'Deactivated User',
      role: 'admin',
    }));

    const serverUser = {
      id: 'portal-user-deactivated',
      name: 'Deactivated User',
      email: 'deactivated@arch-tech.studio',
      password: 'password',
      role: 'admin' as const,
      status: 'inactive' as const,
      projectIds: [],
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/users') {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
    expect(portalAuth.getSession()).toBeNull();
    expect(window.localStorage.getItem('arch-tech-portal-session')).toBeNull();
  });

  it('protects unassigned architect project details by redirecting to 403', async () => {
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    window.history.replaceState({}, '', '/architect/projects/universidad-latina');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/403'));
    expect(screen.getByText('403 / Access restricted')).toBeDefined();
    expect(screen.queryByText('Universidad Latina')).toBeNull();
    fireEvent.click(screen.getByTestId('return-workspace'));
    await waitFor(() => expect(window.location.pathname).toBe('/architect'));
  });

  it('allows assigned client project details and blocks unassigned direct URLs', async () => {
    createPortalUser({ name: 'Runtime Client', email: 'runtime-client@arch-tech.studio', password: 'runtime-demo', role: 'client', projectIds: ['zona-franca-la-lima'], status: 'active' });
    portalAuth.signIn('runtime-client@arch-tech.studio', 'runtime-demo');
    window.history.replaceState({}, '', '/dashboard/projects/zona-franca-la-lima');
    render(<App />);
    expect(screen.getByText('Current phase')).toBeDefined();

    cleanup();
    window.history.replaceState({}, '', '/dashboard/projects/universidad-latina');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/403'));
    expect(screen.getByText('403 / Access restricted')).toBeDefined();
    fireEvent.click(screen.getByTestId('return-workspace'));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(screen.getByText('Projects in progress.')).toBeDefined();
  });

  it('provides all project detail sections and opens the existing workspace', () => {
    const onOpenWorkspace = vi.fn();
    expect(getPortalProject('zona-franca-la-lima')?.approvals[0].title).toBe('Showcase framing');
    render(
      <DashboardProjectPage
        projectId="zona-franca-la-lima"
        onNavigate={vi.fn()}
        onSignOut={vi.fn()}
        onOpenWorkspace={onOpenWorkspace}
      />,
    );

    expect(screen.getByText('Current phase')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-updates'));
    expect(screen.getByText('Showcase media review')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-milestones'));
    expect(screen.getAllByText('Showcase review').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('project-tab-documents'));
    expect(screen.getByText('Official project reference')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-model'));
    fireEvent.click(screen.getByTestId('open-3d-model'));
    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
  });

  it('builds unique dossier media, facts and role-scoped project navigation', () => {
    const project = getPortalProject('zona-franca-la-lima');
    if (!project) throw new Error('Expected canonical project fixture');
    const onNavigate = vi.fn();
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    render(<DashboardProjectPage projectId={project.id} onNavigate={onNavigate} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} />);

    const media = [...document.querySelectorAll('.portal-project-media-frame')];
    const mediaSources = media.filter((item): item is HTMLImageElement => item instanceof HTMLImageElement).map((item) => item.getAttribute('src'));
    expect(media).toHaveLength(3);
    expect(new Set(mediaSources).size).toBe(mediaSources.length);
    for (const label of ['Market', 'Development type', 'Context', 'Scale', 'Current phase', 'Progress', 'Next milestone']) {
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(screen.getByText(project.nextMilestone)).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Latest activity' })).toBeDefined();
    expect(screen.getByTestId('previous-project')).toHaveProperty('disabled', true);
    expect(screen.getByTestId('next-project').textContent).toContain('Waldorf Astoria');
    fireEvent.click(screen.getByTestId('next-project'));
    expect(onNavigate).toHaveBeenCalledWith('/dashboard/projects/waldorf-astoria');

    cleanup();
    const architectNavigate = vi.fn();
    portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');
    render(<DashboardProjectPage projectId={project.id} onNavigate={architectNavigate} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} homePath="/architect" role="architect" />);
    expect(screen.getByTestId('next-project').textContent).toContain('El Cafetal');
    fireEvent.click(screen.getByTestId('next-project'));
    expect(architectNavigate).toHaveBeenCalledWith('/architect/projects/el-cafetal');
    expect(screen.queryByText('Universidad Latina')).toBeNull();
  });

  it('keeps client approvals actionable and gives staff management controls', async () => {
    render(<DashboardProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="client" />);
    fireEvent.click(screen.getByTestId('project-tab-approvals'));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.getByText('Approved')).toBeDefined());

    cleanup();
    render(<DashboardProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="architect" homePath="/architect" />);
    expect(screen.getByTestId('role-management-panel')).toBeDefined();
    expect(screen.queryByTestId('toggle-publication')).toBeNull();
    fireEvent.change(screen.getByLabelText('Update title'), { target: { value: 'Coordination note' } });
    fireEvent.change(screen.getByLabelText('Update body'), { target: { value: 'Team review completed.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish update' }));
    await waitFor(() => expect(getPortalSnapshot().db.updates.some((update) => update.title === 'Coordination note')).toBe(true));
    fireEvent.click(screen.getByTestId('project-tab-updates'));
    await waitFor(() => expect(screen.getByText('Coordination note')).toBeDefined());
    expect(getPortalSnapshot().db.updates.find((update) => update.title === 'Coordination note')?.date).toBe(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    fireEvent.change(screen.getByLabelText('New milestone'), { target: { value: 'Coordination issue' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add milestone' }));
    await waitFor(() => expect(getPortalSnapshot().db.milestones.some((milestone) => milestone.label === 'Coordination issue')).toBe(true));
    fireEvent.change(screen.getByLabelText('New document'), { target: { value: 'Coordination set' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(getPortalSnapshot().db.documents.some((document) => document.name === 'Coordination set')).toBe(true));
    fireEvent.change(screen.getByLabelText('New approval'), { target: { value: 'Client coordination review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request approval' }));
    await waitFor(() => expect(getPortalSnapshot().db.approvals.some((approval) => approval.title === 'Client coordination review')).toBe(true));
    fireEvent.click(screen.getByTestId('project-tab-milestones'));
    expect(screen.getByText('Coordination issue')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-documents'));
    expect(screen.getByText('Coordination set')).toBeDefined();
    fireEvent.click(screen.getByTestId('project-tab-approvals'));
    expect(screen.getByText('Client coordination review')).toBeDefined();

    cleanup();
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    render(<DashboardProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="admin" homePath="/admin" />);
    const beforeTitleOnlySave = getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima');
    fireEvent.change(screen.getByLabelText('Project title'), { target: { value: 'Zona Franca La Lima Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save status' }));
    const afterTitleOnlySave = getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima');
    expect(afterTitleOnlySave?.title).toBe('Zona Franca La Lima Updated');
    expect(afterTitleOnlySave?.progress).toBe(beforeTitleOnlySave?.progress);
    expect(afterTitleOnlySave?.phase).toBe(beforeTitleOnlySave?.phase);
    expect(afterTitleOnlySave?.published).toBe(beforeTitleOnlySave?.published);
  });

  it('validates project progress and trims management inputs', () => {
    render(<DashboardProjectPage projectId="zona-franca-la-lima" onNavigate={vi.fn()} onSignOut={vi.fn()} onOpenWorkspace={vi.fn()} role="architect" homePath="/architect" />);
    const progressInput = screen.getByLabelText('Project progress');
    const saveStatus = screen.getByRole('button', { name: 'Save status' });

    fireEvent.change(progressInput, { target: { value: '0' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima')?.progress).toBe(0);

    fireEvent.change(progressInput, { target: { value: '100' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima')?.progress).toBe(100);

    for (const invalidValue of ['-1', '101']) {
      fireEvent.change(progressInput, { target: { value: invalidValue } });
      fireEvent.click(saveStatus);
      expect(getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima')?.progress).toBe(100);
      expect(screen.getByRole('alert').textContent).toBe('Progress must be a number from 0 to 100.');
    }
    fireEvent.change(progressInput, { target: { value: 'not-a-number' } });
    fireEvent.click(saveStatus);
    expect(getPortalSnapshot().projects.find((project) => project.id === 'zona-franca-la-lima')?.progress).toBe(100);

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

    fireEvent.click(screen.getByTestId('dashboard-project-zona-franca-la-lima'));
    expect(window.location.pathname).toBe('/dashboard/projects/zona-franca-la-lima');
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

  it('renders the architectural footer directory, wordmark and useful navigation', () => {
    render(<LandingPage onNavigate={vi.fn()} onLogin={vi.fn()} />);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('heading', { name: 'Built for complex development.' })).toBeDefined();
    expect(within(footer).getByTestId('footer-projects-link').getAttribute('href')).toBe('#projects');
    expect(within(footer).getByTestId('footer-about-link').getAttribute('href')).toBe('#about');
    expect(within(footer).getByTestId('footer-team-link').getAttribute('href')).toBe('#team');
    expect(within(footer).getByText('Garnier & Garnier Showcase')).toBeDefined();
    expect(within(footer).getByRole('img', { name: 'GARNIER ARCHITECTURE' })).toBeDefined();
  });

  it('scrolls from footer directory links and returns to the landing top', () => {
    render(<LandingPage onNavigate={vi.fn()} onLogin={vi.fn()} />);
    const footer = screen.getByRole('contentinfo');
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    const scrollIntoView = vi.fn();
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    HTMLElement.prototype.scrollTo = scrollTo;

    fireEvent.click(within(footer).getByTestId('footer-projects-link'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    fireEvent.click(within(footer).getByTestId('footer-back-to-top'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    HTMLElement.prototype.scrollTo = originalScrollTo;
  });

  it('keeps the footer Project Portal connected to the existing login action', () => {
    const onLogin = vi.fn();
    render(<LandingPage onNavigate={vi.fn()} onLogin={onLogin} />);

    fireEvent.click(screen.getByTestId('footer-portal-link'));
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
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

  it('routes unknown application routes to /404 and allows returning home', async () => {
    window.history.replaceState({}, '', '/some/nonexistent/route');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
      expect(screen.getByText('404 / Page not found')).toBeDefined();
      expect(screen.getByText('Page not found.')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('return-home'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  it('redirects nonexistent portal project to /404', async () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    window.history.replaceState({}, '', '/dashboard/projects/totally-bogus-project');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
      expect(screen.getByText('404 / Page not found')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('return-workspace'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  it('redirects nonexistent public project to /404', async () => {
    window.history.replaceState({}, '', '/projects/nonexistent-public-project');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
      expect(screen.getByText('404 / Page not found')).toBeDefined();
    });
  });

  it('redirects admin on nonexistent project to /404 but allows existing project', async () => {
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');
    window.history.replaceState({}, '', '/admin/projects/nonexistent-admin-project');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
    });

    cleanup();
    window.history.replaceState({}, '', '/admin/projects/zona-franca-la-lima');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin/projects/zona-franca-la-lima');
      expect(screen.getByText('Zona Franca La Lima')).toBeDefined();
    });
  });

  it('blocks client from architect and admin workspaces with 403', async () => {
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');
    window.history.replaceState({}, '', '/architect');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
      expect(screen.getByText('403 / Access restricted')).toBeDefined();
    });

    cleanup();
    window.history.replaceState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
      expect(screen.getByText('403 / Access restricted')).toBeDefined();
    });
  });

  it('remote project exists but is absent from initial local snapshot → not 404', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    const remoteProject = createPortalProjectRecord({
      title: 'Runtime Remote 99',
      category: 'Corporate',
      phase: 'Concept',
      progress: 15,
      published: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([remoteProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/admin/projects/${remoteProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/admin/projects/${remoteProject.id}`);
      expect(screen.getByText('Runtime Remote 99')).toBeDefined();
    });
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('remote existing unassigned project → 403', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');

    const serverUser = {
      id: 'portal-user-mariana',
      name: 'Mariana Solano',
      email: 'mariana.solano@arch-tech.studio',
      password: 'client-access',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: ['other-project-id'],
    };

    const remoteProject = createPortalProjectRecord({
      title: 'Runtime Unassigned Proj',
      category: 'Corporate',
      phase: 'Concept',
      progress: 20,
      published: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/users') {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([remoteProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/dashboard/projects/${remoteProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
      expect(screen.getByText('403 / Access restricted')).toBeDefined();
    });
    expect(screen.queryByText('Runtime Unassigned Proj')).toBeNull();
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('remote nonexistent project → 404', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', '/admin/projects/completely-missing-project');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
      expect(screen.getByText('404 / Page not found')).toBeDefined();
    });
  });

  it('admin fresh session can open remote runtime project', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    const runtimeAdminProject = createPortalProjectRecord({
      title: 'Runtime Admin Proj',
      category: 'Infrastructure',
      phase: 'Planning',
      progress: 30,
      published: false,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([runtimeAdminProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/admin/projects/${runtimeAdminProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/admin/projects/${runtimeAdminProject.id}`);
      expect(screen.getByText('Runtime Admin Proj')).toBeDefined();
    });
  });

  it('published remote runtime project resolves publicly if supported by current service architecture', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

    const publishedProject = createPortalProjectRecord({
      title: 'Runtime Public Proj',
      category: 'Hospitality',
      phase: 'Design',
      progress: 45,
      published: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([publishedProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/projects/${publishedProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/projects/${publishedProject.id}`);
      expect(screen.getByText('Runtime Public Proj')).toBeDefined();
    });
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('remote project hydration network failure does NOT redirect /404', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network failure'));
    }));

    window.history.replaceState({}, '', '/admin/projects/runtime-proj-id');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('503 / Service unavailable')).toBeDefined();
    });
    expect(window.location.pathname).not.toBe('/404');
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('remote user hydration failure does NOT redirect /403 based on stale data', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');

    const remoteProject = createPortalProjectRecord({
      title: 'Valid Remote Proj',
      category: 'Corporate',
      phase: 'Concept',
      progress: 20,
      published: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([remoteProject]), { status: 200 });
      }
      if (parsed.pathname === '/users') {
        return Promise.reject(new Error('Network error on users'));
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/dashboard/projects/${remoteProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('503 / Service unavailable')).toBeDefined();
    });
    expect(window.location.pathname).not.toBe('/403');
    expect(screen.queryByText('403 / Access restricted')).toBeNull();
  });

  it('retry/success then resolves correct route', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    const remoteProject = createPortalProjectRecord({
      title: 'Recovered Remote Proj',
      category: 'Infrastructure',
      phase: 'Planning',
      progress: 50,
      published: false,
    });

    let networkFailing = true;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (networkFailing) {
        return Promise.reject(new Error('Temporary network drop'));
      }
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([remoteProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/admin/projects/${remoteProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('503 / Service unavailable')).toBeDefined();
    });

    networkFailing = false;
    fireEvent.click(screen.getByTestId('retry-service'));

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/admin/projects/${remoteProject.id}`);
      expect(screen.getByText('Recovered Remote Proj')).toBeDefined();
    });
    expect(screen.queryByText('503 / Service unavailable')).toBeNull();
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('genuine empty successful response still produces /404', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('andrea.quesada@arch-tech.studio', 'admin-access');

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', '/admin/projects/truly-missing-project');
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/404');
      expect(screen.getByText('404 / Page not found')).toBeDefined();
    });
    expect(screen.queryByText('503 / Service unavailable')).toBeNull();
  });

  it('genuine successful unassigned response still produces /403', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    portalAuth.signIn('mariana.solano@arch-tech.studio', 'client-access');

    const serverUser = {
      id: 'portal-user-mariana',
      name: 'Mariana Solano',
      email: 'mariana.solano@arch-tech.studio',
      password: 'client-access',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: ['some-other-project'],
    };

    const remoteProject = createPortalProjectRecord({
      title: 'Forbidden Target Proj',
      category: 'Corporate',
      phase: 'Concept',
      progress: 20,
      published: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname === '/users') {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      if (parsed.pathname === '/projects') {
        return new Response(JSON.stringify([remoteProject]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    window.history.replaceState({}, '', `/dashboard/projects/${remoteProject.id}`);
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/403');
      expect(screen.getByText('403 / Access restricted')).toBeDefined();
    });
    expect(screen.queryByText('503 / Service unavailable')).toBeNull();
    expect(screen.queryByText('404 / Page not found')).toBeNull();
  });

  it('orchestrates architectural route transition from public project to portfolio and prevents rapid double-triggers', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(screen.getByText('A portfolio built for consequence.')).toBeDefined();

    const featuredProjectButton = screen.getByTestId('public-project-zona-franca-la-lima');
    fireEvent.click(featuredProjectButton);

    // Transition overlay is activated in entering phase
    const transitionOverlay = screen.getByTestId('project-route-transition');
    expect(transitionOverlay).toBeDefined();
    expect(transitionOverlay.getAttribute('data-transition-phase')).toBe('entering');

    // Rapid second click does not double trigger
    fireEvent.click(featuredProjectButton);
    expect(transitionOverlay.getAttribute('data-transition-phase')).toBe('entering');

    // Advance to midpoint: route changes to project dossier
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(window.location.pathname).toBe('/projects/zona-franca-la-lima');
    expect(transitionOverlay.getAttribute('data-transition-phase')).toBe('exiting');

    // Complete exit phase
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(screen.queryByTestId('project-route-transition')).toBeNull();

    // Now on PublicProjectPage: test return transition via "Development portfolio"
    const returnButton = screen.getByRole('button', { name: /Development portfolio/i });
    fireEvent.click(returnButton);

    const returnOverlay = screen.getByTestId('project-route-transition');
    expect(returnOverlay).toBeDefined();
    expect(returnOverlay.getAttribute('data-transition-direction')).toBe('reverse');

    // Advance to midpoint: route returns to portfolio root
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(window.location.pathname).toBe('/');

    // Complete return transition
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(screen.queryByTestId('project-route-transition')).toBeNull();

    vi.useRealTimers();
  });
});

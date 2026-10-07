import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminPeoplePage } from '../src/pages/admin/AdminPeoplePage';
import { getPortalSnapshot, type PortalUser } from '../src/portal/data';
import { portalAuth } from '../src/portal/demoAuth';
import { userService } from '../src/services/userService';

describe('AdminPeoplePage persistence & connectivity', () => {
  afterEach(() => {
    cleanup();
    portalAuth.signOut();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('renders offline database state and disables mutation controls when API is not configured', async () => {
    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    // Database status badge shows Offline
    await waitFor(() => {
      const badge = screen.getByTestId('db-status-badge');
      expect(badge.textContent).toContain('DATABASE');
      expect(badge.textContent).toContain('Offline · user changes are not persistent');
    });

    // Add user button is disabled
    const addButton = screen.getByTestId('create-user') as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);

    // Prompt message to start persistence is visible
    expect(screen.getByText(/npm run dev:portal/)).toBeDefined();

    // Role and status mutation buttons are disabled
    const roleButtons = screen.getAllByRole('button', { name: /Make architect|Make client/i }) as HTMLButtonElement[];
    expect(roleButtons.length).toBeGreaterThan(0);
    roleButtons.forEach((button) => expect(button.disabled).toBe(true));

    const editNameButtons = screen.getAllByRole('button', { name: /Edit name/i }) as HTMLButtonElement[];
    expect(editNameButtons.length).toBeGreaterThan(0);
    editNameButtons.forEach((button) => expect(button.disabled).toBe(true));

    const statusButtons = screen.getAllByRole('button', { name: /^(active|inactive)$/i }) as HTMLButtonElement[];
    expect(statusButtons.length).toBeGreaterThan(0);
    statusButtons.forEach((button) => expect(button.disabled).toBe(true));

    // Assignment buttons are disabled
    const assignmentButtons = (screen.getAllByRole('button') as HTMLButtonElement[]).filter((button) => {
      const testId = button.getAttribute('data-testid');
      return testId && testId.startsWith('admin-assignment-') && !testId.includes('-project-');
    });
    expect(assignmentButtons.length).toBeGreaterThan(0);
    assignmentButtons.forEach((button) => expect(button.disabled).toBe(true));
  });

  it('renders connected state and enables create button when API is running', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    const existingUsers = getPortalSnapshot().db.users;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === '/users') {
        return new Response(JSON.stringify(existingUsers), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    await waitFor(() => {
      const badge = screen.getByTestId('db-status-badge');
      expect(badge.textContent).toContain('DATABASE');
      expect(badge.textContent).toContain('Connected · db.json');
    });

    const addButton = screen.getByTestId('create-user') as HTMLButtonElement;
    expect(addButton.disabled).toBe(false);
  });

  it('performs authoritative creation flow: userService.create called, list refreshed, and feedback displayed', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');

    const createdRecord: PortalUser = {
      id: 'portal-user-authoritative',
      name: 'Authoritative Client',
      email: 'authoritative@arch-tech.studio',
      password: 'password-123',
      role: 'client',
      status: 'active',
      projectIds: [],
    };

    let userStore = [...getPortalSnapshot().db.users];
    const createSpy = vi.spyOn(userService, 'create');
    const listSpy = vi.spyOn(userService, 'list');

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      if (init?.method === 'POST' && parsedUrl.pathname === '/users') {
        userStore = [createdRecord, ...userStore];
        return new Response(JSON.stringify(createdRecord), { status: 201 });
      }
      if (parsedUrl.pathname === '/users' && parsedUrl.searchParams.get('email') === createdRecord.email) {
        return new Response('[]', { status: 200 });
      }
      if (parsedUrl.pathname === '/users') {
        return new Response(JSON.stringify(userStore), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }));

    render(<AdminPeoplePage onNavigate={vi.fn()} onSignOut={vi.fn()} />);

    await waitFor(() => {
      expect((screen.getByTestId('create-user') as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: createdRecord.name } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: createdRecord.email } });
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: createdRecord.password } });

    fireEvent.click(screen.getByTestId('create-user'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createdRecord.name,
          email: createdRecord.email,
          role: 'client',
          status: 'active',
        })
      );
    });

    // Authoritative list refresh was called after POST
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
      expect(screen.getByText('Authoritative Client was added as an active client.')).toBeDefined();
    });

    expect(screen.getAllByText(createdRecord.name).length).toBeGreaterThan(0);
  });
});

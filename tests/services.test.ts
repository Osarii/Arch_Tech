import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalContextService } from '../src/services/externalContextService';
import { projectService } from '../src/services/projectService';
import { projectWorkflowService } from '../src/services/projectWorkflowService';
import { createPortalUser, getPortalSnapshot } from '../src/portal/data';
import { portalAuth } from '../src/portal/demoAuth';
import { authService } from '../src/services/authService';

describe('portal service layer', () => {
  afterEach(() => {
    portalAuth.signOut();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('creates and removes runtime projects without allowing canonical deletion', async () => {
    const created = await projectService.create({
      title: 'Runtime logistics campus',
      category: 'Industrial campus',
      phase: 'Concept design',
      progress: 18,
    });

    expect(created.id).toMatch(/^admin-project-/);
    expect(getPortalSnapshot().projects.some((project) => project.id === created.id)).toBe(true);
    await expect(projectService.remove(created.id)).resolves.toBe(true);
    await expect(projectService.remove('zona-franca-la-lima')).rejects.toThrow(/canonical showcase/i);
  });

  it('rejects duplicate user emails in the local persistence path', () => {
    const existing = getPortalSnapshot().db.users[0];
    expect(() => createPortalUser({ name: 'Duplicate', email: existing.email, password: 'password-123' })).toThrow(/already exists/i);
  });

  it('normalizes external context into a concise operational result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 24.5, weather_code: 2, time: '2026-10-04T12:00' },
      }),
    }));

    await expect(externalContextService.getCostaRicaWeather()).resolves.toMatchObject({
      location: 'Costa Rica',
      temperature: 24.5,
      weatherCode: 2,
    });
  });

  it('uses JSON Server endpoints for project create and update, then synchronizes the cache', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const seedProject = getPortalSnapshot().projects[0];
    const remoteProject = { ...seedProject, title: 'HTTP Logistics Campus' };
    let remoteProjectId = '';
    let listedProject = remoteProject;
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (init?.method === 'POST' && path === '/projects') {
        const body = JSON.parse(String(init.body));
        remoteProjectId = body.id;
        listedProject = { ...remoteProject, ...body, title: remoteProject.title };
        return new Response(JSON.stringify(listedProject), { status: 201 });
      }
      if (init?.method === 'PATCH' && path === `/projects/${remoteProjectId}`) {
        listedProject = { ...listedProject, progress: 52 };
        return new Response(JSON.stringify(listedProject), { status: 200 });
      }
      if (path === '/projects') return new Response(JSON.stringify([listedProject]), { status: 200 });
      if (path === '/updates') return new Response('[]', { status: 200 });
      if (path === '/milestones') return new Response('[]', { status: 200 });
      if (path === '/documents') return new Response('[]', { status: 200 });
      if (path === '/approvals') return new Response('[]', { status: 200 });
      if (path === '/notifications') return new Response('[]', { status: 200 });
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const created = await projectService.create({ title: 'HTTP Logistics Campus', category: 'Industrial', phase: 'Concept design', progress: 40 });
    expect(created.id).toBe(remoteProjectId);
    expect(getPortalSnapshot().projects).toEqual(expect.arrayContaining([expect.objectContaining({ id: remoteProjectId, title: remoteProject.title })]));
    const updated = await projectService.update(remoteProjectId, { progress: 52 });
    expect(updated?.progress).toBe(52);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/projects') && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith(`/projects/${remoteProjectId}`) && init?.method === 'PATCH')).toBe(true);
  });

  it('uses HTTP for user creation, role/status updates and project assignments', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const createdUser = { id: 'portal-user-http-1', name: 'HTTP Operator', email: 'operator@arch-tech.studio', password: 'operator-password', role: 'client' as const, status: 'active' as const, projectIds: [] };
    const updatedUser = { ...createdUser, role: 'architect' as const, status: 'inactive' as const, projectIds: ['zona-franca-la-lima'] };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      if (init?.method === 'POST' && path === '/users') return new Response(JSON.stringify(createdUser), { status: 201 });
      if (init?.method === 'PATCH' && path === `/users/${createdUser.id}`) return new Response(JSON.stringify(updatedUser), { status: 200 });
      if (path === '/users' && parsedUrl.searchParams.get('email') === createdUser.email) return new Response('[]', { status: 200 });
      if (path === '/users') return new Response(JSON.stringify([createdUser]), { status: 200 });
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const created = await (await import('../src/services/userService')).userService.create(createdUser);
    expect(created).toMatchObject({ id: createdUser.id });
    const updated = await (await import('../src/services/userService')).userService.update(createdUser.id, { role: 'architect', status: 'inactive', projectIds: ['zona-franca-la-lima'] });
    expect(updated).toMatchObject({ role: 'architect', status: 'inactive', projectIds: ['zona-franca-la-lima'] });
    expect(fetchMock.mock.calls.filter(([url, init]) => String(url).includes(`/users/${createdUser.id}`) && init?.method === 'PATCH')).toHaveLength(1);
  });

  it('reconciles related records and assignments when deleting a runtime project over HTTP', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const projectId = 'admin-project-http-delete';
    const user = { id: 'portal-user-1', name: 'Assigned User', email: 'assigned@arch-tech.studio', password: 'password-123', role: 'client' as const, status: 'active' as const, projectIds: [projectId] };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === `/projects/${projectId}` && !init?.method) return new Response(JSON.stringify({ id: projectId }), { status: 200 });
      if (path === '/projects' && !init?.method) return new Response('[]', { status: 200 });
      if (path === '/users' && !init?.method) return new Response(JSON.stringify([user]), { status: 200 });
      if (path === '/updates' && !init?.method) return new Response(JSON.stringify([{ id: 'update-1', projectId, date: '04 OCT 2026', title: 'Update', body: 'Body' }]), { status: 200 });
      if (path === '/milestones' && !init?.method) return new Response(JSON.stringify([{ id: 'milestone-1', projectId, label: 'Milestone', status: 'Upcoming' }]), { status: 200 });
      if (path === '/documents' && !init?.method) return new Response(JSON.stringify([{ id: 'document-1', projectId, name: 'Document', meta: 'PDF' }]), { status: 200 });
      if (path === '/approvals' && !init?.method) return new Response(JSON.stringify([{ id: 'approval-1', projectId, title: 'Approval', status: 'Pending' }]), { status: 200 });
      if (path === '/notifications' && !init?.method) return new Response(JSON.stringify([{ id: 'notification-1', projectId, userId: user.id, message: 'Notice', date: '04 OCT 2026' }]), { status: 200 });
      if (init?.method === 'PATCH' && path === `/users/${user.id}`) return new Response(JSON.stringify({ ...user, projectIds: [] }), { status: 200 });
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(projectService.remove(projectId)).resolves.toBe(true);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(6);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith(`/users/${user.id}`) && init?.method === 'PATCH')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith(`/projects/${projectId}`) && init?.method === 'DELETE')).toBe(true);
  });

  it('surfaces HTTP failures instead of claiming a project was created', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'API unavailable' }), { status: 503 })));
    await expect(projectService.create({ title: 'Unavailable', category: 'Test', phase: 'Concept design', progress: 0 })).rejects.toThrow('API unavailable');
    expect(getPortalSnapshot().projects.some((project) => project.title === 'Unavailable')).toBe(false);
  });

  it('keeps project workflow mutations on the local fallback when HTTP is disabled', async () => {
    await projectWorkflowService.addUpdate({ projectId: 'zona-franca-la-lima', date: '04 OCT 2026', title: 'Local update', body: 'Saved locally.' });
    await projectWorkflowService.addMilestone({ projectId: 'zona-franca-la-lima', label: 'Local milestone', status: 'Upcoming' });
    await projectWorkflowService.addDocument({ projectId: 'zona-franca-la-lima', name: 'Local document', meta: 'PDF' });
    await projectWorkflowService.requestApproval({ projectId: 'zona-franca-la-lima', title: 'Local approval', status: 'Pending' });
    await projectWorkflowService.updateApproval('zona-franca-la-lima', 'Showcase framing', 'Approved');

    const snapshot = getPortalSnapshot().db;
    expect(snapshot.updates).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Local update' })]));
    expect(snapshot.milestones).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Local milestone' })]));
    expect(snapshot.documents).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Local document' })]));
    expect(snapshot.approvals).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Local approval', status: 'Pending' })]));
    expect(snapshot.approvals).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Showcase framing', status: 'Approved' })]));
  });

  it('uses JSON Server for all project workflow relations, stable IDs and cache synchronization', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const relations = {
      updates: [] as Array<Record<string, unknown>>,
      milestones: [] as Array<Record<string, unknown>>,
      documents: [] as Array<Record<string, unknown>>,
      approvals: [{ id: 'approval-1', projectId: 'zona-franca-la-lima', title: 'Remote approval', status: 'Pending' } as Record<string, unknown>],
      notifications: [] as Array<Record<string, unknown>>,
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname.replace(/^\//, '') as keyof typeof relations;
      const method = init?.method ?? 'GET';
      if (method === 'GET' && path in relations) {
        const records = path === 'approvals' && parsedUrl.searchParams.has('title')
          ? relations.approvals.filter((approval) => approval.projectId === parsedUrl.searchParams.get('projectId') && approval.title === parsedUrl.searchParams.get('title'))
          : relations[path];
        return new Response(JSON.stringify(records), { status: 200 });
      }
      if (method === 'POST' && path in relations) {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        relations[path].push(body);
        return new Response(JSON.stringify(body), { status: 201 });
      }
      if (method === 'PATCH' && path === 'approvals') {
        throw new Error('Approval PATCH must address a stable JSON Server record ID.');
      }
      if (method === 'PATCH' && parsedUrl.pathname === '/approvals/approval-1') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        relations.approvals[0] = { ...relations.approvals[0], ...body };
        return new Response(JSON.stringify(relations.approvals[0]), { status: 200 });
      }
      throw new Error(`Unexpected request: ${method} ${parsedUrl.pathname}${parsedUrl.search}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await projectWorkflowService.addUpdate({ projectId: 'zona-franca-la-lima', date: '04 OCT 2026', title: 'Remote update', body: 'Synced update.' });
    await projectWorkflowService.addMilestone({ projectId: 'zona-franca-la-lima', label: 'Remote milestone', status: 'Upcoming' });
    await projectWorkflowService.addDocument({ projectId: 'zona-franca-la-lima', name: 'Remote document', meta: 'PDF' });
    await projectWorkflowService.requestApproval({ projectId: 'zona-franca-la-lima', title: 'Remote request', status: 'Pending' });
    await projectWorkflowService.updateApproval('zona-franca-la-lima', 'Remote approval', 'Approved');

    const snapshot = getPortalSnapshot().db;
    expect(relations.updates[0].id).toEqual(expect.stringMatching(/^project-update-/));
    expect(relations.milestones[0].id).toEqual(expect.stringMatching(/^project-milestone-/));
    expect(relations.documents[0].id).toEqual(expect.stringMatching(/^project-document-/));
    expect(relations.approvals.find((approval) => approval.title === 'Remote request')?.id).toEqual(expect.stringMatching(/^project-approval-/));
    expect(snapshot.updates).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Remote update' })]));
    expect(snapshot.milestones).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Remote milestone' })]));
    expect(snapshot.documents).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Remote document' })]));
    expect(snapshot.approvals).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Remote approval', status: 'Approved' })]));
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/updates') && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/milestones') && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents') && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/approvals') && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/approvals/approval-1') && init?.method === 'PATCH')).toBe(true);
  });

  it('does not claim a project relation succeeded when HTTP persistence fails', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Relation API unavailable' }), { status: 503 })));

    await expect(projectWorkflowService.addUpdate({ projectId: 'zona-franca-la-lima', date: '04 OCT 2026', title: 'Failed update', body: 'Not saved.' })).rejects.toThrow('Relation API unavailable');
    expect(getPortalSnapshot().db.updates.some((update) => update.title === 'Failed update')).toBe(false);
  });

  it('validates duplicate email and registers client over HTTP producing a usable session', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const newUser = {
      name: 'Registered Client',
      email: 'new-client@arch-tech.studio',
      password: 'password-client-123',
    };
    const serverUser = {
      id: 'portal-user-registered-1',
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: 'client' as const,
      status: 'active' as const,
      projectIds: [],
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      if (path === '/users' && parsedUrl.searchParams.get('email') === newUser.email) {
        return new Response('[]', { status: 200 });
      }
      if (init?.method === 'POST' && path === '/users') {
        return new Response(JSON.stringify(serverUser), { status: 201 });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { authService } = await import('../src/services/authService');
    const session = await authService.register(newUser);
    expect(session).toEqual({
      name: serverUser.name,
      email: serverUser.email,
      role: serverUser.role,
    });
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes('/users') && init?.method === 'POST')).toBe(true);

    // Duplicate email check
    const duplicateMock = vi.fn().mockImplementation(async (url: string) => {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === '/users' && parsedUrl.searchParams.get('email') === newUser.email) {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      throw new Error(`Unexpected request`);
    });
    vi.stubGlobal('fetch', duplicateMock);

    await expect(authService.register(newUser)).rejects.toThrow('An account with this email already exists.');
  });

  it('validates active user on reload in remote mode and avoids repeated network validation', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const candidate = {
      email: 'active@arch-tech.studio',
      name: 'Active User',
      role: 'client' as const,
    };
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify(candidate));

    expect(portalAuth.getSession()).toBeNull();
    expect(portalAuth.getCandidateSession()).toEqual(candidate);

    const serverUser = {
      id: 'user-active-1',
      name: 'Active User Confirmed',
      email: candidate.email,
      password: 'password',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: [],
    };

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === '/users' && parsedUrl.searchParams.get('email') === candidate.email) {
        return new Response(JSON.stringify([serverUser]), { status: 200 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const validated = await authService.validateSession();
    expect(validated).toEqual({
      name: 'Active User Confirmed',
      email: candidate.email,
      role: 'client',
    });
    expect(portalAuth.getSession()).toEqual(validated);
    expect(JSON.parse(window.localStorage.getItem('arch-tech-portal-session')!)).toEqual(validated);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Subsequent check does not call network again
    expect(await authService.validateSession()).toEqual(validated);
    expect(portalAuth.getSession()).toEqual(validated);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects reload of inactive user and clears session in remote mode', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const candidate = {
      email: 'inactive@arch-tech.studio',
      name: 'Inactive User',
      role: 'client' as const,
    };
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify(candidate));

    const serverUser = {
      id: 'user-inactive-1',
      name: candidate.name,
      email: candidate.email,
      password: 'password',
      role: 'client' as const,
      status: 'inactive' as const,
      projectIds: [],
    };

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([serverUser]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const validated = await authService.validateSession();
    expect(validated).toBeNull();
    expect(portalAuth.getSession()).toBeNull();
    expect(portalAuth.getCandidateSession()).toBeNull();
    expect(window.localStorage.getItem('arch-tech-portal-session')).toBeNull();
  });

  it('rejects reload of deleted user and clears session in remote mode', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify({
      email: 'deleted@arch-tech.studio',
      name: 'Deleted User',
      role: 'admin',
    }));

    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const validated = await authService.validateSession();
    expect(validated).toBeNull();
    expect(portalAuth.getSession()).toBeNull();
    expect(window.localStorage.getItem('arch-tech-portal-session')).toBeNull();
  });

  it('refreshes session and prevents stale admin access when server role changed to client', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify({
      email: 'demoted@arch-tech.studio',
      name: 'Demoted Admin',
      role: 'admin',
    }));

    const serverUser = {
      id: 'user-demoted-1',
      name: 'Demoted Admin',
      email: 'demoted@arch-tech.studio',
      password: 'password',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: [],
    };

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([serverUser]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const validated = await authService.validateSession();
    expect(validated).toEqual({
      name: 'Demoted Admin',
      email: 'demoted@arch-tech.studio',
      role: 'client',
    });
    expect(portalAuth.getSession()?.role).toBe('client');
    expect(JSON.parse(window.localStorage.getItem('arch-tech-portal-session')!).role).toBe('client');
  });

  it('clears session when remote validation fails with network error', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    window.localStorage.setItem('arch-tech-portal-session', JSON.stringify({
      email: 'user@arch-tech.studio',
      name: 'User',
      role: 'client',
    }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const validated = await authService.validateSession();
    expect(validated).toBeNull();
    expect(portalAuth.getSession()).toBeNull();
    expect(window.localStorage.getItem('arch-tech-portal-session')).toBeNull();
  });
});

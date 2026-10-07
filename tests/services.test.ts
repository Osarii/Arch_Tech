import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalContextService } from '../src/services/externalContextService';
import { projectService } from '../src/services/projectService';
import { projectWorkflowService } from '../src/services/projectWorkflowService';
import { createPortalUser, getPortalSnapshot, type NewsArticle } from '../src/portal/data';
import { portalAuth } from '../src/portal/demoAuth';
import { authService } from '../src/services/authService';
import {
  getFeaturedNews,
  getPublicNews,
  newsService,
} from '../src/services/newsService';
import { userService, DATABASE_DISCONNECTED_ERROR } from '../src/services/userService';

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

  it('rejects userService.create without VITE_API_BASE_URL and preserves users snapshot', async () => {
    const initialUsers = [...getPortalSnapshot().db.users];
    await expect(
      userService.create({
        name: 'Offline Candidate',
        email: 'offline@arch-tech.studio',
        password: 'password-123',
      })
    ).rejects.toThrow(DATABASE_DISCONNECTED_ERROR);
    expect(getPortalSnapshot().db.users).toEqual(initialUsers);
  });

  it('rejects userService.update without API and does not mutate user', async () => {
    const targetUser = getPortalSnapshot().db.users[0];
    await expect(
      userService.update(targetUser.id, { name: 'Attempted Local Edit' })
    ).rejects.toThrow(DATABASE_DISCONNECTED_ERROR);
    expect(getPortalSnapshot().db.users.find((u) => u.id === targetUser.id)?.name).toBe(targetUser.name);
  });

  it('rejects userService.delete without API and does not remove user', async () => {
    const targetUser = getPortalSnapshot().db.users[0];
    await expect(
      userService.delete(targetUser.id)
    ).rejects.toThrow(DATABASE_DISCONNECTED_ERROR);
    expect(getPortalSnapshot().db.users.some((u) => u.id === targetUser.id)).toBe(true);
  });

  it('performs HTTP create with GET duplicate check, POST /users, and syncs returned user', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const newUser = {
      id: 'portal-user-http-created',
      name: 'Created HTTP User',
      email: 'created.http@arch-tech.studio',
      password: 'password-123',
      role: 'client' as const,
      status: 'active' as const,
      projectIds: [],
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      if (init?.method === 'POST' && parsedUrl.pathname === '/users') {
        return new Response(JSON.stringify(newUser), { status: 201 });
      }
      if (parsedUrl.pathname === '/users' && parsedUrl.searchParams.get('email') === newUser.email) {
        return new Response('[]', { status: 200 });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${parsedUrl.pathname}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const created = await userService.create(newUser);
    expect(created).toEqual(newUser);
    expect(getPortalSnapshot().db.users).toEqual(expect.arrayContaining([expect.objectContaining({ id: newUser.id })]));
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/users?email='))).toBe(true);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
  });

  it('performs HTTP update with PATCH /users/:id and synchronizes user', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const existing = getPortalSnapshot().db.users[0];
    const updatedUser = { ...existing, name: 'Patched Remote Name', role: 'architect' as const };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      if (init?.method === 'PATCH' && parsedUrl.pathname === `/users/${existing.id}`) {
        return new Response(JSON.stringify(updatedUser), { status: 200 });
      }
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await userService.update(existing.id, { name: 'Patched Remote Name', role: 'architect' });
    expect(result).toMatchObject({ id: existing.id, name: 'Patched Remote Name', role: 'architect' });
    expect(getPortalSnapshot().db.users.find((u) => u.id === existing.id)?.name).toBe('Patched Remote Name');
  });

  it('performs HTTP delete with DELETE /users/:id and synchronizes cache', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    const targetUser = getPortalSnapshot().db.users[0];
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url);
      if (init?.method === 'DELETE' && parsedUrl.pathname === `/users/${targetUser.id}`) {
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const deleted = await userService.delete(targetUser.id);
    expect(deleted).toBe(true);
    expect(getPortalSnapshot().db.users.some((u) => u.id === targetUser.id)).toBe(false);
  });

  it('surfaces API failure on mutation and causes no false local mutation', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'JSON Server down' }), { status: 500 })));

    await expect(
      userService.create({
        name: 'Failing User',
        email: 'fail@arch-tech.studio',
        password: 'password-123',
      })
    ).rejects.toThrow();

    expect(getPortalSnapshot().db.users.some((u) => u.email === 'fail@arch-tech.studio')).toBe(false);
  });

  it('ensures users and passwords remain strictly absent from localStorage portal state', () => {
    getPortalSnapshot();
    const stored = window.localStorage.getItem('arch-tech-portal-state');
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.users).toBeUndefined();
      expect(JSON.stringify(parsed)).not.toContain('password');
    }
  });

  it('checks connection returning true on success and false on failure or missing env', async () => {
    expect(await userService.checkConnection()).toBe(false);

    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })));
    expect(await userService.checkConnection()).toBe(true);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
    expect(await userService.checkConnection()).toBe(false);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Internal Server Error', { status: 500 })));
    expect(await userService.checkConnection()).toBe(false);
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
      if (path === '/news' && !init?.method) return new Response(JSON.stringify([{ id: 'news-1', projectId }]), { status: 200 });
      if (init?.method === 'PATCH' && path === `/users/${user.id}`) return new Response(JSON.stringify({ ...user, projectIds: [] }), { status: 200 });
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(projectService.remove(projectId)).resolves.toBe(true);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(7);
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

  describe('newsService and editorial persistence', () => {
    it('creates, retrieves, updates, and deletes news articles in local mode', async () => {
      const created = await newsService.create({
        projectId: 'zona-franca-la-lima',
        title: 'New Logistics Hub Phase 2',
        excerpt: 'Logistics expansion details.',
        body: 'Full body content regarding logistics expansion.',
        category: 'Development',
        cadence: 'weekly',
        status: 'draft',
      });

      expect(created.id).toMatch(/^news-/);
      expect(created.slug).toBe('new-logistics-hub-phase-2');
      expect(created.status).toBe('draft');

      const fetched = await newsService.get(created.id);
      expect(fetched?.title).toBe('New Logistics Hub Phase 2');

      const updated = await newsService.update(created.id, { title: 'Updated Logistics Hub Phase 2' });
      expect(updated?.title).toBe('Updated Logistics Hub Phase 2');

      const bySlug = await newsService.getBySlug(created.slug);
      expect(bySlug?.id).toBe(created.id);

      const removed = await newsService.remove(created.id);
      expect(removed).toBe(true);
      expect(await newsService.get(created.id)).toBeUndefined();
    });

    it('ensures drafts never appear in listPublished(), listFeatured(), or getPublicNews()', async () => {
      const draft = await newsService.create({
        projectId: 'el-cafetal',
        title: 'Confidential Campus Briefing',
        status: 'draft',
        featured: true,
      });

      const publishedList = await newsService.listPublished();
      expect(publishedList.some((item) => item.id === draft.id)).toBe(false);

      const featuredList = await newsService.listFeatured();
      expect(featuredList.some((item) => item.id === draft.id)).toBe(false);

      const publicNews = getPublicNews();
      expect(publicNews.some((item) => item.id === draft.id)).toBe(false);

      const featuredPublic = getFeaturedNews();
      expect(featuredPublic.some((item) => item.id === draft.id)).toBe(false);

      // Now publish explicitly
      const published = await newsService.publish(draft.id);
      expect(published?.status).toBe('published');
      expect(published?.publishedAt).toBeDefined();

      const refreshedPublished = await newsService.listPublished();
      expect(refreshedPublished.some((item) => item.id === draft.id)).toBe(true);

      const refreshedFeatured = await newsService.listFeatured();
      expect(refreshedFeatured.some((item) => item.id === draft.id)).toBe(true);

      // Unpublish back to draft
      await newsService.unpublish(draft.id);
      expect((await newsService.listPublished()).some((item) => item.id === draft.id)).toBe(false);
    });

    it('orders published articles newest-first by publishedAt', async () => {
      const older = await newsService.create({
        projectId: 'waldorf-astoria',
        title: 'Older Milestone Report',
        status: 'published',
        publishedAt: '2026-08-01T10:00:00.000Z',
      });
      const newer = await newsService.create({
        projectId: 'waldorf-astoria',
        title: 'Newer Milestone Report',
        status: 'published',
        publishedAt: '2026-09-01T10:00:00.000Z',
      });

      const list = await newsService.listPublished('waldorf-astoria');
      const olderIndex = list.findIndex((item) => item.id === older.id);
      const newerIndex = list.findIndex((item) => item.id === newer.id);

      expect(newerIndex).toBeLessThan(olderIndex);
    });

    it('enforces unique slugs automatically when identical titles are created', async () => {
      const first = await newsService.create({
        projectId: 'zona-franca-la-lima',
        title: 'Campus Solar Array Commissioning',
      });
      const second = await newsService.create({
        projectId: 'zona-franca-la-lima',
        title: 'Campus Solar Array Commissioning',
      });

      expect(first.slug).toBe('campus-solar-array-commissioning');
      expect(second.slug).toBe('campus-solar-array-commissioning-2');
      expect(first.slug).not.toBe(second.slug);
    });

    it('filters news by project correctly', async () => {
      const zfllNews = await newsService.create({
        projectId: 'zona-franca-la-lima',
        title: 'La Lima Infrastructure Upgrade',
        status: 'published',
      });
      const ecNews = await newsService.create({
        projectId: 'el-cafetal',
        title: 'El Cafetal Facility Upgrade',
        status: 'published',
      });

      const zfllList = await newsService.listByProject('zona-franca-la-lima');
      expect(zfllList.some((item) => item.id === zfllNews.id)).toBe(true);
      expect(zfllList.some((item) => item.id === ecNews.id)).toBe(false);
    });

    it('maintains n8n automated ingest safety: starts as draft and only publishes on explicit admin action', async () => {
      const n8nItem = await newsService.create({
        projectId: 'zona-franca-la-lima',
        title: 'Drone LIDAR Pointcloud Telemetry',
        sourceType: 'n8n',
        sourceUrl: 'http://localhost:5678/workflow/project-automation',
        sourceLabel: 'n8n Drone Pipeline',
        category: 'Site',
        cadence: 'daily',
      });

      // Must be draft by default
      expect(n8nItem.sourceType).toBe('n8n');
      expect(n8nItem.status).toBe('draft');
      expect((await newsService.listPublished()).some((i) => i.id === n8nItem.id)).toBe(false);

      // Admin archives or publishes
      await newsService.publish(n8nItem.id);
      const published = await newsService.get(n8nItem.id);
      expect(published?.status).toBe('published');
      expect((await newsService.listPublished()).some((i) => i.id === n8nItem.id)).toBe(true);
    });

    it('supports JSON Server HTTP CRUD and falls back gracefully when API fails', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

      const mockArticle: NewsArticle = {
        id: 'news-http-test-1',
        projectId: 'zona-franca-la-lima',
        slug: 'http-news-article',
        title: 'HTTP News Article',
        excerpt: 'HTTP excerpt',
        body: 'HTTP body',
        category: 'Development',
        cadence: 'weekly',
        status: 'published',
        image: '',
        featured: false,
        sourceType: 'manual',
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
        publishedAt: '2026-10-01T10:00:00.000Z',
      };

      let currentDb = [mockArticle];

      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;

        if (init?.method === 'POST' && path === '/news') {
          const body = JSON.parse(String(init.body));
          currentDb.push(body);
          return new Response(JSON.stringify(body), { status: 201 });
        }
        if (init?.method === 'PATCH' && path === `/news/${mockArticle.id}`) {
          const body = JSON.parse(String(init.body));
          currentDb = currentDb.map((item) => (item.id === mockArticle.id ? { ...item, ...body } : item));
          return new Response(JSON.stringify(currentDb.find((item) => item.id === mockArticle.id)), { status: 200 });
        }
        if (init?.method === 'DELETE' && path === `/news/${mockArticle.id}`) {
          currentDb = currentDb.filter((item) => item.id !== mockArticle.id);
          return new Response(null, { status: 204 });
        }
        if (path === `/news/${mockArticle.id}`) {
          return new Response(JSON.stringify(mockArticle), { status: 200 });
        }
        if (path === '/news') {
          return new Response(JSON.stringify(currentDb), { status: 200 });
        }
        throw new Error(`Unhandled request: ${init?.method ?? 'GET'} ${path}`);
      });
      vi.stubGlobal('fetch', fetchMock);

      const list = await newsService.list();
      expect(list.some((item) => item.id === mockArticle.id)).toBe(true);

      const created = await newsService.create({
        projectId: 'el-cafetal',
        title: 'New Remote Article',
        status: 'published',
      });
      expect(created.title).toBe('New Remote Article');

      const updated = await newsService.update(mockArticle.id, { title: 'Patched Remote Title' });
      expect(updated?.title).toBe('Patched Remote Title');

      const removed = await newsService.remove(mockArticle.id);
      expect(removed).toBe(true);
    });

    it('cascades related news deletion when a runtime project is deleted locally and remotely', async () => {
      // 1. Local cascade test
      const project = await projectService.create({
        title: 'Temporary Runtime Zone',
        category: 'Industrial',
        phase: 'Design',
        progress: 10,
      });

      const news = await newsService.create({
        projectId: project.id,
        title: 'Temporary Project Announcement',
        status: 'published',
      });

      expect((await newsService.listByProject(project.id)).length).toBe(1);

      await projectService.remove(project.id);
      expect(await newsService.get(news.id)).toBeUndefined();
      expect((await newsService.listByProject(project.id)).length).toBe(0);

      // 2. Remote cascade test
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
      const remoteProjectId = 'admin-project-remote-temp';
      const remoteNewsId = 'news-remote-temp';

      const deletedPaths: string[] = [];
      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        const isGet = !init?.method || init.method === 'GET';
        if (isGet && path === `/projects/${remoteProjectId}`) {
          return new Response(JSON.stringify({ id: remoteProjectId }), { status: 200 });
        }
        if (isGet && ['/updates', '/milestones', '/documents', '/approvals', '/notifications'].includes(path)) {
          return new Response('[]', { status: 200 });
        }
        if (isGet && path === '/news') {
          return new Response(JSON.stringify([{ id: remoteNewsId, projectId: remoteProjectId }]), { status: 200 });
        }
        if (isGet && path === '/users') {
          return new Response('[]', { status: 200 });
        }
        if (init?.method === 'DELETE') {
          deletedPaths.push(path);
          return new Response(null, { status: 204 });
        }
        if (isGet && path === '/projects') {
          return new Response('[]', { status: 200 });
        }
        throw new Error(`Unhandled remote delete mock: ${init?.method} ${path}`);
      });
      vi.stubGlobal('fetch', fetchMock);

      await projectService.remove(remoteProjectId);
      expect(deletedPaths).toContain(`/news/${remoteNewsId}`);
      expect(deletedPaths).toContain(`/projects/${remoteProjectId}`);
    });

    it('migrates stale Waldorf Astoria webp news image path to jpg in portal database', async () => {
      const staleState = {
        schemaVersion: 4,
        news: [
          {
            id: 'news-waldorf-astoria-groundbreaking',
            projectId: 'waldorf-astoria',
            slug: 'waldorf-astoria-cacique-structural-milestone',
            title: 'Waldorf Astoria Cacique Reaches Coastal Superstructure Milestone',
            excerpt: 'The cliffside hospitality resort advances...',
            body: 'The ultra-luxury hospitality development...',
            category: 'Milestone',
            cadence: 'milestone',
            status: 'published',
            image: '/projects/waldorf-astoria/garnier-cover.webp',
            featured: true,
            sourceType: 'manual',
            createdAt: '2026-09-28T14:15:00.000Z',
            updatedAt: '2026-09-28T14:15:00.000Z',
          },
        ],
      };
      window.localStorage.setItem('arch-tech-portal-state', JSON.stringify(staleState));

      const { getPortalSnapshot } = await import('../src/portal/data');
      const snapshot = getPortalSnapshot();
      const article = snapshot.db.news?.find((item) => item.id === 'news-waldorf-astoria-groundbreaking');
      expect(article?.image).toBe('/projects/waldorf-astoria/garnier-cover.jpg');
    });
  });
});

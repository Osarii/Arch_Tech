import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalContextService } from '../src/services/externalContextService';
import { projectService } from '../src/services/projectService';
import { createPortalUser, getPortalSnapshot } from '../src/portal/data';

describe('portal service layer', () => {
  afterEach(() => {
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
      const path = new URL(url).pathname;
      if (init?.method === 'POST' && path === '/users') return new Response(JSON.stringify(createdUser), { status: 201 });
      if (init?.method === 'PATCH' && path === `/users/${createdUser.id}`) return new Response(JSON.stringify(updatedUser), { status: 200 });
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
});

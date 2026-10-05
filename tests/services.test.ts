import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalContextService } from '../src/services/externalContextService';
import { projectService } from '../src/services/projectService';
import { createPortalUser, getPortalSnapshot } from '../src/portal/data';

describe('portal service layer', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
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
});

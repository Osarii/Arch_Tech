import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPortalSnapshot, updatePortalDatabase } from '../src/portal/data';

const PORTAL_STATE_KEY = 'arch-tech-portal-state';

describe('portal persistence recovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getPortalSnapshot();
    window.localStorage.clear();
  });

  it.each([
    ['malformed JSON', '{not-json}'],
    ['null root', 'null'],
    ['string root', JSON.stringify('invalid')],
    ['number root', JSON.stringify(42)],
    ['array root', JSON.stringify([])],
  ])('recovers from a %s and self-heals storage', (_label, value) => {
    window.localStorage.setItem(PORTAL_STATE_KEY, value);

    const recovered = getPortalSnapshot();
    const persisted = JSON.parse(window.localStorage.getItem(PORTAL_STATE_KEY) ?? 'null');

    expect(recovered.db.schemaVersion).toBe(2);
    expect(recovered.projects).toHaveLength(6);
    expect(persisted.schemaVersion).toBe(2);
    expect(persisted.projects).toHaveLength(6);

    const secondRead = getPortalSnapshot();
    expect(secondRead.db.schemaVersion).toBe(2);
    expect(secondRead.projects).toHaveLength(6);
    expect(secondRead.projects.map((project) => project.id)).toEqual(recovered.projects.map((project) => project.id));
  });

  it('returns usable recovered data when storage persistence fails', () => {
    window.localStorage.setItem(PORTAL_STATE_KEY, '{not-json}');
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const recovered = getPortalSnapshot();

    expect(recovered.db.schemaVersion).toBe(2);
    expect(recovered.projects).toHaveLength(6);
  });

  it('keeps mutations available across a temporary storage failure', () => {
    const project = getPortalSnapshot().projects[0];
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => updatePortalDatabase((current) => ({
      ...current,
      projects: current.projects.map((candidate) => candidate.id === project.id ? { ...candidate, progress: 42 } : candidate),
    }))).not.toThrow();

    expect(getPortalSnapshot().projects.find((candidate) => candidate.id === project.id)?.progress).toBe(42);
  });

  it('persists the newest in-memory state after storage recovers', () => {
    const project = getPortalSnapshot().projects[0];
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    updatePortalDatabase((current) => ({
      ...current,
      projects: current.projects.map((candidate) => candidate.id === project.id ? { ...candidate, progress: 58 } : candidate),
    }));

    setItem.mockRestore();
    const recovered = getPortalSnapshot();
    const persisted = JSON.parse(window.localStorage.getItem(PORTAL_STATE_KEY) ?? 'null');

    expect(recovered.projects.find((candidate) => candidate.id === project.id)?.progress).toBe(58);
    expect(persisted.projects.find((candidate: { id: string }) => candidate.id === project.id).progress).toBe(58);
  });

  it('drops malformed nested records without losing canonical projects', () => {
    const seed = getPortalSnapshot();
    window.localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify({
      schemaVersion: 2,
      projects: [
        { ...seed.projects[0], progress: 'invalid' },
        { id: 'admin-project-invalid', title: 'Bad project', progress: 101 },
      ],
      users: [{ ...seed.db.users[0], role: 'invalid', status: 'unknown' }],
      updates: [{ projectId: seed.projects[0].id, date: '04 OCT 2026', title: 'Valid update', body: 'Kept.' }, { projectId: seed.projects[0].id, date: 42, title: 'Bad update', body: 'Dropped.' }],
      milestones: [{ projectId: seed.projects[0].id, label: 'Bad milestone', status: 'invalid' }],
      documents: [{ projectId: seed.projects[0].id, name: 'Valid document', meta: 'PDF' }],
      approvals: [{ projectId: seed.projects[0].id, title: 'Bad approval', status: 'invalid' }],
      notifications: [{ userId: seed.db.users[0].id, projectId: 'missing-project', message: 'Bad notification', date: '04 OCT 2026' }],
    }));

    const recovered = getPortalSnapshot();

    expect(recovered.db.schemaVersion).toBe(2);
    expect(recovered.projects).toHaveLength(6);
    expect(recovered.projects.find((project) => project.id === seed.projects[0].id)?.progress).toBe(seed.projects[0].progress);
    expect(recovered.projects.some((project) => project.id === 'admin-project-invalid')).toBe(false);
    expect(recovered.db.updates.some((update) => update.title === 'Bad update')).toBe(false);
    expect(recovered.db.milestones.some((milestone) => milestone.label === 'Bad milestone')).toBe(false);
    expect(recovered.db.approvals.some((approval) => approval.title === 'Bad approval')).toBe(false);
    expect(recovered.db.notifications.some((notification) => notification.message === 'Bad notification')).toBe(false);
  });
});

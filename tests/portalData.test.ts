import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPortalSnapshot } from '../src/portal/data';

const PORTAL_STATE_KEY = 'arch-tech-portal-state';

describe('portal persistence recovery', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
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
});

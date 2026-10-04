import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/portal/data', () => ({
  getPortalUser: vi.fn(),
}));

import { getPortalUser } from '../src/portal/data';
import { demoAuth } from '../src/portal/demoAuth';

const SESSION_KEY = 'arch-tech-demo-session';
const activeUser = {
  id: 'user-1',
  name: 'Current User',
  email: 'user@example.com',
  password: 'correct-password',
  role: 'client' as const,
  projectIds: [],
  status: 'active' as const,
};

const mockedGetPortalUser = vi.mocked(getPortalUser);

describe('demoAuth session integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    demoAuth.signOut();
    localStorage.clear();
    mockedGetPortalUser.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    demoAuth.signOut();
    localStorage.clear();
  });

  it('creates an authoritative session on valid sign-in', () => {
    mockedGetPortalUser.mockReturnValue(activeUser);

    expect(demoAuth.signIn(' user@example.com ', 'correct-password')).toEqual({
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
    });
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
    });
    expect(mockedGetPortalUser).toHaveBeenCalledWith(activeUser.email);
  });

  it('does not create a session for an incorrect password', () => {
    mockedGetPortalUser.mockReturnValue(activeUser);

    expect(demoAuth.signIn(activeUser.email, 'wrong-password')).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('keeps a usable session when localStorage persistence fails', () => {
    mockedGetPortalUser.mockReturnValue(activeUser);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(demoAuth.signIn(activeUser.email, activeUser.password)).toEqual({
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
    });
    expect(demoAuth.getSession()).toEqual({
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
    });
  });

  it('clears malformed JSON without throwing', () => {
    localStorage.setItem(SESSION_KEY, '{invalid json');

    expect(() => demoAuth.getSession()).not.toThrow();
    expect(demoAuth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('does not retry sign-out when storage removal fails', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: activeUser.email }));
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => demoAuth.signOut()).not.toThrow();
    expect(demoAuth.getSession()).toBeNull();
    expect(removeItem).toHaveBeenCalledTimes(1);
  });

  it('clears a session for a user that no longer exists', () => {
    mockedGetPortalUser.mockReturnValue(undefined);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: activeUser.email }));

    expect(demoAuth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('clears a session for an inactive user', () => {
    mockedGetPortalUser.mockReturnValue({ ...activeUser, status: 'inactive' });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: activeUser.email }));

    expect(demoAuth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('ignores tampered stored name and role values', () => {
    mockedGetPortalUser.mockReturnValue(activeUser);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ email: activeUser.email, name: 'Tampered', role: 'admin' })
    );

    expect(demoAuth.getSession()).toEqual({
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
    });
  });

  it('removes the session on sign-out and remains idempotent', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: activeUser.email }));

    expect(() => demoAuth.signOut()).not.toThrow();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(() => demoAuth.signOut()).not.toThrow();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

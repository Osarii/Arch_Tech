import { getPortalUser, PortalRole } from './data';

const SESSION_KEY = 'arch-tech-demo-session';
let volatileSession: ClientSession | null = null;
let volatileSignedOut = false;

export type ClientSession = {
  name: string;
  email: string;
  role: PortalRole;
};

const clearStoredSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    volatileSignedOut = false;
    return true;
  } catch {
    volatileSignedOut = true;
    return false;
  }
};

const getAuthoritativeSession = (candidate: Partial<ClientSession> | null): ClientSession | null => {
  if (!candidate || typeof candidate.email !== 'string') return null;
  const user = getPortalUser(candidate.email);
  if (!user || user.status !== 'active') return null;
  return { name: user.name, email: user.email, role: user.role };
};

export const demoAuth = {
  getSession(): ClientSession | null {
    if (typeof window === 'undefined') return null;
    if (volatileSignedOut) return null;
    if (volatileSession) {
      const current = volatileSession;
      try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(current));
        volatileSession = null;
      } catch {
        return getAuthoritativeSession(current);
      }
      return getAuthoritativeSession(current);
    }
    let value: string | null;
    try {
      value = window.localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
    if (!value) return null;
    try {
      const session = JSON.parse(value) as Partial<ClientSession> | null;
      const authoritative = getAuthoritativeSession(session);
      if (!authoritative) clearStoredSession();
      return authoritative;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  signIn(email: string, password: string): ClientSession | null {
    const user = getPortalUser(email.trim());
    if (!user || user.password !== password || user.status !== 'active') return null;
    const session = { name: user.name, email: user.email, role: user.role };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      volatileSession = null;
    } catch {
      volatileSession = session;
    }
    volatileSignedOut = false;
    return session;
  },

  signOut() {
    volatileSession = null;
    clearStoredSession();
  },
};

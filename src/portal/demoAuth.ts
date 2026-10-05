import { getPortalUser, PortalRole } from './data';
import { getApiBaseUrl } from '../services/apiClient';

const SESSION_KEY = 'arch-tech-portal-session';
const LEGACY_SESSION_KEY = 'arch-tech-demo-session';
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
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
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
  if (user) {
    if (user.status !== 'active') return null;
    return { name: user.name, email: user.email, role: user.role };
  }
  // In remote HTTP mode, users might not yet be loaded into inMemoryUsers on immediate reload.
  // We keep the candidate session intact if it has valid session shape.
  if (getApiBaseUrl() && candidate.name && candidate.role && ['client', 'architect', 'admin'].includes(candidate.role)) {
    return { name: candidate.name, email: candidate.email, role: candidate.role as PortalRole };
  }
  return null;
};

export const portalAuth = {
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
    let storageKey = SESSION_KEY;
    try {
      value = window.localStorage.getItem(SESSION_KEY);
      if (!value) {
        value = window.localStorage.getItem(LEGACY_SESSION_KEY);
        storageKey = LEGACY_SESSION_KEY;
      }
    } catch {
      return null;
    }
    if (!value) return null;
    try {
      const session = JSON.parse(value) as Partial<ClientSession> | null;
      const authoritative = getAuthoritativeSession(session);
      if (!authoritative) clearStoredSession();
      else if (storageKey === LEGACY_SESSION_KEY) {
        try {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(authoritative));
          window.localStorage.removeItem(LEGACY_SESSION_KEY);
        } catch {
          // The authoritative session remains usable in memory for this read.
        }
      }
      return authoritative;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  signIn(email: string, password: string): ClientSession | null {
    const user = getPortalUser(email.trim());
    if (!user || user.password !== password || user.status !== 'active') return null;
    return this.setSession({ name: user.name, email: user.email, role: user.role });
  },

  setSession(session: ClientSession): ClientSession {
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

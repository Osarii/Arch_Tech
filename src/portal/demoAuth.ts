import { getPortalUser, PortalRole } from './data';

const SESSION_KEY = 'arch-tech-demo-session';

export type ClientSession = {
  name: string;
  email: string;
  role: PortalRole;
};

const clearStoredSession = () => {
  window.localStorage.removeItem(SESSION_KEY);
};

export const demoAuth = {
  getSession(): ClientSession | null {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    try {
      const session = JSON.parse(value) as Partial<ClientSession> | null;
      if (!session || typeof session !== 'object' || typeof session.email !== 'string') {
        clearStoredSession();
        return null;
      }
      const user = getPortalUser(session.email);
      if (!user || user.status !== 'active') {
        clearStoredSession();
        return null;
      }
      return { name: user.name, email: user.email, role: user.role };
    } catch {
      clearStoredSession();
      return null;
    }
  },

  signIn(email: string, password: string): ClientSession | null {
    const user = getPortalUser(email.trim());
    if (!user || user.password !== password || user.status !== 'active') return null;
    const session = { name: user.name, email: user.email, role: user.role };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  signOut() {
    clearStoredSession();
  },
};

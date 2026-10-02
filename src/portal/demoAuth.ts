import { getPortalUser, PortalRole } from './data';

const SESSION_KEY = 'arch-tech-demo-session';

export type ClientSession = {
  name: string;
  email: string;
  role: PortalRole;
};

export const demoAuth = {
  getSession(): ClientSession | null {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    try {
      const session = JSON.parse(value) as Partial<ClientSession> & Pick<ClientSession, 'email' | 'name'>;
      const user = getPortalUser(session.email);
      return user ? { name: user.name, email: user.email, role: user.role } : null;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  signIn(email: string, password: string): ClientSession | null {
    const user = getPortalUser(email);
    if (!user || user.password !== password || user.status !== 'active') return null;
    const session = { name: user.name, email: user.email, role: user.role };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  signOut() {
    window.localStorage.removeItem(SESSION_KEY);
  },
};

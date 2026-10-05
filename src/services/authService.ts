import { type CreatePortalUserInput } from '../portal/data';
import { portalAuth, type ClientSession } from '../portal/demoAuth';
import { getApiBaseUrl } from './apiClient';
import { userService } from './userService';

let activeValidationPromise: Promise<ClientSession | null> | null = null;

export const authService = {
  isRemote: () => Boolean(getApiBaseUrl()),
  getSession: (): ClientSession | null => portalAuth.getSession(),

  async validateSession(): Promise<ClientSession | null> {
    if (!this.isRemote()) {
      return portalAuth.getSession();
    }

    const current = portalAuth.getSession();
    if (current) return current;

    if (activeValidationPromise) {
      return activeValidationPromise;
    }

    activeValidationPromise = (async () => {
      const candidate = portalAuth.getCandidateSession();
      if (!candidate?.email) {
        portalAuth.signOut();
        return null;
      }

      try {
        const user = await userService.findByEmail(candidate.email);
        if (!portalAuth.getCandidateSession() || !user || user.status !== 'active') {
          portalAuth.signOut();
          return null;
        }

        return portalAuth.setSession({
          name: user.name,
          email: user.email,
          role: user.role,
        });
      } catch {
        portalAuth.signOut();
        return null;
      }
    })().finally(() => {
      activeValidationPromise = null;
    });

    return activeValidationPromise;
  },

  async signIn(email: string, password: string): Promise<ClientSession | null> {
    const normalized = email.trim();
    if (!normalized || !password) return null;

    const user = await userService.findByEmail(normalized);

    if (!user || user.password !== password || user.status !== 'active') {
      return null;
    }

    return portalAuth.setSession({ name: user.name, email: user.email, role: user.role });
  },

  signOut: () => portalAuth.signOut(),

  async register(input: CreatePortalUserInput): Promise<ClientSession> {
    const registration = { ...input, role: 'client' as const, status: 'active' as const, projectIds: [] };
    const user = await userService.create(registration);
    const session = portalAuth.setSession({ name: user.name, email: user.email, role: user.role });
    if (!session) throw new Error('The account was created but could not be opened.');
    return session;
  },
};

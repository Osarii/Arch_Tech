import { type CreatePortalUserInput, type PortalUser } from '../portal/data';
import { portalAuth, type ClientSession } from '../portal/demoAuth';
import { getApiBaseUrl } from './apiClient';
import { userService } from './userService';

export const authService = {
  isRemote: () => Boolean(getApiBaseUrl()),
  getSession: (): ClientSession | null => portalAuth.getSession(),

  async signIn(email: string, password: string): Promise<ClientSession | null> {
    const normalized = email.trim();
    if (!normalized || !password) return null;

    let user: PortalUser | undefined;
    if (getApiBaseUrl()) {
      user = await userService.findByEmail(normalized);
    } else {
      user = await userService.findByEmail(normalized);
    }

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

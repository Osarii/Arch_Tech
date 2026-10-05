import { createPortalUser, getPortalUser, type CreatePortalUserInput, type PortalUser } from '../portal/data';
import { portalAuth, type ClientSession } from '../portal/demoAuth';
import { getApiBaseUrl } from './apiClient';
import { userService } from './userService';

export const authService = {
  getSession: (): ClientSession | null => portalAuth.getSession(),
  signIn: (email: string, password: string): ClientSession | null => portalAuth.signIn(email, password),
  signOut: () => portalAuth.signOut(),
  async register(input: CreatePortalUserInput): Promise<ClientSession> {
    const registration = { ...input, role: 'client' as const, status: 'active' as const, projectIds: [] };
    const user: PortalUser = getApiBaseUrl() ? await userService.create(registration) : createPortalUser(registration);
    if (getApiBaseUrl() && !getPortalUser(user.email)) {
      createPortalUser(registration);
    }
    const session = portalAuth.signIn(user.email, user.password);
    if (!session) throw new Error('The account was created but could not be opened.');
    return session;
  },
};

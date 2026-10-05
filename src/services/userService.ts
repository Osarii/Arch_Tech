import { createPortalUser, getPortalSnapshot, syncPortalUsers, updatePortalUser, type CreatePortalUserInput, type PortalUser } from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export const userService = {
  isRemote: () => Boolean(getApiBaseUrl()),
  async list(): Promise<PortalUser[]> {
    if (!getApiBaseUrl()) return getPortalSnapshot().db.users;
    const users = await apiClient.get<PortalUser[]>('/users');
    syncPortalUsers(users, true);
    return users;
  },
  async create(input: CreatePortalUserInput): Promise<PortalUser> {
    if (!getApiBaseUrl()) return createPortalUser(input);
    const user = await apiClient.post<PortalUser>('/users', { ...input, role: input.role ?? 'client', status: input.status ?? 'active', projectIds: input.projectIds ?? [] });
    syncPortalUsers([user]);
    return user;
  },
  async update(id: string, changes: Partial<PortalUser>): Promise<PortalUser | undefined> {
    if (!getApiBaseUrl()) {
      updatePortalUser(id, changes);
      return getPortalSnapshot().db.users.find((user) => user.id === id);
    }
    const user = await apiClient.patch<PortalUser>(`/users/${id}`, changes);
    syncPortalUsers([user]);
    return user;
  },
};

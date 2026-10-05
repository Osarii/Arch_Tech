import { createPortalUser, getPortalSnapshot, updatePortalUser, type CreatePortalUserInput, type PortalUser } from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export const userService = {
  async list(): Promise<PortalUser[]> {
    if (!getApiBaseUrl()) return getPortalSnapshot().db.users;
    return apiClient.get<PortalUser[]>('/users');
  },
  async create(input: CreatePortalUserInput): Promise<PortalUser> {
    if (!getApiBaseUrl()) return createPortalUser(input);
    return apiClient.post<PortalUser>('/users', { ...input, role: input.role ?? 'client', status: input.status ?? 'active', projectIds: input.projectIds ?? [] });
  },
  async update(id: string, changes: Partial<PortalUser>): Promise<PortalUser | undefined> {
    if (!getApiBaseUrl()) {
      updatePortalUser(id, changes);
      return getPortalSnapshot().db.users.find((user) => user.id === id);
    }
    return apiClient.patch<PortalUser>(`/users/${id}`, changes);
  },
};

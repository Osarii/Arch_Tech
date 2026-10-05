import {
  createPortalRecordId,
  createPortalUser,
  getPortalSnapshot,
  getPortalUser,
  removePortalUserInMemory,
  syncPortalUsers,
  updatePortalUser,
  type CreatePortalUserInput,
  type PortalUser,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export const userService = {
  isRemote: () => Boolean(getApiBaseUrl()),

  async list(): Promise<PortalUser[]> {
    if (!getApiBaseUrl()) return getPortalSnapshot().db.users;
    const users = await apiClient.get<PortalUser[]>('/users');
    syncPortalUsers(users, true);
    return users;
  },

  async findById(id: string): Promise<PortalUser | undefined> {
    if (!getApiBaseUrl()) {
      return getPortalSnapshot().db.users.find((user) => user.id === id);
    }
    try {
      const user = await apiClient.get<PortalUser>(`/users/${id}`);
      syncPortalUsers([user]);
      return user;
    } catch {
      return undefined;
    }
  },

  async findByEmail(email: string): Promise<PortalUser | undefined> {
    const normalized = email.trim().toLowerCase();
    if (!getApiBaseUrl()) {
      return getPortalUser(normalized);
    }
    const matching = await apiClient.get<PortalUser[]>(`/users?email=${encodeURIComponent(normalized)}`);
    const user = Array.isArray(matching) ? matching.find((u) => u.email.toLowerCase() === normalized) : undefined;
    if (user) {
      syncPortalUsers([user]);
    }
    return user;
  },

  async create(input: CreatePortalUserInput): Promise<PortalUser> {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim() || !email || !input.password) {
      throw new Error('Name, email and password are required.');
    }

    if (!getApiBaseUrl()) {
      return createPortalUser(input);
    }

    // Authoritative remote check for duplicate email before creation
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const payload: PortalUser = {
      id: createPortalRecordId('portal-user'),
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role ?? 'client',
      status: input.status ?? 'active',
      projectIds: input.projectIds ?? [],
    };

    const user = await apiClient.post<PortalUser>('/users', payload);
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

  async delete(id: string): Promise<boolean> {
    if (!getApiBaseUrl()) {
      removePortalUserInMemory(id);
      return true;
    }
    await apiClient.delete(`/users/${id}`);
    removePortalUserInMemory(id);
    return true;
  },
};

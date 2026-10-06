import {
  createPortalProject,
  createPortalProjectRecord,
  deletePortalProject,
  getPortalSnapshot,
  isCanonicalPortalProject,
  syncPortalProjects,
  syncPortalRelations,
  syncPortalUsers,
  updatePortalProject,
  type CreatePortalProjectInput,
  type PortalDatabase,
  type PortalProject,
  type PortalProjectRecord,
  type PortalUser,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

type RemoteRecord = { id?: string | number };
type ProjectRecordWithRelations = PortalProjectRecord & Partial<Pick<PortalProject, 'updates' | 'milestones' | 'documents' | 'approvals'>>;
type RemoteRelations = Pick<PortalDatabase, 'updates' | 'milestones' | 'documents' | 'approvals' | 'notifications'>;

const remoteEnabled = () => Boolean(getApiBaseUrl());

const loadRelations = async (): Promise<RemoteRelations> => {
  const [updates, milestones, documents, approvals, notifications] = await Promise.all([
    apiClient.get<PortalDatabase['updates']>('/updates'),
    apiClient.get<PortalDatabase['milestones']>('/milestones'),
    apiClient.get<PortalDatabase['documents']>('/documents'),
    apiClient.get<PortalDatabase['approvals']>('/approvals'),
    apiClient.get<PortalDatabase['notifications']>('/notifications'),
  ]);
  return { updates, milestones, documents, approvals, notifications };
};

const hydrateRemoteProjects = async (records: ProjectRecordWithRelations[]): Promise<PortalProject[]> => {
  const relations = await loadRelations();
  syncPortalProjects(records);
  syncPortalRelations(relations);
  return records.map((project) => ({
    ...project,
    updates: relations.updates.filter((item) => item.projectId === project.id),
    milestones: relations.milestones.filter((item) => item.projectId === project.id),
    documents: relations.documents.filter((item) => item.projectId === project.id),
    approvals: relations.approvals.filter((item) => item.projectId === project.id),
  }));
};

const deleteRelatedRecords = async (path: string, projectId: string) => {
  const records = await apiClient.get<Array<RemoteRecord & { projectId?: string }>>(`/${path}`);
  await Promise.all(records.filter((record) => record.projectId === projectId && record.id !== undefined).map((record) => apiClient.delete(`/${path}/${record.id}`)));
};

export const projectService = {
  isRemote: remoteEnabled,
  async list(): Promise<PortalProject[]> {
    if (!remoteEnabled()) return getPortalSnapshot().projects;
    return hydrateRemoteProjects(await apiClient.get<ProjectRecordWithRelations[]>('/projects'));
  },
  async get(id: string): Promise<PortalProject | undefined> {
    if (!remoteEnabled()) return getPortalSnapshot().projects.find((project) => project.id === id);
    const projects = await this.list();
    return projects.find((project) => project.id === id);
  },
  async create(input: CreatePortalProjectInput): Promise<PortalProject> {
    if (!remoteEnabled()) return createPortalProject(input);
    const record = createPortalProjectRecord(input);
    await apiClient.post<ProjectRecordWithRelations>('/projects', record);
    const projects = await this.list();
    const created = projects.find((project) => project.id === record.id);
    if (!created) throw new Error('The project was created but could not be read back from the API.');
    return created;
  },
  async update(id: string, changes: Partial<PortalProjectRecord>): Promise<PortalProject | undefined> {
    if (!remoteEnabled()) {
      updatePortalProject(id, changes);
      return this.get(id);
    }
    await apiClient.patch<ProjectRecordWithRelations>(`/projects/${id}`, changes);
    const projects = await this.list();
    return projects.find((project) => project.id === id);
  },
  async remove(id: string): Promise<boolean> {
    if (isCanonicalPortalProject(id)) throw new Error('Canonical showcase projects cannot be deleted.');
    if (!remoteEnabled()) return deletePortalProject(id);

    await apiClient.get<PortalProjectRecord>(`/projects/${id}`);
    for (const path of ['updates', 'milestones', 'documents', 'approvals', 'notifications', 'news'] as const) {
      await deleteRelatedRecords(path, id);
    }
    const users = await apiClient.get<PortalUser[]>('/users');
    const updatedUsers = await Promise.all(users.map((user) => user.projectIds.includes(id)
      ? apiClient.patch<PortalUser>(`/users/${user.id}`, { projectIds: user.projectIds.filter((projectId) => projectId !== id) })
      : Promise.resolve(user)));
    syncPortalUsers(updatedUsers, true);
    await apiClient.delete(`/projects/${id}`);
    await this.list();
    return true;
  },
};

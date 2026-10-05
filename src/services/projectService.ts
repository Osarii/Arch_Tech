import {
  createPortalProject,
  deletePortalProject,
  getPortalSnapshot,
  isCanonicalPortalProject,
  updatePortalProject,
  type CreatePortalProjectInput,
  type PortalProject,
  type PortalProjectRecord,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

type ProjectRecordWithRelations = PortalProjectRecord & Partial<Pick<PortalProject, 'updates' | 'milestones' | 'documents' | 'approvals'>>;

const hydrateRemoteProjects = async (records: ProjectRecordWithRelations[]): Promise<PortalProject[]> => {
  const [updates, milestones, documents, approvals] = await Promise.all([
    apiClient.get<PortalProject['updates']>('/updates'),
    apiClient.get<PortalProject['milestones']>('/milestones'),
    apiClient.get<PortalProject['documents']>('/documents'),
    apiClient.get<PortalProject['approvals']>('/approvals'),
  ]);
  return records.map((project) => ({
    ...project,
    updates: updates.filter((item) => item.projectId === project.id),
    milestones: milestones.filter((item) => item.projectId === project.id),
    documents: documents.filter((item) => item.projectId === project.id),
    approvals: approvals.filter((item) => item.projectId === project.id),
  }));
};

const remoteEnabled = () => Boolean(getApiBaseUrl());

export const projectService = {
  async list(): Promise<PortalProject[]> {
    if (!remoteEnabled()) return getPortalSnapshot().projects;
    return hydrateRemoteProjects(await apiClient.get<ProjectRecordWithRelations[]>('/projects'));
  },
  async get(id: string): Promise<PortalProject | undefined> {
    if (!remoteEnabled()) return getPortalSnapshot().projects.find((project) => project.id === id);
    try {
      const projects = await this.list();
      return projects.find((project) => project.id === id);
    } catch (error) {
      if ((error as { status?: number }).status === 404) return undefined;
      throw error;
    }
  },
  async create(input: CreatePortalProjectInput): Promise<PortalProject> {
    if (!remoteEnabled()) return createPortalProject(input);
    const created = await apiClient.post<ProjectRecordWithRelations>('/projects', input);
    return (await hydrateRemoteProjects([created]))[0];
  },
  async update(id: string, changes: Partial<PortalProjectRecord>): Promise<PortalProject | undefined> {
    if (!remoteEnabled()) {
      updatePortalProject(id, changes);
      return this.get(id);
    }
    const updated = await apiClient.patch<ProjectRecordWithRelations>(`/projects/${id}`, changes);
    return (await hydrateRemoteProjects([updated]))[0];
  },
  async remove(id: string): Promise<boolean> {
    if (isCanonicalPortalProject(id)) throw new Error('Canonical showcase projects cannot be deleted.');
    if (!remoteEnabled()) return deletePortalProject(id);
    await apiClient.delete(`/projects/${id}`);
    return true;
  },
};

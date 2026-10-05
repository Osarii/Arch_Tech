import {
  addPortalApproval,
  addPortalDocument,
  addPortalMilestone,
  addPortalUpdate,
  createPortalRecordId,
  getPortalSnapshot,
  syncPortalRelations,
  updatePortalApproval,
  type PortalDatabase,
  type ProjectApproval,
  type ProjectDocument,
  type ProjectMilestone,
  type ProjectUpdate,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

type RemoteRelation = { id?: string | number };
type RelationPath = 'updates' | 'milestones' | 'documents' | 'approvals';
type RelationRecord = ProjectUpdate | ProjectMilestone | ProjectDocument | ProjectApproval;

const remoteEnabled = () => Boolean(getApiBaseUrl());

const syncRemoteRelations = async () => {
  const [updates, milestones, documents, approvals, notifications] = await Promise.all([
    apiClient.get<PortalDatabase['updates']>('/updates'),
    apiClient.get<PortalDatabase['milestones']>('/milestones'),
    apiClient.get<PortalDatabase['documents']>('/documents'),
    apiClient.get<PortalDatabase['approvals']>('/approvals'),
    apiClient.get<PortalDatabase['notifications']>('/notifications'),
  ]);
  syncPortalRelations({ updates, milestones, documents, approvals, notifications });
};

const postRelation = async <T extends RelationRecord>(path: RelationPath, prefix: string, record: T): Promise<T & RemoteRelation> => {
  const created = await apiClient.post<T & RemoteRelation>(`/${path}`, { id: createPortalRecordId(prefix), ...record });
  await syncRemoteRelations();
  return created;
};

export const projectWorkflowService = {
  isRemote: remoteEnabled,

  async addUpdate(update: ProjectUpdate): Promise<ProjectUpdate & RemoteRelation> {
    if (!remoteEnabled()) {
      addPortalUpdate(update);
      return update;
    }
    return postRelation('updates', 'project-update', update);
  },

  async addMilestone(milestone: ProjectMilestone): Promise<ProjectMilestone & RemoteRelation> {
    if (!remoteEnabled()) {
      addPortalMilestone(milestone);
      return milestone;
    }
    return postRelation('milestones', 'project-milestone', milestone);
  },

  async addDocument(document: ProjectDocument): Promise<ProjectDocument & RemoteRelation> {
    if (!remoteEnabled()) {
      addPortalDocument(document);
      return document;
    }
    return postRelation('documents', 'project-document', document);
  },

  async requestApproval(approval: ProjectApproval): Promise<ProjectApproval & RemoteRelation> {
    if (!remoteEnabled()) {
      addPortalApproval(approval);
      return approval;
    }
    return postRelation('approvals', 'project-approval', approval);
  },

  async updateApproval(projectId: string, title: string, status: ProjectApproval['status']): Promise<ProjectApproval & RemoteRelation | undefined> {
    if (!remoteEnabled()) {
      const current = getPortalSnapshot().db.approvals.find((approval) => approval.projectId === projectId && approval.title === title);
      if (!current) return undefined;
      updatePortalApproval(projectId, title, status);
      return { ...current, status };
    }

    const approvals = await apiClient.get<Array<ProjectApproval & RemoteRelation>>(`/approvals?projectId=${encodeURIComponent(projectId)}&title=${encodeURIComponent(title)}`);
    const current = approvals.find((approval) => approval.projectId === projectId && approval.title === title);
    if (current?.id === undefined) return undefined;
    const updated = await apiClient.patch<ProjectApproval & RemoteRelation>(`/approvals/${current.id}`, { status });
    await syncRemoteRelations();
    return updated;
  },
};

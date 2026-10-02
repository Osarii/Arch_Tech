import db from '../../db.json';

export type PortalRole = 'client' | 'architect' | 'admin';

export type ProjectUpdate = {
  projectId: string;
  date: string;
  title: string;
  body: string;
};

export type ProjectMilestone = {
  projectId: string;
  label: string;
  status: 'Complete' | 'Current' | 'Upcoming';
};

export type ProjectDocument = {
  projectId: string;
  name: string;
  meta: string;
};

export type ProjectApproval = {
  projectId: string;
  title: string;
  status: 'Approved' | 'Pending' | 'Rejected';
};

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: PortalRole;
  projectIds: string[];
  status: 'active' | 'inactive';
};

type PortalProjectRecord = {
  id: string;
  code: string;
  title: string;
  category: string;
  phase: string;
  progress: number;
  nextMilestone: string;
  summary: string;
  statement: string;
  image: string;
  market?: string;
  developmentType?: string;
  publicStage?: string;
  published?: boolean;
  context?: string;
  scale?: string;
  longView?: string;
  archived?: boolean;
  media?: {
    aerial: string;
    masterplan: string;
    sitePlan: string;
    floorPlan: string;
    interior: string;
    campusOverview: string;
    conceptBoard: string;
  };
};

export type PortalProject = PortalProjectRecord & {
  updates: ProjectUpdate[];
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  approvals: ProjectApproval[];
};

export type PortalDatabase = {
  schemaVersion?: number;
  users: PortalUser[];
  projects: PortalProjectRecord[];
  updates: ProjectUpdate[];
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  approvals: ProjectApproval[];
  notifications: {
    userId: string;
    projectId: string;
    message: string;
    date: string;
  }[];
};

const PORTAL_STATE_KEY = 'arch-tech-portal-state';
const PORTAL_SCHEMA_VERSION = 2;
export const portalDb = db as PortalDatabase;
export const demoPortalUser = portalDb.users[0];

const isRuntimeProjectId = (id: string) => id.startsWith('admin-project-');
const isSafeAssetPath = (asset: unknown): asset is string => typeof asset === 'string' && asset.startsWith('/projects/') && !asset.includes('/arch_');

const mergeRecords = <T extends { projectId: string }>(seed: T[], stored: unknown, key: (record: T) => string, projectIds: Set<string>) => {
  const records = new Map(seed.map((record) => [key(record), record]));
  if (Array.isArray(stored)) {
    stored.filter((record): record is T => Boolean(record) && projectIds.has(record.projectId)).forEach((record) => records.set(key(record), record));
  }
  return [...records.values()];
};

const migratePortalDatabase = (stored: Partial<PortalDatabase>): PortalDatabase => {
  const seedProjects = portalDb.projects;
  const storedProjects = Array.isArray(stored.projects) ? stored.projects : [];
  const projects = seedProjects.map((seedProject) => {
    const saved = storedProjects.find((project) => project?.id === seedProject.id);
    return saved ? { ...seedProject, ...saved, image: seedProject.image, media: seedProject.media } : seedProject;
  });

  storedProjects.filter((project) => isRuntimeProjectId(project?.id)).forEach((project) => {
    projects.push({
      ...project,
      image: isSafeAssetPath(project.image) ? project.image : seedProjects[0].image,
      media: project.media && Object.values(project.media).every(isSafeAssetPath) ? project.media : undefined,
      published: project.published === true,
    });
  });

  const projectIds = new Set(projects.map((project) => project.id));
  const users = portalDb.users.map((seedUser) => {
    const saved = Array.isArray(stored.users) ? stored.users.find((user) => user?.id === seedUser.id) : undefined;
    const projectAssignments = saved?.projectIds?.filter((id) => projectIds.has(id)) ?? [];
    return { ...seedUser, ...saved, projectIds: projectAssignments.length || stored.schemaVersion === PORTAL_SCHEMA_VERSION ? projectAssignments : seedUser.projectIds };
  });
  const customUsers: PortalUser[] = [];
  if (Array.isArray(stored.users)) {
    stored.users.filter((user) => user?.id && !users.some((current) => current.id === user.id)).forEach((user) => customUsers.push({ ...user, projectIds: user.projectIds?.filter((id) => projectIds.has(id)) ?? [] }));
  }

  return {
    schemaVersion: PORTAL_SCHEMA_VERSION,
    users: [...customUsers, ...users],
    projects,
    updates: mergeRecords(portalDb.updates, stored.updates, (record) => `${record.projectId}:${record.date}:${record.title}`, projectIds),
    milestones: mergeRecords(portalDb.milestones, stored.milestones, (record) => `${record.projectId}:${record.label}`, projectIds),
    documents: mergeRecords(portalDb.documents, stored.documents, (record) => `${record.projectId}:${record.name}`, projectIds),
    approvals: mergeRecords(portalDb.approvals, stored.approvals, (record) => `${record.projectId}:${record.title}`, projectIds),
    notifications: mergeRecords(portalDb.notifications, stored.notifications, (record) => `${record.userId}:${record.projectId}:${record.message}:${record.date}`, projectIds),
  };
};

const readPortalDatabase = (): PortalDatabase => {
  if (typeof window === 'undefined') return portalDb;
  try {
    const stored = window.localStorage.getItem(PORTAL_STATE_KEY);
    const next = migratePortalDatabase(stored ? JSON.parse(stored) : {});
    window.localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return portalDb;
  }
};

const writePortalDatabase = (next: PortalDatabase) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify(next));
  return next;
};

export const getPortalSnapshot = () => {
  const current = readPortalDatabase();
  return {
    db: current,
    projects: current.projects.map((project) => ({
      ...project,
      updates: current.updates.filter((update) => update.projectId === project.id),
      milestones: current.milestones.filter((milestone) => milestone.projectId === project.id),
      documents: current.documents.filter((document) => document.projectId === project.id),
      approvals: current.approvals.filter((approval) => approval.projectId === project.id),
    })),
  };
};

export const updatePortalDatabase = (mutate: (current: PortalDatabase) => PortalDatabase) => writePortalDatabase(mutate(readPortalDatabase()));
export const updatePortalProject = (id: string, changes: Partial<PortalProjectRecord>) => updatePortalDatabase((current) => ({ ...current, projects: current.projects.map((project) => project.id === id ? { ...project, ...changes } : project) }));
export const updatePortalApproval = (projectId: string, title: string, status: ProjectApproval['status']) => updatePortalDatabase((current) => ({ ...current, approvals: current.approvals.map((approval) => approval.projectId === projectId && approval.title === title ? { ...approval, status } : approval) }));
export const addPortalUpdate = (update: ProjectUpdate) => updatePortalDatabase((current) => ({ ...current, updates: [update, ...current.updates] }));
export const addPortalMilestone = (milestone: ProjectMilestone) => updatePortalDatabase((current) => ({ ...current, milestones: [...current.milestones, milestone] }));
export const addPortalDocument = (document: ProjectDocument) => updatePortalDatabase((current) => ({ ...current, documents: [...current.documents, document] }));
export const addPortalApproval = (approval: ProjectApproval) => updatePortalDatabase((current) => ({ ...current, approvals: [...current.approvals, approval] }));
export const updatePortalUser = (id: string, changes: Partial<PortalUser>) => updatePortalDatabase((current) => ({ ...current, users: current.users.map((user) => user.id === id ? { ...user, ...changes } : user) }));
export const createPortalProject = (project: PortalProjectRecord) => updatePortalDatabase((current) => ({ ...current, projects: [...current.projects, { ...project, published: project.published === true }] }));

export const getPortalUser = (email: string) => readPortalDatabase().users.find((user) => user.email === email);

export const portalProjects: PortalProject[] = getPortalSnapshot().projects;

export const getPortalProject = (id: string) => getPortalSnapshot().projects.find((project) => project.id === id);

export const getPublicProjects = () => getPortalSnapshot().projects.filter((project) => project.published === true && !project.archived);
export const getPublicProject = (id: string) => getPublicProjects().find((project) => project.id === id);

export const getProjectsForUser = (userId: string) => {
  const snapshot = getPortalSnapshot();
  const user = snapshot.db.users.find((candidate) => candidate.id === userId);
  return snapshot.projects.filter((project) => !project.archived && user?.projectIds.includes(project.id));
};

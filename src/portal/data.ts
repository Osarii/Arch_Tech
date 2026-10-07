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

export type PortalProjectRecord = {
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
    aerial?: string;
    masterplan?: string;
    sitePlan?: string;
    floorPlan?: string;
    interior?: string;
    campusOverview?: string;
    conceptBoard?: string;
    gallery?: string[];
  };
};

export type ProgressSnapshot = {
  id: string;
  projectId: string;
  date: string;
  progress: number;
};

export type NewsCategory =
  | 'Development'
  | 'Site'
  | 'Design'
  | 'Infrastructure'
  | 'Milestone'
  | 'Operations'
  | 'Announcement';

export type NewsCadence = 'daily' | 'weekly' | 'milestone';
export type NewsStatus = 'draft' | 'published' | 'archived';
export type NewsSourceType = 'manual' | 'n8n';

export type NewsArticle = {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: NewsCategory;
  cadence: NewsCadence;
  status: NewsStatus;
  image: string;
  featured: boolean;
  sourceType: NewsSourceType;
  sourceUrl?: string;
  sourceLabel?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  verifiedAt?: string;
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
  progressSnapshots: ProgressSnapshot[];
  news: NewsArticle[];
};

const PORTAL_STATE_KEY = 'arch-tech-portal-state';
const PORTAL_SCHEMA_VERSION = 4;
let volatilePortalDatabase: PortalDatabase | null = null;
const portalDb = db as PortalDatabase;
let inMemoryUsers: PortalUser[] = portalDb.users.map((user) => ({ ...user, projectIds: [...user.projectIds] }));

const legacyUserIdMap: Record<string, string> = {
  'demo-client': 'portal-client',
  'demo-architect': 'portal-architect',
  'demo-admin': 'portal-admin',
};

const legacyProjectIdMap: Record<string, string> = {
  'pacific-nexus-free-zone': 'zona-franca-la-lima',
  'summit-point-corporate-district': 'el-cafetal',
  'mar-vista-hospitality-district': 'waldorf-astoria',
  'caribbean-ai-compute-campus': 'centro-corporativo-sabana',
  'guanacaste-renewable-compute-campus': 'santa-ana-country-club',
  'pacific-regional-medical-campus': 'universidad-latina',
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isValidProgress = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const isRuntimeProjectId = (id: unknown): id is string => isString(id) && id.startsWith('admin-project-');
const isSafeAssetPath = (asset: unknown): asset is string => typeof asset === 'string' && asset.startsWith('/projects/') && !asset.includes('/arch_');
const validMilestoneStatuses: ProjectMilestone['status'][] = ['Complete', 'Current', 'Upcoming'];
const validApprovalStatuses: ProjectApproval['status'][] = ['Approved', 'Pending', 'Rejected'];

const normalizeMedia = (value: unknown): PortalProjectRecord['media'] | undefined => {
  if (!isRecord(value)) return undefined;
  const keys = ['aerial', 'masterplan', 'sitePlan', 'floorPlan', 'interior', 'campusOverview', 'conceptBoard'] as const;
  const media: NonNullable<PortalProjectRecord['media']> = {};
  keys.forEach((key) => {
    if (isSafeAssetPath(value[key])) media[key] = value[key];
  });
  if (Array.isArray(value.gallery)) {
    const gallery = value.gallery.filter(isSafeAssetPath);
    if (gallery.length) media.gallery = gallery;
  }
  return Object.keys(media).length ? media : undefined;
};

const normalizeProject = (candidate: unknown, fallback?: PortalProjectRecord): PortalProjectRecord | null => {
  if (!isRecord(candidate)) return null;
  if (!fallback && (!isString(candidate.id) || !isString(candidate.code) || !isString(candidate.title) || !isString(candidate.category) || !isString(candidate.phase) || !isValidProgress(candidate.progress) || !isString(candidate.nextMilestone) || !isString(candidate.summary) || !isString(candidate.statement))) return null;
  if (fallback) {
    return {
      ...fallback,
      code: isString(candidate.code) ? candidate.code : fallback.code,
      title: isString(candidate.title) ? candidate.title : fallback.title,
      category: isString(candidate.category) ? candidate.category : fallback.category,
      phase: isString(candidate.phase) ? candidate.phase : fallback.phase,
      progress: isValidProgress(candidate.progress) ? candidate.progress : fallback.progress,
      nextMilestone: isString(candidate.nextMilestone) ? candidate.nextMilestone : fallback.nextMilestone,
      summary: isString(candidate.summary) ? candidate.summary : fallback.summary,
      statement: isString(candidate.statement) ? candidate.statement : fallback.statement,
      published: typeof candidate.published === 'boolean' ? candidate.published : fallback.published,
      archived: typeof candidate.archived === 'boolean' ? candidate.archived : fallback.archived,
      market: isString(candidate.market) ? candidate.market : fallback.market,
      developmentType: isString(candidate.developmentType) ? candidate.developmentType : fallback.developmentType,
      publicStage: isString(candidate.publicStage) ? candidate.publicStage : fallback.publicStage,
      context: isString(candidate.context) ? candidate.context : fallback.context,
      scale: isString(candidate.scale) ? candidate.scale : fallback.scale,
      longView: isString(candidate.longView) ? candidate.longView : fallback.longView,
      image: fallback.image,
      media: fallback.media,
    };
  }
  const project: PortalProjectRecord = {
    id: candidate.id as string,
    code: candidate.code as string,
    title: candidate.title as string,
    category: candidate.category as string,
    phase: candidate.phase as string,
    progress: candidate.progress as number,
    nextMilestone: candidate.nextMilestone as string,
    summary: candidate.summary as string,
    statement: candidate.statement as string,
    image: isSafeAssetPath(candidate.image) ? candidate.image : '',
    published: candidate.published === true,
    media: normalizeMedia(candidate.media),
  };
  if (typeof candidate.archived === 'boolean') project.archived = candidate.archived;
  if (isString(candidate.market)) project.market = candidate.market;
  if (isString(candidate.developmentType)) project.developmentType = candidate.developmentType;
  if (isString(candidate.publicStage)) project.publicStage = candidate.publicStage;
  if (isString(candidate.context)) project.context = candidate.context;
  if (isString(candidate.scale)) project.scale = candidate.scale;
  if (isString(candidate.longView)) project.longView = candidate.longView;
  return project;
};

const mergeRecords = <T>(seed: T[], stored: unknown, key: (record: T) => string, isValid: (record: unknown) => record is T) => {
  const records = new Map(seed.map((record) => [key(record), record]));
  if (Array.isArray(stored)) {
    stored.filter(isValid).forEach((record) => records.set(key(record), record));
  }
  return [...records.values()];
};

const isValidProjectUpdate = (value: unknown, projectIds: Set<string>): value is ProjectUpdate => {
  if (!isRecord(value)) return false;
  return isString(value.projectId) && projectIds.has(value.projectId) && isString(value.date) && isString(value.title) && isString(value.body);
};
const isValidProjectMilestone = (value: unknown, projectIds: Set<string>): value is ProjectMilestone => {
  if (!isRecord(value)) return false;
  return isString(value.projectId) && projectIds.has(value.projectId) && isString(value.label) && validMilestoneStatuses.includes(value.status as ProjectMilestone['status']);
};
const isValidProjectDocument = (value: unknown, projectIds: Set<string>): value is ProjectDocument => {
  if (!isRecord(value)) return false;
  return isString(value.projectId) && projectIds.has(value.projectId) && isString(value.name) && isString(value.meta);
};
const isValidProjectApproval = (value: unknown, projectIds: Set<string>): value is ProjectApproval => {
  if (!isRecord(value)) return false;
  return isString(value.projectId) && projectIds.has(value.projectId) && isString(value.title) && validApprovalStatuses.includes(value.status as ProjectApproval['status']);
};
const isValidNotification = (value: unknown, projectIds: Set<string>, userIds: Set<string>): value is PortalDatabase['notifications'][number] => {
  if (!isRecord(value)) return false;
  return isString(value.userId) && userIds.has(value.userId) && isString(value.projectId) && projectIds.has(value.projectId) && isString(value.message) && isString(value.date);
};

export const isValidSnapshotDate = (dateStr: unknown): dateStr is string => {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(year);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const isValidProgressSnapshot = (value: unknown, projectIds: Set<string>): value is ProgressSnapshot => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    value.id.trim().length > 0 &&
    isString(value.projectId) &&
    projectIds.has(value.projectId) &&
    isValidSnapshotDate(value.date) &&
    isValidProgress(value.progress)
  );
};

export const validNewsCategories: NewsCategory[] = [
  'Development',
  'Site',
  'Design',
  'Infrastructure',
  'Milestone',
  'Operations',
  'Announcement',
];
export const validNewsCadences: NewsCadence[] = ['daily', 'weekly', 'milestone'];
export const validNewsStatuses: NewsStatus[] = ['draft', 'published', 'archived'];
const validNewsSourceTypes: NewsSourceType[] = ['manual', 'n8n'];

const isValidNewsArticle = (value: unknown, projectIds: Set<string>): value is NewsArticle => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    value.id.trim().length > 0 &&
    isString(value.projectId) &&
    projectIds.has(value.projectId) &&
    isString(value.slug) &&
    value.slug.trim().length > 0 &&
    isString(value.title) &&
    value.title.trim().length > 0 &&
    isString(value.excerpt) &&
    isString(value.body) &&
    validNewsCategories.includes(value.category as NewsCategory) &&
    validNewsCadences.includes(value.cadence as NewsCadence) &&
    validNewsStatuses.includes(value.status as NewsStatus) &&
    isString(value.image) &&
    typeof value.featured === 'boolean' &&
    validNewsSourceTypes.includes(value.sourceType as NewsSourceType) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

export const compareSnapshots = (a: ProgressSnapshot, b: ProgressSnapshot): number => {
  const timeA = Date.parse(a.date);
  const timeB = Date.parse(b.date);
  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }
  const cmp = a.date.localeCompare(b.date);
  if (cmp !== 0) return cmp;
  return a.id.localeCompare(b.id);
};

const mapProjectId = (id: string) => legacyProjectIdMap[id] ?? id;
const remapProjectRecords = (value: unknown) => Array.isArray(value)
  ? value.map((record) => isRecord(record) && isString(record.projectId) ? { ...record, projectId: mapProjectId(record.projectId) } : record)
  : value;

const migratePortalDatabase = (stored: Partial<PortalDatabase>): PortalDatabase => {
  const seedProjects = portalDb.projects;
  const storedProjects = Array.isArray(stored.projects) ? stored.projects : [];
  const projects = seedProjects.map((seedProject) => {
    const saved = storedProjects.find((project) => project?.id === seedProject.id);
    return saved ? normalizeProject(saved, seedProject) ?? seedProject : seedProject;
  });

  storedProjects.filter((project) => isRuntimeProjectId(project?.id)).forEach((project) => {
    const normalized = normalizeProject(project);
    if (normalized) projects.push(normalized);
  });

  const projectIds = new Set(projects.map((project) => project.id));
  const userIds = new Set(inMemoryUsers.map((user) => user.id));

  const storedNotifications = Array.isArray(stored.notifications)
    ? stored.notifications.map((notification) => isRecord(notification) ? { ...notification, ...(isString(notification.userId) ? { userId: legacyUserIdMap[notification.userId] ?? notification.userId } : {}), ...(isString(notification.projectId) ? { projectId: mapProjectId(notification.projectId) } : {}) } : notification)
    : stored.notifications;

  const rawSnapshots = remapProjectRecords(stored.progressSnapshots);
  const seedSnapshots = portalDb.progressSnapshots ?? [];
  const progressSnapshots = mergeRecords(
    seedSnapshots,
    rawSnapshots,
    (record) => record.id,
    (value): value is ProgressSnapshot => isValidProgressSnapshot(value, projectIds),
  ).sort(compareSnapshots);

  const rawNews = remapProjectRecords(stored.news);
  const seedNews = portalDb.news ?? [];
  const news = mergeRecords(
    seedNews,
    rawNews,
    (record) => record.id,
    (value): value is NewsArticle => isValidNewsArticle(value, projectIds),
  ).map((article) => (
    article.image === '/projects/waldorf-astoria/garnier-cover.webp'
      ? { ...article, image: '/projects/waldorf-astoria/garnier-cover.jpg' }
      : article
  ));

  return {
    schemaVersion: PORTAL_SCHEMA_VERSION,
    users: [...inMemoryUsers],
    projects,
    updates: mergeRecords(portalDb.updates, remapProjectRecords(stored.updates), (record) => `${record.projectId}:${record.date}:${record.title}`, (value): value is ProjectUpdate => isValidProjectUpdate(value, projectIds)),
    milestones: mergeRecords(portalDb.milestones, remapProjectRecords(stored.milestones), (record) => `${record.projectId}:${record.label}`, (value): value is ProjectMilestone => isValidProjectMilestone(value, projectIds)),
    documents: mergeRecords(portalDb.documents, remapProjectRecords(stored.documents), (record) => `${record.projectId}:${record.name}`, (value): value is ProjectDocument => isValidProjectDocument(value, projectIds)),
    approvals: mergeRecords(portalDb.approvals, remapProjectRecords(stored.approvals), (record) => `${record.projectId}:${record.title}`, (value): value is ProjectApproval => isValidProjectApproval(value, projectIds)),
    notifications: mergeRecords(portalDb.notifications, storedNotifications, (record) => `${record.userId}:${record.projectId}:${record.message}:${record.date}`, (value): value is PortalDatabase['notifications'][number] => isValidNotification(value, projectIds, userIds)),
    progressSnapshots,
    news,
  };
};

const isPortalStateRoot = (value: unknown): value is Partial<PortalDatabase> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const serializePortalStateForStorage = (state: PortalDatabase): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { users: _users, ...persistedState } = state;
  return JSON.stringify(persistedState);
};

const readPortalDatabase = (): PortalDatabase => {
  if (typeof window === 'undefined') return { ...portalDb, users: [...inMemoryUsers] };

  if (volatilePortalDatabase) {
    const current = volatilePortalDatabase;
    try {
      window.localStorage.setItem(PORTAL_STATE_KEY, serializePortalStateForStorage(current));
      volatilePortalDatabase = null;
    } catch {
      return { ...current, users: [...inMemoryUsers] };
    }
    return { ...current, users: [...inMemoryUsers] };
  }

  let stored: Partial<PortalDatabase> = {};
  try {
    const raw = window.localStorage.getItem(PORTAL_STATE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (isPortalStateRoot(parsed)) stored = parsed;
  } catch {
    stored = {};
  }

  let next: PortalDatabase;
  try {
    next = migratePortalDatabase(stored);
  } catch {
    next = migratePortalDatabase({});
  }

  try {
    window.localStorage.setItem(PORTAL_STATE_KEY, serializePortalStateForStorage(next));
  } catch {
    volatilePortalDatabase = next;
  }
  return { ...next, users: [...inMemoryUsers] };
};

const writePortalDatabase = (next: PortalDatabase) => {
  if (typeof window === 'undefined') return { ...next, users: [...inMemoryUsers] };
  try {
    window.localStorage.setItem(PORTAL_STATE_KEY, serializePortalStateForStorage(next));
    volatilePortalDatabase = null;
  } catch {
    volatilePortalDatabase = next;
  }
  return { ...next, users: [...inMemoryUsers] };
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

export const updatePortalDatabase = (mutate: (current: PortalDatabase) => PortalDatabase) => {
  const mutated = mutate(readPortalDatabase());
  if (mutated.users) {
    inMemoryUsers = [...mutated.users];
  }
  return writePortalDatabase(mutated);
};
export const updatePortalProject = (id: string, changes: Partial<PortalProjectRecord>) => updatePortalDatabase((current) => ({ ...current, projects: current.projects.map((project) => project.id === id ? { ...project, ...changes } : project) }));
export const updatePortalApproval = (projectId: string, title: string, status: ProjectApproval['status']) => updatePortalDatabase((current) => ({ ...current, approvals: current.approvals.map((approval) => approval.projectId === projectId && approval.title === title ? { ...approval, status } : approval) }));
export const addPortalUpdate = (update: ProjectUpdate) => updatePortalDatabase((current) => ({ ...current, updates: [update, ...current.updates] }));
export const addPortalMilestone = (milestone: ProjectMilestone) => updatePortalDatabase((current) => ({ ...current, milestones: [...current.milestones, milestone] }));
export const addPortalDocument = (document: ProjectDocument) => updatePortalDatabase((current) => ({ ...current, documents: [...current.documents, document] }));
export const addPortalApproval = (approval: ProjectApproval) => updatePortalDatabase((current) => ({ ...current, approvals: [...current.approvals, approval] }));

export const updatePortalUser = (id: string, changes: Partial<PortalUser>) => {
  inMemoryUsers = inMemoryUsers.map((user) => (user.id === id ? { ...user, ...changes } : user));
  return inMemoryUsers.find((user) => user.id === id);
};

export const syncPortalProjects = (projects: PortalProjectRecord[]) => updatePortalDatabase((current) => ({ ...current, projects }));

export const syncPortalUsers = (users: PortalUser[], replaceAll = false) => {
  if (replaceAll) {
    inMemoryUsers = [...users];
  } else {
    const existingIds = new Set(users.map((u) => u.id));
    inMemoryUsers = [...inMemoryUsers.filter((u) => !existingIds.has(u.id)), ...users];
  }
};

export const resetPortalUsers = (users?: PortalUser[]) => {
  inMemoryUsers = users ? [...users] : portalDb.users.map((user) => ({ ...user, projectIds: [...user.projectIds] }));
};

export const removePortalUserInMemory = (id: string) => {
  inMemoryUsers = inMemoryUsers.filter((user) => user.id !== id);
};

export const syncPortalRelations = (
  relations: Partial<Pick<PortalDatabase, 'updates' | 'milestones' | 'documents' | 'approvals' | 'notifications' | 'progressSnapshots' | 'news'>>
) => updatePortalDatabase((current) => ({
  ...current,
  ...relations,
  ...(relations.progressSnapshots ? { progressSnapshots: relations.progressSnapshots } : {}),
  ...(relations.news ? { news: relations.news } : {}),
}));

export const syncPortalNews = (news: NewsArticle[]) =>
  updatePortalDatabase((current) => ({ ...current, news }));

const slugifyNewsTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'news-article';

export type CreateNewsInput = {
  projectId: string;
  title: string;
  excerpt?: string;
  body?: string;
  category?: NewsCategory;
  cadence?: NewsCadence;
  status?: NewsStatus;
  image?: string;
  featured?: boolean;
  sourceType?: NewsSourceType;
  sourceUrl?: string;
  sourceLabel?: string;
  slug?: string;
  publishedAt?: string;
  verifiedAt?: string;
};

export const createPortalNewsRecord = (input: CreateNewsInput, existingNews?: NewsArticle[]): NewsArticle => {
  const currentNews = existingNews ?? getPortalSnapshot().db.news ?? [];
  const baseSlug = input.slug?.trim() || slugifyNewsTitle(input.title);
  let slug = baseSlug;
  let counter = 1;
  while (currentNews.some((article) => article.slug === slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const now = new Date().toISOString();
  const id = createPortalRecordId('news');
  const isN8n = input.sourceType === 'n8n';
  const status: NewsStatus = isN8n
    ? (input.status === 'draft' || !input.status ? 'draft' : input.status)
    : (input.status ?? 'draft');

  return {
    id,
    projectId: input.projectId,
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || input.title.trim(),
    body: input.body?.trim() || '',
    category: input.category ?? 'Development',
    cadence: input.cadence ?? 'weekly',
    status,
    image: input.image?.trim() || '',
    featured: Boolean(input.featured),
    sourceType: input.sourceType ?? 'manual',
    sourceUrl: input.sourceUrl?.trim(),
    sourceLabel: input.sourceLabel?.trim(),
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? (input.publishedAt || now) : undefined,
    verifiedAt: input.verifiedAt,
  };
};

export const addPortalNews = (input: CreateNewsInput): NewsArticle => {
  const record = createPortalNewsRecord(input);
  updatePortalDatabase((current) => ({
    ...current,
    news: [...(current.news ?? []), record],
  }));
  return record;
};

export const updatePortalNewsRecord = (id: string, changes: Partial<NewsArticle>): NewsArticle | undefined => {
  let updated: NewsArticle | undefined;
  updatePortalDatabase((current) => {
    const list = current.news ?? [];
    const existing = list.find((item) => item.id === id);
    if (!existing) return current;
    const nextStatus = changes.status ?? existing.status;
    const now = new Date().toISOString();
    updated = {
      ...existing,
      ...changes,
      updatedAt: now,
      publishedAt:
        nextStatus === 'published'
          ? (changes.publishedAt ?? existing.publishedAt ?? now)
          : nextStatus === 'draft' || nextStatus === 'archived'
            ? (changes.publishedAt === undefined ? existing.publishedAt : changes.publishedAt)
            : existing.publishedAt,
    };
    return {
      ...current,
      news: list.map((item) => (item.id === id ? updated! : item)),
    };
  });
  return updated;
};

export const deletePortalNewsRecord = (id: string): boolean => {
  const exists = (getPortalSnapshot().db.news ?? []).some((item) => item.id === id);
  if (!exists) return false;
  updatePortalDatabase((current) => ({
    ...current,
    news: (current.news ?? []).filter((item) => item.id !== id),
  }));
  return true;
};

export type CreatePortalProjectInput = Pick<PortalProjectRecord, 'title' | 'category' | 'phase' | 'progress'> & Partial<Pick<PortalProjectRecord, 'code' | 'nextMilestone' | 'summary' | 'statement' | 'image' | 'market' | 'developmentType' | 'context' | 'scale' | 'longView' | 'published'>>;
export type CreatePortalUserInput = Pick<PortalUser, 'name' | 'email' | 'password'> & Partial<Pick<PortalUser, 'role' | 'status' | 'projectIds'>>;

export const createPortalRecordId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createPortalProjectRecord = (input: CreatePortalProjectInput): PortalProjectRecord => {
  const id = createPortalRecordId('admin-project');
  return {
    id,
    code: input.code?.trim() || `GA / ${String(getPortalSnapshot().projects.length + 1).padStart(2, '0')}`,
    title: input.title.trim(),
    category: input.category.trim(),
    phase: input.phase.trim(),
    progress: Math.max(0, Math.min(100, Number(input.progress))),
    nextMilestone: input.nextMilestone?.trim() || 'Project review to be scheduled',
    summary: input.summary?.trim() || 'Runtime development project created in the GARNIER ARCHITECTURE portal.',
    statement: input.statement?.trim() || 'A project record ready for coordinated development delivery.',
    image: input.image?.startsWith('/projects/') ? input.image : '',
    market: input.market?.trim() || 'Costa Rica',
    developmentType: input.developmentType?.trim() || input.category.trim(),
    context: input.context?.trim() || 'Portal project',
    scale: input.scale?.trim() || 'To be defined',
    published: input.published === true,
  };
};

export const createPortalProject = (input: CreatePortalProjectInput): PortalProject => {
  const project = createPortalProjectRecord(input);
  updatePortalDatabase((current) => ({ ...current, projects: [...current.projects, project] }));
  return getPortalSnapshot().projects.find((candidate) => candidate.id === project.id)!;
};

export const isCanonicalPortalProject = (id: string) => portalDb.projects.some((project) => project.id === id);

export const deletePortalProject = (id: string): boolean => {
  if (isCanonicalPortalProject(id)) return false;
  const exists = getPortalSnapshot().db.projects.some((project) => project.id === id);
  if (!exists) return false;
  updatePortalDatabase((current) => ({
    ...current,
    projects: current.projects.filter((project) => project.id !== id),
    updates: current.updates.filter((record) => record.projectId !== id),
    milestones: current.milestones.filter((record) => record.projectId !== id),
    documents: current.documents.filter((record) => record.projectId !== id),
    approvals: current.approvals.filter((record) => record.projectId !== id),
    notifications: current.notifications.filter((record) => record.projectId !== id),
    progressSnapshots: (current.progressSnapshots ?? []).filter((record) => record.projectId !== id),
    news: (current.news ?? []).filter((record) => record.projectId !== id),
  }));
  inMemoryUsers = inMemoryUsers.map((user) => ({ ...user, projectIds: user.projectIds.filter((projectId) => projectId !== id) }));
  return true;
};

export const createPortalUser = (input: CreatePortalUserInput): PortalUser => {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.password) throw new Error('Name, email and password are required.');
  if (inMemoryUsers.some((user) => user.email.toLowerCase() === email)) throw new Error('An account with this email already exists.');
  const user: PortalUser = {
    id: createPortalRecordId('portal-user'),
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role ?? 'client',
    status: input.status ?? 'active',
    projectIds: input.projectIds ?? [],
  };
  inMemoryUsers = [user, ...inMemoryUsers];
  return user;
};
export const getPortalUser = (email: string) => inMemoryUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

export const getPortalProject = (id: string) => getPortalSnapshot().projects.find((project) => project.id === id);

export const getPublicProjects = () => getPortalSnapshot().projects.filter((project) => project.published === true && !project.archived);
export const getPublicProject = (id: string) => getPublicProjects().find((project) => project.id === id);

export const getProjectsForUser = (userId: string) => {
  const snapshot = getPortalSnapshot();
  const user = inMemoryUsers.find((candidate) => candidate.id === userId);
  return snapshot.projects.filter((project) => !project.archived && user?.projectIds.includes(project.id));
};

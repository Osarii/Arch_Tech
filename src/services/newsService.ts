import {
  addPortalNews,
  createPortalNewsRecord,
  deletePortalNewsRecord,
  getPortalSnapshot,
  getPublicProjects,
  syncPortalNews,
  updatePortalNewsRecord,
  type CreateNewsInput,
  type NewsArticle,
  type PortalProjectRecord,
  type ProjectUpdate,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export type { CreateNewsInput, NewsArticle, NewsCategory, NewsCadence, NewsStatus, NewsSourceType } from '../portal/data';
const remoteEnabled = () => Boolean(getApiBaseUrl());
const articleTime = (article: NewsArticle) => Date.parse(article.publishedAt || article.createdAt) || 0;
export const compareNewsNewestFirst = (a: NewsArticle, b: NewsArticle) => articleTime(b) - articleTime(a) || a.id.localeCompare(b.id);

export const newsService = {
  isRemote: remoteEnabled,
  async list(): Promise<NewsArticle[]> {
    if (!remoteEnabled()) return [...(getPortalSnapshot().db.news ?? [])];
    try { const records = await apiClient.get<NewsArticle[]>('/news'); syncPortalNews(records); return records; } catch { return [...(getPortalSnapshot().db.news ?? [])]; }
  },
  async get(id: string) {
    if (!remoteEnabled()) return (getPortalSnapshot().db.news ?? []).find((item) => item.id === id);
    try { return await apiClient.get<NewsArticle>(`/news/${id}`); } catch { return (getPortalSnapshot().db.news ?? []).find((item) => item.id === id); }
  },
  async getBySlug(slug: string) { return (await this.list()).find((item) => item.slug === slug); },
  async listPublished(projectId?: string) { return (await this.list()).filter((item) => item.status === 'published' && (!projectId || item.projectId === projectId)).sort(compareNewsNewestFirst); },
  async listByProject(projectId: string) { return (await this.list()).filter((item) => item.projectId === projectId).sort(compareNewsNewestFirst); },
  async listFeatured() { return (await this.list()).filter((item) => item.status === 'published' && item.featured).sort(compareNewsNewestFirst); },
  async create(input: CreateNewsInput) {
    if (!remoteEnabled()) return addPortalNews(input);
    const record = createPortalNewsRecord(input, await this.list());
    await apiClient.post<NewsArticle>('/news', record);
    return (await this.list()).find((item) => item.id === record.id) ?? record;
  },
  async update(id: string, changes: Partial<NewsArticle>) {
    if (!remoteEnabled()) return updatePortalNewsRecord(id, changes);
    const payload: Partial<NewsArticle> = { ...changes, updatedAt: new Date().toISOString() };
    if (changes.status === 'published' && !changes.publishedAt) payload.publishedAt = (await this.get(id))?.publishedAt || new Date().toISOString();
    await apiClient.patch<NewsArticle>(`/news/${id}`, payload);
    return (await this.list()).find((item) => item.id === id);
  },
  async publish(id: string) { const current = await this.get(id); return this.update(id, { status: 'published', publishedAt: current?.publishedAt || new Date().toISOString() }); },
  async unpublish(id: string) { return this.update(id, { status: 'draft' }); },
  async archive(id: string) { return this.update(id, { status: 'archived' }); },
  async remove(id: string) {
    if (!remoteEnabled()) return deletePortalNewsRecord(id);
    try { await apiClient.delete(`/news/${id}`); await this.list(); return true; } catch { return deletePortalNewsRecord(id); }
  },
};

export const getPublicNews = (projectId?: string) => (getPortalSnapshot().db.news ?? []).filter((item) => item.status === 'published' && (!projectId || item.projectId === projectId)).sort(compareNewsNewestFirst);
export const getFeaturedNews = () => getPublicNews().filter((item) => item.featured);
export const getNewsBySlug = (slug: string) => getPublicNews().find((item) => item.slug === slug);
export const getLatestPublishedNews = (limit = 4) => getPublicNews().slice(0, limit);

export type PublicNewsUpdate = ProjectUpdate & { id: string; slug?: string; category?: string; projectTitle: string; projectCategory: string; image: string };
const formatDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
export const getPublicNewsUpdates = (projectId?: string): PublicNewsUpdate[] => {
  const projects = new Map(getPublicProjects().map((project) => [project.id, project]));
  const articles = getPublicNews(projectId);
  if (articles.length) return articles.flatMap((article) => { const project = projects.get(article.projectId); return project ? [{ id: article.id, slug: article.slug, projectId: article.projectId, date: formatDate(article.publishedAt || article.createdAt), title: article.title, body: article.body || article.excerpt, category: article.category, projectTitle: project.title, projectCategory: project.category, image: article.image || project.image }] : []; });
  return (getPortalSnapshot().db.updates ?? []).filter((update) => !projectId || update.projectId === projectId).map((update) => { const project = projects.get(update.projectId); return project ? { ...update, id: `${update.projectId}-${update.date}-${update.title}`, projectTitle: project.title, projectCategory: project.category, image: project.image } : null; }).filter((update): update is PublicNewsUpdate => update !== null);
};
export const getPublicNewsUpdate = (id: string) => getPublicNewsUpdates().find((update) => update.id === id || update.slug === id);
export const getNewsProject = (projectId: string): PortalProjectRecord | undefined => getPublicProjects().find((project) => project.id === projectId);
export const newsUpdatePath = (update: { id: string; slug?: string }) => `/news/${encodeURIComponent(update.slug || update.id)}`;

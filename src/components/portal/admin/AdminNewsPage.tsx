import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Archive,
  Bot,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  getPortalSnapshot,
  validNewsCadences,
  validNewsCategories,
  validNewsStatuses,
  type CreateNewsInput,
  type NewsArticle,
  type NewsCadence,
  type NewsCategory,
  type NewsSourceType,
  type NewsStatus,
} from '../../../portal/data';
import { newsService } from '../../../services/newsService';
import { NavigationProps, PortalEmptyState } from '../PortalCommon';
import { useLocale } from '../../../portal/locale';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useTranslation } from 'react-i18next';

interface NewsModalProps {
  open: boolean;
  article?: NewsArticle | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const NewsEditModal: React.FC<NewsModalProps> = ({
  open,
  article,
  onClose,
  onSaved,
  triggerRef,
}) => {
  const { t } = useTranslation('admin');
  const isEditing = Boolean(article);
  const snapshot = getPortalSnapshot();
  const activeProjects = snapshot.projects.filter((p) => !p.archived);

  const [projectId, setProjectId] = useState(article?.projectId ?? activeProjects[0]?.id ?? '');
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [category, setCategory] = useState<NewsCategory>(article?.category ?? 'Development');
  const [cadence, setCadence] = useState<NewsCadence>(article?.cadence ?? 'weekly');
  const [status, setStatus] = useState<NewsStatus>(article?.status ?? 'draft');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [image, setImage] = useState(article?.image ?? '');
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [sourceType, setSourceType] = useState<NewsSourceType>(article?.sourceType ?? 'manual');
  const [sourceUrl, setSourceUrl] = useState(article?.sourceUrl ?? '');
  const [sourceLabel, setSourceLabel] = useState(article?.sourceLabel ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      if (article) {
        setProjectId(article.projectId);
        setTitle(article.title);
        setSlug(article.slug);
        setCategory(article.category);
        setCadence(article.cadence);
        setStatus(article.status);
        setExcerpt(article.excerpt);
        setBody(article.body);
        setImage(article.image);
        setFeatured(article.featured);
        setSourceType(article.sourceType);
        setSourceUrl(article.sourceUrl ?? '');
        setSourceLabel(article.sourceLabel ?? '');
      } else {
        setProjectId(activeProjects[0]?.id ?? '');
        setTitle('');
        setSlug('');
        setCategory('Development');
        setCadence('weekly');
        setStatus('draft');
        setExcerpt('');
        setBody('');
        setImage('');
        setFeatured(false);
        setSourceType('manual');
        setSourceUrl('');
        setSourceLabel('Garnier Architecture Editorial');
      }
      setError('');
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [open, article]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }
    if (!projectId) {
      setError('Project selection is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const input: CreateNewsInput = {
        projectId,
        title: title.trim(),
        slug: slug.trim() || undefined,
        category,
        cadence,
        status,
        excerpt: excerpt.trim() || title.trim(),
        body: body.trim(),
        image: image.trim(),
        featured,
        sourceType,
        sourceUrl: sourceUrl.trim() || undefined,
        sourceLabel: sourceLabel.trim() || undefined,
      };

      if (isEditing && article) {
        await newsService.update(article.id, input);
        onSaved(`Article "${title}" updated successfully.`);
      } else {
        await newsService.create(input);
        onSaved(`Article "${title}" created successfully.`);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setSaving(false);
      triggerRef?.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="portal-surface flex max-h-[90vh] w-full max-w-2xl flex-col border border-black/20 bg-[#f4efe8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/15 px-6 py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500">{t('newsDeskEyebrow', 'Editorial News Desk')}</p>
            <h2 id={titleId} className="font-serif text-2xl font-light">
              {isEditing ? t('editNewsArticle', 'Edit News Article') : t('draftNewArticle', 'Draft New Article')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeModal', 'Close modal')}
            className="rounded p-1 text-stone-500 hover:text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          <p id={descId} className="sr-only">
            {t('fillNewsArticleDesc', 'Fill in the news article metadata, project link, and content.')}
          </p>

          {error && (
            <div role="alert" className="border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">
                {t('linkedProject', 'Linked Project *')}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
                required
              >
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} — {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('category', 'Category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              >
                {validNewsCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('titleRequired', 'Title *')}</label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder', 'e.g. Zona Franca La Lima Announces Phase 4 Expansion')}
              className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-sm focus:border-black focus:outline-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">
                {t('customSlugOptional', 'Custom Slug (Optional)')}
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t('autoGenerated', 'auto-generated')}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs font-mono focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('cadence', 'Cadence')}</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as NewsCadence)}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              >
                {validNewsCadences.map((cad) => (
                  <option key={cad} value={cad}>
                    {cad.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('status', 'Status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NewsStatus)}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              >
                {validNewsStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('excerpt', 'Excerpt')}</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder={t('excerptPlaceholder', 'Brief summary shown in feeds and cards...')}
              className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('body', 'Body')}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={t('bodyPlaceholder', 'Full article content or telemetry details...')}
              className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">
                {t('imageAssetPath', 'Image Asset Path')}
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/projects/zona-franca-la-lima/garnier-cover.webp"
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs font-mono focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('sourceType', 'Source Type')}</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as NewsSourceType)}
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              >
                <option value="manual">{t('manualEditorial', 'Manual Editorial')}</option>
                <option value="n8n">{t('n8nAutomationPipeline', 'n8n Automation Pipeline')}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">
                {t('sourceLabel', 'Source Label')}
              </label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. n8n Telemetry Ingest"
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600">{t('sourceUrl', 'Source URL')}</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full border border-black/20 bg-white/80 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured-checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 border-black/30"
            />
            <label htmlFor="featured-checkbox" className="font-mono text-xs text-stone-700">
              {t('featuredNewsItem', 'Featured news item (promoted on public showcase)')}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-black/15 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="border border-black/20 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-black/5"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#171714] px-5 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? t('saving', 'Saving...') : isEditing ? t('updateArticle', 'Update Article') : t('createArticle', 'Create Article')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminNewsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('admin');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const [articles, setArticles] = useState<NewsArticle[]>(() => getPortalSnapshot().db.news ?? []);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cadenceFilter, setCadenceFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [feedback, setFeedback] = useState('');
  const createTriggerRef = useRef<HTMLButtonElement>(null);

  const snapshot = getPortalSnapshot();
  const projectsById = new Map(snapshot.projects.map((p) => [p.id, p]));

  const refresh = async () => {
    const list = await newsService.list();
    setArticles(list);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleTogglePublish = async (article: NewsArticle) => {
    if (article.status === 'published') {
      await newsService.unpublish(article.id);
      setFeedback(`Article "${article.title}" reverted to draft.`);
    } else {
      await newsService.publish(article.id);
      setFeedback(`Article "${article.title}" published successfully.`);
    }
    await refresh();
  };

  const handleArchive = async (article: NewsArticle) => {
    await newsService.archive(article.id);
    setFeedback(`Article "${article.title}" archived.`);
    await refresh();
  };

  const handleDelete = async (article: NewsArticle) => {
    if (!window.confirm(`Are you sure you want to delete "${article.title}"?`)) return;
    await newsService.remove(article.id);
    setFeedback(`Article "${article.title}" deleted.`);
    await refresh();
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredArticles = articles.filter((article) => {
    const project = projectsById.get(article.projectId);
    const matchesSearch =
      !normalizedSearch ||
      [article.title, article.excerpt, article.slug, article.category, project?.title ?? '', article.sourceLabel ?? '']
        .some((val) => val.toLowerCase().includes(normalizedSearch));

    const matchesProject = projectFilter === 'all' || article.projectId === projectFilter;
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    const matchesCadence = cadenceFilter === 'all' || article.cadence === cadenceFilter;
    const matchesSource = sourceFilter === 'all' || article.sourceType === sourceFilter;

    return matchesSearch && matchesProject && matchesCategory && matchesStatus && matchesCadence && matchesSource;
  });

  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const n8nCount = articles.filter((a) => a.sourceType === 'n8n').length;
  const featuredCount = articles.filter((a) => a.featured && a.status === 'published').length;

  const content = (
    <div className="space-y-10">
      {/* Header section */}
      <div className="border-b border-black/15 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {adminPortal.newsEyebrow}
            </p>
            <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
              {adminPortal.newsHeading}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
              {adminPortal.newsSubtitle}
            </p>
          </div>
          <button
            ref={createTriggerRef}
            onClick={() => {
              setEditingArticle(null);
              setModalOpen(true);
              setFeedback('');
            }}
            className="flex items-center gap-2 bg-[#171714] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            {t('newArticle', 'New article')}
          </button>
        </div>
        {feedback && (
          <p role="status" className="mt-4 text-sm text-stone-600">
            {feedback}
          </p>
        )}
      </div>

      {/* KPI Overview Strip */}
      <section className="admin-kpi-strip grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('newsRegistryMetrics', 'News registry metrics')}>
        <div className="admin-overview-tile p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('publishedNews', 'Published News')}</p>
          <p className="mt-2 font-serif text-4xl font-light">{publishedCount}</p>
          <p className="mt-1 font-mono text-[9px] text-stone-600">
            {t('featuredOnShowcase', '{{count}} featured on showcase', { count: featuredCount })}
          </p>
        </div>
        <div className="admin-overview-tile p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('draftRegister', 'Draft Register')}</p>
          <p className="mt-2 font-serif text-4xl font-light">{draftCount}</p>
          <p className="mt-1 font-mono text-[9px] text-stone-600">{t('pendingReviewPublication', 'Pending review / publication')}</p>
        </div>
        <div className="admin-overview-tile p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('n8nIngests', 'n8n Ingests')}</p>
          <p className="mt-2 font-serif text-4xl font-light">{n8nCount}</p>
          <p className="mt-1 font-mono text-[9px] text-stone-600">{t('automatedDroneSiteFeeds', 'Automated drone & site feeds')}</p>
        </div>
        <div className="admin-overview-tile p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('totalItems', 'Total Items')}</p>
          <p className="mt-2 font-serif text-4xl font-light">{articles.length}</p>
          <p className="mt-1 font-mono text-[9px] text-stone-600">
            {t('acrossDevelopments', 'Across {{count}} developments', { count: snapshot.projects.length })}
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <section aria-label={t('articleFilterControls', 'Article filter controls')}>
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">{t('articlesTelemetry', 'Articles & Telemetry')}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {t('showingNewsItems', 'Showing {{filtered}} of {{total}} news items', {
                filtered: filteredArticles.length,
                total: articles.length,
              })}
            </p>
          </div>
        </div>

        <div className="portal-register-toolbar mb-7 grid gap-3 border-y border-black/15 py-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchNewsPlaceholder', 'Search news, slugs, projects...')}
              aria-label={t('searchNews', 'Search news')}
              className="w-full border border-black/15 bg-white/50 py-2 pl-9 pr-3 text-xs placeholder:text-stone-400 focus:border-black focus:outline-none"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label={t('filterByProject', 'Filter by project')}
            className="border border-black/15 bg-white/50 px-3 py-2 text-xs focus:border-black focus:outline-none"
          >
            <option value="all">{t('allDevelopments', 'All developments')}</option>
            {snapshot.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t('filterByCategory', 'Filter by category')}
            className="border border-black/15 bg-white/50 px-3 py-2 text-xs focus:border-black focus:outline-none"
          >
            <option value="all">{t('allCategories', 'All categories')}</option>
            {validNewsCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('filterByStatus', 'Filter by status')}
            className="border border-black/15 bg-white/50 px-3 py-2 text-xs focus:border-black focus:outline-none"
          >
            <option value="all">{t('allStatuses', 'All statuses')}</option>
            <option value="published">{t('published', 'Published')}</option>
            <option value="draft">{t('draft', 'Draft')}</option>
            <option value="archived">{t('archived', 'Archived')}</option>
          </select>

          <select
            value={cadenceFilter}
            onChange={(e) => setCadenceFilter(e.target.value)}
            aria-label={t('filterByCadence', 'Filter by cadence')}
            className="border border-black/15 bg-white/50 px-3 py-2 text-xs focus:border-black focus:outline-none"
          >
            <option value="all">{t('allCadences', 'All cadences')}</option>
            {validNewsCadences.map((cad) => (
              <option key={cad} value={cad}>
                {cad.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label={t('filterBySource', 'Filter by source')}
            className="border border-black/15 bg-white/50 px-3 py-2 text-xs focus:border-black focus:outline-none"
          >
            <option value="all">{t('allSources', 'All sources')}</option>
            <option value="manual">{t('manualEditorial', 'Manual editorial')}</option>
            <option value="n8n">{t('n8nAutomation', 'n8n Automation')}</option>
          </select>
        </div>

        {/* Table / Article List */}
        {filteredArticles.length === 0 ? (
          <PortalEmptyState message={t('noNewsFound', 'No news articles found. No articles match your active search or filter criteria.')} />
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const project = projectsById.get(article.projectId);
              const isN8n = article.sourceType === 'n8n';

              return (
                <div
                  key={article.id}
                  className="group flex flex-col justify-between gap-4 border border-black/15 bg-white/30 p-5 transition-colors hover:bg-white/60 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
                        {project?.code ?? 'GA'} // {project?.title ?? article.projectId}
                      </span>
                      <span className="font-mono text-[9px] uppercase text-stone-400">·</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${
                          article.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-800'
                            : article.status === 'draft'
                              ? 'bg-amber-500/20 text-amber-800'
                              : 'bg-stone-500/20 text-stone-700'
                        }`}
                      >
                        {article.status}
                      </span>
                      <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[8px] uppercase text-stone-600">
                        {article.category}
                      </span>
                      <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[8px] uppercase text-stone-600">
                        {article.cadence}
                      </span>
                      {article.featured && (
                        <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[8px] uppercase text-amber-900">
                          <Star className="h-2.5 w-2.5 fill-amber-700 text-amber-700" /> {t('featured', 'Featured')}
                        </span>
                      )}
                      {isN8n && (
                        <span className="flex items-center gap-1 rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[8px] uppercase text-indigo-900">
                          <Bot className="h-2.5 w-2.5" /> {t('n8nTelemetry', 'n8n telemetry')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-normal leading-snug">{article.title}</h3>
                    <p className="line-clamp-2 text-xs text-stone-600">{article.excerpt}</p>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] text-stone-500">
                      <span>{t('slugPrefix', 'Slug: /')}{article.slug}</span>
                      {article.sourceLabel && <span>{t('sourcePrefix', 'Source:')} {article.sourceLabel}</span>}
                      {article.publishedAt && <span>{t('publishedPrefix', 'Published:')} {new Date(article.publishedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArticle(article);
                          setModalOpen(true);
                          setFeedback('');
                        }}
                        className="flex items-center gap-1 border border-black/15 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-700 hover:bg-black hover:text-white"
                        aria-label={t('editArticleAria', 'Edit {{title}}', { title: article.title })}
                      >
                        <Edit3 className="h-3 w-3" /> {t('edit', 'Edit')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(article)}
                        className={`flex items-center gap-1 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                          article.status === 'published'
                            ? 'border-amber-600/30 bg-amber-50 text-amber-800 hover:bg-amber-800 hover:text-white'
                            : 'border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white'
                        }`}
                        aria-label={article.status === 'published' ? t('unpublishArticleAria', 'Unpublish {{title}}', { title: article.title }) : t('publishArticleAria', 'Publish {{title}}', { title: article.title })}
                      >
                        {article.status === 'published' ? (
                          <>
                            <EyeOff className="h-3 w-3" /> {t('unpublish', 'Unpublish')}
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> {t('publish', 'Publish')}
                          </>
                        )}
                      </button>

                      {article.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(article)}
                          className="flex items-center gap-1 border border-black/15 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600 hover:bg-stone-700 hover:text-white"
                          aria-label={t('archiveArticleAria', 'Archive {{title}}', { title: article.title })}
                        >
                          <Archive className="h-3 w-3" /> {t('archive', 'Archive')}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(article)}
                        className="flex items-center gap-1 border border-red-500/20 bg-red-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white"
                        aria-label={t('deleteArticleAria', 'Delete {{title}}', { title: article.title })}
                      >
                        <Trash2 className="h-3 w-3" /> {t('delete', 'Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create / Edit Modal */}
      <NewsEditModal
        open={modalOpen}
        article={editingArticle}
        onClose={() => setModalOpen(false)}
        onSaved={(msg) => {
          setFeedback(msg);
          void refresh();
        }}
        triggerRef={createTriggerRef}
      />
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role="admin" onNavigate={navigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

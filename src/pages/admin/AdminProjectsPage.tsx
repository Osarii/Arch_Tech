import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPortalSnapshot } from '../../portal/data';
import { useLocale } from '../../portal/locale';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import {
  CreateProjectModal,
  NavigationProps,
  PortalEmptyState,
  ProjectRows,
} from '../../components/portal/PortalCommon';
import { PortalShell, usePortalShell } from '../../components/portal/PortalShell';

export const AdminProjectsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { t } = useTranslation('admin');
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const { adminPortal } = useLocale();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [createOpen, setCreateOpen] = useState(false);
  const [operationFeedback, setOperationFeedback] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectSort, setProjectSort] = useState<'name' | 'progress-desc' | 'progress-asc' | 'phase'>('name');
  const createTriggerRef = useRef<HTMLButtonElement>(null);

  const { projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);
  const projectPhases = Array.from(new Set(activeProjects.map((project) => project.phase))).sort((a, b) =>
    a.localeCompare(b),
  );

  const normalizedSearch = projectSearch.trim().toLowerCase();
  const filteredProjects = activeProjects
    .filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        [project.title, project.code, project.category, project.phase].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      const matchesFilter =
        projectFilter === 'all' ||
        (projectFilter === 'pending'
          ? project.approvals.some((approval) => approval.status === 'Pending')
          : project.phase === projectFilter);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (projectSort === 'progress-desc') return b.progress - a.progress || a.title.localeCompare(b.title);
      if (projectSort === 'progress-asc') return a.progress - b.progress || a.title.localeCompare(b.title);
      if (projectSort === 'phase') return a.phase.localeCompare(b.phase) || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });

  const filtersActive = Boolean(projectSearch.trim()) || projectFilter !== 'all' || projectSort !== 'name';
  const clearProjectFilters = () => {
    setProjectSearch('');
    setProjectFilter('all');
    setProjectSort('name');
  };

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const content = (
    <div className="space-y-10">
      <div className="border-b border-black/15 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {adminPortal.projectsEyebrow}
            </p>
            <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
              {adminPortal.projectsHeading}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
              {adminPortal.projectsSubtitle}
            </p>
          </div>
          <button
            ref={createTriggerRef}
            onClick={() => {
              setCreateOpen(true);
              setOperationFeedback('');
            }}
            className="admin-primary-action group flex items-center justify-between gap-2.5 rounded-xs border border-black/20 bg-black px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-all duration-150 hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)]"
          >
            <span>{adminPortal.createNewProject}</span>
            <Plus className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>
        {operationFeedback && (
          <p role="status" className="mt-4 text-sm text-stone-600">
            {operationFeedback}
          </p>
        )}
      </div>

      <section id="portal-section-projects" aria-label={t('projectPortfolioRegister', 'Project portfolio register')}>
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {t('allProjectsAssignments', 'All projects / assignments')}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {t('showingActiveProjects', '{{filtered}} of {{total}} active projects', {
                filtered: filteredProjects.length,
                total: activeProjects.length,
              })}
            </p>
          </div>
          <span className="font-mono text-[10px] text-stone-500">
            {activeProjects.length.toString().padStart(2, '0')} {t('active', 'active')}
          </span>
        </div>

        {/* Search, Filter, Sort Toolbar */}
        <div
          className="portal-register-toolbar mb-7 grid gap-3 border-y border-[var(--portal-border)] py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
          role="search"
          aria-label={t('filterProjectRegister', 'Filter project register')}
        >
          <label className="sr-only" htmlFor="admin-project-search">
            {t('searchProjects', 'Search projects')}
          </label>
          <input
            id="admin-project-search"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder={t('searchPlaceholder', 'Search title, code, category or phase')}
            className="min-w-0 border-b border-[var(--portal-border)] bg-transparent px-0 py-2 text-sm text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-muted)] focus:border-[var(--portal-accent)] transition-colors"
          />

          <label className="sr-only" htmlFor="admin-project-filter">
            {t('filterProjects', 'Filter projects')}
          </label>
          <select
            id="admin-project-filter"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="rounded-xs border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors focus:border-[var(--portal-accent)]"
          >
            <option value="all">{t('allProjects', 'All projects')}</option>
            <option value="pending">{t('pendingApproval', 'Pending approval')}</option>
            {projectPhases.map((phaseOption) => (
              <option key={phaseOption} value={phaseOption}>
                {phaseOption}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="admin-project-sort">
            {t('sortProjects', 'Sort projects')}
          </label>
          <select
            id="admin-project-sort"
            value={projectSort}
            onChange={(event) => setProjectSort(event.target.value as typeof projectSort)}
            className="rounded-xs border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors focus:border-[var(--portal-accent)]"
          >
            <option value="name">{t('sortName', 'Name A–Z')}</option>
            <option value="progress-desc">{t('sortProgressDesc', 'Progress high → low')}</option>
            <option value="progress-asc">{t('sortProgressAsc', 'Progress low → high')}</option>
            <option value="phase">{t('sortPhase', 'Phase')}</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearProjectFilters}
              className="rounded-xs border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--portal-surface-raised)] hover:border-[var(--portal-border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)]"
            >
              {t('clearFilters', 'Clear filters')}
            </button>
          )}
        </div>

        {filteredProjects.length ? (
          <ProjectRows
            projects={filteredProjects}
            onNavigate={navigate}
            onOpenWorkspace={() => navigate('/workspace')}
            detailPath={(id) => `/admin/projects/${id}`}
          />
        ) : (
          <PortalEmptyState message={t('noProjectsMatch', 'No projects match the current search and filters.')} />
        )}
      </section>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(feedback) => {
          refresh();
          setOperationFeedback(feedback);
        }}
        triggerRef={createTriggerRef}
      />
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role="admin" onNavigate={onNavigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

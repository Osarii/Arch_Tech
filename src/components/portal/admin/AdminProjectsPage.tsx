import React, { useEffect, useRef, useState } from 'react';
import { getPortalSnapshot } from '../../../portal/data';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import {
  CreateProjectModal,
  NavigationProps,
  PortalEmptyState,
  ProjectRows,
} from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const AdminProjectsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
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
            className="bg-[#171714] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-stone-800"
          >
            {adminPortal.createNewProject}
          </button>
        </div>
        {operationFeedback && (
          <p role="status" className="mt-4 text-sm text-stone-600">
            {operationFeedback}
          </p>
        )}
      </div>

      <section id="portal-section-projects" aria-label="Project portfolio register">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
              All projects / assignments
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {filteredProjects.length} of {activeProjects.length} active projects
            </p>
          </div>
          <span className="font-mono text-[10px] text-stone-500">
            {activeProjects.length.toString().padStart(2, '0')} active
          </span>
        </div>

        {/* Search, Filter, Sort Toolbar */}
        <div
          className="portal-register-toolbar mb-7 grid gap-3 border-y border-black/15 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
          role="search"
          aria-label="Filter project register"
        >
          <label className="sr-only" htmlFor="admin-project-search">
            Search projects
          </label>
          <input
            id="admin-project-search"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Search title, code, category or phase"
            className="min-w-0 border-b border-black/20 bg-transparent px-0 py-2 text-sm outline-none placeholder:text-stone-500 focus:border-black"
          />

          <label className="sr-only" htmlFor="admin-project-filter">
            Filter projects
          </label>
          <select
            id="admin-project-filter"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="border border-black/20 bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] outline-none"
          >
            <option value="all">All projects</option>
            <option value="pending">Pending approval</option>
            {projectPhases.map((phaseOption) => (
              <option key={phaseOption} value={phaseOption}>
                {phaseOption}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="admin-project-sort">
            Sort projects
          </label>
          <select
            id="admin-project-sort"
            value={projectSort}
            onChange={(event) => setProjectSort(event.target.value as typeof projectSort)}
            className="border border-black/20 bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] outline-none"
          >
            <option value="name">Name A–Z</option>
            <option value="progress-desc">Progress high → low</option>
            <option value="progress-asc">Progress low → high</option>
            <option value="phase">Phase</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearProjectFilters}
              className="border border-black/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
            >
              Clear filters
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
          <PortalEmptyState message="No projects match the current search and filters." />
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

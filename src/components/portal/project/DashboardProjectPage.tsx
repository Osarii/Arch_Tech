import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, FileText } from 'lucide-react';
import {
  getPortalSnapshot,
  getPortalUser,
  getProjectsForUser,
  PortalRole,
  ProjectApproval,
} from '../../../portal/data';
import { portalAuth } from '../../../portal/demoAuth';
import { automationService } from '../../../services/automationService';
import { projectService } from '../../../services/projectService';
import { projectWorkflowService } from '../../../services/projectWorkflowService';
import { userService } from '../../../services/userService';
import {
  formatPortalDate,
  NavigationProps,
  NotFoundPage,
  PortalEmptyState,
  portalStatusClass,
  ProjectNavigation,
  ProjectOverview,
} from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';
import { useLocale } from '../../../portal/locale';

export interface DashboardProjectPageProps extends Partial<NavigationProps> {
  projectId: string;
  onOpenWorkspace?: () => void;
  onSignOut?: () => void;
  homePath?: string;
  role?: PortalRole;
}

export const DashboardProjectPage: React.FC<DashboardProjectPageProps> = ({
  projectId,
  onNavigate,
  onOpenWorkspace,
  onSignOut,
  homePath = '/dashboard',
  role = 'client',
}) => {
  const { portalCommon } = useLocale();
  const { insideShell, navigate: shellNavigate } = usePortalShell();
  const navigate = onNavigate ?? shellNavigate;
  const handleOpenWorkspace = onOpenWorkspace ?? (() => navigate('/workspace'));

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [activeTab, setActiveTab] = useState('Overview');
  const [progress, setProgress] = useState('');
  const [progressError, setProgressError] = useState('');
  const [phase, setPhase] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [milestone, setMilestone] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [approvalTitle, setApprovalTitle] = useState('');
  const [operationFeedback, setOperationFeedback] = useState('');
  const [operationFailed, setOperationFailed] = useState(false);

  const tabs = ['Overview', 'Updates', 'Milestones', 'Documents', 'Approvals', 'Model'];
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);
  const canManage = role === 'architect' || role === 'admin';
  const currentUser = getPortalUser(portalAuth.getSession()?.email ?? '');
  const accessibleProjects = (
    role === 'admin' ? snapshot.projects : getProjectsForUser(currentUser?.id ?? '')
  ).filter((candidate) => !candidate.archived);
  const projectIndex = accessibleProjects.findIndex((candidate) => candidate.id === projectId);
  const previousProject = projectIndex > 0 ? accessibleProjects[projectIndex - 1] : undefined;
  const nextProject =
    projectIndex >= 0 && projectIndex < accessibleProjects.length - 1
      ? accessibleProjects[projectIndex + 1]
      : undefined;

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const saveStatus = async () => {
    const progressValue = progress.trim();
    const changes = {
      ...(progressValue !== '' &&
      Number.isFinite(Number(progressValue)) &&
      Number(progressValue) >= 0 &&
      Number(progressValue) <= 100
        ? { progress: Number(progressValue) }
        : {}),
      ...(phase !== '' ? { phase } : {}),
      ...(role === 'admin' && projectTitle.trim() ? { title: projectTitle.trim() } : {}),
    };
    if (
      progressValue !== '' &&
      (!Number.isFinite(Number(progressValue)) || Number(progressValue) < 0 || Number(progressValue) > 100)
    ) {
      setProgressError('Progress must be a number from 0 to 100.');
    } else {
      setProgressError('');
    }
    if (!Object.keys(changes).length) return;
    try {
      const updated = await projectService.update(projectId, changes);
      if (!updated) throw new Error('Project status could not be read back from the API.');
      await automationService.emit({ event: 'project.updated', projectId, metadata: changes });
      setOperationFailed(false);
      setOperationFeedback('Project status saved.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Project status could not be saved.');
    }
  };

  const addUpdate = async () => {
    const title = updateTitle.trim();
    const body = updateBody.trim();
    if (!title || !body) return;
    try {
      await projectWorkflowService.addUpdate({ projectId, date: formatPortalDate(new Date()), title, body });
      void automationService.emit({ event: 'project.updated', projectId, message: title });
      setUpdateTitle('');
      setUpdateBody('');
      setOperationFailed(false);
      setOperationFeedback('Project update published.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Project update could not be published.');
    }
  };

  const addMilestone = async () => {
    const label = milestone.trim();
    if (!label) return;
    try {
      await projectWorkflowService.addMilestone({ projectId, label, status: 'Upcoming' });
      setMilestone('');
      setOperationFailed(false);
      setOperationFeedback('Milestone added.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Milestone could not be added.');
    }
  };

  const addDocument = async () => {
    const name = documentName.trim();
    if (!name) return;
    try {
      await projectWorkflowService.addDocument({ projectId, name, meta: 'PDF · Added in portal' });
      setDocumentName('');
      setOperationFailed(false);
      setOperationFeedback('Document added.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Document could not be added.');
    }
  };

  const requestApproval = async () => {
    const title = approvalTitle.trim();
    if (!title) return;
    try {
      await projectWorkflowService.requestApproval({ projectId, title, status: 'Pending' });
      void automationService.emit({ event: 'approval.requested', projectId, message: title });
      setApprovalTitle('');
      setOperationFailed(false);
      setOperationFeedback('Approval request sent.');
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Approval request could not be sent.');
    }
  };

  const respondToProjectApproval = async (title: string, status: ProjectApproval['status']) => {
    try {
      const updated = await projectWorkflowService.updateApproval(projectId, title, status);
      if (!updated) throw new Error('Approval could not be read back after saving.');
      setOperationFailed(false);
      setOperationFeedback(
        status === 'Approved'
          ? 'Approval resolved.'
          : status === 'Rejected'
            ? 'Changes requested.'
            : 'Approval reopened.',
      );
      refresh();
    } catch (error) {
      setOperationFailed(true);
      setOperationFeedback(error instanceof Error ? error.message : 'Approval could not be saved.');
    }
  };

  const deleteProject = async () => {
    if (role !== 'admin' || !window.confirm('Delete this runtime project and its related records?')) return;
    try {
      const deleted = await projectService.remove(projectId);
      if (!deleted) throw new Error('Project could not be deleted.');
      navigate(homePath);
    } catch (error) {
      setOperationFeedback(error instanceof Error ? error.message : 'Project could not be deleted.');
    }
  };

  const togglePublication = async () => {
    if (!project) return;
    try {
      await projectService.update(projectId, { published: !project.published });
      setOperationFeedback(
        project.published
          ? 'Project removed from the public portfolio.'
          : 'Project published to the public portfolio.',
      );
      refresh();
    } catch (error) {
      setOperationFeedback(error instanceof Error ? error.message : 'Publication status could not be saved.');
    }
  };

  if (!project) return <NotFoundPage onNavigate={navigate} />;

  const content = (
    <div>
      <button
        onClick={() => navigate(homePath)}
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </button>

      <div className="mt-8 grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
            {project.code} / {project.category}
          </p>
          <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">{project.title}</h1>
        </div>
        <div className="min-w-64">
          <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
            <span>{project.phase}</span>
            <span>{project.progress}%</span>
          </div>
          <div className="portal-progress-track mt-3 h-px bg-black/15">
            <div className="portal-progress-fill h-px bg-black" style={{ width: `${project.progress}%` }} />
          </div>
          <p className="mt-3 text-xs text-stone-500">Next: {project.nextMilestone}</p>
        </div>
      </div>

      <ProjectNavigation previous={previousProject} next={nextProject} onNavigate={navigate} role={role} />

      {operationFeedback && (
        <p role={operationFailed ? 'alert' : 'status'} className="mt-5 text-sm text-stone-600">
          {operationFeedback}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-7 overflow-x-auto border-b border-black/15 py-5 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            data-testid={`project-tab-${tab.toLowerCase()}`}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
              activeTab === tab
                ? 'border-current text-black'
                : 'border-transparent text-stone-400 hover:border-current hover:text-stone-700'
            }`}
          >
            {(portalCommon.tabs as Record<string, string>)[tab] ?? tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <section className="py-12">
        {activeTab === 'Overview' && <ProjectOverview project={project} />}

        {activeTab === 'Updates' && (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {project.updates.length ? (
              project.updates.map((update) => (
                <article key={update.date + update.title} className="grid gap-4 py-8 md:grid-cols-[140px_1fr]">
                  <p className="font-mono text-[10px] text-stone-500">{update.date}</p>
                  <div>
                    <h2 className="font-serif text-3xl">{update.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{update.body}</p>
                  </div>
                </article>
              ))
            ) : (
              <PortalEmptyState message="No updates have been recorded for this project." />
            )}
          </div>
        )}

        {activeTab === 'Milestones' && (
          <ol className="divide-y divide-black/15 border-y border-black/15">
            {project.milestones.length ? (
              project.milestones.map((ms, index) => (
                <li key={ms.label} className="grid grid-cols-[60px_1fr_auto] items-center py-6">
                  <span className="font-mono text-[10px] text-stone-500">{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-serif text-2xl">{ms.label}</span>
                  <span className={`${portalStatusClass(ms.status)} font-mono text-[9px] uppercase tracking-[0.16em]`}>
                    {ms.status}
                  </span>
                </li>
              ))
            ) : (
              <li>
                <PortalEmptyState message="No milestones have been defined for this project." />
              </li>
            )}
          </ol>
        )}

        {activeTab === 'Documents' && (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {project.documents.length ? (
              project.documents.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between gap-6 py-6">
                  <div className="flex items-center gap-4">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="font-serif text-xl">{doc.name}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-stone-500">{doc.meta}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Available</span>
                </div>
              ))
            ) : (
              <PortalEmptyState message="No documents have been issued for this project." />
            )}
          </div>
        )}

        {activeTab === 'Approvals' && (
          <div className="divide-y divide-black/15 border-y border-black/15">
            {project.approvals.length ? (
              project.approvals.map((appr) => (
                <div key={appr.title} className="flex items-center justify-between gap-6 py-6">
                  <p className="font-serif text-2xl">{appr.title}</p>
                  <span className="flex items-center gap-3">
                    <span className={`${portalStatusClass(appr.status)} font-mono text-[9px] uppercase tracking-wider`}>
                      {appr.status}
                    </span>
                    {role === 'client' && appr.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => void respondToProjectApproval(appr.title, 'Approved')}
                          className="border border-black px-3 py-2 font-mono text-[9px] uppercase"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void respondToProjectApproval(appr.title, 'Rejected')}
                          className="border border-black/15 px-3 py-2 font-mono text-[9px] uppercase text-stone-500"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {canManage && (
                      <button
                        onClick={() =>
                          void respondToProjectApproval(
                            appr.title,
                            appr.status === 'Approved' ? 'Pending' : 'Approved',
                          )
                        }
                        className="border border-black px-3 py-2 font-mono text-[9px] uppercase"
                      >
                        {appr.status === 'Approved' ? 'Reopen' : 'Resolve'}
                      </button>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <PortalEmptyState message="No approvals are currently associated with this project." />
            )}
          </div>
        )}

        {activeTab === 'Model' && (
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Box className="h-6 w-6" />
              <h2 className="mt-8 font-serif text-4xl">Current project model</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
                Open the project model in the existing GARNIER ARCHITECTURE workspace.
              </p>
            </div>
            <button
              data-testid="open-3d-model"
              onClick={handleOpenWorkspace}
              className="group inline-flex items-center justify-between gap-12 bg-[#171714] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition-transform active:translate-y-px"
            >
              Open 3D Model <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </section>

      {/* Role Management Controls */}
      {canManage && (
        <section data-testid="role-management-panel" className="border-t border-black/15 py-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
                {role === 'admin' ? 'Administration' : 'Studio management'}
              </p>
              <h2 className="mt-4 font-serif text-4xl">Project controls.</h2>
            </div>
            {role === 'admin' && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">
                  {project.published ? 'Public portfolio' : 'Private project'}
                </span>
                <button
                  data-testid="toggle-publication"
                  onClick={() => void togglePublication()}
                  className="border border-black/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
                >
                  {project.published ? 'Remove from public portfolio' : 'Publish to public portfolio'}
                </button>
                <button
                  data-testid="delete-project"
                  onClick={() => void deleteProject()}
                  className="border border-black/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
                >
                  Delete runtime project
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {role === 'admin' && (
                <label className="block font-mono text-[9px] uppercase text-stone-500">
                  Project title
                  <input
                    aria-label="Project title"
                    value={projectTitle || project.title}
                    onChange={(event) => setProjectTitle(event.target.value)}
                    className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                  />
                </label>
              )}
              <label className="block font-mono text-[9px] uppercase text-stone-500">
                Progress / phase
                <input
                  aria-label="Project progress"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  aria-invalid={Boolean(progressError)}
                  aria-describedby={progressError ? 'project-progress-error' : undefined}
                  value={progress || project.progress}
                  onChange={(event) => {
                    const value = event.target.value;
                    setProgress(value);
                    setProgressError(
                      value.trim() !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)
                        ? 'Progress must be a number from 0 to 100.'
                        : '',
                    );
                  }}
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
                {progressError && (
                  <p id="project-progress-error" role="alert" className="mt-2 text-xs text-stone-600">
                    {progressError}
                  </p>
                )}
                <select
                  aria-label="Project phase"
                  value={phase || project.phase}
                  onChange={(event) => setPhase(event.target.value)}
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                >
                  <option>Brief and site study</option>
                  <option>Concept design</option>
                  <option>Design development</option>
                  <option>Documentation</option>
                </select>
              </label>
              <button
                onClick={() => void saveStatus()}
                className="bg-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white"
              >
                Save status
              </button>
            </div>

            <div className="space-y-4">
              <label className="block font-mono text-[9px] uppercase text-stone-500">
                Create project update
                <input
                  aria-label="Update title"
                  value={updateTitle}
                  onChange={(event) => setUpdateTitle(event.target.value)}
                  placeholder="Update title"
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
                <textarea
                  aria-label="Update body"
                  value={updateBody}
                  onChange={(event) => setUpdateBody(event.target.value)}
                  placeholder="What changed?"
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
              </label>
              <button
                onClick={addUpdate}
                className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
              >
                Publish update
              </button>
            </div>

            <div className="space-y-4">
              <label className="block font-mono text-[9px] uppercase text-stone-500">
                Manage milestones
                <input
                  aria-label="New milestone"
                  value={milestone}
                  onChange={(event) => setMilestone(event.target.value)}
                  placeholder="Milestone name"
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
              </label>
              <button
                onClick={addMilestone}
                className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
              >
                Add milestone
              </button>
            </div>

            <div className="space-y-4">
              <label className="block font-mono text-[9px] uppercase text-stone-500">
                Issue document
                <input
                  aria-label="New document"
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="Document name"
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
              </label>
              <button
                onClick={addDocument}
                className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
              >
                Add document
              </button>
            </div>

            <div className="space-y-4">
              <label className="block font-mono text-[9px] uppercase text-stone-500">
                Client approval request
                <input
                  aria-label="New approval"
                  value={approvalTitle}
                  onChange={(event) => setApprovalTitle(event.target.value)}
                  placeholder="Approval request"
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"
                />
              </label>
              <button
                onClick={requestApproval}
                className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]"
              >
                Request approval
              </button>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase text-stone-500">Project activity</p>
              {project.updates.slice(0, 3).map((update) => (
                <p key={update.date + update.title} className="mt-4 text-sm text-stone-600">
                  {update.date} · {update.title}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );

  if (!insideShell) {
    return (
      <PortalShell role={role} onNavigate={onNavigate} onSignOut={onSignOut}>
        {content}
      </PortalShell>
    );
  }

  return content;
};

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, FileText, LogOut, Moon, Sun, X } from 'lucide-react';
import { demoAuth } from '../../portal/demoAuth';
import {
  addPortalApproval,
  addPortalDocument,
  addPortalMilestone,
  addPortalUpdate,
  getPublicProject,
  getPortalSnapshot,
  getProjectsForUser,
  updatePortalApproval,
  updatePortalDatabase,
  updatePortalProject,
  updatePortalUser,
  PortalProject,
  PortalRole,
  getPortalUser,
} from '../../portal/data';
import { SpatialRail } from '../gallery/SpatialRail';

type Navigate = (path: string) => void;

interface NavigationProps {
  onNavigate: Navigate;
}

const PortalHeader: React.FC<NavigationProps & { onSignOut?: () => void; homePath?: string; role?: PortalRole }> = ({ onNavigate, onSignOut, homePath = '/dashboard', role = 'client' }) => {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('arch-tech-portal-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('portal-dark', dark);
    window.localStorage.setItem('arch-tech-portal-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const navigation = role === 'admin' ? ['Projects', 'People', 'Approvals', 'Activity'] : role === 'architect' ? ['Projects', 'Activity', 'Milestones', 'Documents', 'Approvals'] : ['Projects', 'Updates', 'Documents', 'Notifications'];
  const sectionIds = role === 'admin' ? { Projects: 'projects', People: 'people', Approvals: 'approvals', Activity: 'activity' } : role === 'architect' ? { Projects: 'projects', Activity: 'activity', Milestones: 'milestones', Documents: 'documents', Approvals: 'approvals' } : { Projects: 'projects', Updates: 'updates', Documents: 'documents', Notifications: 'notifications' };
  return (
  <header className="portal-header border-b border-black/10 bg-[#f2efe8]">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
      <button onClick={() => onNavigate('/')} className="font-mono text-sm tracking-[0.24em] text-[#171714]">
        ARCH_TECH
      </button>
      <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600">
        <button onClick={() => onNavigate(homePath)} className="transition-colors hover:text-black">
          {role === 'admin' ? 'Register' : role === 'architect' ? 'Workboard' : 'Projects'}
        </button>
        <nav aria-label={`${role} navigation`} className="hidden gap-3 border-l border-black/15 pl-5 lg:flex">{navigation.map((item) => <button key={item} data-testid={`portal-nav-${item.toLowerCase()}`} aria-controls={`portal-section-${sectionIds[item as keyof typeof sectionIds]}`} onClick={() => document.getElementById(`portal-section-${sectionIds[item as keyof typeof sectionIds]}`)?.scrollIntoView({ behavior: 'smooth' })} className="transition-colors hover:text-black">{item}</button>)}</nav>
        <button onClick={() => setDark((value) => !value)} aria-label={dark ? 'Use light mode' : 'Use dark mode'} data-testid="theme-toggle" className="inline-flex items-center gap-2 transition-colors hover:text-black">
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {dark ? 'Light' : 'Dark'}
        </button>
        {onSignOut && (
          <button onClick={onSignOut} className="inline-flex items-center gap-2 transition-colors hover:text-black">
            Sign out <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  </header>
  );
};

export const LoginOverlay: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({ open, onClose, onSuccess }) => {
  const demoClient = getPortalSnapshot().db.users[0];
  const [email, setEmail] = useState(demoClient?.email ?? '');
  const [password, setPassword] = useState(demoClient?.password ?? '');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, input') ?? []);
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!demoAuth.signIn(email, password)) {
      setError('Check the demo email and password.');
      return;
    }
    onSuccess();
  };

  const handleQuickLogin = (role: PortalRole) => {
    const user = getPortalSnapshot().db.users.find((candidate) => candidate.role === role);
    if (!user || !demoAuth.signIn(user.email, user.password)) {
      setError('This demo account is unavailable.');
      return;
    }
    onSuccess();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-login-title"
        className="w-full max-w-lg border border-white/15 bg-[#11110f]/95 p-6 text-[#f4efe8] shadow-2xl sm:p-8"
      >
        <button onClick={onClose} aria-label="Close login" className="ml-auto flex h-9 w-9 items-center justify-center border border-white/15 text-stone-300 transition-colors hover:border-white hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Private access</p>
          <h1 id="client-login-title" className="mt-5 font-serif text-5xl font-light tracking-tight">Portal Access</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">Review project progress, updates, documents and the current model.</p>

          <div className="mt-8 border-y border-white/10 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Quick access</p><div className="mt-4 grid grid-cols-3 gap-2">{(['client', 'architect', 'admin'] as PortalRole[]).map((role) => <button key={role} type="button" data-testid={`quick-login-${role}`} onClick={() => handleQuickLogin(role)} className="border border-white/20 px-2 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-stone-200 transition-colors hover:border-white hover:bg-white hover:text-black">{`Login as ${role[0].toUpperCase()}${role.slice(1)}`}</button>)}</div><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">— or use credentials manually —</p></div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-7">
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Email
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Password
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button
              data-testid="login-submit"
              type="submit"
              className="group flex w-full items-center justify-between bg-[#f4efe8] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-transform duration-200 active:translate-y-px"
            >
              Enter portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="mt-6 font-mono text-[10px] leading-5 text-stone-500">Demo access is prefilled. Authentication is isolated for a later provider connection.</p>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC<NavigationProps & { onSignOut: () => void }> = ({ onNavigate, onSignOut }) => {
  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const client = getPortalUser(demoAuth.getSession()?.email ?? '');
  const projects = snapshot.projects.filter((project) => !project.archived && client?.projectIds.includes(project.id));
  const updates = projects.flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title }))).slice(0, 5);
  const upcomingMilestones = projects.flatMap((project) => project.milestones.filter((milestone) => milestone.status === 'Upcoming').map((milestone) => ({ ...milestone, projectTitle: project.title })));
  const pendingApprovals = projects.flatMap((project) => project.approvals.filter((approval) => approval.status === 'Pending').map((approval) => ({ ...approval, projectTitle: project.title })));
  const notifications = snapshot.db.notifications.filter((notification) => notification.userId === client?.id);
  const refresh = () => setSnapshot(getPortalSnapshot());
  const respondToApproval = (projectId: string, title: string, status: 'Approved' | 'Rejected') => {
    updatePortalApproval(projectId, title, status);
    refresh();
  };

  return (
    <div className="portal-surface h-screen overflow-y-auto bg-[#f2efe8] text-[#171714]">
      <PortalHeader onNavigate={onNavigate} onSignOut={onSignOut} role="client" />
      <main className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Client portal / Overview</p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">Projects in progress.</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-600">A clear view of where each project stands, what needs your decision and what has changed since your last visit.</p>
        </div>

        <section id="portal-section-projects" className="py-14" aria-labelledby="client-projects-title">
          <div className="mb-8 flex items-center justify-between">
            <h2 id="client-projects-title" className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Your projects</h2>
            <span className="font-mono text-[10px] text-stone-500">{projects.length.toString().padStart(2, '0')} active</span>
          </div>
          <div className="divide-y divide-black/15 border-y border-black/15">
            {projects.map((project) => (
              <article key={project.id} className="grid gap-5 py-7 sm:grid-cols-[80px_1fr_170px_auto] sm:items-center">
                <span className="font-mono text-[10px] text-stone-500">{project.code}</span>
                <button data-testid={`dashboard-project-${project.id}`} onClick={() => onNavigate(`/dashboard/projects/${project.id}`)} className="text-left"><span className="block font-serif text-2xl">{project.title}</span><span className="mt-1 block text-xs text-stone-500">{project.phase} · {project.progress}% complete</span></button>
                <div><p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500"><span>Progress</span><span>{project.progress}%</span></p><div className="h-px bg-black/15"><div className="h-px bg-black" style={{ width: `${project.progress}%` }} /></div><p className="mt-3 text-xs text-stone-600">Next: {project.nextMilestone}</p></div>
                <div className="flex gap-3 sm:justify-end"><button onClick={() => onNavigate(`/dashboard/projects/${project.id}`)} className="border border-black/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]">Open project</button><button onClick={() => onNavigate('/workspace')} className="bg-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white">3D model</button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-12 border-t border-black/15 py-12 lg:grid-cols-[1fr_1fr]" aria-label="Client decisions">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Decisions requiring your attention</p>{pendingApprovals.length ? pendingApprovals.map((approval) => <div key={`${approval.projectId}-${approval.title}`} className="mt-6 border-b border-black/10 pb-5"><div className="flex items-start justify-between gap-6"><div><p className="font-serif text-2xl">{approval.title}</p><p className="mt-1 text-xs text-stone-500">{approval.projectTitle}</p></div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">Pending</span></div><div className="mt-4 flex gap-2"><button onClick={() => respondToApproval(approval.projectId, approval.title, 'Approved')} className="bg-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white">Approve</button><button onClick={() => respondToApproval(approval.projectId, approval.title, 'Rejected')} className="border border-black/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]">Request changes</button></div></div>) : <p className="mt-6 text-sm leading-6 text-stone-600">No decisions are waiting for you.</p>}</div>
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Upcoming milestones</p>{upcomingMilestones.length ? upcomingMilestones.map((milestone) => <p key={`${milestone.projectId}-${milestone.label}`} className="mt-6 flex justify-between gap-5 text-sm"><span>{milestone.projectTitle} · {milestone.label}</span><span className="font-mono text-[9px] uppercase text-stone-500">Upcoming</span></p>) : <p className="mt-6 text-sm text-stone-600">Milestones will appear here as projects advance.</p>}</div>
        </section>

        <section id="portal-section-updates" className="grid gap-12 border-t border-black/15 pt-12 lg:grid-cols-2">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Recent project updates</p>{updates.map((update) => <button key={`${update.projectId}-${update.date}-${update.title}`} onClick={() => onNavigate(`/dashboard/projects/${update.projectId}`)} className="mt-6 block w-full border-b border-black/10 pb-5 text-left"><span className="font-mono text-[10px] text-stone-500">{update.date} · {update.projectTitle}</span><span className="mt-2 block font-serif text-2xl">{update.title}</span><span className="mt-2 block text-sm leading-6 text-stone-600">{update.body}</span></button>)}</div>
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Latest milestone</p><h2 className="mt-8 font-serif text-3xl">{projects[0]?.nextMilestone}</h2><p className="mt-3 text-sm leading-6 text-stone-600">Open a project to review its complete timeline, documents, decisions and model.</p><button onClick={() => projects[0] && onNavigate(`/dashboard/projects/${projects[0].id}`)} className="mt-6 border border-black/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Review project</button></div>
        </section>

        <section id="portal-section-documents" className="border-t border-black/15 pt-10"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Shared documents</p>{projects.flatMap((project) => project.documents.map((document) => <button key={`${project.id}-${document.name}`} onClick={() => onNavigate(`/dashboard/projects/${project.id}`)} className="mt-5 flex w-full justify-between gap-5 border-b border-black/10 pb-4 text-left text-sm"><span>{project.title} · {document.name}</span><span className="font-mono text-[9px] text-stone-500">{document.meta} · Open project</span></button>))}</section>
        <section id="portal-section-notifications" className="border-t border-black/15 pt-10"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Notifications</p>{notifications.length ? notifications.map((notification) => <button key={`${notification.date}-${notification.message}`} onClick={() => onNavigate(`/dashboard/projects/${notification.projectId}`)} className="mt-5 flex w-full justify-between gap-5 border-b border-black/10 pb-4 text-left text-sm"><span>{notification.message}</span><span className="font-mono text-[9px] text-stone-500">{notification.date} · Open project</span></button>) : <p className="mt-5 text-sm text-stone-600">You are up to date.</p>}</section>
      </main>
    </div>
  );
};

const ProjectRows: React.FC<{ projects: PortalProject[]; onNavigate: Navigate; detailPath: (id: string) => string; onOpenWorkspace?: () => void }> = ({ projects, onNavigate, detailPath, onOpenWorkspace }) => (
  <div className="divide-y divide-black/15 border-y border-black/15">
    {projects.map((project) => (
      <div key={project.id} className="group grid w-full gap-5 py-7 text-left transition-colors hover:bg-white/35 sm:grid-cols-[80px_1fr_150px_180px_auto] sm:items-center sm:px-3">
        <span className="font-mono text-[10px] text-stone-500">{project.code}</span>
        <button onClick={() => onNavigate(detailPath(project.id))} className="text-left"><span className="block font-serif text-2xl">{project.title}</span><span className="mt-1 block text-xs text-stone-500">{project.category}</span></button>
        <span className="text-xs text-stone-600">{project.phase}</span>
        <span><span className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500"><span>Progress</span><span>{project.progress}%</span></span><span className="block h-px bg-black/15"><span className="block h-px bg-black" style={{ width: `${project.progress}%` }} /></span></span>
        <span className="flex items-center gap-3"><button onClick={() => onNavigate(detailPath(project.id))} className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black">Open</button>{onOpenWorkspace && <button data-testid={`admin-open-model-${project.id}`} onClick={onOpenWorkspace} className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black">Model</button>}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    ))}
  </div>
);

export const ArchitectDashboardPage: React.FC<NavigationProps & { onSignOut: () => void }> = ({ onNavigate, onSignOut }) => {
  const architect = getPortalUser(demoAuth.getSession()?.email ?? '');
  const projects = getProjectsForUser(architect?.id ?? '');
  const attention = projects.filter((project) => project.progress < 50 || project.approvals.some((approval) => approval.status === 'Pending'));
  const milestones = projects.flatMap((project) => project.milestones.filter((milestone) => milestone.status !== 'Complete').map((milestone) => ({ ...milestone, projectTitle: project.title })));
  const approvals = projects.flatMap((project) => project.approvals.filter((approval) => approval.status === 'Pending').map((approval) => ({ ...approval, projectTitle: project.title })));
  const activity = projects.flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title }))).slice(0, 5);
  return (
    <div className="portal-surface h-screen overflow-y-auto bg-[#f2efe8] text-[#171714]"><PortalHeader onNavigate={onNavigate} onSignOut={onSignOut} homePath="/architect" role="architect" />
      <main className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="border-b border-black/15 pb-12"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Architect workspace / Assigned projects</p><h1 className="mt-5 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">Work in progress.</h1><p className="mt-6 max-w-xl text-sm leading-6 text-stone-600">A focused view of the projects, decisions and deliverables currently assigned to this studio.</p></div>
        <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Architect workload"><div className="portal-overview-tile bg-[#f2efe8] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Assigned workload</p><p className="mt-3 font-serif text-3xl">{projects.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">active projects</p></div><div className="portal-overview-tile bg-[#f2efe8] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Attention</p><p className="mt-3 font-serif text-3xl">{attention.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">projects to review</p></div><div className="portal-overview-tile bg-[#f2efe8] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Client decisions</p><p className="mt-3 font-serif text-3xl">{approvals.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">responses pending</p></div><div className="portal-overview-tile bg-[#f2efe8] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Next milestones</p><p className="mt-3 font-serif text-3xl">{milestones.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">in the active sequence</p></div></section>
        <section id="portal-section-projects" className="py-12"><div className="mb-8 flex items-center justify-between"><h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Assigned projects</h2><span className="font-mono text-[10px] text-stone-500">{projects.length.toString().padStart(2, '0')} active · {attention.length.toString().padStart(2, '0')} need attention</span></div><div className="divide-y divide-black/15 border-y border-black/15">{projects.map((project) => <article key={project.id} className="grid gap-5 py-7 lg:grid-cols-[1fr_170px_auto] lg:items-center"><button onClick={() => onNavigate(`/architect/projects/${project.id}`)} className="text-left"><span className="font-mono text-[10px] text-stone-500">{project.code}</span><h2 className="mt-2 font-serif text-3xl">{project.title}</h2><p className="mt-1 text-xs text-stone-500">{project.phase} · {project.progress}%</p></button><div><p className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500"><span>Progress</span><span>{project.progress}%</span></p><div className="h-px bg-black/15"><div className="h-px bg-black" style={{ width: `${project.progress}%` }} /></div>{project.approvals.some((approval) => approval.status === 'Pending') && <p className="mt-3 font-mono text-[9px] uppercase text-stone-500">Client response pending</p>}</div><div className="flex gap-2 lg:justify-end"><button onClick={() => onNavigate(`/architect/projects/${project.id}`)} className="border border-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]">Open project</button><button onClick={() => onNavigate('/workspace')} className="bg-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white">3D model</button></div></article>)}</div></section>
        <section id="portal-section-activity" className="grid gap-10 border-t border-black/15 pt-12 lg:grid-cols-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Attention needed</p>{attention.length ? attention.map((project) => <button key={project.id} data-testid={`architect-attention-${project.id}`} onClick={() => onNavigate(`/architect/projects/${project.id}`)} className="mt-5 block w-full text-left font-serif text-2xl hover:text-stone-500">{project.title}</button>) : <p className="mt-5 text-sm text-stone-600">All assigned projects are moving to plan.</p>}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Upcoming milestones</p>{milestones.slice(0, 4).map((milestone) => <button key={`${milestone.projectId}-${milestone.label}`} onClick={() => onNavigate(`/architect/projects/${milestone.projectId}`)} className="mt-5 flex w-full justify-between gap-4 text-left text-sm hover:text-stone-500"><span>{milestone.projectTitle} · {milestone.label}</span><span className="font-mono text-[9px] uppercase text-stone-500">{milestone.status}</span></button>)}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Pending client approvals</p>{approvals.map((approval) => <button key={`${approval.projectId}-${approval.title}`} data-testid={`architect-approval-${approval.projectId}`} onClick={() => onNavigate(`/architect/projects/${approval.projectId}`)} className="mt-5 block w-full text-left text-sm hover:text-stone-500">{approval.projectTitle} · {approval.title}</button>)}</div></section>
        <section className="grid gap-10 border-t border-black/15 pt-12 lg:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Recent project activity</p>{activity.map((update) => <button key={`${update.projectId}-${update.date}-${update.title}`} onClick={() => onNavigate(`/architect/projects/${update.projectId}`)} className="mt-5 flex w-full justify-between gap-4 text-left text-sm hover:text-stone-500"><span>{update.projectTitle} · {update.title}</span><span className="font-mono text-[9px] text-stone-500">{update.date}</span></button>)}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Tasks / deliverables</p>{projects.flatMap((project) => project.documents.slice(0, 2).map((document) => <button key={`${project.id}-${document.name}`} onClick={() => onNavigate(`/architect/projects/${project.id}`)} className="mt-5 flex w-full justify-between gap-4 text-left text-sm hover:text-stone-500"><span>{project.title} · {document.name}</span><span className="font-mono text-[9px] uppercase text-stone-500">Issue</span></button>))}</div></section>
        <section id="portal-section-milestones" className="border-t border-black/15 pt-10"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Milestones</p>{milestones.map((milestone) => <button key={`${milestone.projectId}-${milestone.label}`} onClick={() => onNavigate(`/architect/projects/${milestone.projectId}`)} className="mt-4 flex w-full justify-between text-left text-sm hover:text-stone-500"><span>{milestone.projectTitle} · {milestone.label}</span><span className="font-mono text-[9px] uppercase text-stone-500">{milestone.status}</span></button>)}</section>
        <section id="portal-section-documents" className="border-t border-black/15 pt-10"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Documents</p>{projects.flatMap((project) => project.documents.map((document) => <button key={`${project.id}-${document.name}`} onClick={() => onNavigate(`/architect/projects/${project.id}`)} className="mt-4 block w-full text-left text-sm hover:text-stone-500">{project.title} · {document.name}</button>))}</section>
        <section id="portal-section-approvals" className="border-t border-black/15 pt-10"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Approvals</p>{approvals.map((approval) => <button key={`${approval.projectId}-${approval.title}`} onClick={() => onNavigate(`/architect/projects/${approval.projectId}`)} className="mt-4 flex w-full justify-between text-left text-sm hover:text-stone-500"><span>{approval.projectTitle} · {approval.title}</span><span className="font-mono text-[9px] uppercase text-stone-500">{approval.status}</span></button>)}</section>
      </main>
    </div>
  );
};

export const AdminDashboardPage: React.FC<NavigationProps & { onSignOut: () => void }> = ({ onNavigate, onSignOut }) => {
  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', category: 'Residential · New project', phase: 'Brief and site study', progress: '0' });
  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);
  const clients = db.users.filter((user) => user.role === 'client');
  const architects = db.users.filter((user) => user.role === 'architect');
  const attentionProjects = activeProjects.filter((project) => project.progress < 50 || project.approvals.some((approval) => approval.status === 'Pending'));
  const pendingApprovals = db.approvals.filter((approval) => approval.status === 'Pending' && activeProjects.some((project) => project.id === approval.projectId)).map((approval) => ({ ...approval, projectTitle: activeProjects.find((project) => project.id === approval.projectId)?.title ?? approval.projectId }));
  const upcomingMilestones = db.milestones.filter((milestone) => milestone.status === 'Upcoming' && activeProjects.some((project) => project.id === milestone.projectId)).map((milestone) => ({ ...milestone, projectTitle: activeProjects.find((project) => project.id === milestone.projectId)?.title ?? milestone.projectId }));
  const recentActivity = db.updates.filter((update) => activeProjects.some((project) => project.id === update.projectId)).slice(0, 6).map((update) => ({ ...update, projectTitle: activeProjects.find((project) => project.id === update.projectId)?.title ?? update.projectId }));
  const stageCounts = activeProjects.reduce<Record<string, number>>((counts, project) => ({ ...counts, [project.phase]: (counts[project.phase] ?? 0) + 1 }), {});
  const averageProgress = activeProjects.length ? Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length) : 0;
  const refresh = () => setSnapshot(getPortalSnapshot());
  const toggleAssignment = (userId: string, projectId: string) => {
    updatePortalDatabase((current) => ({ ...current, users: current.users.map((user) => user.id !== userId ? user : { ...user, projectIds: user.projectIds.includes(projectId) ? user.projectIds.filter((id) => id !== projectId) : [...user.projectIds, projectId] }) }));
    refresh();
  };
  const createProject = () => {
    if (!newProject.title.trim()) return;
    const id = `admin-project-${Date.now()}`;
    updatePortalDatabase((current) => ({ ...current, projects: [...current.projects, { id, code: `AT / ${String(current.projects.length + 1).padStart(2, '0')}`, title: newProject.title.trim(), category: newProject.category, phase: newProject.phase, progress: Number(newProject.progress), nextMilestone: 'Project briefing', summary: 'New project created in the portal.', statement: 'Project statement pending.', image: '/projects/pacific-nexus-free-zone/hero-exterior.png', published: false }] }));
    setNewProject({ title: '', category: 'Residential · New project', phase: 'Brief and site study', progress: '0' });
    setCreateOpen(false);
    refresh();
  };
  return (
    <div className="portal-surface h-screen overflow-y-auto bg-[#f2efe8] text-[#171714]"><PortalHeader onNavigate={onNavigate} onSignOut={onSignOut} homePath="/admin" role="admin" />
      <main className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="border-b border-black/15 pb-12"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Administration / Portal overview</p><h1 className="mt-5 max-w-3xl font-serif text-5xl font-light tracking-tight sm:text-7xl">The project register.</h1><p className="mt-6 max-w-xl text-sm leading-6 text-stone-600">Projects, people, approvals and shared information across the ARCH_TECH portal.</p></div>
        <section className="flex flex-wrap gap-3 py-10"><button onClick={() => setCreateOpen(true)} className="bg-[#171714] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white">Create project</button><span className="border border-black/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">Operational controls</span></section>
        <section className="grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio overview"><div className="admin-overview-tile bg-[#f2efe8] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Portfolio overview</p><p className="mt-4 font-serif text-4xl">{activeProjects.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">active projects</p></div><div className="admin-overview-tile bg-[#f2efe8] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Portfolio progress</p><p className="mt-4 font-serif text-4xl">{averageProgress}%</p><p className="mt-1 text-xs text-stone-600">average progress across active work</p></div><div className="admin-overview-tile bg-[#f2efe8] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Project health</p><p className="mt-4 font-serif text-4xl">{attentionProjects.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">need attention</p></div><div className="admin-overview-tile bg-[#f2efe8] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Client decisions</p><p className="mt-4 font-serif text-4xl">{pendingApprovals.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">pending approvals</p></div></section>
        <section className="grid gap-10 border-b border-black/15 py-12 lg:grid-cols-[1fr_1.2fr]" aria-label="Development stages"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development stages</p><h2 className="mt-4 font-serif text-4xl">Where the portfolio stands.</h2></div><div className="grid gap-4 sm:grid-cols-2">{Object.entries(stageCounts).map(([stage, count]) => <div key={stage} className="border-l border-black/20 pl-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{stage}</p><p className="mt-3 font-serif text-3xl">{String(count).padStart(2, '0')}</p><p className="mt-1 text-xs text-stone-600">active project{count === 1 ? '' : 's'}</p></div>)}</div></section>
        <section className="grid gap-12 border-b border-black/15 py-12 lg:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Project health / attention</p>{attentionProjects.map((project) => <button key={project.id} onClick={() => onNavigate(`/admin/projects/${project.id}`)} className="mt-5 flex w-full items-center justify-between border-b border-black/10 pb-4 text-left"><span><span className="block font-serif text-2xl">{project.title}</span><span className="mt-1 block text-xs text-stone-500">{project.phase} · {project.progress}%</span></span><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">Review</span></button>)}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Upcoming milestones</p>{upcomingMilestones.slice(0, 5).map((milestone) => <p key={`${milestone.projectId}-${milestone.label}`} className="mt-5 flex justify-between gap-4 text-sm"><span>{milestone.projectTitle} · {milestone.label}</span><span className="font-mono text-[9px] uppercase text-stone-500">Upcoming</span></p>)}</div></section>
        <section id="portal-section-projects" className="py-12"><div className="mb-8 flex items-center justify-between"><h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">All projects / assignments</h2><span className="font-mono text-[10px] text-stone-500">{activeProjects.length.toString().padStart(2, '0')} active</span></div><ProjectRows projects={activeProjects} onNavigate={onNavigate} onOpenWorkspace={() => onNavigate('/workspace')} detailPath={(id) => `/admin/projects/${id}`} /></section>
        <section id="portal-section-people" className="grid gap-12 border-t border-black/15 pt-12 lg:grid-cols-3"><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Clients</h2>{clients.map((user) => <div key={user.id} className="mt-5 flex items-center justify-between gap-4"><span className="font-serif text-2xl">{user.name}</span><span className="flex gap-2"><button onClick={() => updatePortalUser(user.id, { role: 'architect' }) && refresh()} className="font-mono text-[9px] uppercase text-stone-500">Make architect</button><button onClick={() => updatePortalUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' }) && refresh()} className="font-mono text-[9px] uppercase text-stone-500">{user.status}</button></span></div>)}</div><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Architects</h2>{architects.map((user) => <div key={user.id} className="mt-5"><div className="flex items-center justify-between gap-4"><span className="font-serif text-2xl">{user.name}</span><span className="flex gap-2"><button onClick={() => updatePortalUser(user.id, { role: 'client' }) && refresh()} className="font-mono text-[9px] uppercase text-stone-500">Make client</button><button onClick={() => updatePortalUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' }) && refresh()} className="font-mono text-[9px] uppercase text-stone-500">{user.status}</button></span></div><p className="mt-1 text-xs text-stone-500">{user.projectIds.length} assigned projects</p></div>)}</div><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Global approvals</h2>{db.approvals.map((approval) => <p key={approval.projectId} className="mt-5 flex justify-between gap-4 text-sm"><span>{approval.title}</span><span className="font-mono text-[9px] uppercase text-stone-500">{approval.status}</span></p>)}</div></section>
        <section id="portal-section-activity" className="grid gap-12 border-t border-black/15 pt-12 lg:grid-cols-2"><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Assign people to projects</h2>{projects.map((project) => <div key={project.id} className="mt-5"><p className="text-sm">{project.title}</p><div className="mt-2 flex flex-wrap gap-2">{[...clients, ...architects].map((user) => <button key={user.id} onClick={() => toggleAssignment(user.id, project.id)} className={`border px-2 py-1 font-mono text-[9px] uppercase ${user.projectIds.includes(project.id) ? 'border-black bg-black text-white' : 'border-black/15 text-stone-500'}`}>{user.name}</button>)}</div></div>)}</div><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Global notifications</h2>{db.notifications.map((notification) => <p key={`${notification.userId}-${notification.date}`} className="mt-5 flex justify-between gap-4 text-sm"><span>{notification.message}</span><span className="shrink-0 font-mono text-[9px] text-stone-500">{notification.date}</span></p>)}</div></section>
        <section id="portal-section-approvals" className="grid gap-12 border-t border-black/15 pt-12 lg:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Pending approvals</p>{pendingApprovals.map((approval) => <button key={`${approval.projectId}-${approval.title}`} onClick={() => onNavigate(`/admin/projects/${approval.projectId}`)} className="mt-5 flex w-full justify-between gap-4 border-b border-black/10 pb-4 text-left text-sm"><span>{approval.projectTitle} · {approval.title}</span><span className="font-mono text-[9px] uppercase text-stone-500">Review</span></button>)}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Notifications</p>{db.notifications.map((notification) => <p key={`${notification.userId}-${notification.date}`} className="mt-5 flex justify-between gap-4 text-sm"><span>{notification.message}</span><span className="shrink-0 font-mono text-[9px] text-stone-500">{notification.date}</span></p>)}</div></section>
        <section className="grid gap-12 border-t border-black/15 pt-12 lg:grid-cols-2"><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Recent activity</h2>{recentActivity.map((update) => <p key={`${update.projectId}-${update.date}-${update.title}`} className="mt-5 flex justify-between gap-4 text-sm"><span>{update.projectTitle} · {update.title}</span><span className="font-mono text-[9px] text-stone-500">{update.date}</span></p>)}</div><div><h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development controls</h2><p className="mt-5 text-sm leading-6 text-stone-600">Create, assign and advance projects from the register. Open any project or its model directly from the portfolio list.</p></div></section>
      </main>
      {createOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}><form role="dialog" aria-modal="true" aria-labelledby="create-project-title" onSubmit={(event) => { event.preventDefault(); createProject(); }} className="w-full max-w-xl border border-white/15 bg-[#11110f] p-7 text-[#f4efe8] shadow-2xl"><div className="flex items-start justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Administration</p><h2 id="create-project-title" className="mt-4 font-serif text-4xl">New project.</h2></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Close create project" className="border border-white/20 p-2 text-stone-300"><X className="h-4 w-4" /></button></div><div className="mt-8 space-y-5"><label className="block font-mono text-[9px] uppercase text-stone-400">Title<input autoFocus required value={newProject.title} onChange={(event) => setNewProject({ ...newProject, title: event.target.value })} className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none" /></label><label className="block font-mono text-[9px] uppercase text-stone-400">Category<input required value={newProject.category} onChange={(event) => setNewProject({ ...newProject, category: event.target.value })} className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="block font-mono text-[9px] uppercase text-stone-400">Phase<select value={newProject.phase} onChange={(event) => setNewProject({ ...newProject, phase: event.target.value })} className="mt-2 w-full border-b border-white/20 bg-[#11110f] py-3 text-sm text-white outline-none"><option>Brief and site study</option><option>Concept design</option><option>Design development</option><option>Documentation</option></select></label><label className="block font-mono text-[9px] uppercase text-stone-400">Initial progress<input required type="number" min="0" max="100" value={newProject.progress} onChange={(event) => setNewProject({ ...newProject, progress: event.target.value })} className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none" /></label></div></div><button type="submit" className="mt-8 w-full bg-[#f4efe8] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-black">Create project</button></form></div>}
    </div>
  );
};

const ProjectOverview: React.FC<{ project: PortalProject }> = ({ project }) => (
  <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
    <div>
      <p className="font-serif text-3xl font-light leading-snug sm:text-4xl">{project.statement}</p>
      <img src={project.image} alt={project.title} className="mt-10 aspect-[16/9] w-full object-cover" />
    </div>
    <dl className="divide-y divide-black/15 border-y border-black/15 text-sm">
      <div className="grid grid-cols-2 py-5"><dt className="text-stone-500">Current phase</dt><dd>{project.phase}</dd></div>
      <div className="grid grid-cols-2 py-5"><dt className="text-stone-500">Progress</dt><dd>{project.progress}%</dd></div>
      <div className="grid grid-cols-2 py-5"><dt className="text-stone-500">Next milestone</dt><dd>{project.nextMilestone}</dd></div>
      <div className="grid grid-cols-2 py-5"><dt className="text-stone-500">Model access</dt><dd>Available</dd></div>
    </dl>
  </div>
);

export const DashboardProjectPage: React.FC<NavigationProps & { projectId: string; onOpenWorkspace: () => void; onSignOut: () => void; homePath?: string; role?: PortalRole }> = ({ projectId, onNavigate, onOpenWorkspace, onSignOut, homePath = '/dashboard', role = 'client' }) => {
  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [activeTab, setActiveTab] = useState('Overview');
  const [progress, setProgress] = useState('');
  const [phase, setPhase] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [milestone, setMilestone] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [approvalTitle, setApprovalTitle] = useState('');
  const tabs = ['Overview', 'Updates', 'Milestones', 'Documents', 'Approvals', 'Model'];
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);
  const canManage = role === 'architect' || role === 'admin';
  const refresh = () => setSnapshot(getPortalSnapshot());
  const saveStatus = () => {
    const changes = {
      ...(progress !== '' ? { progress: Number(progress) } : {}),
      ...(phase !== '' ? { phase } : {}),
      ...(role === 'admin' && projectTitle.trim() ? { title: projectTitle.trim() } : {}),
    };
    if (Object.keys(changes).length) updatePortalProject(projectId, changes);
    refresh();
  };
  const addUpdate = () => { if (!updateTitle || !updateBody) return; addPortalUpdate({ projectId, date: '02 OCT 2026', title: updateTitle, body: updateBody }); setUpdateTitle(''); setUpdateBody(''); refresh(); };
  const addMilestone = () => { if (!milestone) return; addPortalMilestone({ projectId, label: milestone, status: 'Upcoming' }); setMilestone(''); refresh(); };
  const addDocument = () => { if (!documentName) return; addPortalDocument({ projectId, name: documentName, meta: 'PDF · Added in portal' }); setDocumentName(''); refresh(); };
  const requestApproval = () => { if (!approvalTitle) return; addPortalApproval({ projectId, title: approvalTitle, status: 'Pending' }); setApprovalTitle(''); refresh(); };

  if (!project) return <NotFoundPage onNavigate={onNavigate} />;

  return (
    <div className="portal-surface h-screen overflow-y-auto bg-[#f2efe8] text-[#171714]">
      <PortalHeader onNavigate={onNavigate} onSignOut={onSignOut} homePath={homePath} role={role} />
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
        <button onClick={() => onNavigate(homePath)} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-black">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </button>
        <div className="mt-10 grid gap-8 border-b border-black/15 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">{project.code} / {project.category}</p>
            <h1 className="mt-5 font-serif text-6xl font-light tracking-tight sm:text-7xl">{project.title}</h1>
          </div>
          <div className="min-w-64">
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500"><span>{project.phase}</span><span>{project.progress}%</span></div>
            <div className="mt-3 h-px bg-black/15"><div className="h-px bg-black" style={{ width: `${project.progress}%` }} /></div>
          </div>
        </div>

        <div className="flex gap-7 overflow-x-auto border-b border-black/15 py-5">
          {tabs.map((tab) => (
            <button
              key={tab}
              data-testid={`project-tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${activeTab === tab ? 'text-black' : 'text-stone-400 hover:text-stone-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="py-12">
          {activeTab === 'Overview' && <ProjectOverview project={project} />}
          {activeTab === 'Updates' && (
            <div className="divide-y divide-black/15 border-y border-black/15">
              {project.updates.map((update) => <article key={update.date + update.title} className="grid gap-4 py-8 md:grid-cols-[140px_1fr]"><p className="font-mono text-[10px] text-stone-500">{update.date}</p><div><h2 className="font-serif text-3xl">{update.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{update.body}</p></div></article>)}
            </div>
          )}
          {activeTab === 'Milestones' && (
            <ol className="divide-y divide-black/15 border-y border-black/15">
              {project.milestones.map((milestone, index) => <li key={milestone.label} className="grid grid-cols-[60px_1fr_auto] items-center py-6"><span className="font-mono text-[10px] text-stone-500">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-2xl">{milestone.label}</span><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{milestone.status}</span></li>)}
            </ol>
          )}
          {activeTab === 'Documents' && (
            <div className="divide-y divide-black/15 border-y border-black/15">
              {project.documents.map((document) => <div key={document.name} className="flex items-center justify-between gap-6 py-6"><div className="flex items-center gap-4"><FileText className="h-4 w-4" /><div><p className="font-serif text-xl">{document.name}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-stone-500">{document.meta}</p></div></div><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Available</span></div>)}
            </div>
          )}
          {activeTab === 'Approvals' && (
            <div className="divide-y divide-black/15 border-y border-black/15">
              {project.approvals.map((approval) => <div key={approval.title} className="flex items-center justify-between gap-6 py-6"><p className="font-serif text-2xl">{approval.title}</p><span className="flex items-center gap-3"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">{approval.status}</span>{role === 'client' && approval.status === 'Pending' && <><button onClick={() => { updatePortalApproval(projectId, approval.title, 'Approved'); refresh(); }} className="border border-black px-3 py-2 font-mono text-[9px] uppercase">Approve</button><button onClick={() => { updatePortalApproval(projectId, approval.title, 'Rejected'); refresh(); }} className="border border-black/15 px-3 py-2 font-mono text-[9px] uppercase text-stone-500">Reject</button></>}{canManage && <button onClick={() => { updatePortalApproval(projectId, approval.title, approval.status === 'Approved' ? 'Pending' : 'Approved'); refresh(); }} className="border border-black px-3 py-2 font-mono text-[9px] uppercase">{approval.status === 'Approved' ? 'Reopen' : 'Resolve'}</button>}</span></div>)}
            </div>
          )}
          {activeTab === 'Model' && (
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div><Box className="h-6 w-6" /><h2 className="mt-8 font-serif text-4xl">Current project model</h2><p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">Open the project model in the existing ARCH_TECH workspace.</p></div>
              <button data-testid="open-3d-model" onClick={onOpenWorkspace} className="group inline-flex items-center justify-between gap-12 bg-[#171714] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition-transform active:translate-y-px">Open 3D Model <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
            </div>
          )}
        </section>
        {canManage && <section data-testid="role-management-panel" className="border-t border-black/15 py-12"><div className="flex items-end justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{role === 'admin' ? 'Administration' : 'Studio management'}</p><h2 className="mt-4 font-serif text-4xl">Project controls.</h2></div>{role === 'admin' && <div className="flex flex-wrap items-center justify-end gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">{project.published ? 'Public portfolio' : 'Private project'}</span><button data-testid="toggle-publication" onClick={() => { updatePortalProject(projectId, { published: !project.published }); refresh(); }} className="border border-black/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">{project.published ? 'Remove from public portfolio' : 'Publish to public portfolio'}</button><button onClick={() => { updatePortalProject(projectId, { archived: true }); onNavigate(homePath); }} className="border border-black/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Archive project</button></div>}</div><div className="mt-8 grid gap-8 lg:grid-cols-2"><div className="space-y-4">{role === 'admin' && <label className="block font-mono text-[9px] uppercase text-stone-500">Project title<input aria-label="Project title" value={projectTitle || project.title} onChange={(event) => setProjectTitle(event.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label>}<label className="block font-mono text-[9px] uppercase text-stone-500">Progress / phase<input aria-label="Project progress" type="number" value={progress || project.progress} onChange={(event) => setProgress(event.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /><select aria-label="Project phase" value={phase || project.phase} onChange={(event) => setPhase(event.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none"><option>Brief and site study</option><option>Concept design</option><option>Design development</option><option>Documentation</option></select></label><button onClick={saveStatus} className="bg-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white">Save status</button></div><div className="space-y-4"><label className="block font-mono text-[9px] uppercase text-stone-500">Create project update<input aria-label="Update title" value={updateTitle} onChange={(event) => setUpdateTitle(event.target.value)} placeholder="Update title" className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /><textarea aria-label="Update body" value={updateBody} onChange={(event) => setUpdateBody(event.target.value)} placeholder="What changed?" className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label><button onClick={addUpdate} className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Publish update</button></div><div className="space-y-4"><label className="block font-mono text-[9px] uppercase text-stone-500">Manage milestones<input aria-label="New milestone" value={milestone} onChange={(event) => setMilestone(event.target.value)} placeholder="Milestone name" className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label><button onClick={addMilestone} className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Add milestone</button></div><div className="space-y-4"><label className="block font-mono text-[9px] uppercase text-stone-500">Issue document<input aria-label="New document" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Document name" className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label><button onClick={addDocument} className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Add document</button></div><div className="space-y-4"><label className="block font-mono text-[9px] uppercase text-stone-500">Client approval request<input aria-label="New approval" value={approvalTitle} onChange={(event) => setApprovalTitle(event.target.value)} placeholder="Approval request" className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label><button onClick={requestApproval} className="border border-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em]">Request approval</button></div><div><p className="font-mono text-[9px] uppercase text-stone-500">Project activity</p>{project.updates.slice(0, 3).map((update) => <p key={update.date + update.title} className="mt-4 text-sm text-stone-600">{update.date} · {update.title}</p>)}</div></div></section>}
      </main>
    </div>
  );
};

export const PublicProjectPage: React.FC<NavigationProps & { projectId: string }> = ({ projectId, onNavigate }) => {
  const project = getPublicProject(projectId);
  if (!project) return <NotFoundPage onNavigate={onNavigate} />;

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0b0d] text-[#f4efe8]">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <button onClick={() => onNavigate('/')} className="font-mono text-sm tracking-[0.24em]">ARCH_TECH</button>
        <button onClick={() => onNavigate('/login')} className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-300 hover:text-white">Client Login</button>
      </header>
      <main>
        <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 sm:px-8 lg:px-12 lg:pb-8 lg:pt-14">
          <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Development portfolio</button>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">{project.code} / {project.category}</p>
          <h1 className="mt-4 max-w-5xl font-serif text-5xl font-light tracking-tight sm:text-7xl lg:text-8xl">{project.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">{project.summary}</p>
          <dl className="mt-8 grid max-w-5xl gap-4 border-y border-white/[0.12] py-5 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div><dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Market</dt><dd className="mt-1.5 text-stone-200">{project.market ?? 'Costa Rica'}</dd></div>
            <div><dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Development</dt><dd className="mt-1.5 text-stone-200">{project.developmentType ?? project.category}</dd></div>
            <div><dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Current stage</dt><dd className="mt-1.5 text-stone-200">{project.publicStage ?? project.phase}</dd></div>
            <div><dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Context</dt><dd className="mt-1.5 text-stone-200">{project.context ?? 'Costa Rica'}</dd></div>
            <div><dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">Scale</dt><dd className="mt-1.5 text-stone-200">{project.scale ?? 'Project study'}</dd></div>
          </dl>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-2 sm:px-8 lg:px-12 lg:pb-16 lg:pt-4">
          <SpatialRail project={project} />
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[0.35fr_1fr] lg:px-12 lg:py-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Project intent</p>
          <p className="max-w-3xl font-serif text-3xl font-light leading-snug sm:text-4xl">{project.statement}</p>
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/[0.08] px-6 py-20 sm:px-8 lg:grid-cols-[0.35fr_1fr] lg:px-12 lg:py-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Long view</p>
          <p className="max-w-3xl font-serif text-3xl font-light leading-snug text-stone-200 sm:text-4xl">{project.longView ?? 'Clear decisions, durable materials and a place that can remain useful over time.'}</p>
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/[0.08] px-6 py-20 sm:px-8 lg:grid-cols-[0.35fr_1fr] lg:px-12 lg:py-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Development path</p>
          <ol className="divide-y divide-white/[0.1] border-y border-white/[0.1]">
            {project.milestones.map((milestone, index) => <li key={milestone.label} className="grid gap-4 py-5 sm:grid-cols-[50px_1fr_auto] sm:items-center"><span className="font-mono text-[10px] text-stone-500">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-2xl font-light">{milestone.label}</span><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{milestone.status}</span></li>)}
          </ol>
        </div>
      </main>
    </div>
  );
};

export const NotFoundPage: React.FC<NavigationProps> = ({ onNavigate }) => (
  <main className="flex h-screen flex-col items-center justify-center bg-[#f2efe8] px-6 text-center text-[#171714]">
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">404</p>
    <h1 className="mt-5 font-serif text-5xl">Project not found.</h1>
    <button onClick={() => onNavigate('/')} className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]"><ArrowLeft className="h-3.5 w-3.5" /> Return home</button>
  </main>
);

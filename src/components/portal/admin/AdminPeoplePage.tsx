import React, { useEffect, useState } from 'react';
import { getPortalSnapshot, PortalRole } from '../../../portal/data';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { NavigationProps } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

export const AdminPeoplePage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell } = usePortalShell();
  const { adminPortal } = useLocale();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [userError, setUserError] = useState('');
  const [operationFeedback, setOperationFeedback] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client' as PortalRole,
  });

  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);
  const clients = db.users.filter((user) => user.role === 'client');
  const architects = db.users.filter((user) => user.role === 'architect');
  const assignableUsers = [...clients, ...architects].filter((user) => user.status === 'active');

  const refresh = () => setSnapshot(getPortalSnapshot());

  useEffect(() => {
    if (!projectService.isRemote()) return;
    void Promise.all([projectService.list(), userService.list()]).then(refresh);
  }, []);

  const toggleAssignment = async (userId: string, projectId: string) => {
    const current = getPortalSnapshot().db;
    const user = current.users.find((candidate) => candidate.id === userId);
    const project = current.projects.find((candidate) => candidate.id === projectId);
    if (!user || user.status !== 'active' || !['client', 'architect'].includes(user.role) || !project || project.archived === true)
      return;
    const projectIds = user.projectIds.includes(projectId)
      ? user.projectIds.filter((id) => id !== projectId)
      : [...user.projectIds, projectId];
    try {
      await userService.update(userId, { projectIds });
      refresh();
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Assignment could not be saved.');
    }
  };

  const createUser = async () => {
    setUserError('');
    try {
      const user = await userService.create({ ...newUser, status: 'active', projectIds: [] });
      setNewUser({ name: '', email: '', password: '', role: 'client' });
      setOperationFeedback(`${user.name} was added as an active ${user.role}.`);
      refresh();
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Unable to create the user.');
    }
  };

  const updateUser = async (id: string, changes: Parameters<typeof userService.update>[1]) => {
    await userService.update(id, changes);
    setOperationFeedback('User access updated.');
    refresh();
  };

  const editUserName = async (userId: string, currentName: string) => {
    const nextName = window.prompt('Update user name', currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    try {
      await updateUser(userId, { name: nextName });
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Unable to update the user.');
    }
  };

  const content = (
    <div className="space-y-12">
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {adminPortal.peopleEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {adminPortal.peopleHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {adminPortal.peopleSubtitle}
        </p>
        {operationFeedback && (
          <p role="status" className="mt-4 text-sm text-stone-600">
            {operationFeedback}
          </p>
        )}
      </div>

      {/* People register: Clients & Architects */}
      <section id="portal-section-people" className="grid gap-12 lg:grid-cols-2" aria-label="People register">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Clients</h2>
          <div className="mt-4 divide-y divide-black/15 border-y border-black/15">
            {clients.map((user) => (
              <div key={user.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block font-serif text-2xl">{user.name}</span>
                  <span className="font-mono text-[10px] text-stone-500">{user.email}</span>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => void editUserName(user.id, user.name)}
                    className="font-mono text-[9px] uppercase text-stone-500 hover:text-black"
                  >
                    Edit name
                  </button>
                  <button
                    onClick={() => void updateUser(user.id, { role: 'architect' })}
                    className="font-mono text-[9px] uppercase text-stone-500 hover:text-black"
                  >
                    Make architect
                  </button>
                  <button
                    onClick={() => void updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })}
                    className={`font-mono text-[9px] uppercase ${user.status === 'active' ? 'text-stone-700' : 'text-stone-400'}`}
                  >
                    {user.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Architects</h2>
          <div className="mt-4 divide-y divide-black/15 border-y border-black/15">
            {architects.map((user) => (
              <div key={user.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block font-serif text-2xl">{user.name}</span>
                    <span className="font-mono text-[10px] text-stone-500">{user.email}</span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => void editUserName(user.id, user.name)}
                      className="font-mono text-[9px] uppercase text-stone-500 hover:text-black"
                    >
                      Edit name
                    </button>
                    <button
                      onClick={() => void updateUser(user.id, { role: 'client' })}
                      className="font-mono text-[9px] uppercase text-stone-500 hover:text-black"
                    >
                      Make client
                    </button>
                    <button
                      onClick={() => void updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })}
                      className={`font-mono text-[9px] uppercase ${user.status === 'active' ? 'text-stone-700' : 'text-stone-400'}`}
                    >
                      {user.status}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-stone-500">{user.projectIds.length} assigned developments</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assign People to Projects */}
      <section id="portal-section-activity" className="border-t border-black/15 pt-10" aria-label="Project assignments">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
          Assign people to projects
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Toggle client and architect team access for each active development in the portfolio.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              data-testid={`admin-assignment-project-${project.id}`}
              className="border border-black/15 bg-white/40 p-5"
            >
              <p className="font-serif text-xl">{project.title}</p>
              <p className="font-mono text-[10px] text-stone-500 mt-0.5">{project.code} · {project.phase}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {assignableUsers.map((user) => (
                  <button
                    key={user.id}
                    data-testid={`admin-assignment-${project.id}-${user.id}`}
                    onClick={() => toggleAssignment(user.id, project.id)}
                    className={`border px-2 py-1 font-mono text-[9px] uppercase transition-colors ${
                      user.projectIds.includes(project.id)
                        ? 'border-black bg-black text-white'
                        : 'border-black/15 bg-white/50 text-stone-600 hover:border-black'
                    }`}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Portal Access Section */}
      <section className="border-t border-black/15 pt-10" aria-labelledby="create-user-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">People management</p>
            <h2 id="create-user-title" className="mt-2 font-serif text-3xl">
              Add portal access.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-stone-600">
            Create an active client or architect account, then assign projects from the register above.
          </p>
        </div>

        <form
          className="mt-7 grid gap-4 border-y border-black/15 py-6 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void createUser();
          }}
        >
          <label className="font-mono text-[9px] uppercase text-stone-500">
            Name
            <input
              required
              value={newUser.name}
              onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
              className="mt-2 w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </label>

          <label className="font-mono text-[9px] uppercase text-stone-500">
            Email
            <input
              required
              type="email"
              value={newUser.email}
              onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
              className="mt-2 w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </label>

          <label className="font-mono text-[9px] uppercase text-stone-500">
            Temporary password
            <input
              required
              minLength={8}
              value={newUser.password}
              onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
              className="mt-2 w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </label>

          <label className="font-mono text-[9px] uppercase text-stone-500">
            Role
            <select
              value={newUser.role}
              onChange={(event) => setNewUser({ ...newUser, role: event.target.value as PortalRole })}
              className="mt-2 w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none"
            >
              <option value="client">Client</option>
              <option value="architect">Architect</option>
            </select>
          </label>

          <button
            data-testid="create-user"
            type="submit"
            className="self-end bg-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white hover:bg-stone-800"
          >
            Add user
          </button>
        </form>

        {userError && (
          <p role="alert" className="mt-3 text-sm text-stone-600">
            {userError}
          </p>
        )}
      </section>
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

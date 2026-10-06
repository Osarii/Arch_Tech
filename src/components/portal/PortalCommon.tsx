import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Cpu, Send, Sparkles, X } from 'lucide-react';
import {
  PortalProject,
  PortalRole,
} from '../../portal/data';
import { getPreferredProjectImage } from '../gallery/projectMedia';
import {
  externalContextService,
  type ExternalContext,
  type ResolvedLocation,
  type SeismicContext,
  ExternalContextError,
} from '../../services/externalContextService';
import { projectService } from '../../services/projectService';
import { automationService } from '../../services/automationService';
import { bimAgent } from '../../bim/ai/AIAgent';
import { aiService } from '../../services/aiService';
import { AIMessage } from '../../types/bim';
import { portalAuth } from '../../portal/demoAuth';
import { useLocale } from '../../portal/locale';

export type Navigate = (path: string) => void;

export interface NavigationProps {
  onNavigate: Navigate;
}

export const formatPortalDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

export const portalStatusClass = (status: string) =>
  status === 'Pending'
    ? 'portal-status-pending'
    : status === 'Approved' || status === 'Complete'
      ? 'portal-status-approved'
      : status === 'Rejected'
        ? 'portal-status-rejected'
        : status === 'Upcoming'
          ? 'portal-status-upcoming'
          : status === 'Current'
            ? 'portal-status-current'
            : '';

export const uniqueProjectMedia = (project: PortalProject) =>
  [project.image, ...(project.media?.gallery ?? []), project.media?.aerial, project.media?.campusOverview, project.media?.masterplan]
    .filter((path, index, paths): path is string => Boolean(path) && paths.indexOf(path) === index)
    .slice(0, 3);

export const projectRoute = (role: PortalRole, id: string) =>
  `${role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard'}/projects/${id}`;

export const ProjectThumbnail: React.FC<{ project: PortalProject }> = ({ project }) => {
  const image = getPreferredProjectImage(project);
  const [imageAvailable, setImageAvailable] = useState(Boolean(image));
  if (!imageAvailable) {
    return (
      <span className="portal-project-thumbnail portal-project-thumbnail-fallback" aria-label="Project image unavailable">
        <span>ARCH / PROJECT</span>
      </span>
    );
  }
  return (
    <img
      src={image}
      alt={`${project.title} project image`}
      loading="lazy"
      decoding="async"
      onError={() => setImageAvailable(false)}
      className="portal-project-thumbnail object-cover"
    />
  );
};

export const ProjectMediaFrame: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
  const [imageAvailable, setImageAvailable] = useState(Boolean(src));
  if (!imageAvailable) {
    return (
      <div className={`portal-project-media-frame portal-project-thumbnail-fallback ${className}`} role="img" aria-label={`${alt} image unavailable`}>
        <span>ARCH / PROJECT</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setImageAvailable(false)}
      className={`portal-project-media-frame object-cover ${className}`}
    />
  );
};

export const ProjectIdentityButton: React.FC<{
  project: PortalProject;
  onNavigate: Navigate;
  detailPath: (id: string) => string;
  meta?: React.ReactNode;
  testId?: string;
}> = ({ project, onNavigate, detailPath, meta = project.category, testId }) => (
  <button
    data-testid={testId}
    onClick={() => onNavigate(detailPath(project.id))}
    className="portal-project-identity grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
  >
    <ProjectThumbnail project={project} />
    <span className="min-w-0">
      <span className="block truncate font-mono text-[10px] text-stone-500">{project.code}</span>
      <span className="mt-1 block font-serif text-2xl leading-tight">{project.title}</span>
      <span className="mt-1 block truncate text-xs text-stone-500">{meta}</span>
    </span>
  </button>
);

export const PortalEmptyState: React.FC<{ message: string }> = ({ message }) => (
  <p className="portal-empty-state border-y border-black/15 py-8 text-sm leading-6 text-stone-600">{message}</p>
);

const getWeatherCodeLabel = (code: number): string => {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45:
    case 48: return 'Fog';
    case 51:
    case 53:
    case 55: return 'Drizzle';
    case 61:
    case 63:
    case 65: return 'Rain';
    case 71:
    case 73:
    case 75: return 'Snow';
    case 80:
    case 81:
    case 82: return 'Rain showers';
    case 95:
    case 96:
    case 99: return 'Thunderstorm';
    default: return 'Observed conditions';
  }
};

export const ExternalContextPanel: React.FC = () => {
  const [query, setQuery] = useState('San José, Costa Rica');
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const [weather, setWeather] = useState<ExternalContext | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [seismic, setSeismic] = useState<SeismicContext | null>(null);
  const [seismicStatus, setSeismicStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [seismicError, setSeismicError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();

    setResolvedLocation(null);
    setWeather(null);
    setWeatherStatus('idle');
    setWeatherError(null);
    setSeismic(null);
    setSeismicStatus('idle');
    setSeismicError(null);
    setLocationError(null);

    if (!cleanQuery) {
      setLocationStatus('error');
      setLocationError('Enter a location to analyze.');
      return;
    }

    setLocationStatus('loading');

    let location: ResolvedLocation;
    try {
      location = await externalContextService.geocode(cleanQuery);
      setResolvedLocation(location);
      setLocationStatus('idle');
    } catch (err) {
      setLocationStatus('error');
      setLocationError(err instanceof ExternalContextError ? err.message : 'Location search is temporarily unavailable.');
      return;
    }

    setWeatherStatus('loading');
    setSeismicStatus('loading');

    const [weatherResult, seismicResult] = await Promise.allSettled([
      externalContextService.getWeather(location),
      externalContextService.getSeismicContext(location),
    ]);

    if (weatherResult.status === 'fulfilled') {
      setWeather(weatherResult.value);
      setWeatherStatus('idle');
    } else {
      setWeatherStatus('error');
      setWeatherError(
        weatherResult.reason instanceof ExternalContextError
          ? weatherResult.reason.message
          : 'Weather is temporarily unavailable.',
      );
    }

    if (seismicResult.status === 'fulfilled') {
      setSeismic(seismicResult.value);
      setSeismicStatus('idle');
    } else {
      setSeismicStatus('error');
      setSeismicError(
        seismicResult.reason instanceof ExternalContextError
          ? seismicResult.reason.message
          : 'Seismic context is temporarily unavailable.',
      );
    }
  };

  return (
    <section aria-label="Site intelligence and external context" className="border-b border-black/15 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Site intelligence · External context</p>
          <p className="mt-2 text-sm text-stone-600">Environmental and seismic context across project coordinates.</p>
        </div>
      </div>

      <form onSubmit={handleAnalyze} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter location (e.g. San José, Costa Rica)"
          aria-label="Location for site intelligence"
          data-testid="site-intelligence-input"
          className="min-w-[260px] flex-1 border border-black/20 bg-white/70 px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-black focus:outline-none"
        />
        <button
          type="submit"
          data-testid="site-intelligence-analyze"
          disabled={locationStatus === 'loading' || weatherStatus === 'loading' || seismicStatus === 'loading'}
          className="border border-black/20 bg-black px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {locationStatus === 'loading'
            ? 'Locating…'
            : weatherStatus === 'loading' || seismicStatus === 'loading'
              ? 'Analyzing…'
              : 'Analyze Site'}
        </button>
        <button
          type="button"
          data-testid="load-external-context"
          onClick={() => { void handleAnalyze(); }}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          Load context
        </button>
      </form>

      {locationStatus === 'error' && (
        <p role="alert" data-testid="site-intelligence-location-error" className="mt-4 text-sm text-stone-600">
          {locationError ?? 'Location search is temporarily unavailable.'}
        </p>
      )}

      {resolvedLocation && (
        <div
          data-testid="site-intelligence-location"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 border-l-2 border-stone-800 bg-stone-100/60 px-3 py-2 text-xs"
        >
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">Resolved Location: </span>
            <span className="font-semibold text-stone-800">{resolvedLocation.displayName}</span>
          </div>
          <div className="font-mono text-[10px] text-stone-500">
            {resolvedLocation.latitude.toFixed(4)}°, {resolvedLocation.longitude.toFixed(4)}°
          </div>
        </div>
      )}

      {(weather || weatherStatus !== 'idle' || seismic || seismicStatus !== 'idle') && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Weather Card */}
          <div data-testid="site-intelligence-weather" className="border border-black/10 bg-white/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">Live Weather Context</p>
            {weatherStatus === 'loading' && (
              <p role="status" className="mt-3 text-xs text-stone-500">Gathering current atmospheric conditions…</p>
            )}
            {weatherStatus === 'error' && (
              <p role="alert" data-testid="site-intelligence-weather-error" className="mt-3 text-xs text-stone-600">
                {weatherError ?? 'Weather is temporarily unavailable.'}
              </p>
            )}
            {weather && (
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light text-stone-900">{weather.temperature}°C</span>
                  <span className="text-xs text-stone-600">· {getWeatherCodeLabel(weather.weatherCode)} (WMO {weather.weatherCode})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-2 font-mono text-[11px] text-stone-600">
                  <div>Precipitation: {weather.precipitation != null ? `${weather.precipitation} mm` : 'N/A'}</div>
                  <div>Wind: {weather.windSpeed != null ? `${weather.windSpeed} km/h` : 'N/A'}</div>
                </div>
                {weather.observedAt && (
                  <p className="font-mono text-[10px] text-stone-400">Observed: {weather.observedAt}</p>
                )}
              </div>
            )}
          </div>

          {/* Seismic Card */}
          <div data-testid="site-intelligence-seismic" className="border border-black/10 bg-white/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">Recent Seismic Context</p>
              <span className="font-mono text-[9px] text-stone-400">300 km · 30 days</span>
            </div>
            {seismicStatus === 'loading' && (
              <p role="status" className="mt-3 text-xs text-stone-500">Querying USGS earthquake catalog…</p>
            )}
            {seismicStatus === 'error' && (
              <p role="alert" data-testid="site-intelligence-seismic-error" className="mt-3 text-xs text-stone-600">
                {seismicError ?? 'Seismic context is temporarily unavailable.'}
              </p>
            )}
            {seismic && (
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light text-stone-900">{seismic.eventCount}</span>
                  <span className="text-xs text-stone-600">events recorded within 300 km</span>
                </div>
                {seismic.eventCount === 0 ? (
                  <p className="text-xs text-stone-500">No seismic events recorded within 300 km in the last 30 days.</p>
                ) : (
                  <div className="space-y-1.5 border-t border-black/5 pt-2 font-mono text-[11px] text-stone-600">
                    {seismic.strongest && (
                      <div>
                        <span className="uppercase text-stone-400">Strongest:</span> M{seismic.strongest.magnitude.toFixed(1)} · {seismic.strongest.place} ({seismic.strongest.distanceKm} km)
                      </div>
                    )}
                    {seismic.nearest && (
                      <div>
                        <span className="uppercase text-stone-400">Nearest:</span> M{seismic.nearest.magnitude.toFixed(1)} · {seismic.nearest.place} ({seismic.nearest.distanceKm} km)
                      </div>
                    )}
                    {seismic.mostRecent && (
                      <div>
                        <span className="uppercase text-stone-400">Recent:</span> M{seismic.mostRecent.magnitude.toFixed(1)} · {seismic.mostRecent.place}
                      </div>
                    )}
                  </div>
                )}
                <p className="pt-2 font-mono text-[9px] leading-tight text-stone-400">
                  Contextual seismic observations for site planning; not a structural safety assessment or predictive hazard guarantee.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-400">
        <span>Data sources:</span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          © OpenStreetMap contributors
        </a>
        <span>·</span>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          Weather data by Open-Meteo.com
        </a>
        <span>·</span>
        <a
          href="https://earthquake.usgs.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          USGS Earthquake Hazards Program
        </a>
      </div>
    </section>
  );
};

export const ProjectRows: React.FC<{
  projects: PortalProject[];
  onNavigate: Navigate;
  detailPath: (id: string) => string;
  onOpenWorkspace?: () => void;
}> = ({ projects, onNavigate, detailPath, onOpenWorkspace }) => (
  <div className="divide-y divide-black/15 border-y border-black/15">
    {projects.map((project) => (
      <div
        key={project.id}
        className="portal-register-row group grid w-full gap-5 py-5 text-left transition-colors hover:bg-white/35 sm:grid-cols-[minmax(0,1fr)_150px_180px_auto] sm:items-center sm:px-3"
      >
        <ProjectIdentityButton project={project} onNavigate={onNavigate} detailPath={detailPath} />
        <span className="text-xs text-stone-600">
          <span className="block">{project.phase}</span>
          {project.approvals.some((approval) => approval.status === 'Pending') && (
            <span className="portal-status-pending mt-2 block font-mono text-[9px] uppercase tracking-[0.12em]">Approval pending</span>
          )}
        </span>
        <span>
          <span className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </span>
          <span className="portal-progress-track block h-px bg-black/15">
            <span className="portal-progress-fill block h-px bg-black" style={{ width: `${project.progress}%` }} />
          </span>
        </span>
        <span className="portal-register-actions flex items-center gap-3">
          <button onClick={() => onNavigate(detailPath(project.id))} className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black">
            Open
          </button>
          {onOpenWorkspace && (
            <button
              data-testid={`admin-open-model-${project.id}`}
              onClick={onOpenWorkspace}
              className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black"
            >
              Model
            </button>
          )}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    ))}
  </div>
);

export const DEFAULT_NEW_PROJECT_CATEGORY = 'Development · New project';

export const CreateProjectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: (feedback: string) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}> = ({ open, onClose, onSuccess, triggerRef }) => {
  const [newProject, setNewProject] = useState({
    title: '',
    category: DEFAULT_NEW_PROJECT_CATEGORY,
    phase: 'Brief and site study',
    progress: '0',
  });
  const [createError, setCreateError] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>('button, input, select, textarea') ?? []).filter(
        (element) => !element.hasAttribute('disabled'),
      );
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }
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
  }, [open, onClose, triggerRef]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = newProject.title.trim();
    const category = newProject.category.trim();
    const progress = Number(newProject.progress);
    if (!title || !category || newProject.progress.trim() === '' || !Number.isFinite(progress) || progress < 0 || progress > 100) {
      setCreateError('Enter a project title, category, and a progress value from 0 to 100.');
      return;
    }
    setCreateError('');
    setCreatingProject(true);
    try {
      const project = await projectService.create({ title, category, phase: newProject.phase, progress });
      await automationService.emit({ event: 'project.created', projectId: project.id, message: `Project ${project.title} created.` });
      setNewProject({ title: '', category: DEFAULT_NEW_PROJECT_CATEGORY, phase: 'Brief and site study', progress: '0' });
      onClose();
      triggerRef?.current?.focus();
      onSuccess('Project created and added to the register.');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Project could not be created.');
    } finally {
      setCreatingProject(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !creatingProject && onClose()}
    >
      <form
        ref={dialogRef}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onSubmit={handleSubmit}
        className="w-full max-w-xl border border-white/15 bg-[#11110f] p-7 text-[#f4efe8] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Administration</p>
            <h2 id="create-project-title" className="mt-4 font-serif text-4xl">New project.</h2>
          </div>
          <button
            type="button"
            disabled={creatingProject}
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            aria-label="Close create project"
            className="border border-white/20 p-2 text-stone-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 space-y-5">
          <label className="block font-mono text-[9px] uppercase text-stone-400">
            Title
            <input
              required
              disabled={creatingProject}
              value={newProject.title}
              onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block font-mono text-[9px] uppercase text-stone-400">
            Category
            <input
              required
              disabled={creatingProject}
              value={newProject.category}
              onChange={(event) => setNewProject({ ...newProject, category: event.target.value })}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block font-mono text-[9px] uppercase text-stone-400">
              Phase
              <select
                disabled={creatingProject}
                value={newProject.phase}
                onChange={(event) => setNewProject({ ...newProject, phase: event.target.value })}
                className="mt-2 w-full border-b border-white/20 bg-[#11110f] py-3 text-sm text-white outline-none"
              >
                <option>Brief and site study</option>
                <option>Concept design</option>
                <option>Design development</option>
                <option>Documentation</option>
              </select>
            </label>
            <label className="block font-mono text-[9px] uppercase text-stone-400">
              Initial progress
              <input
                required
                disabled={creatingProject}
                type="number"
                min="0"
                max="100"
                step="1"
                value={newProject.progress}
                onChange={(event) => setNewProject({ ...newProject, progress: event.target.value })}
                className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none"
              >
              </input>
            </label>
          </div>
        </div>
        {createError && <p role="alert" className="mt-5 text-xs text-red-300">{createError}</p>}
        <button
          disabled={creatingProject}
          type="submit"
          className="mt-8 w-full bg-[#f4efe8] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-black disabled:opacity-50"
        >
          {creatingProject ? 'Creating project…' : 'Create project'}
        </button>
      </form>
    </div>
  );
};

export const PortalAIAssistantView: React.FC<{
  role: PortalRole;
  onNavigate: Navigate;
}> = ({ role, onNavigate }) => {
  const { locale, t } = useLocale();
  const aiT = t.portalAi;
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = bimAgent.subscribe((msgs) => setMessages(msgs));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isProcessing) return;
    setInputPrompt('');
    setIsProcessing(true);
    try {
      await bimAgent.sendMessage(text);
    } catch (err) {
      console.error('Portal AI message error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts =
    role === 'client'
      ? aiT.quickPrompts.client
      : role === 'architect'
        ? aiT.quickPrompts.architect
        : aiT.quickPrompts.admin;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/15 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{aiT.heading}</span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {aiT.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-black/15 bg-white/40 px-2.5 py-1 text-[10px] font-mono text-stone-600">
            <Cpu className="h-3 w-3 text-emerald-600" />
            <span>{aiService.isConfigured() ? aiT.remoteStatus : aiT.offlineStatus}</span>
          </div>
          <button
            onClick={() => bimAgent.clearHistory()}
            data-testid="ai-btn-clear"
            className="border border-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-600 hover:text-black hover:border-black"
            title={aiT.clearHistory}
          >
            {aiT.clearHistory}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{aiT.quickPromptsLabel}</span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isProcessing}
            className="border border-black/15 bg-white/50 px-3 py-1 font-mono text-[9px] text-stone-700 transition-colors hover:border-black hover:bg-white disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex h-96 flex-col border border-black/15 bg-[#E6DED2] p-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-stone-500">
              <Bot className="h-8 w-8 stroke-1 text-stone-400" />
              <p className="mt-3 font-serif text-xl text-stone-700">{aiT.emptyTitle}</p>
              <p className="mt-1 max-w-sm text-xs text-stone-500">
                {aiT.emptyDescription}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'border border-black/15 bg-white text-stone-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.toolCalls?.map((tc, idx) => (
                    <div
                      key={idx}
                      data-testid={`ai-tool-call-${tc.toolName}`}
                      className="mt-2 border-t border-stone-200 pt-1.5 font-mono text-[9px] text-stone-500"
                    >
                      <span className="font-semibold">{tc.toolName}</span>: {tc.category}
                    </div>
                  ))}
                  {msg.proposal && (
                    <div data-testid="ai-proposal-card" className="mt-3 border border-amber-500/40 bg-amber-50 p-2 text-stone-800">
                      <p className="font-mono text-[9px] font-semibold uppercase text-amber-700">{aiT.writeConfirmation}</p>
                      <p className="mt-1 text-xs">{msg.proposal.toolName}: {msg.proposal.description}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => bimAgent.confirmProposal(msg.proposal!.proposalId)}
                          className="bg-black px-2.5 py-1 font-mono text-[9px] uppercase text-white"
                        >
                          {aiT.confirm}
                        </button>
                        <button
                          onClick={() => bimAgent.rejectProposal(msg.proposal!.proposalId)}
                          className="border border-black/20 px-2.5 py-1 font-mono text-[9px] uppercase text-stone-600"
                        >
                          {aiT.reject}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex gap-2 border-t border-black/15 pt-3"
        >
          <input
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder={aiT.inputPlaceholder}
            className="flex-1 border border-black/20 bg-white px-3 py-2 text-xs outline-none placeholder:text-stone-400 focus:border-black"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputPrompt.trim()}
            className="flex items-center gap-1.5 bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white disabled:opacity-40"
          >
            <span>{aiT.send}</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/15 pt-6">
        <div>
          <p className="font-serif text-xl">{locale === 'es' ? 'Espacio de Trabajo de Ingeniería 3D' : '3D Engineering Workspace'}</p>
          <p className="text-xs text-stone-600">
            {locale === 'es'
              ? 'Abra el espacio WebGL en vivo para inspeccionar fragmentos, conjuntos de propiedades y modificaciones visuales del modelo.'
              : 'Open the live WebGL workspace to inspect fragments, property sets, and visual model modifications.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/workspace')}
          className="bg-black px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white hover:bg-stone-800"
        >
          Open 3D Model →
        </button>
      </div>
    </div>
  );
};

export const ProjectNavigation: React.FC<{
  previous?: PortalProject;
  next?: PortalProject;
  onNavigate: Navigate;
  role: PortalRole;
}> = ({ previous, next, onNavigate, role }) => (
  <nav aria-label="Project navigation" className="portal-project-navigation grid gap-3 border-y border-black/15 py-4 sm:grid-cols-2">
    <button
      type="button"
      data-testid="previous-project"
      disabled={!previous}
      onClick={() => previous && onNavigate(projectRoute(role, previous.id))}
      className="text-left disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">← Previous project</span>
      <span className="mt-1 block font-serif text-xl">{previous?.title ?? 'First project in scope'}</span>
    </button>
    <button
      type="button"
      data-testid="next-project"
      disabled={!next}
      onClick={() => next && onNavigate(projectRoute(role, next.id))}
      className="text-left sm:text-right"
    >
      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">Next project →</span>
      <span className="mt-1 block font-serif text-xl">{next?.title ?? 'Last project in scope'}</span>
    </button>
  </nav>
);

export const ProjectOverview: React.FC<{ project: PortalProject }> = ({ project }) => {
  const media = uniqueProjectMedia(project);
  const facts: [string, string][] = [
    ['Market', project.market],
    ['Development type', project.developmentType],
    ['Context', project.context],
    ['Scale', project.scale],
    ['Current phase', project.phase],
    ['Progress', `${project.progress}%`],
    ['Next milestone', project.nextMilestone],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const activity = [
    ...project.updates.slice(0, 2).map((update) => ({ kind: 'Update', label: update.title, detail: update.body, date: update.date, status: '' })),
    ...project.approvals.filter((approval) => approval.status === 'Pending').slice(0, 1).map((approval) => ({ kind: 'Approval', label: approval.title, detail: 'Decision required', date: '', status: approval.status })),
    ...project.milestones.filter((milestone) => milestone.status !== 'Complete').slice(0, 1).map((milestone) => ({ kind: 'Milestone', label: milestone.label, detail: 'Delivery event', date: '', status: milestone.status })),
  ].slice(0, 4);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
      <div>
        <p className="max-w-3xl font-serif text-3xl font-light leading-snug sm:text-4xl">{project.statement}</p>
        {media.length ? (
          <div className="portal-project-media-grid mt-10">
            {media.map((src, index) => (
              <ProjectMediaFrame
                key={src}
                src={src}
                alt={`${project.title} project view ${index + 1}`}
                className={index === 0 ? 'portal-project-media-primary' : ''}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <PortalEmptyState message="No project media is available yet." />
          </div>
        )}
      </div>
      <div className="space-y-10">
        <dl className="portal-project-facts divide-y divide-black/15 border-y border-black/15 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,0.8fr)_1.2fr] gap-4 py-4">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <section aria-labelledby="project-latest-activity">
          <div className="flex items-center justify-between gap-4">
            <h2 id="project-latest-activity" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Latest activity</h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">Overview</span>
          </div>
          {activity.length ? (
            <div className="mt-4 divide-y divide-black/15 border-y border-black/15">
              {activity.map((item) => (
                <div key={`${item.kind}-${item.label}`} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-serif text-xl">{item.label}</p>
                    {item.status && (
                      <span className={`${portalStatusClass(item.status)} shrink-0 font-mono text-[9px] uppercase tracking-[0.12em]`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-600">
                    {item.kind}{item.date ? ` · ${item.date}` : ''} · {item.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-600">No recent project activity.</p>
          )}
        </section>
      </div>
    </div>
  );
};

const getRoleHome = (role?: PortalRole) =>
  role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard';

export const NotFoundPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const session = portalAuth.getSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#D6CBB9] px-6 text-center text-[#211E1A]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">404 / Page not found</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-light text-[#211E1A]">Page not found.</h1>
      <p className="mt-3 max-w-md text-sm text-[#57534E]">
        The requested page, project or resource does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {session && (
          <button
            onClick={() => onNavigate(getRoleHome(session.role))}
            data-testid="return-workspace"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#211E1A] hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Return to workspace
          </button>
        )}
        <button
          onClick={() => onNavigate('/')}
          data-testid="return-home"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-black hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Return home
        </button>
      </div>
    </main>
  );
};

export const ForbiddenPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const session = portalAuth.getSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#D6CBB9] px-6 text-center text-[#211E1A]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">403 / Access restricted</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-light text-[#211E1A]">Access restricted.</h1>
      <p className="mt-3 max-w-md text-sm text-[#57534E]">
        You do not have authorization to view this workspace, project or resource.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {session && (
          <button
            onClick={() => onNavigate(getRoleHome(session.role))}
            data-testid="return-workspace"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#211E1A] hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Return to authorized workspace
          </button>
        )}
        <button
          onClick={() => onNavigate('/')}
          data-testid="return-home"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-black hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Public home
        </button>
      </div>
    </main>
  );
};

export const ServiceUnavailablePage: React.FC<NavigationProps & { onRetry?: () => void; message?: string }> = ({ onNavigate, onRetry, message }) => {
  const session = portalAuth.getSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#D6CBB9] px-6 text-center text-[#211E1A]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">503 / Service unavailable</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-light text-[#211E1A]">Service temporarily unavailable.</h1>
      <p className="mt-3 max-w-md text-sm text-[#57534E]">
        {message || 'Unable to load remote project and account records. Please check the network connection and try again.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {onRetry && (
          <button
            onClick={onRetry}
            data-testid="retry-service"
            className="inline-flex items-center gap-2 border border-black/20 bg-stone-900 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:bg-black"
          >
            Retry connection
          </button>
        )}
        {session && (
          <button
            onClick={() => onNavigate(getRoleHome(session.role))}
            data-testid="return-workspace"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#211E1A] hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Return to workspace
          </button>
        )}
        <button
          onClick={() => onNavigate('/')}
          data-testid="return-home"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-black hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Public home
        </button>
      </div>
    </main>
  );
};

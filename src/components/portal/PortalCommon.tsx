import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Moon, Sun, X } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { GarnierChatShell } from '../ai/GarnierChatShell';
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
import {
  getLocalizedApprovalTitle,
  getLocalizedMilestone,
  getLocalizedProjectField,
  getLocalizedUpdate,
} from '../../portal/showcaseLocalization';

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

const uniqueProjectMedia = (project: PortalProject) =>
  [project.image, ...(project.media?.gallery ?? []), project.media?.aerial, project.media?.campusOverview, project.media?.masterplan]
    .filter((path, index, paths): path is string => Boolean(path) && paths.indexOf(path) === index)
    .slice(0, 3);

const projectRoute = (role: PortalRole, id: string) =>
  `${role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard'}/projects/${id}`;

const ProjectThumbnail: React.FC<{ project: PortalProject }> = ({ project }) => {
  const { t } = useTranslation('portal');
  const image = getPreferredProjectImage(project);
  const [imageAvailable, setImageAvailable] = useState(Boolean(image));
  if (!imageAvailable) {
    return (
      <span className="portal-project-thumbnail portal-project-thumbnail-fallback" aria-label={t('projectImageUnavailable', 'Project image unavailable')}>
        {/* i18next-instrument-ignore */}
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

const ProjectMediaFrame: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
  const { t } = useTranslation('common');
  const [imageAvailable, setImageAvailable] = useState(Boolean(src));
  if (!imageAvailable) {
    return (
      <div className={`portal-project-media-frame portal-project-thumbnail-fallback ${className}`} role="img" aria-label={t('gallery.imageUnavailable', '{{alt}} image unavailable', { alt })}>
        {/* i18next-instrument-ignore */}
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
}> = ({
  project,
  onNavigate,
  detailPath,
  meta = getLocalizedProjectField(project.id, 'category', project.category),
  testId,
}) => (
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
  const { t } = useTranslation('portal');
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
      setLocationError(t('siteIntelligence.enterLocation', 'Enter a location to analyze.'));
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
      setLocationError(err instanceof ExternalContextError ? err.message : t('siteIntelligence.locationUnavailable', 'Location search is temporarily unavailable.'));
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
          : t('siteIntelligence.weatherUnavailable', 'Weather is temporarily unavailable.'),
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
          : t('siteIntelligence.seismicUnavailable', 'Seismic context is temporarily unavailable.'),
      );
    }
  };

  return (
    <section aria-label={t('siteIntelligence.title', 'Site intelligence and external context')} className="border-b border-black/15 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('siteIntelligence.eyebrow', 'Site intelligence · External context')}</p>
          <p className="mt-2 text-sm text-stone-600">{t('siteIntelligence.subtitle', 'Environmental and seismic context across project coordinates.')}</p>
        </div>
      </div>

      <form onSubmit={handleAnalyze} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('siteIntelligence.placeholder', 'Enter location (e.g. San José, Costa Rica)')}
          aria-label={t('siteIntelligence.locationAria', 'Location for site intelligence')}
          data-testid="site-intelligence-input"
          className="min-w-[260px] flex-1 rounded-xs border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] px-3 py-2.5 text-xs text-[var(--portal-text)] placeholder:text-[var(--portal-muted)] focus:border-[var(--portal-border-strong)] focus:ring-1 focus:ring-[var(--portal-accent)] focus:outline-none transition-all"
        />
        <button
          type="submit"
          data-testid="site-intelligence-analyze"
          disabled={locationStatus === 'loading' || weatherStatus === 'loading' || seismicStatus === 'loading'}
          className="rounded-xs px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] font-medium transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
        >
          {locationStatus === 'loading'
            ? t('siteIntelligence.locating', 'Locating…')
            : weatherStatus === 'loading' || seismicStatus === 'loading'
              ? t('siteIntelligence.analyzing', 'Analyzing…')
              : t('siteIntelligence.analyzeSite', 'Analyze Site')}
        </button>
        <button
          type="button"
          data-testid="load-external-context"
          onClick={() => { void handleAnalyze(); }}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          {t('siteIntelligence.loadContext', 'Load context')}
        </button>
      </form>

      {locationStatus === 'error' && (
        <p role="alert" data-testid="site-intelligence-location-error" className="mt-4 text-sm text-stone-600">
          {locationError ?? t('siteIntelligence.locationUnavailable', 'Location search is temporarily unavailable.')}
        </p>
      )}

      {resolvedLocation && (
        <div
          data-testid="site-intelligence-location"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-[var(--portal-border)] border-l-2 border-l-[var(--portal-accent)] bg-[var(--portal-surface-raised)] px-3 py-2 text-xs"
        >
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">{t('siteIntelligence.resolvedLocation', 'Resolved Location:')} </span>
            <span className="font-semibold text-[var(--portal-text)]">{resolvedLocation.displayName}</span>
          </div>
          <div className="font-mono text-[10px] text-stone-500">
            {resolvedLocation.latitude.toFixed(4)}
            {/* i18next-instrument-ignore */}
            °, {resolvedLocation.longitude.toFixed(4)}
            {/* i18next-instrument-ignore */}
            °
          </div>
        </div>
      )}

      {(weather || weatherStatus !== 'idle' || seismic || seismicStatus !== 'idle') && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Weather Card */}
          <div data-testid="site-intelligence-weather" className="border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">{t('siteIntelligence.liveWeather', 'Live Weather Context')}</p>
            {weatherStatus === 'loading' && (
              <p role="status" className="mt-3 text-xs text-stone-500">{t('siteIntelligence.gatheringAtmospheric', 'Gathering current atmospheric conditions…')}</p>
            )}
            {weatherStatus === 'error' && (
              <p role="alert" data-testid="site-intelligence-weather-error" className="mt-3 text-xs text-stone-600">
                {weatherError ?? t('siteIntelligence.weatherUnavailable', 'Weather is temporarily unavailable.')}
              </p>
            )}
            {weather && (
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light text-[var(--portal-text)]">
                    {weather.temperature}
                    {/* i18next-instrument-ignore */}
                    °C
                  </span>
                  <span className="text-xs text-stone-600">
                    {/* i18next-instrument-ignore */}
                    · {getWeatherCodeLabel(weather.weatherCode)} (WMO {weather.weatherCode})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-2 font-mono text-[11px] text-stone-600">
                  <div>{t('siteIntelligence.precipitation', 'Precipitation: {{val}}', { val: weather.precipitation != null ? `${weather.precipitation} mm` : 'N/A' })}</div>
                  <div>{t('siteIntelligence.wind', 'Wind: {{val}}', { val: weather.windSpeed != null ? `${weather.windSpeed} km/h` : 'N/A' })}</div>
                </div>
                {weather.observedAt && (
                  <p className="font-mono text-[10px] text-stone-400">{t('siteIntelligence.observed', 'Observed: {{val}}', { val: weather.observedAt })}</p>
                )}
              </div>
            )}
          </div>

          {/* Seismic Card */}
          <div data-testid="site-intelligence-seismic" className="border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">{t('siteIntelligence.recentSeismic', 'Recent Seismic Context')}</p>
              {/* i18next-instrument-ignore */}
              <span className="font-mono text-[9px] text-stone-400">300 km · 30 days</span>
            </div>
            {seismicStatus === 'loading' && (
              <p role="status" className="mt-3 text-xs text-stone-500">{t('siteIntelligence.queryingUsgs', 'Querying USGS earthquake catalog…')}</p>
            )}
            {seismicStatus === 'error' && (
              <p role="alert" data-testid="site-intelligence-seismic-error" className="mt-3 text-xs text-stone-600">
                {seismicError ?? t('siteIntelligence.seismicUnavailable', 'Seismic context is temporarily unavailable.')}
              </p>
            )}
            {seismic && (
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light text-[var(--portal-text)]">{seismic.eventCount}</span>
                  <span className="text-xs text-stone-600">{t('siteIntelligence.eventsRecorded', 'events recorded within 300 km')}</span>
                </div>
                {seismic.eventCount === 0 ? (
                  <p className="text-xs text-stone-500">{t('siteIntelligence.noEvents', 'No seismic events recorded within 300 km in the last 30 days.')}</p>
                ) : (
                  <div className="space-y-1.5 border-t border-black/5 pt-2 font-mono text-[11px] text-stone-600">
                    {seismic.strongest && (
                      <div>
                        <span className="uppercase text-stone-400">{t('siteIntelligence.strongest', 'Strongest:')}</span>{` M${seismic.strongest.magnitude.toFixed(1)} · ${seismic.strongest.place} (${seismic.strongest.distanceKm} km)`}
                      </div>
                    )}
                    {seismic.nearest && (
                      <div>
                        <span className="uppercase text-stone-400">{t('siteIntelligence.nearest', 'Nearest:')}</span>{` M${seismic.nearest.magnitude.toFixed(1)} · ${seismic.nearest.place} (${seismic.nearest.distanceKm} km)`}
                      </div>
                    )}
                    {seismic.mostRecent && (
                      <div>
                        <span className="uppercase text-stone-400">{t('siteIntelligence.recent', 'Recent:')}</span> M{seismic.mostRecent.magnitude.toFixed(1)} · {seismic.mostRecent.place}
                      </div>
                    )}
                  </div>
                )}
                <p className="pt-2 font-mono text-[9px] leading-tight text-stone-400">
                  {t('siteIntelligence.disclaimer', 'Contextual seismic observations for site planning; not a structural safety assessment or predictive hazard guarantee.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-400">
        <span>{t('siteIntelligence.dataSources', 'Data sources:')}</span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          {/* i18next-instrument-ignore */}
          © OpenStreetMap contributors
        </a>
        <span>·</span>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          {/* i18next-instrument-ignore */}
          Weather data by Open-Meteo.com
        </a>
        <span>·</span>
        <a
          href="https://earthquake.usgs.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600"
        >
          {/* i18next-instrument-ignore */}
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
}> = ({ projects, onNavigate, detailPath, onOpenWorkspace }) => {
  const { t } = useTranslation('portal');
  return (
    <div className="divide-y divide-black/15 border-y border-black/15">
      {projects.map((project) => (
        <div
          key={project.id}
          className="portal-register-row group grid w-full gap-5 py-5 text-left transition-colors hover:bg-[var(--portal-surface-raised)] sm:grid-cols-[minmax(0,1fr)_150px_180px_auto] sm:items-center sm:px-3"
        >
          <ProjectIdentityButton project={project} onNavigate={onNavigate} detailPath={detailPath} />
          <span className="text-xs text-stone-600">
            <span className="block">{getLocalizedProjectField(project.id, 'phase', project.phase)}</span>
            {project.approvals.some((approval) => approval.status === 'Pending') && (
              <span className="portal-status-pending mt-2 block font-mono text-[9px] uppercase tracking-[0.12em]">{t('approvalPending', 'Approval pending')}</span>
            )}
          </span>
          <span>
            <span className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500">
              <span>{t('progress', 'Progress')}</span>
              <span>{project.progress}%</span>
            </span>
            <span className="portal-progress-track block h-px bg-black/15">
              <span className="portal-progress-fill block h-px bg-black" style={{ width: `${project.progress}%` }} />
            </span>
          </span>
          <span className="portal-register-actions flex items-center gap-3">
            <button onClick={() => onNavigate(detailPath(project.id))} className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black">
              {t('open', 'Open')}
            </button>
            {onOpenWorkspace && (
              <button
                data-testid={`admin-open-model-${project.id}`}
                onClick={onOpenWorkspace}
                className="admin-action font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 hover:text-black"
              >
                {t('model', 'Model')}
              </button>
            )}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      ))}
    </div>
  );
};

const DEFAULT_NEW_PROJECT_CATEGORY = 'Development · New project';

export const CreateProjectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: (feedback: string) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}> = ({ open, onClose, onSuccess, triggerRef }) => {
  const { t } = useTranslation('admin');
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
      setCreateError(t('enterProjectValidation', 'Enter a project title, category, and a progress value from 0 to 100.'));
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
      onSuccess(t('projectCreatedSuccess', 'Project created and added to the register.'));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : t('projectCreateError', 'Project could not be created.'));
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
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('portal:administration', 'Administration')}</p>
            <h2 id="create-project-title" className="mt-4 font-serif text-4xl">{t('newProjectTitle', 'New project.')}</h2>
          </div>
          <button
            type="button"
            disabled={creatingProject}
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            aria-label={t('closeCreateProject', 'Close create project')}
            className="border border-white/20 p-2 text-stone-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 space-y-5">
          <label className="block font-mono text-[9px] uppercase text-stone-400">
            {t('title', 'Title')}
            <input
              required
              disabled={creatingProject}
              value={newProject.title}
              onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition-colors focus:border-[var(--portal-accent)]"
            />
          </label>
          <label className="block font-mono text-[9px] uppercase text-stone-400">
            {t('category', 'Category')}
            <input
              required
              disabled={creatingProject}
              value={newProject.category}
              onChange={(event) => setNewProject({ ...newProject, category: event.target.value })}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition-colors focus:border-[var(--portal-accent)]"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block font-mono text-[9px] uppercase text-stone-400">
              {t('phase', 'Phase')}
              <select
                disabled={creatingProject}
                value={newProject.phase}
                onChange={(event) => setNewProject({ ...newProject, phase: event.target.value })}
                className="mt-2 w-full border-b border-white/20 bg-[#11110f] py-3 text-sm text-white outline-none transition-colors focus:border-[var(--portal-accent)]"
              >
                <option value="Brief and site study">{t('phases.brief', 'Brief and site study')}</option>
                <option value="Concept design">{t('phases.concept', 'Concept design')}</option>
                <option value="Design development">{t('phases.development', 'Design development')}</option>
                <option value="Documentation">{t('phases.documentation', 'Documentation')}</option>
              </select>
            </label>
            <label className="block font-mono text-[9px] uppercase text-stone-400">
              {t('initialProgress', 'Initial progress')}
              <input
                required
                disabled={creatingProject}
                type="number"
                min="0"
                max="100"
                step="1"
                value={newProject.progress}
                onChange={(event) => setNewProject({ ...newProject, progress: event.target.value })}
                className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-sm text-white outline-none transition-colors focus:border-[var(--portal-accent)]"
              >
              </input>
            </label>
          </div>
        </div>
        {createError && <p role="alert" className="mt-5 text-xs text-red-300">{createError}</p>}
        <button
          disabled={creatingProject}
          type="submit"
          className="mt-8 w-full rounded-xs bg-[#f4efe8] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-black transition-all hover:bg-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)] disabled:opacity-50"
        >
          {creatingProject ? t('creatingProject', 'Creating project…') : t('createProject', 'Create project')}
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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = bimAgent.subscribe((msgs) => setMessages(msgs));
    return () => unsubscribe();
  }, []);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isProcessing) return;
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
      <GarnierChatShell
        title={aiT.heading}
        subtitle={aiT.subtitle}
        statusLabel={aiService.isConfigured() ? aiT.remoteStatus : aiT.offlineStatus}
        isOnline={aiService.isConfigured()}
        messages={messages}
        isProcessing={isProcessing}
        onSendMessage={handleSend}
        onClearHistory={() => bimAgent.clearHistory()}
        onConfirmProposal={(id) => bimAgent.confirmProposal(id)}
        onRejectProposal={(id) => bimAgent.rejectProposal(id)}
        quickPrompts={quickPrompts}
        quickPromptsLabel={aiT.quickPromptsLabel}
        placeholder={aiT.inputPlaceholder}
        emptyHeading={aiT.emptyTitle}
        emptyDescription={aiT.emptyDescription}
        clearLabel={aiT.clearHistory}
        sendLabel={aiT.send}
        confirmLabel={aiT.confirm}
        rejectLabel={aiT.reject}
        writeConfirmationLabel={aiT.writeConfirmation}
        thinkingLabel={aiT.thinking || 'Thinking…'}
      />

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
          {aiT.openModel || 'Open 3D Model →'}
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
}> = ({ previous, next, onNavigate, role }) => {
  const { t } = useTranslation('portal');
  return (
    <nav aria-label={t('projectNavigation', 'Project navigation')} className="portal-project-navigation grid gap-3 border-y border-black/15 py-4 sm:grid-cols-2">
      <button
        type="button"
        data-testid="previous-project"
        disabled={!previous}
        onClick={() => previous && onNavigate(projectRoute(role, previous.id))}
        className="text-left disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{t('prevProject', '← Previous project')}</span>
        <span className="mt-1 block font-serif text-xl">{previous?.title ?? t('firstProjectInScope', 'First project in scope')}</span>
      </button>
      <button
        type="button"
        data-testid="next-project"
        disabled={!next}
        onClick={() => next && onNavigate(projectRoute(role, next.id))}
        className="text-left sm:text-right"
      >
        <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{t('nextProject', 'Next project →')}</span>
        <span className="mt-1 block font-serif text-xl">{next?.title ?? t('lastProjectInScope', 'Last project in scope')}</span>
      </button>
    </nav>
  );
};

export const ProjectOverview: React.FC<{ project: PortalProject }> = ({ project }) => {
  const { t } = useTranslation('portal');
  const media = uniqueProjectMedia(project);
  const localizedStatement = getLocalizedProjectField(project.id, 'statement', project.statement);
  const localizedDevType = getLocalizedProjectField(project.id, 'developmentType', project.developmentType);
  const localizedPhase = getLocalizedProjectField(project.id, 'phase', project.phase);
  const localizedNextMilestone = getLocalizedProjectField(project.id, 'nextMilestone', project.nextMilestone);

  const facts: [string, string][] = [
    ['Market', project.market],
    ['Development type', localizedDevType],
    ['Context', project.context],
    ['Scale', project.scale],
    ['Current phase', localizedPhase],
    ['Progress', `${project.progress}%`],
    ['Next milestone', localizedNextMilestone],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const activity = [
    ...project.updates.slice(0, 2).map((update) => {
      const locUpdate = getLocalizedUpdate(update);
      return { kind: 'Update', label: locUpdate.title, detail: locUpdate.body, date: locUpdate.date, status: '' };
    }),
    ...project.approvals.filter((approval) => approval.status === 'Pending').slice(0, 1).map((approval) => {
      const locTitle = getLocalizedApprovalTitle(approval.title, approval.projectId);
      return { kind: 'Approval', label: locTitle, detail: 'Decision required', date: '', status: approval.status };
    }),
    ...project.milestones.filter((milestone) => milestone.status !== 'Complete').slice(0, 1).map((milestone) => {
      const locMilestone = getLocalizedMilestone(milestone);
      return { kind: 'Milestone', label: locMilestone.label, detail: 'Delivery event', date: '', status: locMilestone.status };
    }),
  ].slice(0, 4);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
      <div>
        <p className="max-w-3xl font-serif text-3xl font-light leading-snug sm:text-4xl">{localizedStatement}</p>
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
            <h2 id="project-latest-activity" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">{t('latestActivity', 'Latest activity')}</h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500">{t('overview', 'Overview')}</span>
          </div>
          {activity.length ? (
            <div className="mt-4 divide-y divide-black/15 border-y border-black/15">
              {activity.map((item) => (
                <div key={`${item.kind}-${item.label}`} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-serif text-xl">{item.label}</p>
                    {item.status && (
                      <span className={`${portalStatusClass(item.status)} shrink-0 font-mono text-[9px] uppercase tracking-[0.12em]`}>
                        {t(`statuses.${item.status.toLowerCase()}`, item.status)}
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
            <p className="mt-4 text-sm text-stone-600">{t('noRecentActivity', 'No recent project activity.')}</p>
          )}
        </section>
      </div>
    </div>
  );
};

const getRoleHome = (role?: PortalRole) =>
  role === 'admin' ? '/admin' : role === 'architect' ? '/architect' : '/dashboard';

const useErrorTheme = () => {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.localStorage.getItem('garnier-public-theme') === 'light' ||
      window.localStorage.getItem('arch-tech-portal-theme') === 'light'
    );
  });

  const toggleTheme = () => {
    setIsLight((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('garnier-public-theme', next ? 'light' : 'dark');
        window.localStorage.setItem('arch-tech-portal-theme', next ? 'light' : 'dark');
        if (next) {
          document.documentElement.classList.remove('portal-dark');
        } else {
          document.documentElement.classList.add('portal-dark');
        }
      }
      return next;
    });
  };

  return { isLight, toggleTheme };
};

const ErrorPageHeader: React.FC<{ isLight: boolean; onToggleTheme: () => void }> = ({ isLight, onToggleTheme }) => (
  <header className="absolute inset-x-6 top-6 mx-auto flex max-w-5xl items-center justify-between">
    <div className="flex items-center gap-2.5">
      <ArchTechLogo
        variant="mark"
        tone={isLight ? 'black' : 'celadon'}
        theme={isLight ? 'light' : 'dark'}
        className="h-6 w-6"
      />
      {/* i18next-instrument-ignore */}
      <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.24em] ${isLight ? 'text-[#17181A]' : 'text-[#EDF4ED]'}`}>
        ARCH_TECH
      </span>
    </div>
    {/* i18next-instrument-ignore */}
    <button
      type="button"
      onClick={onToggleTheme}
      data-testid="error-theme-toggle"
      aria-label={isLight ? 'Use dark theme' : 'Use light theme'}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        isLight
          ? 'border-black/15 bg-black/[0.04] text-[#17181A] hover:bg-black/[0.08]'
          : 'border-white/15 bg-white/[0.05] text-[#EDF4ED] hover:bg-white/10'
      }`}
      title={isLight ? 'Use dark theme' : 'Use light theme'}
    >
      {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  </header>
);

export const NotFoundPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const { portalCommon } = useLocale();
  const session = portalAuth.getSession();
  const { isLight, toggleTheme } = useErrorTheme();

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center transition-colors duration-200 ${
        isLight ? 'bg-[#F5F3EF] text-[#17181A]' : 'bg-[#0A0B0D] text-[#EDF4ED]'
      }`}
    >
      <ErrorPageHeader isLight={isLight} onToggleTheme={toggleTheme} />
      <div className="w-full max-w-xl">
        <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${isLight ? 'text-[#3D7354]' : 'text-[#79B791]'}`}>
          {portalCommon.notFoundEyebrow}
        </p>
        <h1 className={`mt-5 font-serif text-4xl sm:text-5xl font-light tracking-tight ${isLight ? 'text-[#17181A]' : 'text-[#EDF4ED]'}`}>
          {portalCommon.notFoundTitle}.
        </h1>
        <p className={`mx-auto mt-4 max-w-md text-sm leading-6 ${isLight ? 'text-[#5A5D62]' : 'text-stone-400'}`}>
          {portalCommon.notFoundSubtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {session && (
            <button
              onClick={() => onNavigate(getRoleHome(session.role))}
              data-testid="return-workspace"
              className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold transition-all shadow-xs ${
                isLight
                  ? 'border-[#17181A] bg-[#17181A] text-[#F5F3EF] hover:bg-black hover:border-black active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#17181A]'
                  : 'border-[#79B791] bg-[#79B791] text-black hover:bg-[#ABD1B5] hover:border-[#ABD1B5] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#79B791]'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {portalCommon.returnToWorkspace}
            </button>
          )}
          <button
            onClick={() => onNavigate('/')}
            data-testid="return-home"
            className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-all ${
              !session
                ? isLight
                  ? 'border-[#17181A] bg-[#17181A] text-[#F5F3EF] font-semibold hover:bg-black hover:border-black shadow-xs'
                  : 'border-[#79B791] bg-[#79B791] text-black font-semibold hover:bg-[#ABD1B5] shadow-xs'
                : isLight
                  ? 'border-black/15 bg-transparent text-[#17181A] hover:border-black/35 hover:bg-black/[0.04]'
                  : 'border-white/20 bg-transparent text-[#EDF4ED] hover:border-white/40 hover:bg-white/5'
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {portalCommon.returnHome}
          </button>
        </div>
      </div>
    </main>
  );
};

export const ForbiddenPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const { t } = useTranslation('portal');
  const session = portalAuth.getSession();
  const { isLight, toggleTheme } = useErrorTheme();

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center transition-colors duration-200 ${
        isLight ? 'bg-[#F5F3EF] text-[#17181A]' : 'bg-[#0A0B0D] text-[#EDF4ED]'
      }`}
    >
      <ErrorPageHeader isLight={isLight} onToggleTheme={toggleTheme} />
      <div className="w-full max-w-xl">
        <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${isLight ? 'text-[#3D7354]' : 'text-[#79B791]'}`}>
          {t('forbidden.eyebrow', '403 / Access restricted')}
        </p>
        <h1 className={`mt-5 font-serif text-4xl sm:text-5xl font-light tracking-tight ${isLight ? 'text-[#17181A]' : 'text-[#EDF4ED]'}`}>
          {t('forbidden.title', 'Access restricted.')}
        </h1>
        <p className={`mx-auto mt-4 max-w-md text-sm leading-6 ${isLight ? 'text-[#5A5D62]' : 'text-stone-400'}`}>
          {t('forbidden.subtitle', 'You do not have authorization to view this workspace, project or resource.')}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {session && (
            <button
              onClick={() => onNavigate(getRoleHome(session.role))}
              data-testid="return-workspace"
              className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold transition-all shadow-xs ${
                isLight
                  ? 'border-[#17181A] bg-[#17181A] text-[#F5F3EF] hover:bg-black hover:border-black active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#17181A]'
                  : 'border-[#79B791] bg-[#79B791] text-black hover:bg-[#ABD1B5] hover:border-[#ABD1B5] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#79B791]'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {t('forbidden.returnWorkspace', 'Return to authorized workspace')}
            </button>
          )}
          <button
            onClick={() => onNavigate('/')}
            data-testid="return-home"
            className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-all ${
              !session
                ? isLight
                  ? 'border-[#17181A] bg-[#17181A] text-[#F5F3EF] font-semibold hover:bg-black hover:border-black shadow-xs'
                  : 'border-[#79B791] bg-[#79B791] text-black font-semibold hover:bg-[#ABD1B5] shadow-xs'
                : isLight
                  ? 'border-black/15 bg-transparent text-[#17181A] hover:border-black/35 hover:bg-black/[0.04]'
                  : 'border-white/20 bg-transparent text-[#EDF4ED] hover:border-white/40 hover:bg-white/5'
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {t('forbidden.publicHome', 'Public home')}
          </button>
        </div>
      </div>
    </main>
  );
};

export const ServiceUnavailablePage: React.FC<NavigationProps & { onRetry?: () => void; message?: string }> = ({ onNavigate, onRetry, message }) => {
  const { t } = useTranslation('portal');
  const session = portalAuth.getSession();
  const { isLight, toggleTheme } = useErrorTheme();

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center transition-colors duration-200 ${
        isLight ? 'bg-[#F5F3EF] text-[#17181A]' : 'bg-[#0A0B0D] text-[#EDF4ED]'
      }`}
    >
      <ErrorPageHeader isLight={isLight} onToggleTheme={toggleTheme} />
      <div className="w-full max-w-xl">
        <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${isLight ? 'text-[#3D7354]' : 'text-[#79B791]'}`}>
          {t('serviceUnavailable.eyebrow', '503 / Service unavailable')}
        </p>
        <h1 className={`mt-5 font-serif text-4xl sm:text-5xl font-light tracking-tight ${isLight ? 'text-[#17181A]' : 'text-[#EDF4ED]'}`}>
          {t('serviceUnavailable.title', 'Service temporarily unavailable.')}
        </h1>
        <p className={`mx-auto mt-4 max-w-md text-sm leading-6 ${isLight ? 'text-[#5A5D62]' : 'text-stone-400'}`}>
          {message || t('serviceUnavailable.defaultMessage', 'Unable to load remote project and account records. Please check the network connection and try again.')}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {onRetry && (
            <button
              onClick={onRetry}
              data-testid="retry-service"
              className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold transition-all shadow-xs ${
                isLight
                  ? 'border-[#17181A] bg-[#17181A] text-[#F5F3EF] hover:bg-black hover:border-black active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#17181A]'
                  : 'border-[#79B791] bg-[#79B791] text-black hover:bg-[#ABD1B5] hover:border-[#ABD1B5] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#79B791]'
              }`}
            >
              {t('serviceUnavailable.retry', 'Retry connection')}
            </button>
          )}
          {session && (
            <button
              onClick={() => onNavigate(getRoleHome(session.role))}
              data-testid="return-workspace"
              className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                isLight
                  ? 'text-[#17181A] hover:text-[#3D7354] hover:underline'
                  : 'text-[#EDF4ED] hover:text-[#79B791] hover:underline'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {t('serviceUnavailable.returnWorkspace', 'Return to workspace')}
            </button>
          )}
          <button
            onClick={() => onNavigate('/')}
            data-testid="return-home"
            className={`inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-all ${
              isLight
                ? 'border-black/15 bg-transparent text-[#17181A] hover:border-black/35 hover:bg-black/[0.04] active:scale-[0.99]'
                : 'border-white/20 bg-transparent text-[#EDF4ED] hover:border-white/40 hover:bg-white/5 active:scale-[0.99]'
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> {t('serviceUnavailable.publicHome', 'Public home')}
          </button>
        </div>
      </div>
    </main>
  );
};

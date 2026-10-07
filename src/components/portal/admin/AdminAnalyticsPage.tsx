import React, { useEffect, useId, useState } from 'react';
import { getPortalSnapshot, type ProgressSnapshot } from '../../../portal/data';
import { useLocale } from '../../../portal/locale';
import { projectService } from '../../../services/projectService';
import { userService } from '../../../services/userService';
import { analyticsService } from '../../../services/analyticsService';
import { ExternalContextPanel, NavigationProps } from '../PortalCommon';
import { PortalShell, usePortalShell } from '../PortalShell';

type TrendPoint = {
  label: string;
  value: number;
  isLive?: boolean;
};

type TrendLineChartProps = {
  title: string;
  description: string;
  points: TrendPoint[];
  emptyMessage?: string;
  testId?: string;
};

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  title,
  description,
  points,
  emptyMessage = 'No historical telemetry recorded.',
  testId,
}) => {
  const chartId = useId();
  const descId = `${chartId}-desc`;

  if (!points.length) {
    return (
      <div data-testid={testId} className="border border-black/15 bg-black/[0.02] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500">{emptyMessage}</p>
      </div>
    );
  }

  const width = 680;
  const height = 220;
  const padLeft = 46;
  const padRight = 40;
  const padTop = 26;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const yFor = (val: number) => {
    const safe = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
    return padTop + (100 - safe) * (plotH / 100);
  };

  const xFor = (index: number, total: number) => {
    if (total <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (total - 1)) * plotW;
  };

  const coords = points.map((p, i) => ({
    ...p,
    x: xFor(i, points.length),
    y: yFor(p.value),
    safeVal: Math.max(0, Math.min(100, Math.round(p.value * 10) / 10)),
  }));

  const historicalCoords = coords.filter((c) => !c.isLive);
  const liveCoord = coords.find((c) => c.isLive);

  const historicalPath = historicalCoords.reduce(
    (acc, c, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
    '',
  );

  let liveConnectorPath = '';
  if (liveCoord && historicalCoords.length > 0) {
    const lastHist = historicalCoords[historicalCoords.length - 1];
    liveConnectorPath = `M ${lastHist.x.toFixed(1)} ${lastHist.y.toFixed(1)} L ${liveCoord.x.toFixed(1)} ${liveCoord.y.toFixed(1)}`;
  }

  return (
    <div data-testid={testId} className="relative min-w-0">
      <div className="border border-black/15 bg-black/[0.02] p-4 text-inherit">
        <svg
          role="img"
          aria-label={title}
          aria-describedby={descId}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <title>{title}</title>
          <desc id={descId}>{description}</desc>

          {/* Y-axis grid and scale */}
          {[0, 25, 50, 75, 100].map((gridVal) => {
            const y = yFor(gridVal);
            return (
              <g key={gridVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-current opacity-60 font-mono text-[10px]"
                >
                  {gridVal}%
                </text>
              </g>
            );
          })}

          {/* Historical path (solid) */}
          {historicalPath && (
            <path
              d={historicalPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Live connector path (dashed) */}
          {liveConnectorPath && (
            <path
              d={liveConnectorPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Data Points */}
          {coords.map((c, idx) => {
            if (c.isLive) {
              return (
                <g key={`point-${idx}`}>
                  <polygon
                    points={`${c.x},${c.y - 6} ${c.x + 6},${c.y} ${c.x},${c.y + 6} ${c.x - 6},${c.y}`}
                    className="fill-current stroke-current"
                    strokeWidth={1}
                  />
                  <text
                    x={c.x}
                    y={c.y - 9}
                    textAnchor="middle"
                    className="fill-current font-mono text-[10px] font-bold"
                  >
                    Live {c.safeVal}%
                  </text>
                  <text
                    x={c.x}
                    y={padTop + plotH + 16}
                    textAnchor="middle"
                    className="fill-current font-mono text-[9px] font-semibold tracking-wider uppercase"
                  >
                    Current
                  </text>
                </g>
              );
            }

            return (
              <g key={`point-${idx}`}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={4.5}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.25}
                />
                <text
                  x={c.x}
                  y={c.y - 8}
                  textAnchor="middle"
                  className="fill-current font-mono text-[10px] font-medium"
                >
                  {c.safeVal}%
                </text>
                <text
                  x={c.x}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  className="fill-current opacity-70 font-mono text-[9px]"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend & context */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-2 text-[10px]">
          <div className="flex items-center gap-4 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-current bg-transparent" />
              Historical checkpoint
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rotate-45 bg-current" />
              Live registered progress
            </span>
          </div>
          <span className="font-mono text-[9px] opacity-70 uppercase tracking-wider">
            GARNIER ARCHITECTURE concept telemetry
          </span>
        </div>
      </div>

      {/* Accessible fallback summary */}
      <details className="mt-2 text-xs text-stone-600">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-800">
          Accessible tabular breakdown
        </summary>
        <div className="mt-2 overflow-x-auto border border-black/15 bg-white/40 p-2">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="pb-1">Checkpoint</th>
                <th className="pb-1">Status</th>
                <th className="pb-1 text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {coords.map((c, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0">
                  <td className="py-1">{c.label}</td>
                  <td className="py-1">{c.isLive ? 'Live / Current' : 'Historical'}</td>
                  <td className="py-1 text-right font-semibold">{c.safeVal}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export const AdminAnalyticsPage: React.FC<Partial<NavigationProps> & { onSignOut?: () => void }> = ({
  onNavigate,
  onSignOut,
}) => {
  const { insideShell } = usePortalShell();
  const { adminPortal } = useLocale();

  const [snapshot, setSnapshot] = useState(getPortalSnapshot);
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>(() => getPortalSnapshot().db.progressSnapshots ?? []);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { db, projects } = snapshot;
  const activeProjects = projects.filter((project) => !project.archived);

  // Auto-select initial active project if none selected
  const effectiveProjectId = activeProjects.some((p) => p.id === selectedProjectId)
    ? selectedProjectId
    : (activeProjects[0]?.id ?? '');

  const selectedProject = activeProjects.find((p) => p.id === effectiveProjectId) ?? activeProjects[0];

  const pendingApprovals = db.approvals.filter(
    (approval) => approval.status === 'Pending' && activeProjects.some((p) => p.id === approval.projectId),
  );

  const stageCounts = activeProjects.reduce<Record<string, number>>(
    (counts, project) => ({ ...counts, [project.phase]: (counts[project.phase] ?? 0) + 1 }),
    {},
  );

  const analytics = analyticsService.calculatePortfolioAnalytics(activeProjects, snapshots);

  const refresh = async () => {
    const activeIds = new Set(getPortalSnapshot().projects.filter((p) => !p.archived).map((p) => p.id));
    const result = await analyticsService.fetchSnapshots(activeIds);
    if (result.error) {
      setSnapshotError(result.error);
      setSnapshots([]);
    } else {
      setSnapshotError(null);
      setSnapshots(result.snapshots);
    }
    setSnapshot(getPortalSnapshot());
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (projectService.isRemote()) {
        try {
          await Promise.all([projectService.list(), userService.list()]);
        } catch {
          // preserve offline / local view if partial remote failure
        }
      }
      if (!isMounted) return;
      await refresh();
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Portfolio trend points: historical checkpoints + current live
  const portfolioTrendPoints: TrendPoint[] = [
    ...analytics.portfolioHistory.map((h) => ({
      label: h.date,
      value: h.averageProgress,
      isLive: false,
    })),
    ...(activeProjects.length
      ? [{ label: 'Current', value: analytics.currentAverage, isLive: true }]
      : []),
  ];

  // Selected project trend points: historical snapshots + current live
  const projectTrend = selectedProject
    ? analyticsService.chronologicalProjectTrend(selectedProject, snapshots)
    : null;

  const projectTrendPoints: TrendPoint[] = selectedProject && projectTrend
    ? [
        ...projectTrend.snapshots.map((s) => ({
          label: s.date,
          value: s.progress,
          isLive: false,
        })),
        { label: 'Current', value: selectedProject.progress, isLive: true },
      ]
    : [];

  const content = (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="border-b border-black/15 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">
          {adminPortal.analyticsEyebrow}
        </p>
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-6xl">
          {adminPortal.analyticsHeading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
          {adminPortal.analyticsSubtitle}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-stone-500">
          Historical telemetry represents internal GARNIER ARCHITECTURE concept coordination, not official construction contractor records.
        </p>
      </div>

      {/* KPI Overview Strip */}
      <section className="admin-kpi-strip grid gap-px border-y border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio overview">
        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Active projects</p>
          <p className="mt-3 font-serif text-5xl">{activeProjects.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">currently active</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Current average progress</p>
          <p className="mt-3 font-serif text-5xl">{analytics.currentAverage}%</p>
          <p className="mt-1 text-sm text-stone-600">across active work</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Pending approvals</p>
          <p className="mt-3 font-serif text-5xl">{pendingApprovals.length.toString().padStart(2, '0')}</p>
          <p className="mt-1 text-sm text-stone-600">requiring review</p>
        </div>

        <div className="admin-overview-tile bg-[#E6DED2] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Portfolio progress change</p>
          <p className="mt-3 font-serif text-5xl">
            {analytics.progressChange.delta !== null
              ? `${analytics.progressChange.delta >= 0 ? '+' : ''}${analytics.progressChange.delta}%`
              : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {analytics.progressChange.baselineAverage !== null
              ? `from ${analytics.progressChange.baselineAverage}% baseline`
              : 'no historical baseline'}
          </p>
        </div>
      </section>

      {/* Remote Snapshot Error Notice if any */}
      {snapshotError && (
        <div
          data-testid="analytics-remote-warning"
          className="border border-amber-900/20 bg-amber-500/10 p-4 text-xs text-amber-900"
          role="status"
        >
          <p className="font-mono uppercase tracking-wider font-semibold">Remote Telemetry Notice</p>
          <p className="mt-1">
            Historical progress snapshots could not be synchronized ({snapshotError}). Showing live project status.
          </p>
        </div>
      )}

      {/* Portfolio Historical Trend */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Portfolio trend">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Portfolio trend</p>
          <h2 className="mt-4 font-serif text-4xl">Coordination evolution.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            Deterministic portfolio average progress tracked across internal review milestones, connecting to current registered status.
          </p>
          {analytics.strongestMovement && (
            <div className="mt-6 border-l-2 border-stone-800 pl-4 py-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Strongest progress movement</p>
              <p className="mt-1 font-serif text-lg font-medium">{analytics.strongestMovement.project.title}</p>
              <p className="font-mono text-xs text-stone-600">
                +{analytics.strongestMovement.delta}% gain (from {analytics.strongestMovement.baselineProgress}% to {analytics.strongestMovement.currentProgress}%)
              </p>
            </div>
          )}
        </div>
        <div>
          <TrendLineChart
            testId="portfolio-trend-chart"
            title="Portfolio average progress over time"
            description="Chronological chart displaying historical average coordination progress leading to current registered status."
            points={portfolioTrendPoints}
            emptyMessage="No historical portfolio snapshots recorded."
          />
        </div>
      </section>

      {/* Project Historical Trend with Selector */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Project trend">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development trajectory</p>
          <h2 className="mt-4 font-serif text-4xl">Project progress trend.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            Select an active development to examine historical progression and live registered status.
          </p>

          {/* Project Selector */}
          <div className="mt-6">
            <label htmlFor="project-trend-select" className="block font-mono text-[10px] uppercase tracking-wider text-stone-500">
              Select development
            </label>
            <select
              id="project-trend-select"
              data-testid="project-trend-select"
              value={effectiveProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-2 w-full max-w-xs border border-black/20 bg-white/60 px-3 py-2 font-mono text-xs text-stone-900 focus:border-stone-800 focus:outline-none"
            >
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && projectTrend && (
            <div className="mt-6 space-y-2 border-t border-black/10 pt-4 font-mono text-xs text-stone-600">
              <p>
                <span className="text-stone-500 uppercase tracking-wider text-[10px]">Phase:</span> {selectedProject.phase}
              </p>
              <p>
                <span className="text-stone-500 uppercase tracking-wider text-[10px]">Live Progress:</span> <strong className="font-serif text-base text-stone-900">{selectedProject.progress}%</strong>
              </p>
              {projectTrend.hasHistory && projectTrend.baselineProgress !== null && (
                <p>
                  <span className="text-stone-500 uppercase tracking-wider text-[10px]">Baseline / Delta:</span>{' '}
                  {projectTrend.baselineProgress}% ({projectTrend.delta !== null && projectTrend.delta >= 0 ? '+' : ''}{projectTrend.delta}% change)
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          {selectedProject ? (
            <TrendLineChart
              testId="project-trend-chart"
              title={`${selectedProject.title} progress trend`}
              description={`Progress trend for ${selectedProject.title} showing historical milestones and current status.`}
              points={projectTrendPoints}
              emptyMessage={`No historical snapshots recorded for ${selectedProject.title}.`}
            />
          ) : (
            <div className="border border-black/15 bg-black/[0.02] p-8 text-center font-mono text-xs text-stone-500">
              No active projects available.
            </div>
          )}
        </div>
      </section>

      {/* Development stages */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_1.2fr]" aria-label="Development stages">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Development stages</p>
          <h2 className="mt-4 font-serif text-4xl">Where the portfolio stands.</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Active project concentration categorized by development phase from preliminary study through documentation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <div key={stage} className="border-l border-black/20 pl-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">{stage}</p>
              <p className="mt-3 font-serif text-3xl">{String(count).padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-stone-600">active project{count === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project progress chart (Live portfolio signal) */}
      <section className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[0.75fr_1.25fr]" aria-label="Project progress chart">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Live portfolio signal</p>
          <h2 className="mt-4 font-serif text-4xl">Progress by development.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            A direct view of current progress from the active project register.
          </p>
        </div>
        <div
          data-testid="project-progress-chart"
          role="img"
          aria-label="Project progress by development"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          {activeProjects.map((project) => (
            <div key={project.id} className="min-w-0">
              <div className="flex h-40 items-end border-b border-l border-black/20 px-2">
                <div
                  className="w-full bg-[#2D2E2C] transition-[height]"
                  style={{ height: `${Math.max(4, project.progress)}%` }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500">
                {project.title}
              </p>
              <p className="mt-1 font-serif text-2xl">{project.progress}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* Weather & Site Intelligence panel (Phase 5) */}
      <ExternalContextPanel />
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

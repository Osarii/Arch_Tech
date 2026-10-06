import {
  compareSnapshots,
  getPortalSnapshot,
  isValidProgressSnapshot,
  type PortalProjectRecord,
  type ProgressSnapshot,
} from '../portal/data';
import { apiClient, getApiBaseUrl } from './apiClient';

export type HistoricalAveragePoint = {
  date: string;
  averageProgress: number;
  snapshotCount: number;
};

export type ProjectMovement = {
  project: PortalProjectRecord;
  delta: number;
  baselineProgress: number;
  currentProgress: number;
};

export type PortfolioProgressChange = {
  delta: number | null;
  baselineAverage: number | null;
  currentAverage: number;
};

export type ProjectTrendData = {
  snapshots: ProgressSnapshot[];
  currentProgress: number;
  baselineProgress: number | null;
  delta: number | null;
  hasHistory: boolean;
};

export type PortfolioAnalytics = {
  activeProjectsCount: number;
  currentAverage: number;
  portfolioHistory: HistoricalAveragePoint[];
  progressChange: PortfolioProgressChange;
  strongestMovement: ProjectMovement | null;
  projectsWithoutHistory: PortalProjectRecord[];
};

export type SnapshotLoadResult = {
  snapshots: ProgressSnapshot[];
  error?: string;
  isRemote: boolean;
};

const isRemoteEnabled = () => Boolean(getApiBaseUrl());

export const analyticsService = {
  isRemote: isRemoteEnabled,

  async fetchSnapshots(validProjectIds?: Set<string>): Promise<SnapshotLoadResult> {
    if (!isRemoteEnabled()) {
      const localSnapshots = getPortalSnapshot().db.progressSnapshots ?? [];
      const filtered = validProjectIds
        ? localSnapshots.filter((s) => validProjectIds.has(s.projectId))
        : localSnapshots;
      return {
        snapshots: [...filtered].sort(compareSnapshots),
        isRemote: false,
      };
    }

    try {
      const raw = await apiClient.get<unknown>('/progressSnapshots');
      if (!Array.isArray(raw)) {
        return {
          snapshots: [],
          error: 'Remote progress snapshots endpoint returned an unexpected response structure.',
          isRemote: true,
        };
      }

      const projectIds = validProjectIds ?? new Set(getPortalSnapshot().projects.map((p) => p.id));
      const valid = raw.filter((item): item is ProgressSnapshot => isValidProgressSnapshot(item, projectIds));
      return {
        snapshots: valid.sort(compareSnapshots),
        isRemote: true,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Historical progress snapshots endpoint is unavailable.';
      return {
        snapshots: [],
        error: message,
        isRemote: true,
      };
    }
  },

  async listSnapshots(validProjectIds?: Set<string>): Promise<ProgressSnapshot[]> {
    const result = await this.fetchSnapshots(validProjectIds);
    return result.snapshots;
  },

  snapshotsByProject(projectId: string, snapshots: ProgressSnapshot[]): ProgressSnapshot[] {
    return snapshots
      .filter((snapshot) => snapshot.projectId === projectId)
      .sort(compareSnapshots);
  },

  chronologicalProjectTrend(project: PortalProjectRecord, snapshots: ProgressSnapshot[]): ProjectTrendData {
    const projectSnapshots = this.snapshotsByProject(project.id, snapshots);
    const hasHistory = projectSnapshots.length > 0;
    const baselineProgress = hasHistory ? projectSnapshots[0].progress : null;
    const delta = hasHistory ? Math.round(project.progress - projectSnapshots[0].progress) : null;

    return {
      snapshots: projectSnapshots,
      currentProgress: project.progress,
      baselineProgress,
      delta,
      hasHistory,
    };
  },

  portfolioAverageOverTime(snapshots: ProgressSnapshot[]): HistoricalAveragePoint[] {
    if (!snapshots.length) return [];

    const groupedByDate = new Map<string, number[]>();
    snapshots.forEach((snapshot) => {
      const values = groupedByDate.get(snapshot.date) ?? [];
      values.push(snapshot.progress);
      groupedByDate.set(snapshot.date, values);
    });

    const dates = Array.from(groupedByDate.keys()).sort((a, b) => {
      const timeA = Date.parse(a);
      const timeB = Date.parse(b);
      if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
      return a.localeCompare(b);
    });

    return dates.map((date) => {
      const values = groupedByDate.get(date)!;
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = values.length ? Math.round((total / values.length) * 10) / 10 : 0;
      return {
        date,
        averageProgress: average,
        snapshotCount: values.length,
      };
    });
  },

  currentPortfolioAverage(projects: PortalProjectRecord[]): number {
    const active = projects.filter((p) => !p.archived);
    if (!active.length) return 0;
    const total = active.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(total / active.length);
  },

  changeBetweenHistoricalAndCurrent(
    projects: PortalProjectRecord[],
    snapshots: ProgressSnapshot[],
  ): PortfolioProgressChange {
    const currentAverage = this.currentPortfolioAverage(projects);
    const history = this.portfolioAverageOverTime(snapshots);

    if (!history.length) {
      return {
        delta: null,
        baselineAverage: null,
        currentAverage,
      };
    }

    const baselineAverage = history[0].averageProgress;
    const delta = Math.round((currentAverage - baselineAverage) * 10) / 10;

    return {
      delta,
      baselineAverage,
      currentAverage,
    };
  },

  strongestPositiveProjectMovement(
    projects: PortalProjectRecord[],
    snapshots: ProgressSnapshot[],
  ): ProjectMovement | null {
    const active = projects.filter((p) => !p.archived);
    let best: ProjectMovement | null = null;

    active.forEach((project) => {
      const projectSnapshots = this.snapshotsByProject(project.id, snapshots);
      if (!projectSnapshots.length) return;

      const baselineProgress = projectSnapshots[0].progress;
      const delta = project.progress - baselineProgress;

      if (delta > 0 && (!best || delta > best.delta)) {
        best = {
          project,
          delta,
          baselineProgress,
          currentProgress: project.progress,
        };
      }
    });

    return best;
  },

  projectsWithoutHistoricalData(
    projects: PortalProjectRecord[],
    snapshots: ProgressSnapshot[],
  ): PortalProjectRecord[] {
    const active = projects.filter((p) => !p.archived);
    const recordedIds = new Set(snapshots.map((s) => s.projectId));
    return active.filter((project) => !recordedIds.has(project.id));
  },

  calculatePortfolioAnalytics(
    projects: PortalProjectRecord[],
    snapshots: ProgressSnapshot[],
  ): PortfolioAnalytics {
    const active = projects.filter((p) => !p.archived);
    return {
      activeProjectsCount: active.length,
      currentAverage: this.currentPortfolioAverage(active),
      portfolioHistory: this.portfolioAverageOverTime(snapshots),
      progressChange: this.changeBetweenHistoricalAndCurrent(active, snapshots),
      strongestMovement: this.strongestPositiveProjectMovement(active, snapshots),
      projectsWithoutHistory: this.projectsWithoutHistoricalData(active, snapshots),
    };
  },
};

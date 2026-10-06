import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  analyticsService,
  type ProjectMovement,
} from '../src/services/analyticsService';
import {
  resetPortalUsers,
  isValidProgressSnapshot,
  compareSnapshots,
  type ProgressSnapshot,
  type PortalProjectRecord,
} from '../src/portal/data';
import { AdminAnalyticsPage } from '../src/components/portal/admin/AdminAnalyticsPage';

const createMockProject = (id: string, title: string, progress: number): PortalProjectRecord => ({
  id,
  code: `AT / ${id.slice(0, 2).toUpperCase()}`,
  title,
  category: 'Commercial',
  phase: 'Concept design',
  progress,
  nextMilestone: 'Review',
  summary: 'Summary',
  statement: 'Statement',
  image: '',
  published: true,
});

describe('Phase 6: Portfolio Analytics & Progress History', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPortalUsers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('DATA: ProgressSnapshot model and validation', () => {
    it('validates correct progress snapshots within 0-100 and existing projectIds', () => {
      const validProjectIds = new Set(['proj-1', 'proj-2']);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'proj-1', date: '2026-01-15', progress: 50 }, validProjectIds)).toBe(true);
      expect(isValidProgressSnapshot({ id: 's2', projectId: 'proj-2', date: '2026-02-15', progress: 0 }, validProjectIds)).toBe(true);
      expect(isValidProgressSnapshot({ id: 's3', projectId: 'proj-2', date: '2026-03-15', progress: 100 }, validProjectIds)).toBe(true);
    });

    it('rejects malformed records and out-of-bound progress values', () => {
      const validProjectIds = new Set(['proj-1']);
      expect(isValidProgressSnapshot({ id: '', projectId: 'proj-1', date: '2026-01-15', progress: 50 }, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'proj-1', date: '', progress: 50 }, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'proj-1', date: '2026-01-15', progress: -1 }, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'proj-1', date: '2026-01-15', progress: 101 }, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'proj-1', date: '2026-01-15', progress: '50' }, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot(null, validProjectIds)).toBe(false);
      expect(isValidProgressSnapshot('string', validProjectIds)).toBe(false);
    });

    it('rejects orphaned progress snapshots whose projectId does not exist', () => {
      const validProjectIds = new Set(['proj-1']);
      expect(isValidProgressSnapshot({ id: 's1', projectId: 'orphan-proj', date: '2026-01-15', progress: 50 }, validProjectIds)).toBe(false);
    });

    it('sorts snapshots deterministically by date ascending, then by id', () => {
      const s1: ProgressSnapshot = { id: 'b', projectId: 'proj-1', date: '2026-03-01', progress: 60 };
      const s2: ProgressSnapshot = { id: 'a', projectId: 'proj-1', date: '2026-01-01', progress: 30 };
      const s3: ProgressSnapshot = { id: 'c', projectId: 'proj-1', date: '2026-01-01', progress: 35 };

      const sorted = [s1, s2, s3].sort(compareSnapshots);
      expect(sorted).toEqual([s2, s3, s1]);
    });
  });

  describe('ANALYTICS: Calculation engine', () => {
    const projects: PortalProjectRecord[] = [
      createMockProject('p1', 'Alpha Campus', 80),
      createMockProject('p2', 'Beta District', 60),
      createMockProject('p3', 'Gamma Hub', 40),
    ];

    const snapshots: ProgressSnapshot[] = [
      { id: 's1', projectId: 'p1', date: '2026-01-15', progress: 40 },
      { id: 's2', projectId: 'p1', date: '2026-04-15', progress: 60 },
      { id: 's3', projectId: 'p2', date: '2026-01-15', progress: 20 },
      { id: 's4', projectId: 'p2', date: '2026-04-15', progress: 40 },
    ];

    it('calculates portfolio average over time chronologically', () => {
      const trend = analyticsService.portfolioAverageOverTime(snapshots);
      expect(trend).toHaveLength(2);
      expect(trend[0]).toEqual({ date: '2026-01-15', averageProgress: 30, snapshotCount: 2 });
      expect(trend[1]).toEqual({ date: '2026-04-15', averageProgress: 50, snapshotCount: 2 });
    });

    it('calculates current portfolio average from live project values', () => {
      const avg = analyticsService.currentPortfolioAverage(projects);
      expect(avg).toBe(60); // (80 + 60 + 40) / 3 = 60
    });

    it('calculates change between historical baseline and current values', () => {
      const change = analyticsService.changeBetweenHistoricalAndCurrent(projects, snapshots);
      expect(change.currentAverage).toBe(60);
      expect(change.baselineAverage).toBe(30);
      expect(change.delta).toBe(30);
    });

    it('identifies strongest positive project movement', () => {
      const best = analyticsService.strongestPositiveProjectMovement(projects, snapshots) as ProjectMovement;
      expect(best).not.toBeNull();
      // p1: 80 - 40 = 40. p2: 60 - 20 = 40.
      expect(best.delta).toBe(40);
      expect(['Alpha Campus', 'Beta District']).toContain(best.project.title);
    });

    it('identifies projects without historical data', () => {
      const withoutData = analyticsService.projectsWithoutHistoricalData(projects, snapshots);
      expect(withoutData).toHaveLength(1);
      expect(withoutData[0].id).toBe('p3');
    });

    it('handles empty snapshot set without errors, NaN, or Infinity', () => {
      const emptyHistory = analyticsService.portfolioAverageOverTime([]);
      expect(emptyHistory).toEqual([]);

      const change = analyticsService.changeBetweenHistoricalAndCurrent(projects, []);
      expect(change.delta).toBeNull();
      expect(change.baselineAverage).toBeNull();
      expect(change.currentAverage).toBe(60);

      const best = analyticsService.strongestPositiveProjectMovement(projects, []);
      expect(best).toBeNull();

      const withoutData = analyticsService.projectsWithoutHistoricalData(projects, []);
      expect(withoutData).toHaveLength(3);
    });

    it('handles single snapshot cleanly', () => {
      const single: ProgressSnapshot[] = [{ id: 's1', projectId: 'p1', date: '2026-01-15', progress: 50 }];
      const trend = analyticsService.portfolioAverageOverTime(single);
      expect(trend).toEqual([{ date: '2026-01-15', averageProgress: 50, snapshotCount: 1 }]);

      const change = analyticsService.changeBetweenHistoricalAndCurrent(projects, single);
      expect(change.baselineAverage).toBe(50);
      expect(change.delta).toBe(10); // 60 - 50 = 10
    });

    it('handles 0% and 100% boundary conditions', () => {
      const boundaryProjects = [
        createMockProject('p0', 'Zero Project', 0),
        createMockProject('p100', 'Max Project', 100),
      ];
      const boundarySnapshots: ProgressSnapshot[] = [
        { id: 'b0', projectId: 'p0', date: '2026-01-15', progress: 0 },
        { id: 'b100', projectId: 'p100', date: '2026-01-15', progress: 100 },
      ];

      const currentAvg = analyticsService.currentPortfolioAverage(boundaryProjects);
      expect(currentAvg).toBe(50);

      const history = analyticsService.portfolioAverageOverTime(boundarySnapshots);
      expect(history[0].averageProgress).toBe(50);

      const change = analyticsService.changeBetweenHistoricalAndCurrent(boundaryProjects, boundarySnapshots);
      expect(change.delta).toBe(0);
    });
  });

  describe('REMOTE: JSON Server integration and failure isolation', () => {
    it('reads /progressSnapshots when remote is enabled', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

      const mockSnapshots = [
        { id: 'r1', projectId: 'zona-franca-la-lima', date: '2026-01-15', progress: 35 },
      ];

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSnapshots),
      }));

      const result = await analyticsService.fetchSnapshots(new Set(['zona-franca-la-lima']));
      expect(result.error).toBeUndefined();
      expect(result.snapshots).toHaveLength(1);
      expect(result.snapshots[0].id).toBe('r1');
      expect(result.isRemote).toBe(true);
    });

    it('safely handles remote /progressSnapshots endpoint failure without crashing', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network connection failed')));

      const result = await analyticsService.fetchSnapshots();
      expect(result.error).toMatch(/Network connection failed/i);
      expect(result.snapshots).toEqual([]);
      expect(result.isRemote).toBe(true);

      const list = await analyticsService.listSnapshots();
      expect(list).toEqual([]);
    });
  });

  describe('UI: AdminAnalyticsPage rendering and interaction', () => {
    it('renders historical portfolio trend chart and KPI strip', async () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByText(/Administration \/ Analytics/i)).toBeDefined();
      expect(screen.getByText(/Portfolio analytics & signals/i)).toBeDefined();

      // KPI strip
      expect(screen.getAllByText(/Active projects/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Current average progress/i)).toBeDefined();
      expect(screen.getByText(/Portfolio progress change/i)).toBeDefined();

      // Portfolio trend chart
      const portfolioChart = screen.getByTestId('portfolio-trend-chart');
      expect(portfolioChart).toBeDefined();
      expect(portfolioChart.querySelector('svg')).toBeDefined();

      // Check for presence of percentage values in chart
      expect(portfolioChart.textContent).toMatch(/Live \d+%/);

      // Verify no NaN or Infinity is printed anywhere in the DOM
      expect(document.body.innerHTML).not.toContain('NaN');
      expect(document.body.innerHTML).not.toContain('Infinity');
    });

    it('changes project trend when selecting a development from dropdown', async () => {
      render(<AdminAnalyticsPage />);

      const selector = screen.getByTestId('project-trend-select');
      expect(selector).toBeDefined();

      // Change selection to El Cafetal
      fireEvent.change(selector, { target: { value: 'el-cafetal' } });

      await waitFor(() => {
        const projectChart = screen.getByTestId('project-trend-chart');
        expect(projectChart).toBeDefined();
        expect(screen.getByText(/AT \/ 02/)).toBeDefined();
      });

      expect(document.body.innerHTML).not.toContain('NaN');
      expect(document.body.innerHTML).not.toContain('Infinity');
    });

    it('distinguishes historical and live progress points clearly in charts', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getAllByText(/Historical checkpoint/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Live registered progress/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ARCH_TECH concept telemetry/i).length).toBeGreaterThan(0);
    });

    it('keeps existing development stages, live project comparison, and site intelligence intact', () => {
      render(<AdminAnalyticsPage />);

      // Existing stages
      expect(screen.getByText(/Development stages/i)).toBeDefined();
      expect(screen.getByText(/Where the portfolio stands/i)).toBeDefined();

      // Existing current progress chart
      expect(screen.getByTestId('project-progress-chart')).toBeDefined();

      // Phase 5 Site Intelligence
      expect(screen.getByTestId('site-intelligence-input')).toBeDefined();
      expect(screen.getByTestId('site-intelligence-analyze')).toBeDefined();
    });

    it('renders a useful empty state notice when remote snapshot endpoint fails', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');

      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/progressSnapshots')) {
          return { ok: false, status: 503, text: async () => 'Service Unavailable' };
        }
        return { ok: true, status: 200, text: async () => '[]' };
      }));

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-remote-warning')).toBeDefined();
      });

      // The rest of the page remains intact
      expect(screen.getAllByText(/Active projects/i).length).toBeGreaterThan(0);
      expect(screen.getByTestId('project-progress-chart')).toBeDefined();
      expect(screen.getByTestId('site-intelligence-input')).toBeDefined();
    });
  });
});

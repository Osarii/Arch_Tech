import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { PortalProject } from '../src/portal/data';
import { projectService } from '../src/services/projectService';
import { calculatePortfolioInsights, portfolioInsightsService } from '../src/services/portfolioInsightsService';
import { PortfolioInsightsPanel } from '../src/components/portal/admin/PortfolioInsightsPanel';
import { AdminAssistantPage } from '../src/components/portal/admin/AdminAssistantPage';
import { bimAgent } from '../src/bim/ai/AIAgent';

vi.mock('../src/bim/ai/AIAgent', () => ({
  bimAgent: { subscribe: vi.fn(() => () => {}), sendMessage: vi.fn().mockResolvedValue(undefined), clearHistory: vi.fn() },
}));
vi.mock('../src/components/portal/PortalShell', () => ({
  usePortalShell: () => ({ insideShell: true, navigate: vi.fn() }),
  PortalShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const project = (id: string, changes: Partial<PortalProject> = {}): PortalProject => ({
  id, code: id, title: `Project ${id}`, category: 'Infrastructure', phase: 'Design',
  progress: 20, nextMilestone: '', summary: '', statement: '', image: '',
  updates: [], milestones: [], documents: [], approvals: [], ...changes,
});
const pending = project('pending', {
  progress: 40,
  approvals: [{ projectId: 'pending', title: 'Design review', status: 'Pending' }],
  milestones: [
    { projectId: 'pending', label: 'Design', status: 'Current' },
    { projectId: 'pending', label: 'Delivery', status: 'Upcoming' },
    { projectId: 'pending', label: 'Brief', status: 'Complete' },
  ],
});
const priority = project('priority', {
  progress: 80,
  approvals: [{ projectId: 'priority', title: 'Revision', status: 'Rejected' }],
});

beforeEach(() => {
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// JSDOM does not implement scrolling.
Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });

describe('deterministic portfolio intelligence', () => {
  it('calculates the unweighted average and relation counts from non-archived projects only', () => {
    const archived = project('archived', {
      ...pending, id: 'archived', archived: true, progress: 100,
      approvals: [{ projectId: 'archived', title: 'Ignored', status: 'Pending' }],
      milestones: [{ projectId: 'archived', label: 'Ignored', status: 'Current' }],
    });
    const result = calculatePortfolioInsights([pending, priority, project('info'), archived]);
    expect(result.summary).toEqual({ activeProjects: 3, averageProgress: 140 / 3, pendingApprovals: 1, currentMilestones: 1, upcomingMilestones: 1, attentionProjects: 2 });
    expect(result.projects.map((item) => item.projectId)).toEqual(['priority', 'pending', 'info']);
    expect(result.executiveBrief).toContain('46.7% average recorded progress');
  });

  it('explains severity and focus using recorded approvals and milestones', () => {
    const result = calculatePortfolioInsights([pending, priority, project('info', { progress: 0 })]);
    expect(result.projects[0]).toMatchObject({ severity: 'priority', reasons: ['Rejected approval: Revision'], recommendedFocus: 'Review rejected approvals and coordinate revisions.' });
    expect(result.projects[1]).toMatchObject({ severity: 'attention', progress: 40, reasons: ['Pending approval: Design review', 'Current milestone: Design', 'Upcoming milestone: Delivery'] });
    expect(result.projects[2].severity).toBe('info');
    expect(result.projects[2].reasons).toEqual(['No pending or rejected approvals, or current or upcoming milestones recorded.']);
  });

  it('keeps milestone-only and approved projects informational regardless of recorded progress', () => {
    const result = calculatePortfolioInsights([
      project('current', { progress: 0, milestones: [{ projectId: 'current', label: 'Survey', status: 'Current' }] }),
      project('upcoming', { milestones: [{ projectId: 'upcoming', label: 'Review', status: 'Upcoming' }] }),
      project('approved', { approvals: [{ projectId: 'approved', title: 'Accepted', status: 'Approved' }] }),
    ]);
    expect(result.projects.every((item) => item.severity === 'info')).toBe(true);
    expect(result.projects.find((item) => item.projectId === 'current')?.recommendedFocus).toContain('current milestones');
    expect(result.projects.find((item) => item.projectId === 'upcoming')?.recommendedFocus).toContain('upcoming milestones');
    expect(result.summary.attentionProjects).toBe(0);
  });

  it('ignores relations belonging to another project', () => {
    const result = calculatePortfolioInsights([project('a', { approvals: pending.approvals, milestones: pending.milestones })]);
    expect(result.summary.pendingApprovals).toBe(0);
    expect(result.summary.currentMilestones).toBe(0);
    expect(result.summary.upcomingMilestones).toBe(0);
    expect(result.projects[0].severity).toBe('info');
  });

  it('returns finite zero totals for empty or fully archived portfolios', () => {
    const empty = calculatePortfolioInsights([]);
    expect(empty.summary).toEqual({ activeProjects: 0, averageProgress: 0, pendingApprovals: 0, currentMilestones: 0, upcomingMilestones: 0, attentionProjects: 0 });
    expect(empty.projects).toEqual([]);
    expect(calculatePortfolioInsights([project('a', { archived: true })])).toEqual(empty);
  });

  it('orders by severity, title and ID, and sorts reasons without mutating input', () => {
    const a = project('a', { title: 'Same', approvals: [
      { projectId: 'a', title: 'Zoning', status: 'Pending' },
      { projectId: 'a', title: 'Access', status: 'Pending' },
    ] });
    const b = project('b', { title: 'Same', approvals: [{ projectId: 'b', title: 'Access', status: 'Pending' }] });
    const projects = [b, project('z', { title: 'Alpha' }), a, priority];
    const before = structuredClone(projects);
    const first = calculatePortfolioInsights(projects);
    expect(first.projects.map((item) => item.projectId)).toEqual(['priority', 'a', 'b', 'z']);
    expect(calculatePortfolioInsights([...projects].reverse().map((item) => ({ ...item, approvals: [...item.approvals].reverse() })))).toEqual(first);
    expect(projects).toEqual(before);
  });

  it('loads exclusively through projectService.list and propagates service failure', async () => {
    const list = vi.spyOn(projectService, 'list').mockResolvedValue([pending]);
    await expect(portfolioInsightsService.get()).resolves.toEqual(calculatePortfolioInsights([pending]));
    expect(list).toHaveBeenCalledTimes(1);
    list.mockRejectedValue(new Error('Offline'));
    await expect(portfolioInsightsService.get()).rejects.toThrow('Offline');
  });
});

describe('portfolio panel and Admin Assistant', () => {
  it('renders summary, brief, queue, reasons and project navigation above the real BIM Assistant', async () => {
    vi.spyOn(projectService, 'list').mockResolvedValue([pending, priority]);
    const navigate = vi.fn();
    render(<AdminAssistantPage onNavigate={navigate} />);
    expect(screen.getByRole('status').textContent).toContain('Loading');
    await screen.findByRole('heading', { name: 'Executive brief' });
    const panel = screen.getByRole('region', { name: 'Portfolio intelligence' });
    expect(within(panel).getByText('CURRENT DATA')).toBeDefined();
    expect(within(panel).getAllByRole('term')).toHaveLength(6);
    expect(within(panel).getByText('60.0%')).toBeDefined();
    expect(within(panel).getByRole('heading', { name: 'Attention queue' })).toBeDefined();
    expect(within(panel).getByText('Rejected approval: Revision')).toBeDefined();
    expect(within(panel).getByText('Upcoming milestone: Delivery')).toBeDefined();
    fireEvent.click(within(panel).getByRole('button', { name: 'Project priority' }));
    expect(navigate).toHaveBeenCalledWith('/admin/projects/priority');
    const bim = screen.getByText('BIM AI Assistant');
    expect(panel.compareDocumentPosition(bim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Calculate model quantities' })); });
    expect(bimAgent.sendMessage).toHaveBeenCalledWith('Calculate model quantities');
  });

  it('renders empty data without implying average progress', async () => {
    vi.spyOn(projectService, 'list').mockResolvedValue([]);
    render(<PortfolioInsightsPanel onNavigate={vi.fn()} />);
    await screen.findByText('No active projects to review.');
    expect(screen.getByText('No non-archived projects are available in the current portfolio.')).toBeDefined();
    expect(screen.getByText('—')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Project reasons' })).toBeNull();
  });

  it('shows unavailable data while preserving usable BIM controls', async () => {
    vi.spyOn(projectService, 'list').mockRejectedValue(new Error('Service unavailable'));
    render(<AdminAssistantPage onNavigate={vi.fn()} />);
    await screen.findByText('Portfolio intelligence is unavailable. Current project data could not be loaded.');
    expect(screen.getByText('BIM AI Assistant')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Executive brief' })).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Find all walls' })); });
    expect(bimAgent.sendMessage).toHaveBeenCalledWith('Find all walls');
  });
});

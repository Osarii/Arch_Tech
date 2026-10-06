import type { PortalProject } from '../portal/data';
import { projectService } from './projectService';

export interface PortfolioSummary {
  activeProjects: number;
  averageProgress: number;
  pendingApprovals: number;
  currentMilestones: number;
  upcomingMilestones: number;
  attentionProjects: number;
}

export interface ProjectInsight {
  projectId: string;
  projectTitle: string;
  progress: number;
  severity: 'info' | 'attention' | 'priority';
  reasons: string[];
  recommendedFocus: string;
}

export interface PortfolioInsights {
  summary: PortfolioSummary;
  projects: ProjectInsight[];
  executiveBrief: string;
}

// Compare by code point so ordering does not depend on the browser locale.
const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const severityOrder = { priority: 0, attention: 1, info: 2 };

export const calculatePortfolioInsights = (projects: readonly PortalProject[]): PortfolioInsights => {
  const active = projects.filter((project) => !project.archived);
  const summary: PortfolioSummary = {
    activeProjects: active.length,
    averageProgress: active.length ? active.reduce((sum, project) => sum + project.progress, 0) / active.length : 0,
    pendingApprovals: 0,
    currentMilestones: 0,
    upcomingMilestones: 0,
    attentionProjects: 0,
  };
  const insights = active.map((project): ProjectInsight => {
    const approvals = project.approvals.filter((item) => item.projectId === project.id);
    const milestones = project.milestones.filter((item) => item.projectId === project.id);
    const pending = approvals.filter((item) => item.status === 'Pending');
    const rejected = approvals.filter((item) => item.status === 'Rejected');
    const current = milestones.filter((item) => item.status === 'Current');
    const upcoming = milestones.filter((item) => item.status === 'Upcoming');
    summary.pendingApprovals += pending.length;
    summary.currentMilestones += current.length;
    summary.upcomingMilestones += upcoming.length;
    const severity = rejected.length ? 'priority' : pending.length ? 'attention' : 'info';
    if (severity !== 'info') summary.attentionProjects += 1;
    const reasons = [
      ...rejected.map((item) => `Rejected approval: ${item.title}`).sort(compareText),
      ...pending.map((item) => `Pending approval: ${item.title}`).sort(compareText),
      ...current.map((item) => `Current milestone: ${item.label}`).sort(compareText),
      ...upcoming.map((item) => `Upcoming milestone: ${item.label}`).sort(compareText),
    ];
    if (!reasons.length) reasons.push('No pending or rejected approvals, or current or upcoming milestones recorded.');
    return {
      projectId: project.id,
      projectTitle: project.title,
      progress: project.progress,
      severity,
      reasons,
      recommendedFocus: rejected.length ? 'Review rejected approvals and coordinate revisions.'
        : pending.length ? 'Review pending approvals with the responsible stakeholders.'
          : current.length ? 'Review the recorded current milestones.'
            : upcoming.length ? 'Review the recorded upcoming milestones.'
              : 'Review the project record for the next coordination action.',
    };
  }).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    || compareText(a.projectTitle, b.projectTitle) || compareText(a.projectId, b.projectId));

  return {
    summary,
    projects: insights,
    executiveBrief: active.length
      ? `${summary.activeProjects} non-archived projects have ${summary.averageProgress.toFixed(1)}% average recorded progress. ${summary.pendingApprovals} pending approvals and ${summary.attentionProjects} projects with pending or rejected approvals require review. ${summary.currentMilestones} current and ${summary.upcomingMilestones} upcoming milestones are recorded.`
      : 'No non-archived projects are available in the current portfolio.',
  };
};

export const portfolioInsightsService = {
  async get(): Promise<PortfolioInsights> {
    return calculatePortfolioInsights(await projectService.list());
  },
};

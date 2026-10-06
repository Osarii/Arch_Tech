import React, { useEffect, useState } from 'react';
import { portfolioInsightsService, type PortfolioInsights } from '../../../services/portfolioInsightsService';
import type { Navigate } from '../PortalCommon';

export const PortfolioInsightsPanel: React.FC<{ onNavigate: Navigate }> = ({ onNavigate }) => {
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let active = true;
    portfolioInsightsService.get().then((result) => {
      if (active) {
        setInsights(result);
        setStatus('ready');
      }
    }).catch(() => {
      if (active) setStatus('unavailable');
    });
    return () => { active = false; };
  }, []);

  const attention = insights?.projects.filter((project) => project.severity !== 'info') ?? [];
  const summary = insights?.summary;

  return (
    <section aria-label="Portfolio intelligence" className="border-b border-black/15 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl">Portfolio intelligence</h2>
        <span className="font-mono text-[10px] tracking-[0.2em] text-stone-500">CURRENT DATA</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Recorded progress and workflow relations for non-archived projects. Priority: rejected approvals. Attention: pending approvals. Milestone status follows the project record.
      </p>
      {status === 'loading' && <p role="status" className="mt-6 text-sm">Loading portfolio intelligence…</p>}
      {status === 'unavailable' && <p role="status" className="mt-6 text-sm">Portfolio intelligence is unavailable. Current project data could not be loaded.</p>}
      {status === 'ready' && insights && summary && (
        <div className="mt-6 space-y-8">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {[
              ['Active projects', summary.activeProjects],
              ['Average progress', summary.activeProjects ? `${summary.averageProgress.toFixed(1)}%` : '—'],
              ['Pending approvals', summary.pendingApprovals],
              ['Current milestones', summary.currentMilestones],
              ['Upcoming milestones', summary.upcomingMilestones],
              ['Attention projects', summary.attentionProjects],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-black/15 pt-3">
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-2 font-serif text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h3 className="font-serif text-xl">Executive brief</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{insights.executiveBrief}</p>
          </div>
          <div>
            <h3 className="font-serif text-xl">Attention queue</h3>
            {attention.length ? (
              <ol className="mt-3 space-y-3">
                {attention.map((project) => (
                  <li key={project.projectId} className="flex flex-wrap items-center justify-between gap-2 border-t border-black/15 pt-3">
                    <button className="text-left text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2" onClick={() => onNavigate(`/admin/projects/${encodeURIComponent(project.projectId)}`)}>{project.projectTitle}</button>
                    <span className="font-mono text-xs uppercase">{project.severity}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-stone-600">{summary.activeProjects ? 'No projects have pending or rejected approvals.' : 'No active projects to review.'}</p>}
          </div>
          {insights.projects.length > 0 && (
            <div>
              <h3 className="font-serif text-xl">Project reasons</h3>
              <div className="mt-3 space-y-4">
                {insights.projects.map((project) => (
                  <article key={project.projectId} className="border-t border-black/15 pt-4">
                    <h4 className="text-sm font-medium">{project.projectTitle} · {project.progress}% recorded progress · {project.severity}</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-600">
                      {project.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}
                    </ul>
                    <p className="mt-3 text-sm"><span className="font-medium">Recommended focus: </span>{project.recommendedFocus}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

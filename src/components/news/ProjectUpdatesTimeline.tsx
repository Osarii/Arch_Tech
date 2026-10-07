import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getPublicNewsUpdates, newsUpdatePath } from '../../services/newsService';
import { useLocale } from '../../portal/locale';

export const ProjectUpdatesTimeline: React.FC<{ projectId: string; onNavigate: (path: string) => void }> = ({ projectId, onNavigate }) => {
  const { publicNews } = useLocale();
  const updates = getPublicNewsUpdates(projectId);
  if (!updates.length) return null;
  return (
    <section aria-labelledby="project-updates-title" className="mx-auto max-w-7xl border-t border-white/[0.12] px-6 py-12 sm:px-8 lg:grid lg:grid-cols-[0.35fr_1fr] lg:gap-10 lg:px-12 lg:py-16">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#79B791]">{publicNews.timelineJournal}</p>
        <h2 id="project-updates-title" className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">
          {publicNews.timelineTitle}
        </h2>
      </div>
      <ol className="mt-8 divide-y divide-white/[0.12] lg:mt-0">
        {updates.map((update) => (
          <li key={update.id} className="py-5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => onNavigate(newsUpdatePath(update))}
              className="group grid w-full gap-2 text-left sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-5"
            >
              <time className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#79B791]">{update.date}</time>
              <span>
                <span className="block font-serif text-2xl font-light text-[#EDF4ED] group-hover:text-[#ABD1B5]">{update.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#ABD1B5]">{update.body}</span>
              </span>
              <ArrowUpRight className="hidden h-4 w-4 text-[#FFBF00] sm:block" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};

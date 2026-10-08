import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight, Search } from 'lucide-react';
import { bimEngine } from '@/bim/engine/BimEngine';
import { useBimStore } from '@/stores/bimStore';

export const BimModelExplorer: React.FC = () => {
  const { t } = useTranslation('workspace');
  const activeSiteContextId = useBimStore((state) => state.activeSiteContextId);
  const query = useBimStore((state) => state.sceneExplorerQuery);
  const setQuery = useBimStore((state) => state.setSceneExplorerQuery);
  const selectedElements = useBimStore((state) => state.selectedSceneElements);
  const hiddenIds = useBimStore((state) => state.hiddenSceneElementIds);
  const selectedIds = useMemo(() => new Set(selectedElements.map((item) => item.id)), [selectedElements]);
  const groups = useMemo(() => bimEngine.getSceneExplorerGroups(query), [query]);

  if (!activeSiteContextId) return null;

  return (
    <aside aria-label={t('modelExplorer', 'Model explorer')} data-testid="bim-model-explorer" className="absolute right-3 top-14 z-20 flex max-h-[calc(100%-4.5rem)] w-72 flex-col border border-[#2a3040] bg-[#12141a]/95 p-3 text-xs text-slate-200 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#79B791]">
        <Building2 className="h-3 w-3" />
        <span>{t('modelExplorer', 'Model explorer')}</span>
      </div>
      <label className="sr-only" htmlFor="bim-explorer-search">{t('searchElements', 'Search elements')}</label>
      <div className="mt-2 flex items-center border border-[#2a3040] bg-[#171a22] px-2">
        <Search className="h-3 w-3 shrink-0 text-slate-500" />
        <input id="bim-explorer-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchElements', 'Search elements')} className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[11px] text-slate-200 outline-none placeholder:text-slate-600" />
      </div>
      <div className="mt-2 overflow-y-auto pr-1">
        <div className="flex items-center gap-1 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-300">
          <ChevronRight className="h-3 w-3 text-[#79B791]" /> {t('laLimaSite', 'La Lima Site')}
        </div>
        {groups.map((group) => (
          <section key={group.id} className="border-l border-[#2a3040] pl-2">
            <button type="button" onClick={() => void bimEngine.selectSceneElements(group.targets.map((target) => target.id), false, true)} className="flex w-full items-center justify-between py-1 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400 transition hover:text-slate-100">
              <span>{group.name}</span><span>{group.targets.length}</span>
            </button>
            {group.targets.map((target) => (
              <button key={target.id} type="button" data-testid={`bim-explorer-${target.id}`} onClick={(event) => void bimEngine.selectSceneElements([target.id], event.shiftKey || event.metaKey || event.ctrlKey, true)} className={`block w-full truncate border-l-2 py-1 pl-2 text-left text-[11px] transition ${hiddenIds.has(target.id) ? 'border-transparent text-slate-600 line-through' : selectedIds.has(target.id) ? 'border-[#FFBF00] bg-[#202534] text-slate-100' : 'border-transparent text-slate-300 hover:bg-[#1a1e28] hover:text-slate-100'}`} title={target.details.name}>
                {target.details.name}
              </button>
            ))}
          </section>
        ))}
        {groups.length === 0 && <p className="py-3 text-center text-[11px] text-slate-500">{t('noElementsFound', 'No elements found')}</p>}
      </div>
    </aside>
  );
};

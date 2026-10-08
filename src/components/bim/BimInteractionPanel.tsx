import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Focus, Layers, Target, X } from 'lucide-react';
import { bimEngine } from '@/bim/engine/BimEngine';
import { useBimStore } from '@/stores/bimStore';

export const BimInteractionPanel: React.FC = () => {
  const { t } = useTranslation('workspace');
  const selection = useBimStore((state) => state.selectedSceneElement);

  if (!selection) return null;

  const fields = [
    [t('elementCategory', 'Category'), selection.category],
    [t('elementType', 'Type'), selection.type],
    [t('levelPrefix', 'Level'), selection.level],
    [t('material', 'Material'), selection.material],
    [t('zone', 'Zone'), selection.zone],
    [t('project', 'Project'), selection.project],
    [t('elementId', 'Element ID'), selection.elementId],
  ].filter(([, value]) => Boolean(value));

  return (
    <aside
      aria-label={t('selectedElement', 'Selected element')}
      data-testid="bim-interaction-panel"
      className="absolute left-3 top-14 z-20 w-72 border border-[#2a3040] bg-[#12141a]/95 p-3 text-xs text-slate-200 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#282e3c] pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#79B791]">
            <Target className="h-3 w-3" />
            <span>{t('selection', 'Selection')}</span>
          </div>
          <h2 className="mt-1 truncate font-serif text-lg leading-tight text-slate-100">{selection.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => void bimEngine.clearCurrentSelection()}
          aria-label={t('clearSelection', 'Clear selection')}
          className="shrink-0 p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5">
        {fields.map(([label, value]) => (
          <React.Fragment key={String(label)}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</dt>
            <dd className="truncate text-right text-[11px] text-slate-200" title={String(value)}>{value}</dd>
          </React.Fragment>
        ))}
      </dl>

      <div className="mt-3 grid grid-cols-3 gap-px border border-[#2a3040] bg-[#2a3040]">
        <button
          type="button"
          data-testid="bim-action-focus"
          onClick={() => void bimEngine.focusSelected()}
          className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]"
        >
          <Focus className="h-3 w-3 text-[#79B791]" /> {t('focus', 'Focus')}
        </button>
        <button
          type="button"
          data-testid="bim-action-isolate"
          onClick={() => void bimEngine.isolateSelected()}
          className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]"
        >
          <Layers className="h-3 w-3 text-[#FFBF00]" /> {t('isolate', 'Isolate')}
        </button>
        <button
          type="button"
          data-testid="bim-action-hide"
          onClick={() => void bimEngine.hideSelected()}
          className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]"
        >
          <EyeOff className="h-3 w-3 text-slate-400" /> {t('hide', 'Hide')}
        </button>
      </div>
      <button
        type="button"
        data-testid="bim-action-show-all"
        onClick={() => void bimEngine.showAll()}
        className="mt-2 flex w-full items-center justify-center gap-1 border border-[#2a3040] px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-300 transition hover:border-[#79B791] hover:text-slate-100"
      >
        <Eye className="h-3 w-3 text-[#79B791]" /> {t('showAll', 'Show All')}
      </button>
    </aside>
  );
};

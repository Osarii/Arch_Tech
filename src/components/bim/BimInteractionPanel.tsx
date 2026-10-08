import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Focus, Layers, Target, X } from 'lucide-react';
import { bimEngine } from '@/bim/engine/BimEngine';
import { useBimStore } from '@/stores/bimStore';

type Field = [string, string | undefined];

const uniqueValues = (values: Array<string | undefined>) => [...new Set(values.filter(Boolean) as string[])].join(', ');

export const BimInteractionPanel: React.FC = () => {
  const { t } = useTranslation('workspace');
  const selections = useBimStore((state) => state.selectedSceneElements);
  const isMultiple = selections.length > 1;

  if (selections.length === 0) return null;

  const primary = selections[0];
  const groups: Array<[string, Field[]]> = isMultiple
    ? [
        [t('identity', 'Identity'), [[t('elementsLabel', 'Elements'), String(selections.length)]]],
        [t('classification', 'Classification'), [[t('elementCategory', 'Category'), uniqueValues(selections.map((item) => item.category))], [t('elementType', 'Type'), uniqueValues(selections.map((item) => item.type))]]],
        [t('location', 'Location'), [[t('zone', 'Zone'), uniqueValues(selections.map((item) => item.zone))], [t('project', 'Project'), uniqueValues(selections.map((item) => item.project))]]],
        [t('material', 'Material'), [[t('material', 'Material'), uniqueValues(selections.map((item) => item.material))]]],
        [t('statusLabel', 'Status'), [[t('statusLabel', 'Status'), uniqueValues(selections.map((item) => item.status))]]],
      ]
    : [
        [t('identity', 'Identity'), [[t('elementId', 'Element ID'), primary.elementId]]],
        [t('classification', 'Classification'), [[t('elementCategory', 'Category'), primary.category], [t('elementType', 'Type'), primary.type]]],
        [t('location', 'Location'), [[t('levelPrefix', 'Level'), primary.level], [t('zone', 'Zone'), primary.zone], [t('project', 'Project'), primary.project]]],
        [t('material', 'Material'), [[t('material', 'Material'), primary.material]]],
        [t('statusLabel', 'Status'), [[t('statusLabel', 'Status'), primary.status]]],
      ];

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
            <span>{isMultiple ? t('selectedElementsCount', '{{count}} selected', { count: selections.length }) : t('selection', 'Selection')}</span>
          </div>
          <h2 className="mt-1 truncate font-serif text-lg leading-tight text-slate-100">{isMultiple ? t('multiSelection', 'Multiple elements') : primary.name}</h2>
        </div>
        <button type="button" onClick={() => void bimEngine.clearCurrentSelection()} aria-label={t('clearSelection', 'Clear selection')} className="shrink-0 p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {groups.map(([title, fields]) => {
          const available = fields.filter(([, value]) => Boolean(value));
          if (available.length === 0) return null;
          return (
            <section key={title}>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{title}</h3>
              <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                {available.map(([label, value]) => (
                  <React.Fragment key={label}>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                    <dd className="truncate text-right text-[11px] text-slate-200" title={value}>{value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-px border border-[#2a3040] bg-[#2a3040]">
        <button type="button" data-testid="bim-action-focus" onClick={() => void bimEngine.focusSelected()} className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]">
          <Focus className="h-3 w-3 text-[#79B791]" /> {t('focus', 'Focus')}
        </button>
        <button type="button" data-testid="bim-action-isolate" onClick={() => void bimEngine.isolateSelected()} className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]">
          <Layers className="h-3 w-3 text-[#FFBF00]" /> {t('isolate', 'Isolate')}
        </button>
        <button type="button" data-testid="bim-action-hide" onClick={() => void bimEngine.hideSelected()} className="flex items-center justify-center gap-1 bg-[#171a22] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-200 transition hover:bg-[#202534]">
          <EyeOff className="h-3 w-3 text-slate-400" /> {t('hide', 'Hide')}
        </button>
      </div>
      <button type="button" data-testid="bim-action-show-all" onClick={() => void bimEngine.showAll()} className="mt-2 flex w-full items-center justify-center gap-1 border border-[#2a3040] px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-300 transition hover:border-[#79B791] hover:text-slate-100">
        <Eye className="h-3 w-3 text-[#79B791]" /> {t('showAll', 'Show All')}
      </button>
      <p className="mt-2 font-mono text-[9px] text-slate-500">{t('selectionShortcuts', 'F focus · H hide · Esc clear')}</p>
    </aside>
  );
};

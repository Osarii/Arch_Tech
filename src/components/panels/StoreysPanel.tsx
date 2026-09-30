import React from 'react';
import {
  Layers,
  MapPin,
  Eye,
  EyeOff,
  Maximize2,
  Compass,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { StoreyData } from '@/types/bim';

export const StoreysPanel: React.FC = () => {
  const storeysData = useBimStore((s) => s.storeysData);
  const activeFloorPlanStorey = useBimStore((s) => s.activeFloorPlanStorey);
  const is2DMode = useBimStore((s) => s.is2DMode);
  const hiddenStoreys = useBimStore((s) => s.hiddenStoreys);
  const toggleStoreyVisibility = useBimStore((s) => s.toggleStoreyVisibility);

  const handleOpenFloorPlan = async (storey: StoreyData) => {
    await bimEngine.openFloorPlan(storey.name, storey.elementIds);
  };

  const handleIsolateStorey = async (storey: StoreyData) => {
    await bimEngine.isolateStorey(storey.elementIds);
    useBimStore.getState().setIsIsolated(true);
  };

  const handleFitStorey = async (storey: StoreyData) => {
    await bimEngine.fitStorey(storey.elementIds);
  };

  const handleRestoreAll = async () => {
    await bimEngine.restoreAllStoreys();
  };

  const handleToggleStorey = async (storeyName: string, elementIds: number[]) => {
    toggleStoreyVisibility(storeyName);
    const isHidden = hiddenStoreys.has(storeyName);
    if (isHidden) {
      await bimEngine.showAll();
    } else {
      await bimEngine.hideElements(elementIds);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs select-none">
      {/* Active Floor Plan Banner */}
      {is2DMode && activeFloorPlanStorey && (
        <div className="p-2.5 bg-emerald-950/60 border-b border-emerald-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-200">
              2D Plan: <span className="font-mono text-white">{activeFloorPlanStorey}</span>
            </span>
          </div>
          <button
            onClick={() => bimEngine.exitFloorPlan()}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-[11px] font-medium transition"
            title="Switch back to 3D Orbit View"
          >
            <Compass className="w-3 h-3" />
            <span>Exit 2D</span>
          </button>
        </div>
      )}

      {/* Global Actions */}
      <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#151720]">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px]">Building Storeys ({storeysData.length})</span>
        </div>
        <button
          onClick={handleRestoreAll}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#1c202a] hover:bg-[#252b39] text-slate-300 text-[11px] transition border border-[#2b3140]"
          title="Restore visibility and framing of all building storeys"
        >
          <RotateCcw className="w-3 h-3 text-sky-400" />
          <span>Restore All</span>
        </button>
      </div>

      {/* Storey List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {storeysData.length > 0 ? (
          storeysData.map((storey) => {
            const isPlanActive = activeFloorPlanStorey === storey.name && is2DMode;
            const isHidden = hiddenStoreys.has(storey.name);

            return (
              <div
                key={storey.id}
                data-testid={`storey-card-${storey.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`p-2.5 rounded-lg border transition ${
                  isPlanActive
                    ? 'bg-emerald-950/40 border-emerald-600/80 shadow-md shadow-emerald-950/50'
                    : 'bg-[#161822] border-[#252a36] hover:border-[#353d4f]'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm flex items-center space-x-1.5">
                      <span>{storey.name}</span>
                      {isPlanActive && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white font-normal uppercase">
                          Active 2D
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">Elev: {storey.elevation}m</span>
                      </span>
                      <span>•</span>
                      <span>{storey.elementCount} elements</span>
                    </div>
                  </div>

                  {/* Eye Toggle */}
                  <button
                    onClick={() => handleToggleStorey(storey.name, storey.elementIds)}
                    className="p-1 hover:bg-[#202533] rounded text-slate-400 hover:text-slate-200 transition"
                    title={`Toggle ${storey.name} visibility`}
                  >
                    {isHidden ? (
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                </div>

                {/* Category Chips */}
                <div className="flex flex-wrap gap-1 my-2">
                  {storey.categories.map((c) => (
                    <span
                      key={c.name}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c202d] text-slate-300 border border-[#2b3142]"
                    >
                      {c.name}: {c.count}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 pt-1 border-t border-[#222736]">
                  <button
                    onClick={() => handleOpenFloorPlan(storey)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded text-[11px] font-medium transition ${
                      isPlanActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/80'
                    }`}
                    title="Generate 2D Top-Down Orthographic Floor Plan"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>2D Floor Plan</span>
                  </button>

                  <button
                    onClick={() => handleIsolateStorey(storey)}
                    className="px-2 py-1 rounded bg-[#1f2432] hover:bg-[#2a3144] text-slate-200 text-[11px] transition border border-[#2b3242]"
                    title="Isolate this storey in 3D"
                  >
                    <span>Isolate</span>
                  </button>

                  <button
                    onClick={() => handleFitStorey(storey)}
                    className="p-1 rounded bg-[#1f2432] hover:bg-[#2a3144] text-slate-300 transition border border-[#2b3242]"
                    title="Fit camera to storey elements"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-slate-500">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No storeys detected in active model.</p>
          </div>
        )}
      </div>
    </div>
  );
};

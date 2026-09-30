import React, { useMemo } from 'react';
import {
  Filter,
  Search,
  Layers,
  Box,
  Palette,
  Sliders,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { BimFilterService } from '@/bim/filter/bimFilterService';

export const AdvancedFilterPanel: React.FC = () => {
  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const categories = useBimStore((s) => s.categories);
  const storeys = useBimStore((s) => s.storeys);
  const materials = useBimStore((s) => s.materials);
  const filterCriteria = useBimStore((s) => s.filterCriteria);
  const setFilterCriteria = useBimStore((s) => s.setFilterCriteria);
  const resetFilterCriteria = useBimStore((s) => s.resetFilterCriteria);
  const storeysData = useBimStore((s) => s.storeysData);

  // Compute all element IDs in model
  const allElementIds = useMemo(() => {
    const ids: number[] = [];
    for (const s of storeysData) {
      ids.push(...s.elementIds);
    }
    return ids;
  }, [storeysData]);

  const expressIdToCategory = useBimStore((s) => s.expressIdToCategory);
  const expressIdToStorey = useBimStore((s) => s.expressIdToStorey);

  // Compute matching IDs using real IFC data
  const matchedIds = useMemo(() => {
    if (!bimEngine.webIfcApi || bimEngine.webIfcModelID === null || allElementIds.length === 0) {
      return [];
    }

    return BimFilterService.filterElements(
      bimEngine.webIfcApi,
      bimEngine.webIfcModelID,
      allElementIds,
      filterCriteria,
      expressIdToCategory,
      expressIdToStorey
    );
  }, [filterCriteria, allElementIds, expressIdToCategory, expressIdToStorey]);

  const handleIsolateMatches = async () => {
    if (matchedIds.length > 0) {
      await bimEngine.isolateElements(matchedIds);
      useBimStore.getState().setIsIsolated(true);
    }
  };

  const handleSelectMatches = async () => {
    if (matchedIds.length > 0) {
      await bimEngine.selectElements(matchedIds, true);
    }
  };

  const handleReset = async () => {
    resetFilterCriteria();
    await bimEngine.showAll();
  };

  if (!modelMetadata) {
    return (
      <div className="flex-1 p-6 text-center text-slate-500 text-xs">
        <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p>Load an IFC model to use advanced multi-faceted filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs select-none">
      {/* Header / Match summary badge */}
      <div className="p-2.5 rounded-lg bg-[#181b26] border border-[#272d3e] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span className="font-medium text-slate-200">
            Matches: <span className="font-mono text-sky-300 font-bold" data-testid="filter-match-count">{matchedIds.length}</span> / {allElementIds.length}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-[#202534] transition"
          title="Reset all filter fields"
        >
          <RotateCcw className="w-3 h-3 text-sky-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Category / IFC Type Dropdown */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
          <Box className="w-3.5 h-3.5 text-sky-400" />
          <span>IFC Category / Type</span>
        </label>
        <select
          value={filterCriteria.type || ''}
          data-testid="filter-select-type"
          onChange={(e) =>
            setFilterCriteria({ ...filterCriteria, type: e.target.value || undefined })
          }
          className="w-full bg-[#151722] border border-[#262c3e] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Building Storey Dropdown */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Building Storey</span>
        </label>
        <select
          value={filterCriteria.storey || ''}
          data-testid="filter-select-storey"
          onChange={(e) =>
            setFilterCriteria({ ...filterCriteria, storey: e.target.value || undefined })
          }
          className="w-full bg-[#151722] border border-[#262c3e] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
        >
          <option value="">All Storeys ({storeys.length})</option>
          {storeys.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Name Substring Search */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <span>Element Name / Tag</span>
        </label>
        <input
          type="text"
          placeholder="Filter by name (e.g. Wall, Door 01)"
          value={filterCriteria.nameQuery || ''}
          data-testid="filter-input-name"
          onChange={(e) => setFilterCriteria({ ...filterCriteria, nameQuery: e.target.value })}
          className="w-full bg-[#151722] border border-[#262c3e] rounded px-2.5 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* 4. Material Dropdown */}
      {materials.length > 0 && (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Associated Material</span>
          </label>
          <select
            value={filterCriteria.material || ''}
            data-testid="filter-select-material"
            onChange={(e) =>
              setFilterCriteria({ ...filterCriteria, material: e.target.value || undefined })
            }
            className="w-full bg-[#151722] border border-[#262c3e] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="">All Materials ({materials.length})</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 5. Property Set Values */}
      <div className="space-y-1.5 border-t border-[#222738] pt-2.5">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Property Set Value</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Property (e.g. LoadBearing)"
            value={filterCriteria.propertyName || ''}
            onChange={(e) =>
              setFilterCriteria({ ...filterCriteria, propertyName: e.target.value || undefined })
            }
            className="bg-[#151722] border border-[#262c3e] rounded px-2 py-1 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
          />
          <input
            type="text"
            placeholder="Value (e.g. true)"
            value={filterCriteria.propertyValue || ''}
            onChange={(e) =>
              setFilterCriteria({ ...filterCriteria, propertyValue: e.target.value || '' })
            }
            className="bg-[#151722] border border-[#262c3e] rounded px-2 py-1 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          onClick={handleIsolateMatches}
          disabled={matchedIds.length === 0}
          data-testid="filter-btn-isolate"
          className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-sm disabled:opacity-40"
        >
          Isolate Matches in 3D ({matchedIds.length})
        </button>

        <button
          onClick={handleSelectMatches}
          disabled={matchedIds.length === 0}
          data-testid="filter-btn-select"
          className="w-full py-1.5 px-3 rounded-lg bg-[#1e2332] hover:bg-[#272e42] text-slate-200 font-medium text-xs transition border border-[#2d354a] disabled:opacity-40"
        >
          Select Matches in 3D
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import {
  BarChart3,
  Layers,
  Box,
  Palette,
  Ruler,
  Building,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';

export const BimAnalysisPanel: React.FC = () => {
  const analysisData = useBimStore((s) => s.analysisData);
  const modelMetadata = useBimStore((s) => s.modelMetadata);

  if (!analysisData || !modelMetadata) {
    return (
      <div className="flex-1 p-6 text-center text-slate-500 text-xs">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p>Load an IFC model to view BIM structural analysis.</p>
      </div>
    );
  }

  const { categoryCounts, storeyDistributions, quantities, materials, totalElements } = analysisData;

  const categoryEntries = Object.entries(categoryCounts).filter(([, count]) => count > 0);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs select-none">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#171a24] p-2.5 rounded-lg border border-[#252b3a]">
          <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
            <Box className="w-3 h-3 text-sky-400" />
            <span>Elements</span>
          </span>
          <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
            {totalElements}
          </span>
        </div>

        <div className="bg-[#171a24] p-2.5 rounded-lg border border-[#252b3a]">
          <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>Levels</span>
          </span>
          <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
            {analysisData.totalStoreys}
          </span>
        </div>

        <div className="bg-[#171a24] p-2.5 rounded-lg border border-[#252b3a]">
          <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
            <Palette className="w-3 h-3 text-amber-400" />
            <span>Materials</span>
          </span>
          <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
            {analysisData.totalMaterials}
          </span>
        </div>
      </div>

      {/* Real IFC Quantities Section */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 border-b border-[#252b3c] pb-2">
          <Ruler className="w-3.5 h-3.5 text-sky-400" />
          <span>Real IFC Quantities Takeoff</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="bg-[#1b1f2c] p-2 rounded border border-[#282f42]">
            <span className="text-[10px] text-slate-400 block">Gross Wall Area</span>
            <span className="text-slate-100 font-semibold text-xs mt-0.5 block">
              {quantities.totalWallGrossArea > 0 ? `${quantities.totalWallGrossArea} m²` : 'Extracted from geometry'}
            </span>
          </div>

          <div className="bg-[#1b1f2c] p-2 rounded border border-[#282f42]">
            <span className="text-[10px] text-slate-400 block">Total Slab Area</span>
            <span className="text-slate-100 font-semibold text-xs mt-0.5 block">
              {quantities.totalSlabArea > 0 ? `${quantities.totalSlabArea} m²` : 'Extracted from geometry'}
            </span>
          </div>

          <div className="bg-[#1b1f2c] p-2 rounded border border-[#282f42]">
            <span className="text-[10px] text-slate-400 block">Total Volume</span>
            <span className="text-slate-100 font-semibold text-xs mt-0.5 block">
              {quantities.totalVolume > 0 ? `${quantities.totalVolume} m³` : 'Standard Qto'}
            </span>
          </div>

          <div className="bg-[#1b1f2c] p-2 rounded border border-[#282f42]">
            <span className="text-[10px] text-slate-400 block">Doors & Windows</span>
            <span className="text-slate-100 font-semibold text-xs mt-0.5 block">
              {quantities.totalDoorsCount} doors / {quantities.totalWindowsCount} win
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 border-b border-[#252b3c] pb-2">
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Category Breakdown</span>
        </h4>

        <div className="space-y-2">
          {categoryEntries.map(([cat, count]) => {
            const percentage = totalElements > 0 ? Math.round((count / totalElements) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">{cat}</span>
                  <span className="font-mono text-slate-400">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#202535] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storey Distribution Section */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 border-b border-[#252b3c] pb-2">
          <Building className="w-3.5 h-3.5 text-amber-400" />
          <span>Storey Distribution</span>
        </h4>

        <div className="space-y-2">
          {Object.entries(storeyDistributions).map(([storeyName, dist]) => {
            const storeyTotal = Object.values(dist).reduce((a, b) => a + b, 0);
            return (
              <div
                key={storeyName}
                className="bg-[#1b1f2c] p-2.5 rounded border border-[#262c3e] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{storeyName}</span>
                  <span className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800">
                    {storeyTotal} items
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
                  {Object.entries(dist)
                    .filter(([, c]) => c > 0)
                    .map(([cName, cCount]) => (
                      <span
                        key={cName}
                        className="bg-[#13151f] px-1.5 py-0.5 rounded border border-[#222838]"
                      >
                        {cName}: {cCount}
                      </span>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Materials List */}
      {materials.length > 0 && (
        <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2">
          <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 border-b border-[#252b3c] pb-2">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Extracted IFC Materials ({materials.length})</span>
          </h4>

          <div className="flex flex-wrap gap-1">
            {materials.map((m) => (
              <span
                key={m}
                className="px-2 py-0.5 rounded bg-[#1c2130] text-slate-300 text-[10px] font-mono border border-[#2c344a]"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

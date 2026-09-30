import React from 'react';
import { Activity, X, Cpu } from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';

export const PerformanceMonitor: React.FC = () => {
  const isPerfOpen = useBimStore((s) => s.isPerfOpen);
  const togglePerfOpen = useBimStore((s) => s.togglePerfOpen);
  const perfStats = useBimStore((s) => s.perfStats);
  const modelMetadata = useBimStore((s) => s.modelMetadata);

  if (!isPerfOpen) return null;

  const fpsBadge =
    perfStats.fps >= 45
      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
      : perfStats.fps >= 30
      ? 'bg-amber-950/80 text-amber-400 border-amber-700/60'
      : 'bg-rose-950/80 text-rose-400 border-rose-700/60';

  return (
    <div className="absolute top-3 left-3 z-30 w-64 bg-[#141720]/95 backdrop-blur-md border border-[#262c3b] rounded-xl shadow-2xl p-3 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232734] mb-2.5">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Diagnostics</span>
        </div>
        <button
          onClick={togglePerfOpen}
          className="text-slate-500 hover:text-slate-300 transition"
          title="Close Diagnostics"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-2 rounded-lg border flex flex-col ${fpsBadge}`}>
          <span className="text-[10px] uppercase font-mono opacity-80">Framerate</span>
          <span className="text-xl font-bold font-mono">{perfStats.fps} FPS</span>
        </div>

        <div className="p-2 rounded-lg bg-[#1a1e28] border border-[#282f40] flex flex-col text-slate-200">
          <span className="text-[10px] uppercase font-mono text-slate-400">Frame Time</span>
          <span className="text-xl font-bold font-mono">{perfStats.frameTimeMs} ms</span>
        </div>
      </div>

      {/* GPU / WebGL Render Stats */}
      <div className="space-y-1.5 text-[11px] font-mono text-slate-300 bg-[#101218] p-2 rounded-md border border-[#1f2330] mb-2.5">
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">Draw Calls:</span>
          <span className="text-slate-100">{perfStats.drawCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">Triangles:</span>
          <span className="text-slate-100">{perfStats.triangles.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">Geometries:</span>
          <span className="text-slate-100">{perfStats.geometries}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">Loaded Elements:</span>
          <span className="text-sky-400 font-medium">
            {modelMetadata ? modelMetadata.elementCount : 0}
          </span>
        </div>
      </div>

      {/* Baseline Target Info */}
      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 bg-sky-950/20 border border-sky-900/30 px-2 py-1 rounded">
        <Cpu className="w-3 h-3 text-sky-400 shrink-0" />
        <span>Profile: Intel UHD 630 (DPR 1.25, Shadows OFF)</span>
      </div>
    </div>
  );
};

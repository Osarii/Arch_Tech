import React, { useRef } from 'react';
import {
  FolderOpen,
  Box,
  Layers,
  Activity,
  SlidersHorizontal,
  XCircle,
  Camera,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { bimEngine } from '@/bim/engine/BimEngine';

export const HeaderBar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const loading = useBimStore((s) => s.loading);
  const cameraMode = useBimStore((s) => s.cameraMode);
  const setCameraMode = useBimStore((s) => s.setCameraMode);
  const perfStats = useBimStore((s) => s.perfStats);
  const togglePerfOpen = useBimStore((s) => s.togglePerfOpen);
  const isTreeOpen = useBimStore((s) => s.isTreeOpen);
  const toggleTreeOpen = useBimStore((s) => s.toggleTreeOpen);
  const isPropsOpen = useBimStore((s) => s.isPropsOpen);
  const togglePropsOpen = useBimStore((s) => s.togglePropsOpen);
  const is2DMode = useBimStore((s) => s.is2DMode);
  const activeFloorPlanStorey = useBimStore((s) => s.activeFloorPlanStorey);

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await IfcLoaderService.loadIfc(file);
      e.target.value = '';
    }
  };

  const handleLoadSample = async (samplePath: string, name: string) => {
    try {
      useBimStore.getState().setLoading({
        isBusy: true,
        stage: 'Fetching sample IFC',
        progress: 10,
        filename: name,
      });
      const response = await fetch(samplePath);
      if (!response.ok) throw new Error(`HTTP ${response.status} loading sample`);
      const buffer = await response.arrayBuffer();
      await IfcLoaderService.loadIfc(buffer, name);
    } catch (err: any) {
      console.error('Failed to load sample IFC:', err);
      useBimStore.getState().setLoading({
        isBusy: false,
        stage: 'Error',
        progress: 0,
        error: `Could not load sample: ${err.message}`,
      });
    }
  };

  const handleToggleCamera = () => {
    const nextMode = cameraMode === 'perspective' ? 'orthographic' : 'perspective';
    setCameraMode(nextMode);
    bimEngine.setCameraMode(nextMode);
  };

  // FPS status color
  const fpsColor =
    perfStats.fps >= 45
      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
      : perfStats.fps >= 30
      ? 'text-amber-400 bg-amber-950/60 border-amber-800'
      : 'text-rose-400 bg-rose-950/60 border-rose-800';

  return (
    <header className="h-11 bg-[#12141a] border-b border-[#222630] px-3 flex items-center justify-between select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-sky-600/30 border border-sky-500/50 flex items-center justify-center text-sky-400 font-mono text-xs font-bold">
            B1
          </div>
          <span className="font-semibold text-xs tracking-wider text-slate-200">
            BIM LAB <span className="text-sky-400 font-mono text-[10px]">V1</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#2d3240]" />

        {/* File Actions */}
        <div className="flex items-center space-x-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleOpenFileClick}
            disabled={loading.isBusy}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#1c202a] hover:bg-[#252b39] active:bg-[#2d3547] text-slate-200 text-xs font-medium border border-[#2d3342] transition disabled:opacity-50"
            title="Open IFC File"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Open IFC</span>
          </button>

          <button
            onClick={() => handleLoadSample('/small_model.ifc', 'Building-Architecture.ifc')}
            disabled={loading.isBusy}
            data-testid="header-btn-sample-fast"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1c202a] text-slate-300 hover:text-sky-300 text-xs transition disabled:opacity-50"
            title="Load Official buildingSMART Sample Model (90KB)"
          >
            <Box className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample (Fast)</span>
          </button>

          <button
            onClick={() => handleLoadSample('/sample.ifc', 'BasicHouse.ifc')}
            disabled={loading.isBusy}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1c202a] text-slate-300 hover:text-sky-300 text-xs transition disabled:opacity-50"
            title="Load Complete Revit House IFC (50MB, 1500 Psets)"
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample (House)</span>
          </button>

          {modelMetadata && (
            <button
              onClick={() => IfcLoaderService.unload()}
              className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-950/40 text-rose-400 text-xs transition"
              title="Close Active Model"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>

        {modelMetadata && (
          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-400 bg-[#161922] px-2 py-0.5 rounded border border-[#252b3a]">
            <span className="text-slate-300 font-mono font-medium truncate max-w-[140px]">
              {modelMetadata.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-400 font-mono">{modelMetadata.schema}</span>
            <span className="text-slate-500">•</span>
            <span>{modelMetadata.elementCount} elements</span>
          </div>
        )}

        {is2DMode && activeFloorPlanStorey && (
          <div
            data-testid="header-badge-2d-mode"
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/80 text-[11px] text-emerald-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold font-mono">2D: {activeFloorPlanStorey}</span>
            <button
              onClick={() => bimEngine.exitFloorPlan()}
              className="ml-1 text-[10px] text-emerald-400 hover:text-emerald-100 underline"
              title="Exit 2D Plan Mode"
            >
              Exit
            </button>
          </div>
        )}
      </div>

      {/* Right Tools & Diagnostics */}
      <div className="flex items-center space-x-2">
        {/* Camera Toggle */}
        <button
          onClick={handleToggleCamera}
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#181b24] hover:bg-[#202532] text-xs text-slate-300 border border-[#2a3040] transition"
          title={`Switch Camera Projection (Currently: ${cameraMode})`}
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="capitalize font-mono text-[11px]">{cameraMode}</span>
        </button>

        {/* Panel Toggles */}
        <button
          onClick={toggleTreeOpen}
          className={`p-1.5 rounded text-xs transition border ${
            isTreeOpen
              ? 'bg-sky-950/50 border-sky-800/80 text-sky-300'
              : 'bg-[#181b24] border-[#2a3040] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Spatial Tree Panel"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={togglePropsOpen}
          className={`p-1.5 rounded text-xs transition border ${
            isPropsOpen
              ? 'bg-sky-950/50 border-sky-800/80 text-sky-300'
              : 'bg-[#181b24] border-[#2a3040] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Properties Panel"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#2d3240]" />

        {/* FPS Indicator Badge */}
        <button
          onClick={togglePerfOpen}
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition ${fpsColor}`}
          title="Toggle Performance Diagnostics Panel"
        >
          <Activity className="w-3 h-3" />
          <span>{perfStats.fps} FPS</span>
        </button>
      </div>
    </header>
  );
};

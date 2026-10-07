import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  Box,
  Layers,
  Activity,
  SlidersHorizontal,
  XCircle,
  Camera,
  Eye,
  Pencil,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { bimEngine } from '@/bim/engine/BimEngine';
import { bimEditService } from '@/bim/edit/bimEditService';
import {
  LA_LIMA_SITE_CONTEXT_ID,
  laLimaSiteContextService,
} from '@/bim/site';
import { EditMode } from '@/types/bim';
import { ArchTechLogo } from '@/components/brand/ArchTechLogo';

export const HeaderBar: React.FC = () => {
  const { t } = useTranslation(['workspace', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const activeSiteContextId = useBimStore((s) => s.activeSiteContextId);
  const activeSiteContextLabel = useBimStore((s) => s.activeSiteContextLabel);
  const loading = useBimStore((s) => s.loading);
  const cameraMode = useBimStore((s) => s.cameraMode);
  const setCameraMode = useBimStore((s) => s.setCameraMode);
  const perfStats = useBimStore((s) => s.perfStats);
  const renderQuality = useBimStore((s) => s.renderQuality);
  const togglePerfOpen = useBimStore((s) => s.togglePerfOpen);
  const isTreeOpen = useBimStore((s) => s.isTreeOpen);
  const toggleTreeOpen = useBimStore((s) => s.toggleTreeOpen);
  const isPropsOpen = useBimStore((s) => s.isPropsOpen);
  const togglePropsOpen = useBimStore((s) => s.togglePropsOpen);
  const is2DMode = useBimStore((s) => s.is2DMode);
  const activeFloorPlanStorey = useBimStore((s) => s.activeFloorPlanStorey);

  // Phase 3 Edit Mode & Change Set
  const editMode = useBimStore((s) => s.editMode);
  const setEditMode = useBimStore((s) => s.setEditMode);
  const changeSet = useBimStore((s) => s.changeSet);
  const canUndo = useBimStore((s) => s.canUndo);
  const canRedo = useBimStore((s) => s.canRedo);
  const setLeftPanelTab = useBimStore((s) => s.setLeftPanelTab);
  const rightPanelTab = useBimStore((s) => s.rightPanelTab);
  const setRightPanelTab = useBimStore((s) => s.setRightPanelTab);

  // Global Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          bimEditService.redo();
        } else {
          bimEditService.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        bimEditService.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await IfcLoaderService.loadIfc(file);
    } catch (err) {
      console.error('Failed to load user IFC file:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      console.error(`Failed to load sample ${name}:`, err);
      useBimStore.getState().setLoading({
        isBusy: false,
        stage: 'Error',
        progress: 0,
        error: `Could not load sample: ${err.message}`,
      });
    }
  };

  const handleUnload = async () => {
    await IfcLoaderService.unload();
  };

  const handleLoadLaLimaSite = async () => {
    try {
      await bimEngine.waitForInit();
      await IfcLoaderService.unload();
      const scene = bimEngine.world?.scene?.three;
      if (!scene) throw new Error('BIM scene is not initialized.');
      laLimaSiteContextService.attach(scene);
      laLimaSiteContextService.load();
      bimEngine.setRenderQuality(bimEngine.getRenderQuality());
      const store = useBimStore.getState();
      store.setActiveSiteContextId(LA_LIMA_SITE_CONTEXT_ID);
      store.setActiveSiteContextLabel(t('laLimaSite', 'La Lima Site'));
      bimEngine.setCameraMode('perspective');
      setCameraMode('perspective');
      bimEngine.fitModel();
      bimEngine.setStandardView('isometric');
    } catch (err: any) {
      console.error('Failed to load La Lima concept site:', err);
      useBimStore.getState().setLoading({
        isBusy: false,
        stage: 'Error',
        progress: 0,
        error: err.message || 'Could not load La Lima concept site.',
      });
    }
  };

  const handleToggleCamera = () => {
    const newMode = cameraMode === 'perspective' ? 'orthographic' : 'perspective';
    bimEngine.setCameraMode(newMode);
    setCameraMode(newMode);
  };

  const handleSetMode = (mode: EditMode) => {
    setEditMode(mode);
    if (mode === 'edit') {
      setRightPanelTab('edit');
    } else {
      setRightPanelTab('properties');
    }
  };

  return (
    <header className="h-12 w-full bg-[#101217] border-b border-[#222630] flex items-center justify-between px-3 select-none z-30">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ifc"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Brand & File Actions */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <ArchTechLogo variant="mark" tone="mint-cream" theme="dark" className="arch-tech-logo-workspace" label="GARNIER ARCHITECTURE" />
          <span className="font-semibold text-slate-100 text-sm tracking-tight">
            <span className="text-[10px] text-sky-400 font-mono bg-sky-950/70 border border-sky-800 px-1 py-0.5 rounded">{t('openbimWorkspaceBadge', 'OPENBIM WORKSPACE')}</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#2d3342]" />

        <div className="flex items-center space-x-1">
          <button
            onClick={handleOpenFileClick}
            disabled={loading.isBusy}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#181b24] hover:bg-[#202532] text-slate-200 text-xs font-medium border border-[#2a3040] transition disabled:opacity-50"
            title={t('openLocalIfcTooltip', 'Open local .ifc file')}
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('openIfc', 'Open IFC')}</span>
          </button>

          <button
            onClick={() => handleLoadSample('/ifc_open_house.ifc', 'IfcOpenHouse_IFC4.ifc')}
            disabled={loading.isBusy}
            data-testid="header-btn-sample-fast"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1c202a] text-slate-300 hover:text-sky-300 text-xs transition disabled:opacity-50"
            title={t('sampleFastTooltip', 'Load IfcOpenHouse Sample Model (IFC4, 111KB)')}
          >
            <Box className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('sampleFast', 'Sample (Fast)')}</span>
          </button>

          <button
            onClick={handleLoadLaLimaSite}
            disabled={loading.isBusy}
            data-testid="header-btn-la-lima-site"
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition disabled:opacity-50 ${
              activeSiteContextId === LA_LIMA_SITE_CONTEXT_ID
                ? 'bg-emerald-950/70 text-emerald-300'
                : 'hover:bg-[#1c202a] text-slate-300 hover:text-emerald-300'
            }`}
            title={t('laLimaSiteTooltip', 'Load the La Lima industrial and corporate concept site')}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('laLimaSite', 'La Lima Site')}</span>
          </button>

          <button
            onClick={() => handleLoadSample('/sample.ifc', 'BasicHouse.ifc')}
            disabled={loading.isBusy}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1c202a] text-slate-300 hover:text-sky-300 text-xs transition disabled:opacity-50"
            title={t('sampleHouseTooltip', 'Load Complete Revit House IFC (50MB, 1500 Psets)')}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('sampleHouse', 'Sample (House)')}</span>
          </button>

          {(modelMetadata || activeSiteContextId) && (
            <button
              onClick={handleUnload}
              className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-950/40 text-rose-400 text-xs transition"
              title={t('closeActiveModelTooltip', 'Close Active Model')}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{t('closeModel', 'Close')}</span>
            </button>
          )}
        </div>

        {modelMetadata && (
          <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-400 bg-[#161922] px-2 py-0.5 rounded border border-[#252b3a]">
            <span className="text-slate-300 font-mono font-medium truncate max-w-[140px]">
              {modelMetadata.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-400 font-mono">{modelMetadata.schema}</span>
            <span className="text-slate-500">•</span>
            <span>{t('elementsCount', '{{count}} elements', { count: modelMetadata.elementCount })}</span>
          </div>
        )}

        {!modelMetadata && activeSiteContextLabel && (
          <div className="hidden xl:flex items-center text-[11px] text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
            <span className="font-mono font-medium">{activeSiteContextLabel}</span>
          </div>
        )}

        {is2DMode && activeFloorPlanStorey && (
          <div
            data-testid="header-badge-2d-mode"
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/80 text-[11px] text-emerald-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold font-mono">{t('floorPlan2dLabel', '2D: {{storey}}', { storey: activeFloorPlanStorey })}</span>
            <button
              onClick={() => bimEngine.exitFloorPlan()}
              className="ml-1 text-[10px] text-emerald-400 hover:text-emerald-100 underline"
              title={t('exit2DPlanModeTooltip', 'Exit 2D Plan Mode')}
            >
              {t('exit', 'Exit')}
            </button>
          </div>
        )}
      </div>

      {/* Center: Inspect Mode / Edit Mode Switcher */}
      {modelMetadata && (
        <div className="flex items-center space-x-2">
          {/* Mode Pill Toggle */}
          <div className="flex items-center bg-[#141722] border border-[#262c3b] rounded-lg p-0.5 text-xs select-none">
            <button
              onClick={() => handleSetMode('inspect')}
              data-testid="mode-inspect"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                editMode === 'inspect'
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('inspectModeTooltip', 'Inspect Mode (Read-Only Analysis, Slicing, Measurements)')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('inspect', 'Inspect')}</span>
            </button>
            <button
              onClick={() => handleSetMode('edit')}
              data-testid="mode-edit"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                editMode === 'edit'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('editModeTooltip', 'Edit Mode (Non-Destructive Transforms, Overrides, Actions)')}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{t('edit', 'Edit')}</span>
            </button>
          </div>

          {/* Quick Undo / Redo in Edit Mode */}
          {editMode === 'edit' && (
            <div className="flex items-center space-x-1 bg-[#141722] border border-[#262c3b] rounded-lg px-1.5 py-0.5 text-xs">
              <button
                onClick={() => bimEditService.undo()}
                disabled={!canUndo}
                data-testid="header-btn-undo"
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition"
                title={t('undoTooltip', 'Undo (Ctrl+Z)')}
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => bimEditService.redo()}
                disabled={!canRedo}
                data-testid="header-btn-redo"
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition"
                title={t('redoTooltip', 'Redo (Ctrl+Shift+Z)')}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setLeftPanelTab('changes')}
                data-testid="header-changes-badge"
                className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-[10px] font-mono text-purple-300 hover:bg-purple-900 transition flex items-center space-x-1"
                title={t('viewNonDestructiveChangeSet', 'View non-destructive change set')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>
                  {t('editsCount', '{{count}} edits', { count: changeSet.length })}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right Tools & Diagnostics */}
      <div className="flex items-center space-x-2">
        {/* Camera Toggle */}
        <button
          onClick={handleToggleCamera}
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#181b24] hover:bg-[#202532] text-xs text-slate-300 border border-[#2a3040] transition"
          title={t('switchCameraProjectionTooltip', 'Switch Camera Projection (Currently: {{mode}})', { mode: cameraMode })}
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px] capitalize">{cameraMode}</span>
        </button>

        <select
          value={renderQuality}
          onChange={(event) => bimEngine.setRenderQuality(event.target.value as 'performance' | 'balanced' | 'quality')}
          data-testid="render-quality-select"
          className="rounded bg-[#181b24] hover:bg-[#202532] border border-[#2a3040] px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:ring-1 focus:ring-sky-500"
          aria-label={t('renderQuality', 'Render quality')}
          title={t('renderQualityTooltip', 'Select renderer quality profile')}
        >
          <option value="performance">{t('renderQualityPerformance', 'Performance')}</option>
          <option value="balanced">{t('renderQualityBalanced', 'Balanced')}</option>
          <option value="quality">{t('renderQualityQuality', 'Quality')}</option>
        </select>

        {/* Panel Toggles */}
        <div className="flex items-center space-x-1 border-l border-[#2d3342] pl-2">
          <button
            onClick={toggleTreeOpen}
            className={`p-1.5 rounded transition ${
              isTreeOpen
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b24]'
            }`}
            title={t('toggleSpatialTreePanel', 'Toggle Spatial Tree Panel')}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePropsOpen}
            className={`p-1.5 rounded transition ${
              isPropsOpen
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b24]'
            }`}
            title={t('togglePropertiesPanel', 'Toggle Properties Panel')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (!isPropsOpen) togglePropsOpen();
              setRightPanelTab('ai');
            }}
            data-testid="header-btn-ai"
            className={`p-1.5 rounded transition ${
              isPropsOpen && rightPanelTab === 'ai'
                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                : 'text-purple-400 hover:text-purple-200 hover:bg-[#1d1627]'
            }`}
            title={t('openAiBimAssistant', 'Open AI BIM Assistant')}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Performance Stats Pill */}
        <button
          onClick={togglePerfOpen}
          data-testid="header-perf-toggle"
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#141720] hover:bg-[#1b202c] border border-[#262c3b] text-xs font-mono transition"
          title={t('toggleDiagnosticsOverlay', 'Toggle Diagnostics Overlay')}
        >
          <Activity
            className={`w-3.5 h-3.5 ${
              perfStats.fps >= 50
                ? 'text-emerald-400'
                : perfStats.fps >= 30
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          />
          <span
            className={
              perfStats.fps >= 50
                ? 'text-emerald-300'
                : perfStats.fps >= 30
                ? 'text-amber-300'
                : 'text-rose-300'
            }
          >
            {t('fpsFormat', '{{fps}} FPS', { fps: perfStats.fps })}
          </span>
        </button>
      </div>
    </header>
  );
};

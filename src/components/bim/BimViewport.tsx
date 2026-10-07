import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { LA_LIMA_SITE_CONTEXT_ID, laLimaSiteContextService } from '@/bim/site';
import { Box, UploadCloud, Compass, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { StandardViewDirection } from '@/types/bim';

export const BimViewport: React.FC = () => {
  const { t } = useTranslation('workspace');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const activeSiteContextId = useBimStore((s) => s.activeSiteContextId);
  const loading = useBimStore((s) => s.loading);
  const setSelectedElement = useBimStore((s) => s.setSelectedElement);
  const setPerfStats = useBimStore((s) => s.setPerfStats);
  const setSelectedNodeId = useBimStore((s) => s.setSelectedNodeId);

  useEffect(() => {
    if (!containerRef.current) return;

    // Connect selection callback
    bimEngine.onElementSelected = (details) => {
      setSelectedElement(details);
      if (details) {
        setSelectedNodeId(`elem-${details.expressID}`);
      } else {
        setSelectedNodeId(null);
      }
    };

    // Connect performance stats callback
    bimEngine.onPerformanceUpdate = (stats) => {
      setPerfStats(stats);
    };

    // Initialize BIM Engine
    bimEngine.init(containerRef.current).catch((err) => {
      console.error('Failed to initialize BimEngine:', err);
    });

    return () => {
      // Don't fully dispose on hot reload, but handle resize cleanup
    };
  }, [setSelectedElement, setPerfStats, setSelectedNodeId]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.ifc')) {
      await IfcLoaderService.loadIfc(file);
    }
  };

  const handleSetView = (direction: StandardViewDirection) => {
    bimEngine.setStandardView(direction);
    setShowViewMenu(false);
  };

  const handleLoadLaLimaSite = async () => {
    try {
      await bimEngine.waitForInit();
      await IfcLoaderService.unload();
      const scene = bimEngine.world?.scene?.three;
      if (!scene) throw new Error('BIM scene is not initialized.');
      laLimaSiteContextService.attach(scene);
      laLimaSiteContextService.load();
      const store = useBimStore.getState();
      store.setActiveSiteContextId(LA_LIMA_SITE_CONTEXT_ID);
      store.setActiveSiteContextLabel(t('laLimaSite', 'La Lima Site'));
      bimEngine.setCameraMode('perspective');
      store.setCameraMode('perspective');
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

  return (
    <div
      className="relative flex-1 h-full w-full bg-[#0d0f12] overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Drag & Drop Highlight Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-sky-950/60 backdrop-blur-sm border-2 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-16 h-16 text-sky-400 animate-bounce mb-3" />
          <p className="text-sky-200 font-medium text-lg">{t('dropIfcFileToLoad', 'Drop IFC file to load')}</p>
          <p className="text-sky-400/80 text-sm mt-1">{t('acceptsStandardIfc', 'Accepts standard .ifc building models')}</p>
        </div>
      )}

      {/* Empty State Overlay */}
      {!modelMetadata && !activeSiteContextId && !loading.isBusy && !loading.error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none">
          <div className="max-w-md w-full bg-[#13161e]/90 backdrop-blur-md border border-[#222735] rounded-xl p-6 shadow-2xl text-center pointer-events-auto">
            <div className="w-12 h-12 rounded-lg bg-sky-950/70 border border-sky-800/60 flex items-center justify-center mx-auto mb-4 text-sky-400">
              <Box className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-100 mb-1.5">{t('noBimModelLoaded', 'No BIM Model Loaded')}</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {t('dragAndDropPrompt', 'Drag and drop any .ifc file into the viewport, or open a sample model below.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleLoadLaLimaSite}
                className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium shadow-sm transition flex items-center justify-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('loadLaLimaSite', 'Load La Lima Site')}</span>
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/ifc_open_house.ifc');
                  const buf = await res.arrayBuffer();
                  await IfcLoaderService.loadIfc(buf, 'IfcOpenHouse_IFC4.ifc');
                }}
                className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-sm transition flex items-center justify-center space-x-1.5"
              >
                <Box className="w-3.5 h-3.5" />
                <span>{t('loadSampleFast', 'Load Sample (Fast, 111KB)')}</span>
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/sample.ifc');
                  const buf = await res.arrayBuffer();
                  await IfcLoaderService.loadIfc(buf, 'BasicHouse.ifc');
                }}
                className="px-3 py-2 rounded bg-[#1f2430] hover:bg-[#282f40] text-slate-200 text-xs font-medium border border-[#2e3648] transition flex items-center justify-center space-x-1.5"
              >
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('loadHouseFull', 'Load House (Full, 50MB)')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Progress Overlay */}
      {loading.isBusy && (
        <div className="absolute inset-0 z-30 bg-[#0d0f14]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="max-w-sm w-full bg-[#141720] border border-[#242938] rounded-lg p-5 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
              <div>
                <h3 className="text-xs font-semibold text-slate-200">{t('loadingIfcModel', 'Loading IFC Model')}</h3>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">
                  {loading.filename || t('processingGeometry', 'Processing geometry...')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-sky-400">{loading.stage}</span>
                <span className="text-slate-400">{loading.progress}%</span>
              </div>
              <div className="w-full bg-[#202534] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loading.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {loading.error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4">
          <div className="bg-rose-950/90 border border-rose-800 text-rose-200 p-3 rounded-lg shadow-lg flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">{t('modelLoadingError', 'Model Loading Error')}</p>
              <p className="text-[11px] text-rose-200/90 mt-0.5">{loading.error}</p>
            </div>
            <button
              onClick={() => useBimStore.getState().setLoading({ error: undefined })}
              className="text-rose-400 hover:text-rose-200 text-xs font-mono ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Viewport Floating Quick View Cube / Menu */}
      {(modelMetadata || activeSiteContextId) && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative">
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#161922]/90 hover:bg-[#1f2330] text-slate-300 text-xs font-mono border border-[#282e3e] shadow-md transition backdrop-blur-sm"
              title={t('cameraViewAngleTooltip', 'Camera View Angle')}
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('view', 'View')}</span>
            </button>

            {showViewMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-[#161922] border border-[#282e3e] rounded-md shadow-xl py-1 z-30 text-xs">
                {(['isometric', 'top', 'bottom', 'front', 'back', 'left', 'right'] as StandardViewDirection[]).map(
                  (v) => (
                    <button
                      key={v}
                      onClick={() => handleSetView(v)}
                      className="w-full text-left px-3 py-1 hover:bg-[#202534] text-slate-300 hover:text-sky-300 capitalize font-mono text-[11px] transition"
                    >
                      {v}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

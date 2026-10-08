import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MousePointer,
  Ruler,
  Scissors,
  Eye,
  EyeOff,
  Maximize,
  Target,
  Layers,
  Trash2,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { ToolType, MeasurementType } from '@/types/bim';

export const BottomToolbar: React.FC = () => {
  const { t } = useTranslation('workspace');
  const activeTool = useBimStore((s) => s.activeTool);
  const selectedElement = useBimStore((s) => s.selectedElement);
  const selectedSceneElements = useBimStore((s) => s.selectedSceneElements);
  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const activeSiteContextId = useBimStore((s) => s.activeSiteContextId);
  const measureMode = useBimStore((s) => s.measureMode);
  const setMeasureMode = useBimStore((s) => s.setMeasureMode);
  const polylineMeasurement = useBimStore((s) => s.polylineMeasurement);
  const sectionPlaneCount = useBimStore((s) => s.sectionPlaneCount);
  const sectionPlane = useBimStore((s) => s.sectionPlane);
  const is2DMode = useBimStore((s) => s.is2DMode);
  const activeFloorPlanStorey = useBimStore((s) => s.activeFloorPlanStorey);
  const hasSelection = Boolean(selectedElement || selectedSceneElements.length > 0);

  const handleToolChange = (tool: ToolType) => {
    bimEngine.activateTool(tool, measureMode);
  };

  const handleMeasureModeChange = (mode: MeasurementType) => {
    setMeasureMode(mode);
    bimEngine.activateTool('measure', mode);
  };

  const handleCreateOrthogonalPlane = (axis: 'x' | 'y' | 'z') => {
    bimEngine.setSectionPlane(axis);
  };

  const handleClearClippingPlanes = () => {
    bimEngine.deleteClippingPlanes();
  };

  const handleClearMeasurements = () => {
    bimEngine.deleteMeasurements();
  };

  const handleHideSelection = async () => {
    await bimEngine.hideSelected();
  };

  const handleIsolateSelection = async () => {
    await bimEngine.isolateSelected();
  };

  const handleShowAll = async () => {
    await bimEngine.showAll();
    useBimStore.getState().setHiddenExpressIds(new Set());
    useBimStore.getState().setIsIsolated(false);
  };

  const handleFitModel = () => {
    bimEngine.fitModel();
  };

  const handleFocusSelection = async () => {
    if (hasSelection) return bimEngine.focusSelected();
    bimEngine.fitModel();
  };

  const handleToggle2D3D = async () => {
    if (is2DMode) {
      await bimEngine.exitFloorPlan();
    } else {
      // If storeys exist, open first storey floor plan
      const storeysData = useBimStore.getState().storeysData;
      if (storeysData.length > 0) {
        await bimEngine.openFloorPlan(storeysData[0].name, storeysData[0].elementIds);
      } else {
        bimEngine.setCameraMode('orthographic');
        bimEngine.setStandardView('top');
        useBimStore.getState().setIs2DMode(true);
      }
    }
  };

  if (!modelMetadata && !activeSiteContextId) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1 bg-[#13161f]/95 border border-[#262c3b] rounded-xl shadow-2xl p-1.5 backdrop-blur-md select-none">
      {/* 2D / 3D Quick Toggle */}
      <button
        onClick={handleToggle2D3D}
        data-testid="btn-toggle-2d-3d"
        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          is2DMode
            ? 'bg-emerald-600 text-white font-semibold'
            : 'bg-[#1a1e28] text-slate-300 hover:bg-[#222838] border border-[#2a3040]'
        }`}
        title={is2DMode ? t('exit2DFloorPlanTitle', 'Exit 2D Floor Plan (Return to 3D Orbit)') : t('switchTo2DTitle', 'Switch to 2D Top-Down Floor Plan')}
      >
        {is2DMode ? (
          <>
            <Compass className="w-3.5 h-3.5" />
            <span>{t('plan2D', '2D ({{name}})', { name: activeFloorPlanStorey || t('planDefault', 'Plan') })}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('plan2DDefault', '2D Plan')}</span>
          </>
        )}
      </button>

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Primary Interaction Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleToolChange('select')}
          data-testid="tool-select"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'select'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title={t('selectInspectTitle', 'Select & Inspect Element (Click 3D element)')}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>{t('selectTool', 'Select')}</span>
        </button>

        <button
          onClick={() => handleToolChange('measure')}
          data-testid="tool-measure"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'measure'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title={t('measureTitle', 'Measure (Distance, Area, Angle)')}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>{t('measureTool', 'Measure')}</span>
        </button>

        <button
          onClick={() => handleToolChange('section')}
          data-testid="tool-section"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'section'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title={t('sectionTitle', 'Section / Cut Planes (X, Y, Z Orthogonal)')}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>{t('sectionTool', 'Section')}</span>
        </button>
      </div>

      {/* Tool Context Sub-actions: SECTION */}
      {activeTool === 'section' && (
        <>
          <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleCreateOrthogonalPlane('x')}
              data-testid="section-btn-x"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] text-sky-300 text-xs font-mono font-medium border border-sky-800/60 transition"
              title={t('cutXTitle', 'Add X-Axis Orthogonal Section Plane')}
            >
              {t('cutX', 'Cut X')}
            </button>
            <button
              onClick={() => handleCreateOrthogonalPlane('y')}
              data-testid="section-btn-y"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] text-emerald-300 text-xs font-mono font-medium border border-emerald-800/60 transition"
              title={t('cutYTitle', 'Add Y-Axis (Horizontal) Section Plane')}
            >
              {t('cutY', 'Cut Y')}
            </button>
            <button
              onClick={() => handleCreateOrthogonalPlane('z')}
              data-testid="section-btn-z"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] text-amber-300 text-xs font-mono font-medium border border-amber-800/60 transition"
              title={t('cutZTitle', 'Add Z-Axis Orthogonal Section Plane')}
            >
              {t('cutZ', 'Cut Z')}
            </button>
            <button
              onClick={() => bimEngine.moveSectionPlane(-25)}
              disabled={!sectionPlane}
              data-testid="section-btn-move-negative"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-[#2d3345] transition"
              title={t('moveSectionBackTitle', 'Move section plane back 25m')}
            >
              {t('sectionMoveNegative', '−25m')}
            </button>
            <button
              onClick={() => bimEngine.moveSectionPlane(25)}
              disabled={!sectionPlane}
              data-testid="section-btn-move-positive"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-[#2d3345] transition"
              title={t('moveSectionForwardTitle', 'Move section plane forward 25m')}
            >
              {t('sectionMovePositive', '+25m')}
            </button>
            <button
              onClick={() => bimEngine.invertSectionPlane()}
              disabled={!sectionPlane}
              data-testid="section-btn-invert"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] disabled:opacity-40 text-slate-200 text-xs font-medium border border-[#2d3345] transition"
              title={t('invertSectionTitle', 'Invert section direction')}
            >
              {t('invert', 'Invert')}
            </button>
            {sectionPlaneCount > 0 && (
              <button
                onClick={handleClearClippingPlanes}
                data-testid="section-btn-clear"
                className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
                title={t('deleteAllSectionPlanesTitle', 'Delete all section planes')}
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('clearWithCount', 'Clear ({{count}})', { count: sectionPlaneCount })}</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Tool Context Sub-actions: MEASURE */}
      {activeTool === 'measure' && (
        <>
          <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleMeasureModeChange('distance')}
              data-testid="measure-btn-distance"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'distance'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title={t('measureDistanceTitle', 'Measure 2-point 3D distance')}
            >
              {t('distance', 'Distance')}
            </button>
            <button
              onClick={() => handleMeasureModeChange('polyline')}
              data-testid="measure-btn-polyline"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'polyline'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title={t('measurePolylineTitle', 'Measure connected 3D segments')}
            >
              {t('polyline', 'Polyline')}
            </button>
            <button
              onClick={() => handleMeasureModeChange('area')}
              data-testid="measure-btn-area"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'area'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title={t('measureAreaTitle', 'Measure surface area')}
            >
              {t('area', 'Area')}
            </button>
            <button
              onClick={() => handleMeasureModeChange('angle')}
              data-testid="measure-btn-angle"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'angle'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title={t('measureAngleTitle', 'Measure angle between 3 points')}
            >
              {t('angle', 'Angle')}
            </button>
            <button
              onClick={handleClearMeasurements}
              data-testid="measure-btn-clear"
              className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
              title={t('clearActiveMeasurementsTitle', 'Clear active measurements')}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t('clearMeasurements', 'Clear')}</span>
            </button>
            {measureMode === 'polyline' && (
              <>
                <span
                  data-testid="polyline-measurement-summary"
                  className="max-w-28 truncate px-1 text-[10px] font-mono text-sky-300"
                  title={polylineMeasurement.segmentLengths.map((length) => `${length.toFixed(2)} m`).join(' + ')}
                >
                  {polylineMeasurement.pointCount > 1
                    ? `${polylineMeasurement.totalLength.toFixed(2)} m`
                    : t('placePoints', 'Place points')}
                </span>
                <button
                  onClick={() => bimEngine.finishPolylineMeasurement()}
                  data-testid="measure-btn-finish-polyline"
                  className="px-2 py-1 rounded bg-sky-950/70 border border-sky-800/80 text-sky-300 hover:bg-sky-900 text-xs font-medium transition"
                  title={t('finishPolylineTitle', 'Finish current polyline measurement')}
                >
                  {t('finish', 'Finish')}
                </button>
                <button
                  onClick={() => bimEngine.clearLastPolylineMeasurement()}
                  data-testid="measure-btn-clear-last-polyline"
                  className="px-2 py-1 rounded border border-[#2d3345] text-slate-300 hover:bg-[#1e2330] text-xs font-medium transition"
                  title={t('clearLastPolylineTitle', 'Clear last completed polyline')}
                >
                  {t('clearLast', 'Clear last')}
                </button>
              </>
            )}
            {measureMode === 'area' && (
              <button
                onClick={() => bimEngine.finishMeasurement()}
                data-testid="measure-btn-finish-area"
                className="px-2 py-1 rounded bg-sky-950/70 border border-sky-800/80 text-sky-300 hover:bg-sky-900 text-xs font-medium transition"
                title={t('finishAreaTitle', 'Close and finish the area polygon')}
              >
                {t('finishArea', 'Close area')}
              </button>
            )}
            <button
              onClick={() => bimEngine.clearCurrentMeasurement()}
              data-testid="measure-btn-clear-current"
              className="flex items-center space-x-1 px-2 py-1 rounded border border-[#2d3345] text-slate-300 hover:bg-[#1e2330] text-xs font-medium transition"
              title={t('clearCurrentMeasurementTitle', 'Clear current measurement')}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t('clearCurrent', 'Clear current')}</span>
            </button>
          </div>
        </>
      )}

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Visibility Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleHideSelection}
          disabled={!hasSelection}
          data-testid="action-hide"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title={t('hideSelectedTitle', 'Hide Selected Element')}
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('hide', 'Hide')}</span>
        </button>

        <button
          onClick={handleIsolateSelection}
          disabled={!hasSelection}
          data-testid="action-isolate"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title={t('isolateSelectedTitle', 'Isolate Selected Element')}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('isolate', 'Isolate')}</span>
        </button>

        <button
          onClick={handleShowAll}
          data-testid="action-show-all"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition"
          title={t('showAllTitle', 'Show All Elements')}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('showAll', 'Show All')}</span>
        </button>
      </div>

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Camera Frame Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleFitModel}
          data-testid="action-fit"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition"
          title={t('fitModelTitle', 'Fit Entire Model to Screen')}
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>{t('fit', 'Fit')}</span>
        </button>

        <button
          onClick={handleFocusSelection}
          disabled={!hasSelection}
          data-testid="action-focus"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title={t('focusSelectedTitle', 'Focus Selected Element')}
        >
          <Target className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('focus', 'Focus')}</span>
        </button>
      </div>
    </div>
  );
};

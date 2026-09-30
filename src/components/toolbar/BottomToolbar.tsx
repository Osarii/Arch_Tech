import React from 'react';
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
  Plus,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { ToolType, MeasurementType } from '@/types/bim';

export const BottomToolbar: React.FC = () => {
  const activeTool = useBimStore((s) => s.activeTool);
  const setActiveTool = useBimStore((s) => s.setActiveTool);
  const selectedElement = useBimStore((s) => s.selectedElement);
  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const measureMode = useBimStore((s) => s.measureMode);
  const setMeasureMode = useBimStore((s) => s.setMeasureMode);
  const sectionPlaneCount = useBimStore((s) => s.sectionPlaneCount);
  const is2DMode = useBimStore((s) => s.is2DMode);
  const activeFloorPlanStorey = useBimStore((s) => s.activeFloorPlanStorey);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);

    if (tool === 'measure') {
      bimEngine.clipper.enabled = false;
      bimEngine.startMeasurement(measureMode);
    } else if (tool === 'section') {
      bimEngine.deleteMeasurements();
      bimEngine.clipper.enabled = true;
    } else {
      bimEngine.clipper.enabled = false;
      bimEngine.deleteMeasurements();
      bimEngine.highlighter.enabled = true;
    }
  };

  const handleMeasureModeChange = (mode: MeasurementType) => {
    setMeasureMode(mode);
    bimEngine.startMeasurement(mode);
  };

  const handleAddClippingPlane = async () => {
    await bimEngine.createClippingPlane();
  };

  const handleCreateOrthogonalPlane = (axis: 'x' | 'y' | 'z') => {
    bimEngine.createOrthogonalClippingPlane(axis);
  };

  const handleClearClippingPlanes = () => {
    bimEngine.deleteClippingPlanes();
  };

  const handleClearMeasurements = () => {
    bimEngine.deleteMeasurements();
  };

  const handleHideSelection = async () => {
    if (selectedElement) {
      await bimEngine.hideElements([selectedElement.expressID]);
      useBimStore
        .getState()
        .setHiddenExpressIds(
          new Set([...useBimStore.getState().hiddenExpressIds, selectedElement.expressID])
        );
      await bimEngine.clearSelection();
    }
  };

  const handleIsolateSelection = async () => {
    if (selectedElement) {
      await bimEngine.isolateElements([selectedElement.expressID]);
      useBimStore.getState().setIsIsolated(true);
    }
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
    if (selectedElement) {
      await bimEngine.focusElements([selectedElement.expressID]);
    } else {
      bimEngine.fitModel();
    }
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

  if (!modelMetadata) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-[#13161f]/95 border border-[#262c3b] rounded-xl shadow-2xl p-1.5 space-x-1 backdrop-blur-md select-none">
      {/* 2D / 3D Quick Toggle */}
      <button
        onClick={handleToggle2D3D}
        data-testid="btn-toggle-2d-3d"
        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          is2DMode
            ? 'bg-emerald-600 text-white font-semibold'
            : 'bg-[#1a1e28] text-slate-300 hover:bg-[#222838] border border-[#2a3040]'
        }`}
        title={is2DMode ? 'Exit 2D Floor Plan (Return to 3D Orbit)' : 'Switch to 2D Top-Down Floor Plan'}
      >
        {is2DMode ? (
          <>
            <Compass className="w-3.5 h-3.5" />
            <span>2D ({activeFloorPlanStorey || 'Plan'})</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>2D Plan</span>
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
          title="Select & Inspect Element (Click 3D element)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>

        <button
          onClick={() => handleToolChange('measure')}
          data-testid="tool-measure"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'measure'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title="Measure (Distance, Area, Angle)"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Measure</span>
        </button>

        <button
          onClick={() => handleToolChange('section')}
          data-testid="tool-section"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'section'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title="Section / Cut Planes (X, Y, Z Orthogonal)"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Section</span>
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
              title="Add X-Axis Orthogonal Section Plane"
            >
              Cut X
            </button>
            <button
              onClick={() => handleCreateOrthogonalPlane('y')}
              data-testid="section-btn-y"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] text-emerald-300 text-xs font-mono font-medium border border-emerald-800/60 transition"
              title="Add Y-Axis (Horizontal) Section Plane"
            >
              Cut Y
            </button>
            <button
              onClick={() => handleCreateOrthogonalPlane('z')}
              data-testid="section-btn-z"
              className="px-2 py-1 rounded bg-[#1c2130] hover:bg-[#252c40] text-amber-300 text-xs font-mono font-medium border border-amber-800/60 transition"
              title="Add Z-Axis Orthogonal Section Plane"
            >
              Cut Z
            </button>
            <button
              onClick={handleAddClippingPlane}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-950/70 border border-sky-800/80 text-sky-300 hover:bg-sky-900 text-xs font-medium transition"
              title="Click in 3D scene to place custom section plane"
            >
              <Plus className="w-3 h-3" />
              <span>Free</span>
            </button>
            {sectionPlaneCount > 0 && (
              <button
                onClick={handleClearClippingPlanes}
                data-testid="section-btn-clear"
                className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
                title="Delete all section planes"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear ({sectionPlaneCount})</span>
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
              title="Measure 2-point 3D distance"
            >
              Distance
            </button>
            <button
              onClick={() => handleMeasureModeChange('area')}
              data-testid="measure-btn-area"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'area'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title="Measure surface area"
            >
              Area
            </button>
            <button
              onClick={() => handleMeasureModeChange('angle')}
              data-testid="measure-btn-angle"
              className={`px-2 py-1 rounded text-xs transition ${
                measureMode === 'angle'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-[#1e2330]'
              }`}
              title="Measure angle between 3 points"
            >
              Angle
            </button>
            <button
              onClick={handleClearMeasurements}
              data-testid="measure-btn-clear"
              className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
              title="Clear active measurements"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </>
      )}

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Visibility Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleHideSelection}
          disabled={!selectedElement}
          data-testid="action-hide"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title="Hide Selected Element"
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Hide</span>
        </button>

        <button
          onClick={handleIsolateSelection}
          disabled={!selectedElement}
          data-testid="action-isolate"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title="Isolate Selected Element"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Isolate</span>
        </button>

        <button
          onClick={handleShowAll}
          data-testid="action-show-all"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition"
          title="Show All Elements"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Show All</span>
        </button>
      </div>

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Camera Frame Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleFitModel}
          data-testid="action-fit"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition"
          title="Fit Entire Model to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>

        <button
          onClick={handleFocusSelection}
          disabled={!selectedElement}
          data-testid="action-focus"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title="Focus Selected Element"
        >
          <Target className="w-3.5 h-3.5 text-sky-400" />
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
};

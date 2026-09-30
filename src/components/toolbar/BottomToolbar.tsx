import React, { useState } from 'react';
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
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { ToolType } from '@/types/bim';

export const BottomToolbar: React.FC = () => {
  const activeTool = useBimStore((s) => s.activeTool);
  const setActiveTool = useBimStore((s) => s.setActiveTool);
  const selectedElement = useBimStore((s) => s.selectedElement);
  const modelMetadata = useBimStore((s) => s.modelMetadata);

  const [sectionPlaneCount, setSectionPlaneCount] = useState(0);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);

    if (tool === 'measure') {
      bimEngine.clipper.enabled = false;
      bimEngine.startMeasurement();
    } else if (tool === 'section') {
      bimEngine.lengthMeasure.enabled = false;
      bimEngine.clipper.enabled = true;
    } else {
      bimEngine.clipper.enabled = false;
      bimEngine.lengthMeasure.enabled = false;
      bimEngine.highlighter.enabled = true;
    }
  };

  const handleAddClippingPlane = async () => {
    await bimEngine.createClippingPlane();
    setSectionPlaneCount((prev) => prev + 1);
  };

  const handleClearClippingPlanes = () => {
    bimEngine.deleteClippingPlanes();
    setSectionPlaneCount(0);
  };

  const handleClearMeasurements = () => {
    bimEngine.deleteMeasurements();
  };

  const handleHideSelection = async () => {
    if (selectedElement) {
      await bimEngine.hideElements([selectedElement.expressID]);
      await bimEngine.clearSelection();
    }
  };

  const handleIsolateSelection = async () => {
    if (selectedElement) {
      await bimEngine.isolateElements([selectedElement.expressID]);
    }
  };

  const handleShowAll = async () => {
    await bimEngine.showAll();
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

  if (!modelMetadata) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-[#13161f]/95 border border-[#262c3b] rounded-xl shadow-2xl p-1.5 space-x-1 backdrop-blur-md select-none">
      {/* Primary Interaction Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleToolChange('select')}
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
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'measure'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title="Measure 3D Distance"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Measure</span>
        </button>

        <button
          onClick={() => handleToolChange('section')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'section'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-[#1e2330] hover:text-slate-100'
          }`}
          title="Section / Cut Planes"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Section</span>
        </button>
      </div>

      {/* Tool Context Sub-actions */}
      {activeTool === 'section' && (
        <>
          <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />
          <button
            onClick={handleAddClippingPlane}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-sky-800/80 text-sky-300 hover:bg-sky-900 text-xs font-medium transition"
            title="Create clipping plane in viewport"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plane</span>
          </button>
          {sectionPlaneCount > 0 && (
            <button
              onClick={handleClearClippingPlanes}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
              title="Delete all clipping planes"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </>
      )}

      {activeTool === 'measure' && (
        <>
          <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />
          <button
            onClick={handleClearMeasurements}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs font-medium transition"
            title="Clear active measurements"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </>
      )}

      <div className="h-5 w-[1px] bg-[#2d3345] mx-1" />

      {/* Visibility Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleHideSelection}
          disabled={!selectedElement}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title="Hide Selected Element"
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Hide</span>
        </button>

        <button
          onClick={handleIsolateSelection}
          disabled={!selectedElement}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title="Isolate Selected Element"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Isolate</span>
        </button>

        <button
          onClick={handleShowAll}
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
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1e2330] hover:text-slate-100 transition"
          title="Fit Entire Model to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>

        <button
          onClick={handleFocusSelection}
          disabled={!selectedElement}
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

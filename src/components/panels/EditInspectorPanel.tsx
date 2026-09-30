import React, { useState, useEffect } from 'react';
import {
  Move,
  RotateCw,
  Palette,
  Copy,
  RotateCcw,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';
import { ElementTransform, ElementVisualOverride } from '@/types/bim';

const PRESET_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'White', hex: '#ffffff' },
];

export const EditInspectorPanel: React.FC = () => {
  const selectedElement = useBimStore((s) => s.selectedElement);
  const changeSet = useBimStore((s) => s.changeSet);

  const [transform, setTransform] = useState<ElementTransform>({
    x: 0,
    y: 0,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  });

  const [override, setOverride] = useState<ElementVisualOverride>({
    color: undefined,
    opacity: 1.0,
    wireframe: false,
  });

  const [isDeleted, setIsDeleted] = useState(false);

  // Sync state whenever selected element or changeSet updates
  useEffect(() => {
    if (!selectedElement) return;
    const state = bimEditService.getElementState(selectedElement.expressID);
    if (state) {
      setTransform({ ...state.transform });
      setOverride({ ...state.override });
      setIsDeleted(state.isDeleted);
    } else {
      setTransform({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 });
      setOverride({ color: undefined, opacity: 1.0, wireframe: false });
      setIsDeleted(false);
    }
  }, [selectedElement, changeSet]);

  if (!selectedElement) {
    return (
      <div className="flex-1 p-6 text-center text-slate-500 text-xs">
        <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p>Select any BIM element in the 3D viewport to inspect and edit its non-destructive properties.</p>
      </div>
    );
  }

  // Handle translation
  const handleStepMove = async (axis: 'x' | 'y' | 'z', delta: number) => {
    await bimEditService.transformElement(selectedElement.expressID, selectedElement.name, {
      [axis]: delta,
    });
  };

  const handleAbsoluteMove = async (axis: 'x' | 'y' | 'z', value: number) => {
    await bimEditService.transformElement(
      selectedElement.expressID,
      selectedElement.name,
      { [axis]: value },
      true
    );
  };

  // Handle rotation
  const handleStepRotate = async (deg: number) => {
    await bimEditService.transformElement(selectedElement.expressID, selectedElement.name, {
      rotationY: deg,
    });
  };

  const handleAbsoluteRotate = async (deg: number) => {
    await bimEditService.transformElement(
      selectedElement.expressID,
      selectedElement.name,
      { rotationY: deg },
      true
    );
  };

  // Reset transform
  const handleResetTransform = async () => {
    await bimEditService.transformElement(
      selectedElement.expressID,
      selectedElement.name,
      { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
      true
    );
  };

  // Handle color override
  const handleSetColor = async (hex?: string) => {
    await bimEditService.setVisualOverride(selectedElement.expressID, selectedElement.name, {
      color: hex,
    });
  };

  // Handle opacity override
  const handleSetOpacity = async (opacity: number) => {
    await bimEditService.setVisualOverride(selectedElement.expressID, selectedElement.name, {
      opacity,
    });
  };

  // Handle delete / restore
  const handleToggleDelete = async () => {
    if (isDeleted) {
      await bimEditService.restoreElement(selectedElement.expressID);
    } else {
      await bimEditService.deleteElement(selectedElement.expressID, selectedElement.name);
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    await bimEditService.duplicateElement(selectedElement.expressID, selectedElement.name);
  };

  // Reset all changes for element
  const handleResetElement = async () => {
    await bimEditService.resetElement(selectedElement.expressID);
  };

  const hasModifications =
    transform.x !== 0 ||
    transform.y !== 0 ||
    transform.z !== 0 ||
    transform.rotationY !== 0 ||
    override.color !== undefined ||
    override.opacity !== 1.0 ||
    isDeleted;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs select-none">
      {/* Selected Element Header Card */}
      <div className="bg-[#171a24] border border-[#262c3c] rounded-lg p-3">
        <div className="flex items-start justify-between mb-1.5">
          <span
            data-testid="selected-element-express-id"
            className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800"
          >
            #{selectedElement.expressID}
          </span>
          {isDeleted && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase font-semibold">
              Marked Deleted
            </span>
          )}
          {hasModifications && !isDeleted && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
              Modified
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-100 text-sm leading-snug break-words">
          {selectedElement.name}
        </h3>
        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedElement.type}</p>
      </div>

      {/* 1. Transform: Translation (Move X/Y/Z) */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#252b3c] pb-2">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
            <Move className="w-3.5 h-3.5 text-sky-400" />
            <span>Position Transform (Meters)</span>
          </div>
          {(transform.x !== 0 || transform.y !== 0 || transform.z !== 0) && (
            <button
              onClick={handleResetTransform}
              data-testid="btn-reset-transform"
              className="text-[10px] text-sky-400 hover:text-sky-200 flex items-center space-x-1"
              title="Reset position and rotation to [0, 0, 0]"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Translation X Axis */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-semibold text-sky-400">X (East/West)</span>
            <span className="font-mono text-slate-300">{transform.x.toFixed(2)} m</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleStepMove('x', -1)}
              data-testid="btn-move-x-sub-1"
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -1m
            </button>
            <button
              onClick={() => handleStepMove('x', -0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -0.1
            </button>
            <input
              type="number"
              step="0.1"
              value={transform.x}
              data-testid="input-move-x"
              onChange={(e) => handleAbsoluteMove('x', parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#12141c] border border-[#2b3142] rounded px-2 py-1 text-center font-mono text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => handleStepMove('x', 0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +0.1
            </button>
            <button
              onClick={() => handleStepMove('x', 1)}
              data-testid="btn-move-x-add-1"
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +1m
            </button>
          </div>
        </div>

        {/* Translation Y Axis */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-semibold text-emerald-400">Y (Elevation)</span>
            <span className="font-mono text-slate-300">{transform.y.toFixed(2)} m</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleStepMove('y', -1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -1m
            </button>
            <button
              onClick={() => handleStepMove('y', -0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -0.1
            </button>
            <input
              type="number"
              step="0.1"
              value={transform.y}
              data-testid="input-move-y"
              onChange={(e) => handleAbsoluteMove('y', parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#12141c] border border-[#2b3142] rounded px-2 py-1 text-center font-mono text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => handleStepMove('y', 0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +0.1
            </button>
            <button
              onClick={() => handleStepMove('y', 1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +1m
            </button>
          </div>
        </div>

        {/* Translation Z Axis */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-semibold text-amber-400">Z (North/South)</span>
            <span className="font-mono text-slate-300">{transform.z.toFixed(2)} m</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleStepMove('z', -1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -1m
            </button>
            <button
              onClick={() => handleStepMove('z', -0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              -0.1
            </button>
            <input
              type="number"
              step="0.1"
              value={transform.z}
              data-testid="input-move-z"
              onChange={(e) => handleAbsoluteMove('z', parseFloat(e.target.value) || 0)}
              className="flex-1 bg-[#12141c] border border-[#2b3142] rounded px-2 py-1 text-center font-mono text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => handleStepMove('z', 0.1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +0.1
            </button>
            <button
              onClick={() => handleStepMove('z', 1)}
              className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
            >
              +1m
            </button>
          </div>
        </div>
      </div>

      {/* 2. Transform: Rotation Y */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#252b3c] pb-2">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rotation (Degrees)</span>
          </div>
          <span className="font-mono text-slate-300 text-[11px]">{transform.rotationY}°</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleStepRotate(-45)}
            data-testid="btn-rotate-sub-45"
            className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
          >
            -45°
          </button>
          <button
            onClick={() => handleStepRotate(-15)}
            className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
          >
            -15°
          </button>
          <input
            type="number"
            step="5"
            value={transform.rotationY}
            data-testid="input-rotate-y"
            onChange={(e) => handleAbsoluteRotate(parseFloat(e.target.value) || 0)}
            className="flex-1 bg-[#12141c] border border-[#2b3142] rounded px-2 py-1 text-center font-mono text-slate-100 text-xs focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => handleStepRotate(15)}
            className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
          >
            +15°
          </button>
          <button
            onClick={() => handleStepRotate(45)}
            data-testid="btn-rotate-add-45"
            className="px-2 py-1 rounded bg-[#1c202d] hover:bg-[#252b3c] text-slate-300 font-mono text-[11px] border border-[#2b3346]"
          >
            +45°
          </button>
        </div>
      </div>

      {/* 3. Visual Overrides (Color & Opacity) */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#252b3c] pb-2">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visual Appearance Overrides</span>
          </div>
          {override.color && (
            <button
              onClick={() => handleSetColor(undefined)}
              data-testid="btn-reset-color"
              className="text-[10px] text-sky-400 hover:text-sky-200"
            >
              Reset Color
            </button>
          )}
        </div>

        {/* Color Palette Swatches */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Color Palette</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => {
              const isSelected = override.color?.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.name}
                  onClick={() => handleSetColor(c.hex)}
                  data-testid={`color-swatch-${c.name.toLowerCase()}`}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-md transition transform active:scale-95 flex items-center justify-center border ${
                    isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#151722]' : 'border-black/30'
                  }`}
                  title={`${c.name} (${c.hex})`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Opacity / Transparency</span>
            <span className="font-mono text-slate-300">
              {Math.round((override.opacity ?? 1.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={override.opacity ?? 1.0}
            data-testid="slider-opacity"
            onChange={(e) => handleSetOpacity(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Non-Destructive Element Actions */}
      <div className="border border-[#222736] rounded-lg bg-[#151722] p-3 space-y-2">
        <h4 className="font-semibold text-slate-200 text-xs border-b border-[#252b3c] pb-2 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Non-Destructive Actions</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleToggleDelete}
            data-testid="btn-toggle-delete"
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition border ${
              isDeleted
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900'
            }`}
          >
            {isDeleted ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Restore Element</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Temp Delete</span>
              </>
            )}
          </button>

          <button
            onClick={handleDuplicate}
            data-testid="btn-duplicate"
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[#1d2230] hover:bg-[#283042] text-slate-200 text-xs font-medium border border-[#2e374d] transition"
            title="Create visual duplicate instance (+1.5m X)"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            <span>Duplicate</span>
          </button>
        </div>
      </div>

      {/* 5. Original vs Modified Comparison Card */}
      {hasModifications && (
        <div className="border border-[#242b3c] rounded-lg bg-[#171a25] p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-[#283042] pb-1.5">
            <span className="font-semibold text-slate-200 text-xs">Diff Comparison</span>
            <button
              onClick={handleResetElement}
              data-testid="btn-reset-element-changes"
              className="text-[10px] text-rose-400 hover:text-rose-200 flex items-center space-x-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Element</span>
            </button>
          </div>

          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Position:</span>
              <span className="text-slate-200">
                [0, 0, 0] → [{transform.x}, {transform.y}, {transform.z}]
              </span>
            </div>
            {transform.rotationY !== 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Rotation:</span>
                <span className="text-slate-200">0° → {transform.rotationY}°</span>
              </div>
            )}
            {override.color && (
              <div className="flex justify-between">
                <span className="text-slate-400">Color Override:</span>
                <span className="text-sky-400">{override.color}</span>
              </div>
            )}
            {override.opacity !== 1.0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Opacity:</span>
                <span className="text-amber-400">{Math.round((override.opacity ?? 1) * 100)}%</span>
              </div>
            )}
            {isDeleted && (
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>Status:</span>
                <span>Temporarily Hidden</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

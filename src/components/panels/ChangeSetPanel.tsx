import React from 'react';
import {
  ListFilter,
  RotateCcw,
  Undo2,
  Redo2,
  Move,
  RotateCw,
  Palette,
  Trash2,
  Copy,
  Clock,
  Box,
  Sliders,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';
import { bimEngine } from '@/bim/engine/BimEngine';
import { BimChange, BimChangeType } from '@/types/bim';

export const ChangeSetPanel: React.FC = () => {
  const changeSet = useBimStore((s) => s.changeSet);
  const canUndo = useBimStore((s) => s.canUndo);
  const canRedo = useBimStore((s) => s.canRedo);

  const handleFocusChange = async (change: BimChange) => {
    await bimEngine.selectElements([change.elementId], true);
    await bimEngine.focusElements([change.elementId]);
  };

  const handleRevertElement = async (e: React.MouseEvent, elementId: number) => {
    e.stopPropagation();
    await bimEditService.resetElement(elementId);
  };

  const handleUndo = async () => {
    await bimEditService.undo();
  };

  const handleRedo = async () => {
    await bimEditService.redo();
  };

  const handleResetAll = async () => {
    await bimEditService.resetAllEdits();
  };

  const getBadgeIcon = (type: BimChangeType) => {
    switch (type) {
      case 'move':
        return <Move className="w-3 h-3 text-sky-400" />;
      case 'rotate':
        return <RotateCw className="w-3 h-3 text-amber-400" />;
      case 'color':
      case 'opacity':
        return <Palette className="w-3 h-3 text-cyan-400" />;
      case 'delete':
        return <Trash2 className="w-3 h-3 text-rose-400" />;
      case 'duplicate':
        return <Copy className="w-3 h-3 text-purple-400" />;
      default:
        return <Box className="w-3 h-3 text-slate-400" />;
    }
  };

  const getBadgeClass = (type: BimChangeType) => {
    switch (type) {
      case 'move':
        return 'bg-sky-950/70 border-sky-800 text-sky-300';
      case 'rotate':
        return 'bg-amber-950/70 border-amber-800 text-amber-300';
      case 'color':
      case 'opacity':
        return 'bg-cyan-950/70 border-cyan-800 text-cyan-300';
      case 'delete':
        return 'bg-rose-950/70 border-rose-800 text-rose-300';
      case 'duplicate':
        return 'bg-purple-950/70 border-purple-800 text-purple-300';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs select-none">
      {/* Top Action Header */}
      <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#151720]">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <ListFilter className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-medium text-[11px]">Non-Destructive Changes ({changeSet.length})</span>
        </div>

        {/* Global Undo / Redo / Reset Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            data-testid="btn-changeset-undo"
            className="p-1 rounded bg-[#1c202a] hover:bg-[#252b39] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#1c202a] border border-[#2b3140] transition"
            title="Undo latest change (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            data-testid="btn-changeset-redo"
            className="p-1 rounded bg-[#1c202a] hover:bg-[#252b39] text-slate-300 disabled:opacity-40 disabled:hover:bg-[#1c202a] border border-[#2b3140] transition"
            title="Redo undone change"
          >
            <Redo2 className="w-3 h-3" />
          </button>
          {changeSet.length > 0 && (
            <button
              onClick={handleResetAll}
              data-testid="btn-changeset-reset-all"
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-[10px] font-medium transition"
              title="Reset all changes and restore original IFC model"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Changes Feed List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {changeSet.length > 0 ? (
          changeSet.map((change) => (
            <div
              key={change.id}
              data-testid={`change-item-${change.type}`}
              onClick={() => handleFocusChange(change)}
              className="p-2.5 rounded-lg bg-[#161822] border border-[#252a36] hover:border-purple-500/60 hover:bg-[#1a1d2a] cursor-pointer transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border flex items-center space-x-1 ${getBadgeClass(
                      change.type
                    )}`}
                  >
                    {getBadgeIcon(change.type)}
                    <span>{change.type}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    #{change.elementId}
                  </span>
                </div>

                <button
                  onClick={(e) => handleRevertElement(e, change.elementId)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition"
                  title="Revert all changes for this element"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <h4 className="font-semibold text-slate-200 text-xs mt-1.5 truncate group-hover:text-purple-300 transition">
                {change.elementName}
              </h4>

              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {change.description}
              </p>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#222634] text-[10px] text-slate-500 font-mono">
                <span className="flex items-center space-x-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{change.timestamp}</span>
                </span>
                <span className="text-purple-400 font-sans group-hover:underline">
                  Click to focus 3D
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500">
            <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No changes recorded yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Switch to Edit Mode to move, rotate, style, or duplicate BIM elements non-destructively.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

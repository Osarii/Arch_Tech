import React, { useState, useRef } from 'react';
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
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';
import { bimEngine } from '@/bim/engine/BimEngine';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { IfcPersistenceService } from '@/bim/persistence/ifcPersistenceService';
import { BimChange, BimChangeType, PersistenceResult } from '@/types/bim';

export const ChangeSetPanel: React.FC = () => {
  const changeSet = useBimStore((s) => s.changeSet);
  const canUndo = useBimStore((s) => s.canUndo);
  const canRedo = useBimStore((s) => s.canRedo);
  const modelMetadata = useBimStore((s) => s.modelMetadata);

  const [persistenceResult, setPersistenceResult] = useState<PersistenceResult | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

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
    setPersistenceResult(null);
  };

  // Phase 4: JSON Export
  const handleExportJson = () => {
    const json = IfcPersistenceService.exportChangeSetAsJson(changeSet);
    const base = (modelMetadata?.name || 'model').replace(/\.ifc$/i, '');
    IfcPersistenceService.downloadJsonFile(`${base}_changeset.json`, json);
  };

  // Phase 4: JSON Import
  const handleImportJsonClick = () => {
    jsonFileInputRef.current?.click();
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const { success, changes, error } = IfcPersistenceService.importChangeSetFromJson(text);
      if (success) {
        for (const c of changes) {
          if (c.type === 'move' || c.type === 'rotate') {
            await bimEditService.transformElement(c.elementId, c.elementName, c.newValue, true);
          } else if (c.type === 'color' || c.type === 'opacity') {
            await bimEditService.setVisualOverride(c.elementId, c.elementName, c.newValue);
          } else if (c.type === 'delete') {
            await bimEditService.deleteElement(c.elementId, c.elementName);
          }
        }
      } else {
        console.error('Failed to import change set:', error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Phase 4: Export modified IFC (.ifc)
  const handleExportIfc = () => {
    if (!bimEngine.webIfcApi || bimEngine.webIfcModelID === null || changeSet.length === 0) return;
    const modelName = modelMetadata?.name || 'model.ifc';

    const { filename, data, result } = IfcPersistenceService.exportModifiedIfc(
      bimEngine.webIfcApi,
      bimEngine.webIfcModelID,
      changeSet,
      modelName
    );

    setPersistenceResult(result);
    if (result.success) {
      IfcPersistenceService.downloadIfcFile(filename, data);
    }
  };

  // Phase 4: Save & Reload Persisted IFC
  const handleSaveAndReload = async () => {
    if (!bimEngine.webIfcApi || bimEngine.webIfcModelID === null || changeSet.length === 0) return;
    const modelName = modelMetadata?.name || 'model.ifc';

    const { filename, data, result } = IfcPersistenceService.exportModifiedIfc(
      bimEngine.webIfcApi,
      bimEngine.webIfcModelID,
      changeSet,
      modelName
    );

    setPersistenceResult(result);

    if (result.success && result.persistedCount > 0) {
      try {
        // Reload newly serialized model directly into BIM viewer.
        // IfcLoaderService.loadIfc executes post-commit cleanup (resetAllEdits) only AFTER commit succeeds.
        await IfcLoaderService.loadIfc(data, filename);
        useBimStore.getState().setLeftPanelTab('changes');
      } catch (err: any) {
        console.error('Failed to reload persisted IFC model:', err);
        setPersistenceResult({
          ...result,
          success: false,
          error: `Model export succeeded, but reload failed: ${err.message || 'Unknown error'}. Your edits and Change Set were preserved.`,
        });
      }
    }
  };

  const isPersistable = (type: BimChangeType) => {
    return ['move', 'rotate', 'delete'].includes(type);
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
      {/* Hidden JSON file input */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonFileChange}
        className="hidden"
      />

      {/* Top Action Header */}
      <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#151720]">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <ListFilter className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-medium text-[11px]">
            Change Set ({changeSet.length})
          </span>
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

      {/* Phase 4 Persistence Action Strip */}
      <div className="p-2 border-b border-[#222630] bg-[#12141c] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>IFC Persistence & JSON</span>
          <span className="text-[10px] text-slate-500 font-mono">Phase 4</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleExportJson}
            disabled={changeSet.length === 0}
            data-testid="btn-export-changeset-json"
            className="flex items-center justify-center space-x-1 px-2 py-1 rounded bg-[#171a24] hover:bg-[#202534] disabled:opacity-40 text-slate-300 border border-[#272d3d] text-[10px] transition"
            title="Export Change Set as JSON"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleImportJsonClick}
            data-testid="btn-import-changeset-json"
            className="flex items-center justify-center space-x-1 px-2 py-1 rounded bg-[#171a24] hover:bg-[#202534] text-slate-300 border border-[#272d3d] text-[10px] transition"
            title="Import Change Set from JSON file"
          >
            <Upload className="w-3 h-3 text-purple-400" />
            <span>Import JSON</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={handleExportIfc}
            disabled={changeSet.length === 0}
            data-testid="btn-export-new-ifc"
            className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded bg-emerald-950/70 hover:bg-emerald-900/80 disabled:opacity-40 text-emerald-300 border border-emerald-800 text-[10px] font-medium transition"
            title="Export changes to a NEW .ifc file (never overwrites original)"
          >
            <FileCheck className="w-3 h-3" />
            <span>Export .ifc</span>
          </button>

          <button
            onClick={handleSaveAndReload}
            disabled={changeSet.length === 0}
            data-testid="btn-save-reload-ifc"
            className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded bg-sky-950/70 hover:bg-sky-900/80 disabled:opacity-40 text-sky-300 border border-sky-800 text-[10px] font-medium transition"
            title="Persist changes to new IFC and reload automatically in viewer"
          >
            <Save className="w-3 h-3" />
            <span>Save & Reload</span>
          </button>
        </div>

        {/* Persistence Audit Result Card */}
        {persistenceResult && (
          <div
            data-testid="persistence-audit-card"
            className="mt-2 p-2 rounded bg-[#151922] border border-[#2b3345] space-y-1 text-[10px]"
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-200">Persistence Audit:</span>
              <span
                className={
                  persistenceResult.success
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {persistenceResult.success ? 'Success' : 'Partial'}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Persisted: {persistenceResult.persistedCount}</span>
              </span>
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Unsupported: {persistenceResult.unsupportedCount}</span>
              </span>
              {persistenceResult.failedCount > 0 && (
                <span className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Failed: {persistenceResult.failedCount}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Changes Feed List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {changeSet.length > 0 ? (
          changeSet.map((change) => {
            const persistable = isPersistable(change.type);

            return (
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

                    {/* Persistable vs Viewport Only Indicator */}
                    <span
                      className={`font-mono text-[8px] uppercase px-1 py-0.2 rounded border ${
                        persistable
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                      title={
                        persistable
                          ? 'Persistable to real IFC geometry/structure'
                          : 'Viewport styling only (transient)'
                      }
                    >
                      {persistable ? 'IFC Persistable' : 'Viewport Only'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleRevertElement(e, change.elementId)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#202534] text-slate-400 hover:text-slate-200 transition"
                    title="Revert all changes for this element"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-1.5 font-medium text-slate-200 truncate">
                  {change.elementName}
                </div>

                <div className="mt-0.5 text-slate-400 text-[11px]">
                  {change.description}
                </div>

                {/* Values Diff Display */}
                {change.type === 'move' && (
                  <div className="mt-1.5 p-1.5 rounded bg-[#10121a] border border-[#1e2330] font-mono text-[10px] grid grid-cols-2 gap-1">
                    <span className="text-slate-500">
                      Orig: [{change.originalValue?.x ?? 0}m,{' '}
                      {change.originalValue?.y ?? 0}m,{' '}
                      {change.originalValue?.z ?? 0}m]
                    </span>
                    <span className="text-sky-300 font-semibold">
                      New: [{change.newValue.x}m, {change.newValue.y}m,{' '}
                      {change.newValue.z}m]
                    </span>
                  </div>
                )}

                {change.type === 'rotate' && (
                  <div className="mt-1.5 p-1.5 rounded bg-[#10121a] border border-[#1e2330] font-mono text-[10px] grid grid-cols-2 gap-1">
                    <span className="text-slate-500">
                      Orig: {change.originalValue?.rotationY ?? 0}°
                    </span>
                    <span className="text-amber-300 font-semibold">
                      New: {change.newValue.rotationY}°
                    </span>
                  </div>
                )}

                {change.type === 'color' && (
                  <div className="mt-1.5 flex items-center space-x-2 text-[10px]">
                    <span className="text-slate-500">Override:</span>
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20"
                      style={{ backgroundColor: change.newValue.color }}
                    />
                    <span className="font-mono text-slate-300">
                      {change.newValue.color}
                    </span>
                  </div>
                )}

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">#{change.elementId}</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{change.timestamp}</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
            <Sliders className="w-8 h-8 opacity-30" />
            <p className="text-[11px]">No changes recorded yet.</p>
            <p className="text-[10px] text-slate-600 max-w-[200px]">
              Switch to Edit Mode and transform elements or apply overrides to build
              a Change Set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

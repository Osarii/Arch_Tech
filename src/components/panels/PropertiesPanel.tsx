import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Info,
  Copy,
  Check,
  Building,
  Layers,
  Box,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { PropertyGroup } from '@/types/bim';

export const PropertiesPanel: React.FC = () => {
  const isPropsOpen = useBimStore((s) => s.isPropsOpen);
  const selectedElement = useBimStore((s) => s.selectedElement);
  const modelMetadata = useBimStore((s) => s.modelMetadata);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState(false);

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCopyGuid = (guid: string) => {
    navigator.clipboard.writeText(guid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isPropsOpen) return null;

  return (
    <aside className="w-80 h-full bg-[#12141a] border-l border-[#222630] flex flex-col shrink-0 select-none z-20 text-xs">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#222630] flex items-center justify-between font-semibold text-slate-300">
        <div className="flex items-center space-x-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>Properties & Data</span>
        </div>
        {selectedElement && (
          <span
            data-testid="selected-element-express-id"
            className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800"
          >
            #{selectedElement.expressID}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <div className="p-3 space-y-4">
            {/* Element Header Card */}
            <div className="bg-[#171a22] border border-[#272c38] rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <span
                  data-testid="selected-element-type"
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-700/50 uppercase tracking-wide"
                >
                  {selectedElement.type}
                </span>
                <button
                  onClick={() => handleCopyGuid(selectedElement.globalId)}
                  className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition"
                  title="Copy GlobalId"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span data-testid="selected-element-guid">{selectedElement.globalId.slice(0, 8)}...</span>
                </button>
              </div>

              <h3
                data-testid="selected-element-name"
                className="font-semibold text-slate-100 text-sm leading-snug break-words"
              >
                {selectedElement.name}
              </h3>

              {selectedElement.storey && (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>Level: {selectedElement.storey}</span>
                </div>
              )}
            </div>

            {/* Property Groups */}
            <div className="space-y-2">
              {selectedElement.propertyGroups.map((group: PropertyGroup) => {
                const isCollapsed = collapsedGroups.has(group.name);
                return (
                  <div
                    key={group.name}
                    className="border border-[#222734] rounded bg-[#151720] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full px-2.5 py-1.5 bg-[#181c26] hover:bg-[#1e2330] flex items-center justify-between text-left font-medium text-slate-200 transition text-[11px]"
                    >
                      <span>{group.name}</span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="p-2 divide-y divide-[#1e222e]">
                        {group.properties.map((prop, idx) => (
                          <div
                            key={idx}
                            className="py-1.5 flex items-start justify-between text-[11px] gap-2"
                          >
                            <span className="text-slate-400 font-medium truncate max-w-[120px]">
                              {prop.name}
                            </span>
                            <span className="text-slate-200 font-mono text-right break-words max-w-[150px]">
                              {prop.value === null || prop.value === undefined
                                ? '—'
                                : String(prop.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : modelMetadata ? (
          /* Model Summary View (when no element is selected) */
          <div className="p-3 space-y-4">
            <div className="bg-[#171a22] border border-[#272c38] rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold mb-2">
                <Building className="w-4 h-4" />
                <span>Model Overview</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">File Name:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[150px]">
                    {modelMetadata.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size:</span>
                  <span className="text-slate-200 font-mono">
                    {(modelMetadata.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Schema:</span>
                  <span className="text-sky-400 font-mono">{modelMetadata.schema}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Elements:</span>
                  <span className="text-slate-200 font-mono font-medium">
                    {modelMetadata.elementCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Element Counts Card */}
            <div className="border border-[#222734] rounded-lg bg-[#151720] p-3">
              <h4 className="font-semibold text-slate-300 text-xs mb-2.5 flex items-center space-x-1.5">
                <Box className="w-3.5 h-3.5 text-sky-400" />
                <span>Category Breakdown</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Walls</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.walls}
                  </span>
                </div>
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Doors</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.doors}
                  </span>
                </div>
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Windows</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.windows}
                  </span>
                </div>
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Slabs</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.slabs}
                  </span>
                </div>
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Columns</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.columns}
                  </span>
                </div>
                <div className="bg-[#1a1e28] p-2 rounded border border-[#262c3b]">
                  <span className="text-slate-400 text-[10px] block">Storeys</span>
                  <span className="text-slate-100 font-semibold text-sm">
                    {modelMetadata.counts.storeys}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-sky-950/30 border border-sky-900/40 rounded p-2.5 text-[11px] text-sky-300 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <p>Click on any 3D element in the viewport or tree to inspect its IFC attributes and property sets.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>Select an element or load an IFC model to view properties.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

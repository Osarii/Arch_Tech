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
  BarChart3,
  Filter,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { PropertyGroup } from '@/types/bim';
import { BimAnalysisPanel } from './BimAnalysisPanel';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { EditInspectorPanel } from './EditInspectorPanel';
import { AiAssistantPanel } from './AiAssistantPanel';

export const PropertiesPanel: React.FC = () => {
  const isPropsOpen = useBimStore((s) => s.isPropsOpen);
  const rightPanelTab = useBimStore((s) => s.rightPanelTab);
  const setRightPanelTab = useBimStore((s) => s.setRightPanelTab);

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
      {/* Top Tab Bar */}
      <div className="h-9 border-b border-[#222630] flex items-center bg-[#0f1117] text-[11px] font-medium text-slate-400 shrink-0">
        <button
          onClick={() => setRightPanelTab('properties')}
          data-testid="tab-properties"
          className={`flex-1 h-full flex items-center justify-center space-x-1.5 border-b-2 transition ${
            rightPanelTab === 'properties'
              ? 'border-sky-500 text-sky-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Properties & Data</span>
        </button>

        <button
          onClick={() => setRightPanelTab('analysis')}
          data-testid="tab-analysis"
          className={`flex-1 h-full flex items-center justify-center space-x-1.5 border-b-2 transition ${
            rightPanelTab === 'analysis'
              ? 'border-emerald-500 text-emerald-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analysis</span>
        </button>

        <button
          onClick={() => setRightPanelTab('filter')}
          data-testid="tab-filter"
          className={`flex-1 h-full flex items-center justify-center space-x-1 border-b-2 transition ${
            rightPanelTab === 'filter'
              ? 'border-purple-500 text-purple-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        <button
          onClick={() => setRightPanelTab('edit')}
          data-testid="tab-edit"
          className={`flex-1 h-full flex items-center justify-center space-x-1 border-b-2 transition ${
            rightPanelTab === 'edit'
              ? 'border-amber-500 text-amber-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
          title="Non-Destructive Element Editor"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setRightPanelTab('ai')}
          data-testid="tab-ai"
          className={`flex-1 h-full flex items-center justify-center space-x-1 border-b-2 transition ${
            rightPanelTab === 'ai'
              ? 'border-purple-500 text-purple-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
          title="BIM AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI</span>
        </button>
      </div>

      {/* Tab Content */}
      {rightPanelTab === 'ai' ? (
        <AiAssistantPanel />
      ) : rightPanelTab === 'analysis' ? (
        <BimAnalysisPanel />
      ) : rightPanelTab === 'filter' ? (
        <AdvancedFilterPanel />
      ) : rightPanelTab === 'edit' ? (
        <EditInspectorPanel />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Properties Header info */}
          <div className="h-9 px-3 border-b border-[#222630] flex items-center justify-between font-semibold text-slate-300 bg-[#151722]">
            <div className="flex items-center space-x-1.5">
              <span>Element Inspector</span>
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

          {/* Properties Content */}
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

                  {selectedElement.materials && selectedElement.materials.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedElement.materials.map((mat) => (
                        <span
                          key={mat}
                          className="px-1.5 py-0.5 rounded bg-[#202534] text-slate-300 text-[10px] font-mono border border-[#2b3346]"
                        >
                          {mat}
                        </span>
                      ))}
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
                          className="w-full px-2.5 py-1.5 bg-[#191c26] hover:bg-[#1f2430] flex items-center justify-between text-slate-300 font-medium text-xs transition"
                        >
                          <span className="truncate">{group.name}</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono text-slate-500">
                              {group.properties.length}
                            </span>
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="divide-y divide-[#1e2330]">
                            {group.properties.map((prop, idx) => (
                              <div
                                key={`${prop.name}-${idx}`}
                                className="px-2.5 py-1.5 flex items-start justify-between space-x-2 hover:bg-[#191d29] transition"
                              >
                                <span
                                  className="text-slate-400 text-[11px] truncate"
                                  title={prop.name}
                                >
                                  {prop.name}
                                </span>
                                <span
                                  className="font-mono text-[11px] text-slate-200 text-right break-all max-w-[170px]"
                                  title={String(prop.value ?? '')}
                                >
                                  {prop.value === null || prop.value === undefined
                                    ? '-'
                                    : typeof prop.value === 'boolean'
                                    ? prop.value
                                      ? 'true'
                                      : 'false'
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
              /* Fallback to Model Summary when no element is selected */
              <div className="p-3 space-y-4">
                <div className="border border-[#222734] rounded-lg bg-[#151720] p-3 space-y-2">
                  <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>Model Overview</span>
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">File Name:</span>
                      <span className="text-slate-200 font-mono truncate max-w-[160px]">
                        {modelMetadata.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFC Schema:</span>
                      <span className="text-sky-400 font-mono">{modelMetadata.schema}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">File Size:</span>
                      <span className="text-slate-200 font-mono">
                        {(modelMetadata.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
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
        </div>
      )}
    </aside>
  );
};

import React, { useEffect, useRef } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Box,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  DoorOpen,
  Square,
  Columns,
  Bookmark,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { BimTreeNode } from '@/types/bim';
import { bimEngine } from '@/bim/engine/BimEngine';
import { StoreysPanel } from './StoreysPanel';
import { ViewpointsPanel } from './ViewpointsPanel';

export const SpatialTreePanel: React.FC = () => {
  const isTreeOpen = useBimStore((s) => s.isTreeOpen);
  const leftPanelTab = useBimStore((s) => s.leftPanelTab);
  const setLeftPanelTab = useBimStore((s) => s.setLeftPanelTab);

  const spatialTree = useBimStore((s) => s.spatialTree);
  const expandedNodeIds = useBimStore((s) => s.expandedNodeIds);
  const toggleNodeExpanded = useBimStore((s) => s.toggleNodeExpanded);
  const expandAllNodes = useBimStore((s) => s.expandAllNodes);
  const collapseAllNodes = useBimStore((s) => s.collapseAllNodes);
  const selectedNodeId = useBimStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useBimStore((s) => s.setSelectedNodeId);
  const treeSearchQuery = useBimStore((s) => s.treeSearchQuery);
  const setTreeSearchQuery = useBimStore((s) => s.setTreeSearchQuery);

  const hiddenCategories = useBimStore((s) => s.hiddenCategories);
  const toggleCategoryVisibility = useBimStore((s) => s.toggleCategoryVisibility);
  const hiddenStoreys = useBimStore((s) => s.hiddenStoreys);
  const toggleStoreyVisibility = useBimStore((s) => s.toggleStoreyVisibility);

  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Auto scroll selected node into view
  useEffect(() => {
    if (selectedNodeId && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedNodeId]);

  // Handle clicking a tree leaf / element
  const handleNodeClick = async (node: BimTreeNode) => {
    setSelectedNodeId(node.id);
    if (node.expressID !== undefined) {
      await bimEngine.selectElements([node.expressID], true);
    }
  };

  // Toggle category visibility
  const handleToggleCategory = async (e: React.MouseEvent, category: string, elementIds: number[]) => {
    e.stopPropagation();
    toggleCategoryVisibility(category);

    const isCurrentlyHidden = hiddenCategories.has(category);
    if (isCurrentlyHidden) {
      await bimEngine.hider?.set(true);
    } else {
      await bimEngine.hideElements(elementIds);
    }
  };

  // Helper icon for BIM entities
  const getNodeIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('PROJECT') || t.includes('SITE') || t.includes('BUILDING')) {
      return <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    if (t.includes('STOREY')) {
      return <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (t.includes('DOOR')) {
      return <DoorOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (t.includes('WINDOW')) {
      return <Square className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (t.includes('COLUMN') || t.includes('BEAM')) {
      return <Columns className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    return <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  // Recursive tree renderer
  const renderNode = (node: BimTreeNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;

    if (treeSearchQuery) {
      const q = treeSearchQuery.toLowerCase();
      const matchSelf =
        node.name.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q) ||
        (node.expressID !== undefined && node.expressID.toString().includes(q));

      const hasMatchingChild = (n: BimTreeNode): boolean => {
        return (
          n.name.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q) ||
          (n.expressID !== undefined && n.expressID.toString().includes(q)) ||
          n.children.some(hasMatchingChild)
        );
      };

      if (!matchSelf && !hasMatchingChild(node)) {
        return null;
      }
    }

    const isCategoryNode = node.type === 'CATEGORY' && node.category;
    const isStoreyNode = node.type === 'IFCBUILDINGSTOREY';

    return (
      <div key={node.id} className="text-xs">
        <div
          ref={isSelected ? selectedItemRef : undefined}
          onClick={() => handleNodeClick(node)}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          data-testid={`tree-node-${node.id}`}
          data-type={node.type}
          data-express-id={node.expressID}
          className={`flex items-center justify-between pr-2 py-1 cursor-pointer transition select-none group border-l-2 ${
            isSelected
              ? 'bg-sky-950/70 border-sky-400 text-sky-200 font-medium'
              : 'border-transparent text-slate-300 hover:bg-[#181c26] hover:text-slate-100'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpanded(node.id);
                }}
                className="p-0.5 hover:text-sky-400 text-slate-400 transition"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {getNodeIcon(node.type)}

            <span className="truncate text-[11px]">{node.name}</span>
          </div>

          {/* Visibility Action for Category or Storey */}
          {isCategoryNode && node.category && (
            <button
              onClick={(e) => {
                const elementIds = node.children
                  .map((c) => c.expressID)
                  .filter((id): id is number => id !== undefined);
                handleToggleCategory(e, node.category!, elementIds);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-sky-300 text-slate-500 transition p-0.5"
              title={`Toggle ${node.category} visibility`}
            >
              {hiddenCategories.has(node.category) ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-sky-400" />
              )}
            </button>
          )}

          {isStoreyNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStoreyVisibility(node.name);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-emerald-300 text-slate-500 transition p-0.5"
              title={`Toggle Storey visibility`}
            >
              {hiddenStoreys.has(node.name) ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (!isTreeOpen) return null;

  return (
    <aside className="w-72 h-full bg-[#12141a] border-r border-[#222630] flex flex-col shrink-0 select-none z-20">
      {/* Top Tab Bar */}
      <div className="h-9 border-b border-[#222630] flex items-center bg-[#0f1117] text-[11px] font-medium text-slate-400 shrink-0">
        <button
          onClick={() => setLeftPanelTab('tree')}
          data-testid="tab-spatial-tree"
          className={`flex-1 h-full flex items-center justify-center space-x-1.5 border-b-2 transition ${
            leftPanelTab === 'tree'
              ? 'border-sky-500 text-sky-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Spatial BIM Tree</span>
        </button>

        <button
          onClick={() => setLeftPanelTab('storeys')}
          data-testid="tab-storeys"
          className={`flex-1 h-full flex items-center justify-center space-x-1.5 border-b-2 transition ${
            leftPanelTab === 'storeys'
              ? 'border-emerald-500 text-emerald-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Levels / 2D</span>
        </button>

        <button
          onClick={() => setLeftPanelTab('viewpoints')}
          data-testid="tab-viewpoints"
          className={`flex-1 h-full flex items-center justify-center space-x-1.5 border-b-2 transition ${
            leftPanelTab === 'viewpoints'
              ? 'border-amber-500 text-amber-300 bg-[#151722]'
              : 'border-transparent hover:text-slate-200 hover:bg-[#12141a]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Views</span>
        </button>
      </div>

      {/* Tab Content */}
      {leftPanelTab === 'storeys' ? (
        <StoreysPanel />
      ) : leftPanelTab === 'viewpoints' ? (
        <ViewpointsPanel />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tree Header Controls */}
          <div className="p-2 border-b border-[#222630] flex items-center justify-between bg-[#151722]">
            <span className="text-[11px] text-slate-400 font-mono">
              {spatialTree.length > 0 ? `${spatialTree.length} roots` : 'Hierarchy'}
            </span>
            <div className="flex items-center space-x-1 text-slate-400">
              <button
                onClick={expandAllNodes}
                className="p-1 hover:text-slate-200 hover:bg-[#1c202a] rounded transition"
                title="Expand All"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={collapseAllNodes}
                className="p-1 hover:text-slate-200 hover:bg-[#1c202a] rounded transition"
                title="Collapse All"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Filter / Search Bar */}
          <div className="p-2 border-b border-[#222630] bg-[#12141a]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter elements..."
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                className="w-full bg-[#171a22] border border-[#272c38] rounded px-2 py-1 pl-7 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/70"
              />
            </div>
          </div>

          {/* Tree Content List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
            {spatialTree.length > 0 ? (
              spatialTree.map((root) => renderNode(root, 0))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No spatial structure available
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

import { create } from 'zustand';
import {
  ToolType,
  CameraViewMode,
  LoadingStage,
  ModelMetadata,
  SelectedElementDetails,
  BimTreeNode,
  PerformanceStats,
} from '@/types/bim';

interface BimState {
  // Tools & Navigation
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  cameraMode: CameraViewMode;
  setCameraMode: (mode: CameraViewMode) => void;

  // Loading
  loading: LoadingStage;
  setLoading: (stage: Partial<LoadingStage>) => void;
  resetLoading: () => void;

  // Model Metadata
  modelMetadata: ModelMetadata | null;
  setModelMetadata: (meta: ModelMetadata | null) => void;

  // Selection
  selectedElement: SelectedElementDetails | null;
  setSelectedElement: (element: SelectedElementDetails | null) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Spatial Tree
  spatialTree: BimTreeNode[];
  setSpatialTree: (tree: BimTreeNode[]) => void;
  expandedNodeIds: Set<string>;
  toggleNodeExpanded: (id: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
  treeSearchQuery: string;
  setTreeSearchQuery: (query: string) => void;

  // Filters & Visibility
  categories: string[];
  setCategories: (cats: string[]) => void;
  hiddenCategories: Set<string>;
  toggleCategoryVisibility: (cat: string) => void;

  storeys: string[];
  setStoreys: (storeys: string[]) => void;
  hiddenStoreys: Set<string>;
  toggleStoreyVisibility: (storey: string) => void;

  hiddenExpressIds: Set<number>;
  setHiddenExpressIds: (ids: Set<number>) => void;
  isIsolated: boolean;
  setIsIsolated: (isolated: boolean) => void;

  // Performance Monitor
  perfStats: PerformanceStats;
  setPerfStats: (stats: Partial<PerformanceStats>) => void;
  isPerfOpen: boolean;
  togglePerfOpen: () => void;

  // Panel Toggles
  isTreeOpen: boolean;
  toggleTreeOpen: () => void;
  isPropsOpen: boolean;
  togglePropsOpen: () => void;

  // Reset all state on model unload
  resetModel: () => void;
}

const initialLoading: LoadingStage = {
  isBusy: false,
  stage: 'Idle',
  progress: 0,
};

const initialPerf: PerformanceStats = {
  fps: 60,
  frameTimeMs: 16.6,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  loadedElements: 0,
};

export const useBimStore = create<BimState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  cameraMode: 'perspective',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  loading: initialLoading,
  setLoading: (stage) =>
    set((state) => ({ loading: { ...state.loading, ...stage } })),
  resetLoading: () => set({ loading: initialLoading }),

  modelMetadata: null,
  setModelMetadata: (meta) => set({ modelMetadata: meta }),

  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  spatialTree: [],
  setSpatialTree: (tree) => set({ spatialTree: tree }),
  expandedNodeIds: new Set<string>(['root', 'project', 'site', 'building']),
  toggleNodeExpanded: (id) =>
    set((state) => {
      const next = new Set(state.expandedNodeIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedNodeIds: next };
    }),
  expandAllNodes: () =>
    set((state) => {
      const allIds = new Set<string>();
      const collect = (nodes: BimTreeNode[]) => {
        for (const n of nodes) {
          allIds.add(n.id);
          if (n.children.length > 0) collect(n.children);
        }
      };
      collect(state.spatialTree);
      return { expandedNodeIds: allIds };
    }),
  collapseAllNodes: () => set({ expandedNodeIds: new Set<string>() }),
  treeSearchQuery: '',
  setTreeSearchQuery: (query) => set({ treeSearchQuery: query }),

  categories: [],
  setCategories: (cats) => set({ categories: cats }),
  hiddenCategories: new Set<string>(),
  toggleCategoryVisibility: (cat) =>
    set((state) => {
      const next = new Set(state.hiddenCategories);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return { hiddenCategories: next };
    }),

  storeys: [],
  setStoreys: (storeys) => set({ storeys: storeys }),
  hiddenStoreys: new Set<string>(),
  toggleStoreyVisibility: (storey) =>
    set((state) => {
      const next = new Set(state.hiddenStoreys);
      if (next.has(storey)) {
        next.delete(storey);
      } else {
        next.add(storey);
      }
      return { hiddenStoreys: next };
    }),

  hiddenExpressIds: new Set<number>(),
  setHiddenExpressIds: (ids) => set({ hiddenExpressIds: ids }),
  isIsolated: false,
  setIsIsolated: (isolated) => set({ isIsolated: isolated }),

  perfStats: initialPerf,
  setPerfStats: (stats) =>
    set((state) => ({ perfStats: { ...state.perfStats, ...stats } })),
  isPerfOpen: true,
  togglePerfOpen: () => set((state) => ({ isPerfOpen: !state.isPerfOpen })),

  isTreeOpen: true,
  toggleTreeOpen: () => set((state) => ({ isTreeOpen: !state.isTreeOpen })),
  isPropsOpen: true,
  togglePropsOpen: () => set((state) => ({ isPropsOpen: !state.isPropsOpen })),

  resetModel: () =>
    set({
      modelMetadata: null,
      selectedElement: null,
      selectedNodeId: null,
      spatialTree: [],
      categories: [],
      storeys: [],
      hiddenCategories: new Set<string>(),
      hiddenStoreys: new Set<string>(),
      hiddenExpressIds: new Set<number>(),
      isIsolated: false,
      treeSearchQuery: '',
      activeTool: 'select',
      loading: initialLoading,
    }),
}));

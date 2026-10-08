import { create } from 'zustand';
import {
  ToolType,
  MeasurementType,
  CameraViewMode,
  LoadingStage,
  ModelMetadata,
  SelectedElementDetails,
  BimTreeNode,
  PerformanceStats,
  LeftPanelTab,
  RightPanelTab,
  StoreyData,
  BimViewpoint,
  BimFilterCriteria,
  BimAnalysisData,
  EditMode,
  BimChange,
} from '@/types/bim';
import type { SceneInteractionDetails } from '@/bim/interaction';

interface BimState {
  // Tools & Navigation
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  cameraMode: CameraViewMode;
  setCameraMode: (mode: CameraViewMode) => void;
  measureMode: MeasurementType;
  setMeasureMode: (mode: MeasurementType) => void;

  // Change Set & History (Phase 3)
  changeSet: BimChange[];
  setChangeSet: (changes: BimChange[]) => void;
  canUndo: boolean;
  setCanUndo: (can: boolean) => void;
  canRedo: boolean;
  setCanRedo: (can: boolean) => void;

  // 2D Floor Plan Mode
  activeFloorPlanStorey: string | null;
  setActiveFloorPlanStorey: (storey: string | null) => void;
  is2DMode: boolean;
  setIs2DMode: (is2D: boolean) => void;

  // Section tool status
  sectionPlaneCount: number;
  setSectionPlaneCount: (count: number) => void;

  // Panel Tabs
  leftPanelTab: LeftPanelTab;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;

  // Loading
  loading: LoadingStage;
  setLoading: (stage: Partial<LoadingStage>) => void;
  resetLoading: () => void;

  // Model Metadata
  modelMetadata: ModelMetadata | null;
  setModelMetadata: (meta: ModelMetadata | null) => void;
  activeSiteContextId: string | null;
  setActiveSiteContextId: (id: string | null) => void;
  activeSiteContextLabel: string | null;
  setActiveSiteContextLabel: (label: string | null) => void;

  // Selection
  selectedElement: SelectedElementDetails | null;
  setSelectedElement: (element: SelectedElementDetails | null) => void;
  selectedSceneElement: SceneInteractionDetails | null;
  setSelectedSceneElement: (element: SceneInteractionDetails | null) => void;
  selectedSceneElements: SceneInteractionDetails[];
  setSelectedSceneElements: (elements: SceneInteractionDetails[]) => void;
  hoveredSceneElementId: string | null;
  setHoveredSceneElementId: (id: string | null) => void;
  hiddenSceneElementIds: Set<string>;
  setHiddenSceneElementIds: (ids: Set<string>) => void;
  isolatedSceneElementId: string | null;
  setIsolatedSceneElementId: (id: string | null) => void;
  isolatedSceneElementIds: Set<string>;
  setIsolatedSceneElementIds: (ids: Set<string>) => void;
  sceneExplorerQuery: string;
  setSceneExplorerQuery: (query: string) => void;
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

  // Storeys & Level Navigation
  storeys: string[];
  setStoreys: (storeys: string[]) => void;
  storeysData: StoreyData[];
  setStoreysData: (data: StoreyData[]) => void;
  hiddenStoreys: Set<string>;
  toggleStoreyVisibility: (storey: string) => void;

  // Categories & Visibility
  categories: string[];
  setCategories: (cats: string[]) => void;
  hiddenCategories: Set<string>;
  toggleCategoryVisibility: (cat: string) => void;

  hiddenExpressIds: Set<number>;
  setHiddenExpressIds: (ids: Set<number>) => void;
  isIsolated: boolean;
  setIsIsolated: (isolated: boolean) => void;

  // Advanced Filtering
  expressIdToCategory: Map<number, string>;
  setExpressIdToCategory: (map: Map<number, string>) => void;
  expressIdToStorey: Map<number, string>;
  setExpressIdToStorey: (map: Map<number, string>) => void;
  filterCriteria: BimFilterCriteria;
  setFilterCriteria: (criteria: BimFilterCriteria) => void;
  resetFilterCriteria: () => void;
  filteredElementIds: number[] | null;
  setFilteredElementIds: (ids: number[] | null) => void;

  // BIM Analysis
  analysisData: BimAnalysisData | null;
  setAnalysisData: (data: BimAnalysisData | null) => void;
  materials: string[];
  setMaterials: (mats: string[]) => void;

  // Local Viewpoints
  viewpoints: BimViewpoint[];
  addViewpoint: (vp: BimViewpoint) => void;
  deleteViewpoint: (id: string) => void;

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

const initialFilter: BimFilterCriteria = {
  type: undefined,
  storey: undefined,
  nameQuery: '',
  material: undefined,
  propertyName: undefined,
  propertyValue: '',
};

export const useBimStore = create<BimState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  editMode: 'inspect',
  setEditMode: (mode) => set({ editMode: mode }),

  changeSet: [],
  setChangeSet: (changes) => set({ changeSet: changes }),
  canUndo: false,
  setCanUndo: (can) => set({ canUndo: can }),
  canRedo: false,
  setCanRedo: (can) => set({ canRedo: can }),

  cameraMode: 'perspective',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  measureMode: 'distance',
  setMeasureMode: (mode) => set({ measureMode: mode }),

  activeFloorPlanStorey: null,
  setActiveFloorPlanStorey: (storey) => set({ activeFloorPlanStorey: storey }),
  is2DMode: false,
  setIs2DMode: (is2D) => set({ is2DMode: is2D }),

  sectionPlaneCount: 0,
  setSectionPlaneCount: (count) => set({ sectionPlaneCount: count }),

  leftPanelTab: 'tree',
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

  rightPanelTab: 'properties',
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  loading: initialLoading,
  setLoading: (stage) =>
    set((state) => ({ loading: { ...state.loading, ...stage } })),
  resetLoading: () => set({ loading: initialLoading }),

  modelMetadata: null,
  setModelMetadata: (meta) => set({ modelMetadata: meta }),
  activeSiteContextId: null,
  setActiveSiteContextId: (id) => set({ activeSiteContextId: id }),
  activeSiteContextLabel: null,
  setActiveSiteContextLabel: (label) => set({ activeSiteContextLabel: label }),

  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),
  selectedSceneElement: null,
  setSelectedSceneElement: (element) => set({ selectedSceneElement: element }),
  selectedSceneElements: [],
  setSelectedSceneElements: (elements) => set({ selectedSceneElements: elements, selectedSceneElement: elements[0] ?? null }),
  hoveredSceneElementId: null,
  setHoveredSceneElementId: (id) => set({ hoveredSceneElementId: id }),
  hiddenSceneElementIds: new Set<string>(),
  setHiddenSceneElementIds: (ids) => set({ hiddenSceneElementIds: ids }),
  isolatedSceneElementId: null,
  setIsolatedSceneElementId: (id) => set({ isolatedSceneElementId: id }),
  isolatedSceneElementIds: new Set<string>(),
  setIsolatedSceneElementIds: (ids) => set({ isolatedSceneElementIds: ids, isolatedSceneElementId: ids.values().next().value ?? null }),
  sceneExplorerQuery: '',
  setSceneExplorerQuery: (query) => set({ sceneExplorerQuery: query }),
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
  setStoreys: (storeys) => set({ storeys }),
  storeysData: [],
  setStoreysData: (data) => set({ storeysData: data }),
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

  expressIdToCategory: new Map<number, string>(),
  setExpressIdToCategory: (map) => set({ expressIdToCategory: map }),
  expressIdToStorey: new Map<number, string>(),
  setExpressIdToStorey: (map) => set({ expressIdToStorey: map }),
  filterCriteria: initialFilter,
  setFilterCriteria: (criteria) => set({ filterCriteria: criteria }),
  resetFilterCriteria: () => set({ filterCriteria: initialFilter, filteredElementIds: null }),
  filteredElementIds: null,
  setFilteredElementIds: (ids) => set({ filteredElementIds: ids }),

  analysisData: null,
  setAnalysisData: (data) => set({ analysisData: data }),
  materials: [],
  setMaterials: (mats) => set({ materials: mats }),

  viewpoints: [],
  addViewpoint: (vp) => set((state) => ({ viewpoints: [vp, ...state.viewpoints] })),
  deleteViewpoint: (id) =>
    set((state) => ({ viewpoints: state.viewpoints.filter((v) => v.id !== id) })),

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
      activeSiteContextId: null,
      activeSiteContextLabel: null,
      selectedElement: null,
      selectedSceneElement: null,
      selectedSceneElements: [],
      hoveredSceneElementId: null,
      hiddenSceneElementIds: new Set<string>(),
      isolatedSceneElementId: null,
      isolatedSceneElementIds: new Set<string>(),
      sceneExplorerQuery: '',
      selectedNodeId: null,
      spatialTree: [],
      categories: [],
      storeys: [],
      storeysData: [],
      analysisData: null,
      materials: [],
      viewpoints: [],
      expressIdToCategory: new Map<number, string>(),
      expressIdToStorey: new Map<number, string>(),
      filterCriteria: initialFilter,
      filteredElementIds: null,
      hiddenCategories: new Set<string>(),
      hiddenStoreys: new Set<string>(),
      hiddenExpressIds: new Set<number>(),
      isIsolated: false,
      activeFloorPlanStorey: null,
      is2DMode: false,
      sectionPlaneCount: 0,
      leftPanelTab: 'tree',
      rightPanelTab: 'properties',
      treeSearchQuery: '',
      editMode: 'inspect',
      changeSet: [],
      canUndo: false,
      canRedo: false,
      activeTool: 'select',
      measureMode: 'distance',
      loading: initialLoading,
    }),
}));

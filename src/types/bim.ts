export type ToolType = 'select' | 'measure' | 'section' | 'isolate' | 'hide';

export type EditMode = 'inspect' | 'edit';

export type MeasurementType = 'distance' | 'area' | 'angle';

export type CameraViewMode = 'perspective' | 'orthographic';

export type StandardViewDirection = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'isometric';

export type LeftPanelTab = 'tree' | 'storeys' | 'viewpoints' | 'changes';

export type RightPanelTab = 'properties' | 'analysis' | 'filter' | 'edit' | 'ai';

export interface LoadingStage {
  isBusy: boolean;
  stage: string;
  progress: number;
  filename?: string;
  error?: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  schema: string;
  elementCount: number;
  counts: {
    walls: number;
    doors: number;
    windows: number;
    slabs: number;
    columns: number;
    beams: number;
    spaces: number;
    storeys: number;
    other: number;
  };
}

export interface PropertyItem {
  name: string;
  value: string | number | boolean | null;
  type?: string;
}

export interface PropertyGroup {
  name: string;
  properties: PropertyItem[];
}

export interface SelectedElementDetails {
  expressID: number;
  globalId: string;
  type: string;
  name: string;
  description?: string;
  storey?: string;
  materials?: string[];
  propertyGroups: PropertyGroup[];
}

export interface BimTreeNode {
  id: string; // unique node id, e.g. "storey-12" or "elem-456"
  expressID?: number;
  name: string;
  type: string;
  category?: string;
  children: BimTreeNode[];
  visible: boolean;
  hasGeometry?: boolean;
}

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  loadedElements: number;
}

export interface StoreyData {
  id: string;
  name: string;
  elevation: number;
  elementCount: number;
  elementIds: number[];
  categories: { name: string; count: number }[];
}

export interface BimViewpoint {
  id: string;
  title: string;
  description?: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraMode: CameraViewMode;
  selectedElements: number[];
  isolatedStorey?: string;
  createdAt: string;
}

export interface BimFilterCriteria {
  type?: string;
  storey?: string;
  nameQuery?: string;
  material?: string;
  propertyName?: string;
  propertyValue?: string;
}

export interface BimAnalysisData {
  totalElements: number;
  schema: string;
  totalStoreys: number;
  totalMaterials: number;
  materials: string[];
  categoryCounts: Record<string, number>;
  storeyDistributions: Record<string, Record<string, number>>;
  quantities: {
    totalWallGrossArea: number;
    totalWallNetArea: number;
    totalSlabArea: number;
    totalVolume: number;
    totalDoorsCount: number;
    totalWindowsCount: number;
    totalSpacesCount: number;
  };
}

// --- PHASE 3: NON-DESTRUCTIVE EDITING TYPES ---

export type BimChangeType = 'move' | 'rotate' | 'color' | 'opacity' | 'delete' | 'duplicate';

export interface ElementTransform {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export interface ElementVisualOverride {
  color?: string; // hex string e.g. '#38bdf8'
  opacity?: number; // 0.1 to 1.0
  wireframe?: boolean;
}

export interface BimChange {
  id: string;
  elementId: number;
  elementName: string;
  category?: string;
  type: BimChangeType;
  description: string;
  originalValue: any;
  newValue: any;
  timestamp: string;
}

export interface ElementEditState {
  elementId: number;
  elementName: string;
  category?: string;
  transform: ElementTransform;
  override: ElementVisualOverride;
  isDeleted: boolean;
  isDuplicate?: boolean;
}

// --- PHASE 4: REAL IFC PERSISTENCE TYPES ---

export type PersistenceStatus = 'persisted' | 'unsupported' | 'failed' | 'skipped';

export interface PersistenceOperationStatus {
  changeId: string;
  elementId: number;
  elementName: string;
  type: BimChangeType;
  status: PersistenceStatus;
  reason?: string;
  details?: string;
}

export interface PersistenceResult {
  success: boolean;
  persistedCount: number;
  unsupportedCount: number;
  failedCount: number;
  operations: PersistenceOperationStatus[];
  newIfcData?: Uint8Array;
  newFilename?: string;
  error?: string;
}

// --- PHASE 5: AI BIM ASSISTANT TYPES ---

export type ToolCategory = 'READ' | 'WRITE';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, ToolParameter>;
}

export interface PendingWriteProposal {
  proposalId: string;
  toolName: string;
  args: Record<string, any>;
  summary: string;
  description: string;
  elementId?: number;
  elementName?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed';
  createdAt: string;
}

export interface AIMessageToolCall {
  toolName: string;
  category: ToolCategory;
  args: Record<string, any>;
  result?: any;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: AIMessageToolCall[];
  proposal?: PendingWriteProposal;
}

export interface ConversationContext {
  modelLoaded?: boolean;
  modelName?: string;
  selectedElementId?: number;
  selectedElementName?: string;
  totalElements?: number;
  changeSetCount?: number;
}

// --- PHASE 6: DETERMINISTIC BIM GENERATION TYPES ---

export interface BimGenerationParams {
  length: number; // meters along X (> 0)
  width: number; // meters along Z (> 0)
  height?: number; // total height in meters (> 0)
  storeyHeight?: number; // height per storey in meters (> 0)
  storeys?: number; // number of storeys (>= 1)
  wallThickness?: number; // wall thickness in meters (> 0)
  slabThickness?: number; // slab thickness in meters (> 0)
  originX?: number;
  originY?: number;
  originZ?: number;
}

export interface BimGenerationWallSpec {
  id: string;
  storeyIndex: number;
  storeyName: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  elevation: number;
  height: number;
  thickness: number;
}

export interface BimGenerationSlabSpec {
  id: string;
  storeyIndex: number;
  storeyName: string;
  elevation: number;
  length: number;
  width: number;
  thickness: number;
  originX: number;
  originZ: number;
  type: 'base' | 'floor' | 'roof';
}

export interface BimGenerationPlan {
  id: string;
  timestamp: number;
  params: {
    length: number;
    width: number;
    storeyHeight: number;
    storeys: number;
    wallThickness: number;
    slabThickness: number;
    totalHeight: number;
    footprintArea: number;
    grossVolume: number;
    originX: number;
    originY: number;
    originZ: number;
  };
  walls: BimGenerationWallSpec[];
  slabs: BimGenerationSlabSpec[];
}



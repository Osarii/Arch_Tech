export type ToolType = 'select' | 'measure' | 'section' | 'isolate' | 'hide';

export type CameraViewMode = 'perspective' | 'orthographic';

export type StandardViewDirection = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'isometric';

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

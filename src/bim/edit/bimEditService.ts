import * as THREE from 'three';
import * as WebIFC from 'web-ifc';
import {
  BimChange,
  ElementEditState,
  ElementTransform,
  ElementVisualOverride,
} from '@/types/bim';
import { useBimStore } from '@/stores/bimStore';

export interface BimEditSceneBridge {
  getWebIfcApi: () => WebIFC.IfcAPI | null;
  getWebIfcModelID: () => number | null;
  getCurrentModelId: () => string | null;
  hideElements: (ids: number[]) => Promise<void>;
  unhideElements: (ids: number[]) => Promise<void>;
  showAll: () => Promise<void>;
  clearSelection: () => Promise<void>;
}

const defaultTransform: ElementTransform = {
  x: 0,
  y: 0,
  z: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

const defaultOverride: ElementVisualOverride = {
  color: undefined,
  opacity: 1.0,
  wireframe: false,
};

export class BimEditService {
  private appliedChanges: BimChange[] = [];
  private undoneChanges: BimChange[] = [];
  private elementStates: Map<number, ElementEditState> = new Map();
  private proxyMeshes: Map<number, THREE.Group> = new Map();
  public editsGroup: THREE.Group = new THREE.Group();
  private bridge: BimEditSceneBridge | null = null;

  constructor() {
    this.editsGroup.name = 'BimEditsLayer';
  }

  public setSceneBridge(bridge: BimEditSceneBridge | null): void {
    this.bridge = bridge;
  }

  public initSceneLayer(scene: THREE.Scene): void {
    if (!scene.children.includes(this.editsGroup)) {
      scene.add(this.editsGroup);
    }
  }

  public getChangeSet(): BimChange[] {
    return [...this.appliedChanges];
  }

  public getElementState(elementId: number): ElementEditState | null {
    return this.elementStates.get(elementId) || null;
  }

  /**
   * Builds or returns a Three.js visual proxy for an element using authentic WebIFC geometry.
   */
  private getOrCreateProxy(
    ifcApi: WebIFC.IfcAPI,
    modelID: number,
    expressID: number
  ): THREE.Group | null {
    if (this.proxyMeshes.has(expressID)) {
      return this.proxyMeshes.get(expressID)!;
    }

    try {
      const flatMesh = ifcApi.GetFlatMesh(modelID, expressID);
      if (!flatMesh || !flatMesh.geometries) return null;

      const group = new THREE.Group();
      group.name = `Proxy_Element_${expressID}`;
      const geoms = flatMesh.geometries;

      for (let i = 0; i < geoms.size(); i++) {
        const pGeom = geoms.get(i);
        const ifcGeom = ifcApi.GetGeometry(modelID, pGeom.geometryExpressID);
        if (!ifcGeom) continue;

        const vPtr = ifcGeom.GetVertexData();
        const vSize = ifcGeom.GetVertexDataSize();
        const iPtr = ifcGeom.GetIndexData();
        const iSize = ifcGeom.GetIndexDataSize();

        const rawVertices = ifcApi.GetVertexArray(vPtr, vSize);
        const rawIndices = ifcApi.GetIndexArray(iPtr, iSize);

        const numVertices = rawVertices.length / 6;
        const positions = new Float32Array(numVertices * 3);
        const normals = new Float32Array(numVertices * 3);

        for (let j = 0; j < numVertices; j++) {
          positions[j * 3] = rawVertices[j * 6];
          positions[j * 3 + 1] = rawVertices[j * 6 + 1];
          positions[j * 3 + 2] = rawVertices[j * 6 + 2];

          normals[j * 3] = rawVertices[j * 6 + 3];
          normals[j * 3 + 1] = rawVertices[j * 6 + 4];
          normals[j * 3 + 2] = rawVertices[j * 6 + 5];
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(rawIndices, 1));

        const col = pGeom.color;
        const material = new THREE.MeshLambertMaterial({
          color: new THREE.Color(col.x, col.y, col.z),
          transparent: col.w < 1.0,
          opacity: col.w,
        });

        const mesh = new THREE.Mesh(geometry, material);
        if (pGeom.flatTransformation && pGeom.flatTransformation.length === 16) {
          const matrix = new THREE.Matrix4().fromArray(pGeom.flatTransformation);
          mesh.applyMatrix4(matrix);
        }

        group.add(mesh);
        ifcGeom.delete();
      }

      this.editsGroup.add(group);
      this.proxyMeshes.set(expressID, group);

      // Hide original in That Open Fragments model
      this.bridge?.hideElements([expressID]);

      return group;
    } catch (err) {
      console.warn(`Failed to extract proxy geometry for element #${expressID}:`, err);
      return null;
    }
  }

  /**
   * Transforms an element (Move X/Y/Z, Rotate X/Y/Z).
   */
  public async transformElement(
    elementId: number,
    elementName: string,
    delta: Partial<ElementTransform>,
    absolute = false
  ): Promise<void> {
    const currentState = this.getOrInitState(elementId, elementName);
    const prevTransform = { ...currentState.transform };

    const newTransform: ElementTransform = absolute
      ? { ...currentState.transform, ...delta }
      : {
          x: Math.round((currentState.transform.x + (delta.x || 0)) * 100) / 100,
          y: Math.round((currentState.transform.y + (delta.y || 0)) * 100) / 100,
          z: Math.round((currentState.transform.z + (delta.z || 0)) * 100) / 100,
          rotationX: Math.round((currentState.transform.rotationX + (delta.rotationX || 0)) * 10) / 10,
          rotationY: Math.round((currentState.transform.rotationY + (delta.rotationY || 0)) * 10) / 10,
          rotationZ: Math.round((currentState.transform.rotationZ + (delta.rotationZ || 0)) * 10) / 10,
        };

    currentState.transform = newTransform;

    // Apply to visual 3D proxy
    this.updateProxyTransform(elementId, newTransform);

    const isRotation =
      (delta.rotationX !== undefined && Math.abs(newTransform.rotationX - prevTransform.rotationX) > 0.001) ||
      (delta.rotationY !== undefined && Math.abs(newTransform.rotationY - prevTransform.rotationY) > 0.001) ||
      (delta.rotationZ !== undefined && Math.abs(newTransform.rotationZ - prevTransform.rotationZ) > 0.001);
    const change: BimChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId,
      elementName,
      type: isRotation ? 'rotate' : 'move',
      description: isRotation
        ? `Rotated element (${newTransform.rotationY}°)`
        : `Moved element [${newTransform.x}m, ${newTransform.y}m, ${newTransform.z}m]`,
      originalValue: prevTransform,
      newValue: newTransform,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.pushChange(change);
  }

  /**
   * Applies temporary visual overrides (color, opacity, wireframe).
   */
  public async setVisualOverride(
    elementId: number,
    elementName: string,
    override: Partial<ElementVisualOverride>
  ): Promise<void> {
    const currentState = this.getOrInitState(elementId, elementName);
    const prevOverride = { ...currentState.override };
    const newOverride: ElementVisualOverride = {
      ...currentState.override,
      ...override,
    };

    currentState.override = newOverride;

    // Apply to proxy materials
    this.updateProxyMaterial(elementId, newOverride);

    const changeType = override.color !== undefined ? 'color' : 'opacity';
    const change: BimChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId,
      elementName,
      type: changeType,
      description:
        override.color !== undefined
          ? `Changed color override to ${override.color}`
          : `Changed opacity override to ${Math.round((override.opacity || 1) * 100)}%`,
      originalValue: prevOverride,
      newValue: newOverride,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.pushChange(change);
  }

  /**
   * Temporary non-destructive deletion.
   */
  public async deleteElement(elementId: number, elementName: string): Promise<void> {
    const currentState = this.getOrInitState(elementId, elementName);
    if (currentState.isDeleted) return;

    currentState.isDeleted = true;

    // Hide both original and proxy
    await this.bridge?.hideElements([elementId]);
    const proxy = this.proxyMeshes.get(elementId);
    if (proxy) proxy.visible = false;

    await this.bridge?.clearSelection();

    const change: BimChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId,
      elementName,
      type: 'delete',
      description: `Temporarily deleted element`,
      originalValue: false,
      newValue: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.pushChange(change);
  }

  /**
   * Restore a temporarily deleted element.
   */
  public async restoreElement(elementId: number): Promise<void> {
    const state = this.elementStates.get(elementId);
    if (!state || !state.isDeleted) return;

    state.isDeleted = false;

    // If proxy exists, show proxy; else show original
    const proxy = this.proxyMeshes.get(elementId);
    if (proxy) {
      proxy.visible = true;
    } else {
      await this.bridge?.unhideElements([elementId]);
    }

    const change: BimChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId,
      elementName: state.elementName,
      type: 'delete',
      description: `Restored deleted element`,
      originalValue: true,
      newValue: false,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.pushChange(change);
  }

  /**
   * Duplicates element visual instance at offset (+1.5m X).
   */
  public async duplicateElement(elementId: number, elementName: string): Promise<number | null> {
    const api = this.bridge?.getWebIfcApi();
    const modelID = this.bridge?.getWebIfcModelID();
    if (!api || modelID === null || modelID === undefined) return null;

    // Generate duplicate expressId
    const dupExpressId = elementId + 100000;
    const dupProxy = this.getOrCreateProxy(api, modelID, elementId);

    if (!dupProxy) return null;

    // Clone proxy group
    const cloned = dupProxy.clone(true);
    cloned.position.x += 1.5; // Offset duplicate
    this.editsGroup.add(cloned);
    this.proxyMeshes.set(dupExpressId, cloned);

    const dupState: ElementEditState = {
      elementId: dupExpressId,
      elementName: `${elementName} (Copy)`,
      transform: { ...defaultTransform, x: 1.5 },
      override: { ...defaultOverride },
      isDeleted: false,
      isDuplicate: true,
    };
    this.elementStates.set(dupExpressId, dupState);

    const change: BimChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId: dupExpressId,
      elementName: `${elementName} (Copy)`,
      type: 'duplicate',
      description: `Created visual duplicate of #${elementId}`,
      originalValue: null,
      newValue: dupExpressId,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.pushChange(change);
    return dupExpressId;
  }

  /**
   * Resets all changes for a specific element back to original IFC state.
   */
  public async resetElement(elementId: number): Promise<void> {
    const proxy = this.proxyMeshes.get(elementId);
    if (proxy) {
      this.editsGroup.remove(proxy);
      proxy.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      this.proxyMeshes.delete(elementId);
    }

    this.elementStates.delete(elementId);

    // Unhide original element
    await this.bridge?.unhideElements([elementId]);

    // Filter out changes for this element
    this.appliedChanges = this.appliedChanges.filter((c) => c.elementId !== elementId);
    this.syncStore();
  }

  /**
   * Undo latest change.
   */
  public async undo(): Promise<void> {
    if (this.appliedChanges.length === 0) return;
    const change = this.appliedChanges.pop()!;
    this.undoneChanges.push(change);

    const state = this.elementStates.get(change.elementId);
    if (state) {
      if (change.type === 'move' || change.type === 'rotate') {
        state.transform = { ...change.originalValue };
        this.updateProxyTransform(change.elementId, state.transform);
      } else if (change.type === 'color' || change.type === 'opacity') {
        state.override = { ...change.originalValue };
        this.updateProxyMaterial(change.elementId, state.override);
      } else if (change.type === 'delete') {
        state.isDeleted = change.originalValue;
        const proxy = this.proxyMeshes.get(change.elementId);
        if (proxy) proxy.visible = !state.isDeleted;
        else if (!state.isDeleted) {
          await this.bridge?.unhideElements([change.elementId]);
        }
      }
    }

    this.syncStore();
  }

  /**
   * Redo previously undone change.
   */
  public async redo(): Promise<void> {
    if (this.undoneChanges.length === 0) return;
    const change = this.undoneChanges.pop()!;
    this.appliedChanges.push(change);

    const state = this.elementStates.get(change.elementId);
    if (state) {
      if (change.type === 'move' || change.type === 'rotate') {
        state.transform = { ...change.newValue };
        this.updateProxyTransform(change.elementId, state.transform);
      } else if (change.type === 'color' || change.type === 'opacity') {
        state.override = { ...change.newValue };
        this.updateProxyMaterial(change.elementId, state.override);
      } else if (change.type === 'delete') {
        state.isDeleted = change.newValue;
        const proxy = this.proxyMeshes.get(change.elementId);
        if (proxy) proxy.visible = !state.isDeleted;
        else if (state.isDeleted) {
          await this.bridge?.hideElements([change.elementId]);
        }
      }
    }

    this.syncStore();
  }

  /**
   * Resets all edits and restores pristine original IFC model.
   */
  public async resetAllEdits(): Promise<void> {
    // Dispose all proxy meshes
    for (const [, proxy] of this.proxyMeshes) {
      this.editsGroup.remove(proxy);
      proxy.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    this.proxyMeshes.clear();
    this.elementStates.clear();
    this.appliedChanges = [];
    this.undoneChanges = [];

    // Show all elements in fragments model
    await this.bridge?.showAll();
    this.syncStore();
  }

  // --- INTERNAL HELPERS ---

  private getOrInitState(elementId: number, elementName: string): ElementEditState {
    let state = this.elementStates.get(elementId);
    if (!state) {
      state = {
        elementId,
        elementName,
        transform: { ...defaultTransform },
        override: { ...defaultOverride },
        isDeleted: false,
      };
      this.elementStates.set(elementId, state);
    }
    return state;
  }

  private updateProxyTransform(elementId: number, transform: ElementTransform): void {
    const api = this.bridge?.getWebIfcApi();
    const modelID = this.bridge?.getWebIfcModelID();
    if (!api || modelID === null || modelID === undefined) return;
    const proxy = this.getOrCreateProxy(api, modelID, elementId);
    if (!proxy) return;

    proxy.position.set(transform.x, transform.y, transform.z);
    proxy.rotation.set(
      THREE.MathUtils.degToRad(transform.rotationX),
      THREE.MathUtils.degToRad(transform.rotationY),
      THREE.MathUtils.degToRad(transform.rotationZ)
    );
  }

  private updateProxyMaterial(elementId: number, override: ElementVisualOverride): void {
    const api = this.bridge?.getWebIfcApi();
    const modelID = this.bridge?.getWebIfcModelID();
    if (!api || modelID === null || modelID === undefined) return;
    const proxy = this.getOrCreateProxy(api, modelID, elementId);
    if (!proxy) return;

    proxy.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (override.color) {
          child.material.color = new THREE.Color(override.color);
        }
        if (override.opacity !== undefined) {
          child.material.transparent = override.opacity < 1.0;
          child.material.opacity = override.opacity;
        }
        if (override.wireframe !== undefined) {
          child.material.wireframe = override.wireframe;
        }
      }
    });
  }

  private pushChange(change: BimChange): void {
    this.appliedChanges.push(change);
    this.undoneChanges = []; // clear redo on new action
    this.syncStore();
  }

  private syncStore(): void {
    const store = useBimStore.getState();
    store.setChangeSet([...this.appliedChanges]);
    store.setCanUndo(this.appliedChanges.length > 0);
    store.setCanRedo(this.undoneChanges.length > 0);
  }
}

export const bimEditService = new BimEditService();

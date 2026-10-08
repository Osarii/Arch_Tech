import * as THREE from 'three';

export type SceneInteractionDetails = {
  id: string;
  name: string;
  category: string;
  type: string;
  level?: string;
  material?: string;
  status?: string;
  project?: string;
  zone?: string;
  elementId?: string;
};

export type SceneInteractionTarget = {
  id: string;
  details: SceneInteractionDetails;
  object: THREE.Mesh | THREE.InstancedMesh;
  instanceId?: number;
};

type HiddenTarget = SceneInteractionTarget & {
  matrix?: THREE.Matrix4;
  visible?: boolean;
};

const hiddenScale = new THREE.Vector3(0.00001, 0.00001, 0.00001);

export const getCameraFocusBounds = (box: THREE.Box3): THREE.Box3 => {
  const padded = box.clone();
  const size = new THREE.Vector3();
  padded.getSize(size);
  padded.expandByScalar(Math.max(2, Math.max(size.x, size.y, size.z) * 0.12));
  return padded;
};

/**
 * Owns selection state for procedural scene objects. It never mutates source
 * materials: feedback is drawn by two reusable box helpers.
 */
export class ModelInteraction {
  public onHoverChange?: (target: SceneInteractionTarget | null) => void;
  public onSelectionChange?: (target: SceneInteractionTarget | null) => void;

  private scene: THREE.Scene | null = null;
  private hovered: SceneInteractionTarget | null = null;
  private selected: SceneInteractionTarget | null = null;
  private isolatedId: string | null = null;
  private readonly hidden = new Map<string, HiddenTarget>();
  private readonly overlay = new THREE.Group();
  private readonly hoverHelper = new THREE.Box3Helper(new THREE.Box3(), 0x79b791);
  private readonly selectionHelper = new THREE.Box3Helper(new THREE.Box3(), 0xffbf00);

  constructor() {
    this.overlay.name = 'BimInteractionOverlays';
    this.overlay.userData.interactionOverlay = true;
    for (const helper of [this.hoverHelper, this.selectionHelper]) {
      helper.userData.interactionOverlay = true;
      helper.raycast = () => {};
      helper.visible = false;
      const material = helper.material as THREE.LineBasicMaterial;
      material.transparent = true;
      material.opacity = helper === this.hoverHelper ? 0.48 : 0.9;
      material.depthTest = false;
      this.overlay.add(helper);
    }
  }

  public attach(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.overlay.parent !== scene) scene.add(this.overlay);
  }

  public reset(): void {
    this.showAll();
    this.setHovered(null);
    this.setSelected(null);
  }

  public dispose(): void {
    this.reset();
    this.overlay.removeFromParent();
    for (const helper of [this.hoverHelper, this.selectionHelper]) {
      helper.geometry.dispose();
      (helper.material as THREE.Material).dispose();
    }
    this.scene = null;
    this.onHoverChange = undefined;
    this.onSelectionChange = undefined;
  }

  public getHovered(): SceneInteractionTarget | null {
    return this.hovered;
  }

  public getSelected(): SceneInteractionTarget | null {
    return this.selected;
  }

  public getHiddenIds(): Set<string> {
    return new Set(this.hidden.keys());
  }

  public getIsolatedId(): string | null {
    return this.isolatedId;
  }

  public getSelectableTargets(): SceneInteractionTarget[] {
    if (!this.scene) return [];
    const targets: SceneInteractionTarget[] = [];
    this.scene.traverse((object) => {
      if (!this.isSelectableObject(object)) return;
      if (object instanceof THREE.InstancedMesh) {
        for (let instanceId = 0; instanceId < object.count; instanceId += 1) {
          const target = this.createTarget(object, instanceId);
          if (target) targets.push(target);
        }
      } else {
        const target = this.createTarget(object);
        if (target) targets.push(target);
      }
    });
    return targets;
  }

  public getTargetById(id: string): SceneInteractionTarget | null {
    return this.getSelectableTargets().find((target) => target.id === id) ?? null;
  }

  public pick(raycaster: THREE.Raycaster, camera: THREE.Camera, pointer: THREE.Vector2): SceneInteractionTarget | null {
    if (!this.scene) return null;
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObject(this.scene, true)) {
      const object = hit.object;
      if (!this.isSelectableObject(object)) continue;
      const target = this.createTarget(object, hit.instanceId);
      if (target && !this.hidden.has(target.id)) return target;
    }
    return null;
  }

  public setHovered(target: SceneInteractionTarget | null): void {
    if (this.hovered?.id === target?.id) return;
    this.hovered = target;
    this.updateHelper(this.hoverHelper, target);
    this.onHoverChange?.(target);
  }

  public setSelected(target: SceneInteractionTarget | null): void {
    if (this.selected?.id === target?.id) return;
    this.selected = target;
    this.updateHelper(this.selectionHelper, target);
    this.onSelectionChange?.(target);
  }

  public getSelectedBounds(): THREE.Box3 | null {
    return this.selected ? this.getBounds(this.selected) : null;
  }

  public hideSelected(): boolean {
    if (!this.selected) return false;
    this.hideTarget(this.selected);
    this.setSelected(null);
    return true;
  }

  public isolateSelected(): boolean {
    if (!this.selected) return false;
    const selectedId = this.selected.id;
    for (const target of this.getSelectableTargets()) {
      if (target.id !== selectedId) this.hideTarget(target);
    }
    this.isolatedId = selectedId;
    return true;
  }

  public showAll(): void {
    for (const target of this.hidden.values()) this.restoreTarget(target);
    this.hidden.clear();
    this.isolatedId = null;
  }

  private isSelectableObject(object: THREE.Object3D): object is THREE.Mesh | THREE.InstancedMesh {
    return (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh)
      && object.userData.selectable === true
      && object.userData.interactionOverlay !== true;
  }

  private createTarget(object: THREE.Mesh | THREE.InstancedMesh, instanceId?: number): SceneInteractionTarget | null {
    const source = object.userData.interaction as SceneInteractionDetails | SceneInteractionDetails[] | undefined;
    const details = Array.isArray(source) ? source[instanceId ?? -1] : source;
    if (!details) return null;
    return {
      id: details.id || `${object.uuid}:${instanceId ?? 'object'}`,
      details,
      object,
      ...(instanceId === undefined ? {} : { instanceId }),
    };
  }

  private getBounds(target: SceneInteractionTarget): THREE.Box3 {
    const { object, instanceId } = target;
    if (object instanceof THREE.InstancedMesh && instanceId !== undefined) {
      object.geometry.computeBoundingBox();
      const instanceMatrix = new THREE.Matrix4();
      object.getMatrixAt(instanceId, instanceMatrix);
      object.updateWorldMatrix(true, false);
      return object.geometry.boundingBox!.clone().applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(object.matrixWorld, instanceMatrix)
      );
    }
    return new THREE.Box3().setFromObject(object);
  }

  private updateHelper(helper: THREE.Box3Helper, target: SceneInteractionTarget | null): void {
    helper.visible = Boolean(target);
    if (!target) return;
    helper.box.copy(this.getBounds(target));
    helper.updateMatrixWorld(true);
  }

  private hideTarget(target: SceneInteractionTarget): void {
    if (this.hidden.has(target.id)) return;
    if (target.object instanceof THREE.InstancedMesh && target.instanceId !== undefined) {
      const matrix = new THREE.Matrix4();
      target.object.getMatrixAt(target.instanceId, matrix);
      this.hidden.set(target.id, { ...target, matrix });
      target.object.setMatrixAt(target.instanceId, matrix.clone().scale(hiddenScale));
      target.object.instanceMatrix.needsUpdate = true;
      return;
    }
    this.hidden.set(target.id, { ...target, visible: target.object.visible });
    target.object.visible = false;
  }

  private restoreTarget(target: HiddenTarget): void {
    if (target.object instanceof THREE.InstancedMesh && target.instanceId !== undefined && target.matrix) {
      target.object.setMatrixAt(target.instanceId, target.matrix);
      target.object.instanceMatrix.needsUpdate = true;
      return;
    }
    if (target.visible !== undefined) target.object.visible = target.visible;
  }
}

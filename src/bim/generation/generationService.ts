import * as THREE from 'three';
import {
  BimGenerationParams,
  BimGenerationPlan,
  BimGenerationWallSpec,
  BimGenerationSlabSpec,
} from '@/types/bim';

export class BimGenerationService {
  private activePlan: BimGenerationPlan | null = null;
  public previewGroup: THREE.Group = new THREE.Group();
  private attachedScene: THREE.Scene | null = null;

  constructor() {
    this.previewGroup.name = 'BimGenerationPreview';
  }

  public initSceneLayer(scene: THREE.Scene): void {
    this.attachedScene = scene;
    if (!scene.children.includes(this.previewGroup)) {
      scene.add(this.previewGroup);
    }
  }

  public setScene(scene: THREE.Scene | null): void {
    this.attachedScene = scene;
    if (scene && !scene.children.includes(this.previewGroup)) {
      scene.add(this.previewGroup);
    }
  }

  public getActivePlan(): BimGenerationPlan | null {
    return this.activePlan;
  }

  public hasActivePreview(): boolean {
    return this.previewGroup.children.length > 0;
  }

  /**
   * Validates generation parameters against geometric constraints.
   */
  public validateParams(params: Partial<BimGenerationParams>): {
    valid: boolean;
    error?: string;
    normalized?: Required<BimGenerationParams>;
  } {
    const length = Number(params.length);
    const width = Number(params.width);
    const storeys = params.storeys !== undefined ? Math.floor(Number(params.storeys)) : 1;
    let storeyHeight = params.storeyHeight !== undefined ? Number(params.storeyHeight) : undefined;

    if (isNaN(length) || length <= 0) {
      return { valid: false, error: 'Building length must be a positive number greater than 0.' };
    }
    if (isNaN(width) || width <= 0) {
      return { valid: false, error: 'Building width must be a positive number greater than 0.' };
    }
    if (isNaN(storeys) || storeys < 1) {
      return { valid: false, error: 'Number of storeys must be an integer of at least 1.' };
    }

    if (storeyHeight === undefined && params.height !== undefined) {
      const totalH = Number(params.height);
      if (!isNaN(totalH) && totalH > 0) {
        storeyHeight = totalH / storeys;
      }
    }

    if (storeyHeight === undefined || isNaN(storeyHeight) || storeyHeight <= 0) {
      return {
        valid: false,
        error: 'Storey height (or total building height) must be a positive number greater than 0.',
      };
    }

    const wallThickness = params.wallThickness !== undefined && Number(params.wallThickness) > 0
      ? Number(params.wallThickness)
      : 0.2;

    if (wallThickness >= Math.min(length, width) / 2) {
      return {
        valid: false,
        error: `Wall thickness (${wallThickness}m) is too large for footprint (${length}m × ${width}m).`,
      };
    }

    const slabThickness = params.slabThickness !== undefined && Number(params.slabThickness) > 0
      ? Number(params.slabThickness)
      : 0.2;

    const originX = params.originX !== undefined ? Number(params.originX) : 0;
    const originY = params.originY !== undefined ? Number(params.originY) : 0;
    const originZ = params.originZ !== undefined ? Number(params.originZ) : 0;

    const totalHeight = storeys * storeyHeight;

    return {
      valid: true,
      normalized: {
        length,
        width,
        height: totalHeight,
        storeyHeight,
        storeys,
        wallThickness,
        slabThickness,
        originX,
        originY,
        originZ,
      },
    };
  }

  /**
   * Generates a deterministic BIM generation plan from validated parameters.
   */
  public generatePlan(params: Partial<BimGenerationParams>): BimGenerationPlan {
    const validation = this.validateParams(params);
    if (!validation.valid || !validation.normalized) {
      throw new Error(validation.error || 'Invalid BIM generation parameters.');
    }

    const {
      length,
      width,
      storeyHeight,
      storeys,
      wallThickness,
      slabThickness,
      originX,
      originY,
      originZ,
    } = validation.normalized;

    const totalHeight = storeys * storeyHeight;
    const footprintArea = length * width;
    const grossVolume = footprintArea * totalHeight;

    const walls: BimGenerationWallSpec[] = [];
    const slabs: BimGenerationSlabSpec[] = [];

    // 1. Base Slab (Ground level)
    slabs.push({
      id: 'slab-base-0',
      storeyIndex: 0,
      storeyName: 'Level 0 (Ground Floor)',
      elevation: originY,
      length,
      width,
      thickness: slabThickness,
      originX,
      originZ,
      type: 'base',
    });

    // 2. Generate Storeys: Walls + Intermediate/Roof Slabs
    for (let s = 0; s < storeys; s++) {
      const storeyName = s === 0 ? 'Level 0 (Ground Floor)' : `Level ${s}`;
      const elevation = originY + s * storeyHeight;

      // 4 perimeter walls per storey
      // South Wall: along X from (0, 0) to (length, 0)
      walls.push({
        id: `wall-s${s}-south`,
        storeyIndex: s,
        storeyName,
        startX: originX,
        startZ: originZ,
        endX: originX + length,
        endZ: originZ,
        elevation,
        height: storeyHeight,
        thickness: wallThickness,
      });

      // East Wall: along Z from (length, 0) to (length, width)
      walls.push({
        id: `wall-s${s}-east`,
        storeyIndex: s,
        storeyName,
        startX: originX + length,
        startZ: originZ,
        endX: originX + length,
        endZ: originZ + width,
        elevation,
        height: storeyHeight,
        thickness: wallThickness,
      });

      // North Wall: along X from (length, width) to (0, width)
      walls.push({
        id: `wall-s${s}-north`,
        storeyIndex: s,
        storeyName,
        startX: originX + length,
        startZ: originZ + width,
        endX: originX,
        endZ: originZ + width,
        elevation,
        height: storeyHeight,
        thickness: wallThickness,
      });

      // West Wall: along Z from (0, width) to (0, 0)
      walls.push({
        id: `wall-s${s}-west`,
        storeyIndex: s,
        storeyName,
        startX: originX,
        startZ: originZ + width,
        endX: originX,
        endZ: originZ,
        elevation,
        height: storeyHeight,
        thickness: wallThickness,
      });

      // Upper floor slab or roof slab
      const isTop = s === storeys - 1;
      slabs.push({
        id: isTop ? `slab-roof-${s + 1}` : `slab-floor-${s + 1}`,
        storeyIndex: s + 1,
        storeyName: isTop ? 'Roof Level' : `Level ${s + 1}`,
        elevation: elevation + storeyHeight,
        length,
        width,
        thickness: slabThickness,
        originX,
        originZ,
        type: isTop ? 'roof' : 'floor',
      });
    }

    const plan: BimGenerationPlan = {
      id: `gen-plan-${Date.now()}`,
      timestamp: Date.now(),
      params: {
        length,
        width,
        storeyHeight,
        storeys,
        wallThickness,
        slabThickness,
        totalHeight,
        footprintArea,
        grossVolume,
        originX,
        originY,
        originZ,
      },
      walls,
      slabs,
    };

    return plan;
  }

  /**
   * Constructs disposable Three.js preview objects and renders them non-destructively.
   */
  public previewPlan(plan: BimGenerationPlan, scene?: THREE.Scene): THREE.Group {
    this.clearPreview();

    const targetScene = scene || this.attachedScene;
    if (targetScene && !targetScene.children.includes(this.previewGroup)) {
      targetScene.add(this.previewGroup);
    }

    // Shared semi-transparent preview materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Sky Blue
      opacity: 0.55,
      transparent: true,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const slabMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Slate
      opacity: 0.65,
      transparent: true,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const wallEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
    });

    const slabEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Build Walls
    for (const wall of plan.walls) {
      const dx = wall.endX - wall.startX;
      const dz = wall.endZ - wall.startZ;
      const wallLength = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);

      const wallGeom = new THREE.BoxGeometry(wallLength, wall.height, wall.thickness);
      const wallMesh = new THREE.Mesh(wallGeom, wallMaterial);

      const midX = (wall.startX + wall.endX) / 2;
      const midY = wall.elevation + wall.height / 2;
      const midZ = (wall.startZ + wall.endZ) / 2;

      wallMesh.position.set(midX, midY, midZ);
      wallMesh.rotation.y = -angle;
      wallMesh.name = `Preview_${wall.id}`;

      // Add crisp edge outline
      const edges = new THREE.EdgesGeometry(wallGeom);
      const line = new THREE.LineSegments(edges, wallEdgeMaterial);
      wallMesh.add(line);

      this.previewGroup.add(wallMesh);
    }

    // 2. Build Slabs
    for (const slab of plan.slabs) {
      const slabGeom = new THREE.BoxGeometry(slab.length, slab.thickness, slab.width);
      const slabMesh = new THREE.Mesh(slabGeom, slabMaterial);

      const midX = slab.originX + slab.length / 2;
      // Position slab so that its top or center sits appropriately at elevation
      const midY = slab.elevation + (slab.type === 'base' ? slab.thickness / 2 : -slab.thickness / 2);
      const midZ = slab.originZ + slab.width / 2;

      slabMesh.position.set(midX, midY, midZ);
      slabMesh.name = `Preview_${slab.id}`;

      const edges = new THREE.EdgesGeometry(slabGeom);
      const line = new THREE.LineSegments(edges, slabEdgeMaterial);
      slabMesh.add(line);

      this.previewGroup.add(slabMesh);
    }

    this.activePlan = plan;
    return this.previewGroup;
  }

  /**
   * Completely disposes preview geometries, materials, and children with zero memory leaks.
   */
  public clearPreview(): void {
    if (this.previewGroup.children.length === 0 && !this.activePlan) {
      return;
    }

    const disposeChild = (obj: THREE.Object3D) => {
      obj.children.forEach(disposeChild);

      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }

      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    };

    while (this.previewGroup.children.length > 0) {
      const child = this.previewGroup.children[0];
      disposeChild(child);
      this.previewGroup.remove(child);
    }

    if (this.previewGroup.parent) {
      this.previewGroup.parent.remove(this.previewGroup);
    }

    this.activePlan = null;
  }
}

export const bimGenerationService = new BimGenerationService();

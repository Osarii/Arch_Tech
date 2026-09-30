import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as FRAGS from '@thatopen/fragments';
import * as WebIFC from 'web-ifc';
import {
  CameraViewMode,
  StandardViewDirection,
  PerformanceStats,
  SelectedElementDetails,
} from '@/types/bim';
import { extractElementProperties } from '../properties/propertyExtractor';

export class BimEngine {
  public components: OBC.Components;
  public worlds: OBC.Worlds;
  public world!: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  public fragments: OBC.FragmentsManager;
  public ifcLoader: OBC.IfcLoader;
  public highlighter!: OBF.Highlighter;
  public hider!: OBC.Hider;
  public clipper!: OBC.Clipper;
  public lengthMeasure!: OBF.LengthMeasurement;

  public container: HTMLElement | null = null;
  public currentModel: FRAGS.FragmentsModel | null = null;
  public currentModelId: string | null = null;
  public webIfcApi: WebIFC.IfcAPI | null = null;
  public webIfcModelID: number | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private animFrameId: number | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Selection callback
  public onElementSelected?: (details: SelectedElementDetails | null) => void;
  public onPerformanceUpdate?: (stats: Partial<PerformanceStats>) => void;

  // Performance tracking
  private lastTime = performance.now();
  private frames = 0;
  private fps = 60;
  private frameTimeMs = 16.6;

  constructor() {
    this.components = new OBC.Components();
    this.worlds = this.components.get(OBC.Worlds);
    this.fragments = this.components.get(OBC.FragmentsManager);
    this.ifcLoader = this.components.get(OBC.IfcLoader);
  }

  public async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Initializes the BIM viewport within the given DOM container.
   */
  public async init(container: HTMLElement): Promise<void> {
    if (this.isInitialized && this.container === container) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.container = container;

      // 1. Create Simple World
      this.world = this.worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBC.SimpleRenderer
      >();

      this.world.scene = new OBC.SimpleScene(this.components);
      this.world.renderer = new OBC.SimpleRenderer(this.components, container);
      this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);

      this.components.init();

      // 2. Hardware profile (Intel UHD Graphics 630 target)
      // DPR max 1.25, Shadows OFF, bloom/postprocessing OFF
      const threeRenderer = this.world.renderer.three;
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      threeRenderer.shadowMap.enabled = false;

      // 3. Technical background & lighting
      this.world.scene.three.background = new THREE.Color('#0d0f12');

      // Ambient + 1 directional light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.world.scene.three.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(40, 70, 40);
      dirLight.castShadow = false;
      this.world.scene.three.add(dirLight);

      // Subtle technical grid
      const grid = new THREE.GridHelper(100, 50, 0x0284c7, 0x1e2430);
      grid.position.y = -0.01;
      this.world.scene.three.add(grid);

      // 4. Fragments & Worker setup (prefer local worker blob for instant offline init)
      try {
        const response = await fetch('/worker.min.mjs');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], 'worker.mjs', { type: 'text/javascript' });
        const workerUrl = URL.createObjectURL(file);
        this.fragments.init(workerUrl);
      } catch (err) {
        console.warn('Local worker load fallback to getWorker():', err);
        const workerUrl = await OBC.FragmentsManager.getWorker();
        this.fragments.init(workerUrl);
      }

      // 5. IfcLoader setup with local WASM
      const wasmPath = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
      await this.ifcLoader.setup({
        wasm: {
          path: wasmPath,
          absolute: true,
        },
        autoSetWasm: false,
      });

    // 6. Highlighter setup
    this.highlighter = this.components.get(OBF.Highlighter);
    this.highlighter.setup({
      world: this.world,
      selectName: 'select',
      autoHighlightOnClick: true,
    });

    // Wire up highlight events
    if (this.highlighter.events?.select) {
      this.highlighter.events.select.onHighlight.add((modelIdMap) => {
        this.handleModelIdMapSelection(modelIdMap);
      });
      this.highlighter.events.select.onClear.add(() => {
        if (this.onElementSelected) this.onElementSelected(null);
      });
    }

    // 7. Hider setup
    this.hider = this.components.get(OBC.Hider);

    // 8. Clipper setup
    this.clipper = this.components.get(OBC.Clipper);
    this.clipper.enabled = false;

    // 9. LengthMeasurement setup
    this.lengthMeasure = this.components.get(OBF.LengthMeasurement);
    this.lengthMeasure.world = this.world;
    this.lengthMeasure.enabled = false;

    // 10. Initial camera view
    this.world.camera.controls.setLookAt(20, 20, 20, 0, 0, 0, false);

    // 11. Handle container resizing
    this.setupResizeObserver(container);

    // 12. Performance monitoring loop
    this.startPerformanceLoop();

    this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private setupResizeObserver(container: HTMLElement) {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(container);
  }

  public resize(): void {
    if (!this.world || !this.container) return;
    this.world.renderer?.resize();
    this.world.camera?.updateAspect();
  }

  private startPerformanceLoop(): void {
    const loop = () => {
      this.frames++;
      const now = performance.now();
      const delta = now - this.lastTime;

      if (delta >= 1000) {
        this.fps = Math.round((this.frames * 1000) / delta);
        this.frameTimeMs = Math.round((delta / this.frames) * 10) / 10;
        this.frames = 0;
        this.lastTime = now;

        if (this.onPerformanceUpdate && this.world?.renderer?.three) {
          const info = this.world.renderer.three.info;
          this.onPerformanceUpdate({
            fps: this.fps,
            frameTimeMs: this.frameTimeMs,
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
          });
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private handleModelIdMapSelection(modelIdMap: OBC.ModelIdMap) {
    if (!this.webIfcApi || this.webIfcModelID === null) return;

    for (const [, expressIds] of Object.entries(modelIdMap)) {
      for (const expressID of expressIds) {
        const details = extractElementProperties(this.webIfcApi, this.webIfcModelID, expressID);
        if (details && this.onElementSelected) {
          this.onElementSelected(details);
          return;
        }
      }
    }
  }

  // --- CAMERA & VIEWPORT CONTROLS ---

  public setCameraMode(mode: CameraViewMode): void {
    if (!this.world?.camera) return;
    if (mode === 'orthographic') {
      this.world.camera.projection.set('Orthographic');
    } else {
      this.world.camera.projection.set('Perspective');
    }
  }

  public fitModel(box?: THREE.Box3): void {
    if (!this.world?.camera?.controls) return;
    const targetBox = box || this.currentModel?.box;
    if (targetBox && !targetBox.isEmpty()) {
      this.world.camera.controls.fitToBox(targetBox, true);
    }
  }

  public setStandardView(direction: StandardViewDirection): void {
    if (!this.world?.camera?.controls) return;
    const box = this.currentModel?.box || new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 10);
    const dist = maxDim * 2.2;

    switch (direction) {
      case 'top':
        this.world.camera.controls.setLookAt(center.x, center.y + dist, center.z, center.x, center.y, center.z, true);
        break;
      case 'bottom':
        this.world.camera.controls.setLookAt(center.x, center.y - dist, center.z, center.x, center.y, center.z, true);
        break;
      case 'front':
        this.world.camera.controls.setLookAt(center.x, center.y, center.z + dist, center.x, center.y, center.z, true);
        break;
      case 'back':
        this.world.camera.controls.setLookAt(center.x, center.y, center.z - dist, center.x, center.y, center.z, true);
        break;
      case 'left':
        this.world.camera.controls.setLookAt(center.x - dist, center.y, center.z, center.x, center.y, center.z, true);
        break;
      case 'right':
        this.world.camera.controls.setLookAt(center.x + dist, center.y, center.z, center.x, center.y, center.z, true);
        break;
      case 'isometric':
      default:
        this.world.camera.controls.setLookAt(
          center.x + dist * 0.7,
          center.y + dist * 0.7,
          center.z + dist * 0.7,
          center.x,
          center.y,
          center.z,
          true
        );
        break;
    }
  }

  // --- SELECTION & VISIBILITY API (AI-READY CLEAN INTERFACE) ---

  public async selectElements(expressIDs: number[], zoom = true): Promise<void> {
    if (!this.currentModelId || !this.highlighter) return;
    const modelIdMap: OBC.ModelIdMap = {
      [this.currentModelId]: new Set(expressIDs),
    };
    await this.highlighter.highlightByID('select', modelIdMap, true, zoom);

    if (expressIDs.length > 0 && this.webIfcApi && this.webIfcModelID !== null) {
      const details = extractElementProperties(this.webIfcApi, this.webIfcModelID, expressIDs[0]);
      if (details && this.onElementSelected) {
        this.onElementSelected(details);
      }
    }
  }

  public async clearSelection(): Promise<void> {
    if (!this.highlighter) return;
    await this.highlighter.clear('select');
    if (this.onElementSelected) this.onElementSelected(null);
  }

  public async hideElements(expressIDs: number[]): Promise<void> {
    if (!this.currentModelId || !this.hider) return;
    const modelIdMap: OBC.ModelIdMap = {
      [this.currentModelId]: new Set(expressIDs),
    };
    await this.hider.set(false, modelIdMap);
  }

  public async isolateElements(expressIDs: number[]): Promise<void> {
    if (!this.currentModelId || !this.hider) return;
    const modelIdMap: OBC.ModelIdMap = {
      [this.currentModelId]: new Set(expressIDs),
    };
    await this.hider.isolate(modelIdMap);
  }

  public async showAll(): Promise<void> {
    if (!this.hider) return;
    await this.hider.set(true);
  }

  public async focusElements(expressIDs: number[]): Promise<void> {
    if (!this.currentModel || expressIDs.length === 0) {
      this.fitModel();
      return;
    }
    // Zoom via highlighter selection
    await this.selectElements(expressIDs, true);
  }

  public getProperties(expressID: number): SelectedElementDetails | null {
    if (!this.webIfcApi || this.webIfcModelID === null) return null;
    return extractElementProperties(this.webIfcApi, this.webIfcModelID, expressID);
  }

  // --- INSPECTION TOOLS: CLIPPING & MEASUREMENT ---

  public async createClippingPlane(): Promise<void> {
    if (!this.clipper || !this.world) return;
    this.clipper.enabled = true;
    await this.clipper.create(this.world);
  }

  public deleteClippingPlanes(): void {
    if (!this.clipper) return;
    this.clipper.deleteAll();
    this.clipper.enabled = false;
  }

  public startMeasurement(): void {
    if (!this.lengthMeasure) return;
    this.lengthMeasure.enabled = true;
    this.lengthMeasure.create();
  }

  public deleteMeasurements(): void {
    if (!this.lengthMeasure) return;
    this.lengthMeasure.delete();
    this.lengthMeasure.enabled = false;
  }

  // --- MEMORY SAFETY & MODEL UNLOAD ---

  public async unloadModel(): Promise<void> {
    if (this.highlighter) {
      await this.highlighter.clear('select');
    }

    if (this.clipper) {
      this.clipper.deleteAll();
    }

    if (this.currentModel) {
      try {
        if (this.world?.scene?.three && this.currentModel.object) {
          this.world.scene.three.remove(this.currentModel.object);
        }
        await this.currentModel.dispose();
      } catch (err) {
        console.warn('Error disposing fragments model:', err);
      }
      this.currentModel = null;
      this.currentModelId = null;
    }

    if (this.webIfcApi && this.webIfcModelID !== null) {
      try {
        this.webIfcApi.CloseModel(this.webIfcModelID);
      } catch (err) {
        console.warn('Error closing web-ifc model:', err);
      }
      this.webIfcModelID = null;
    }

    if (this.onElementSelected) {
      this.onElementSelected(null);
    }
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.unloadModel();
    try {
      this.components.dispose();
    } catch (err) {
      console.warn('Error disposing components:', err);
    }
    this.isInitialized = false;
  }
}

// Global engine singleton
export const bimEngine = new BimEngine();

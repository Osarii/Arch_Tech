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
  MeasurementType,
  BimViewpoint,
} from '@/types/bim';
import { extractElementProperties } from '../properties/propertyExtractor';
import { bimEditService } from '../edit/bimEditService';
import { bimGenerationService } from '../generation/generationService';
import { laLimaSiteContextService } from '../site';
import {
  ModelInteraction,
  filterSceneInteractionTargets,
  groupSceneInteractionTargets,
  getCameraFocusBounds,
  type SceneInteractionDetails,
  type SceneInteractionGroup,
  type SceneInteractionTarget,
} from '../interaction';
import { useBimStore } from '@/stores/bimStore';
import { AdaptiveResolution } from './adaptiveResolution';
import { renderQualityProfiles, type RenderDiagnostics, type RenderQualityProfile } from './renderQuality';
import { SceneLighting } from './sceneLighting';

type CameraControlsEvents = {
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

export class BimEngine {
  public components!: OBC.Components;
  public worlds!: OBC.Worlds;
  public world!: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;
  public fragments!: OBC.FragmentsManager;
  public ifcLoader!: OBC.IfcLoader;
  public highlighter!: OBF.Highlighter;
  public hider!: OBC.Hider;
  public clipper!: OBC.Clipper;
  public lengthMeasure!: OBF.LengthMeasurement;
  public areaMeasure!: OBF.AreaMeasurement;
  public angleMeasure!: OBF.AngleMeasurement;

  public container: HTMLElement | null = null;
  public currentModel: FRAGS.FragmentsModel | null = null;
  public currentModelId: string | null = null;
  public webIfcApi: WebIFC.IfcAPI | null = null;
  public webIfcModelID: number | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private resizeFrameId: number | null = null;
  private performanceTimerId: ReturnType<typeof setInterval> | null = null;
  private workerBlobUrl: string | null = null;
  private contextCanvas: HTMLCanvasElement | null = null;
  private modelBoundsCache: { model: FRAGS.FragmentsModel; box: THREE.Box3 } | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private disposePromise: Promise<void> | null = null;
  private isDisposed = false;
  private readonly lighting = new SceneLighting();
  private readonly adaptiveResolution = new AdaptiveResolution();
  private qualityProfile: RenderQualityProfile = 'balanced';
  private effectiveDpr = renderQualityProfiles.balanced.maxDpr;
  private trackedControls: CameraControlsEvents | null = null;
  private isCameraInteractive = false;
  private lastCameraActivityAt = 0;
  private modelInteraction = new ModelInteraction();
  private readonly interactionRaycaster = new THREE.Raycaster();
  private readonly interactionPointer = new THREE.Vector2();
  private interactionCanvas: HTMLCanvasElement | null = null;
  private pointerFrameId: number | null = null;
  private pendingPointer: { x: number; y: number } | null = null;
  private pointerDown: { x: number; y: number } | null = null;

  // Selection callback
  public onElementSelected?: (details: SelectedElementDetails | null) => void;
  public onSceneElementSelected?: (details: SceneInteractionDetails | null) => void;
  public onSceneElementsSelected?: (details: SceneInteractionDetails[]) => void;
  public onSceneElementHovered?: (id: string | null) => void;
  public onPerformanceUpdate?: (stats: Partial<PerformanceStats>) => void;

  // Performance tracking
  private lastTime = performance.now();
  private lastRendererFrame = 0;
  private fps = 60;
  private frameTimeMs = 16.6;

  private readonly handleCameraActivity = (): void => {
    this.isCameraInteractive = true;
    this.lastCameraActivityAt = performance.now();
  };

  private readonly handleCameraRest = (): void => {
    this.isCameraInteractive = false;
  };

  private readonly handleInteractionPointerMove = (event: PointerEvent): void => {
    if (useBimStore.getState().activeTool !== 'select') {
      this.handleInteractionPointerLeave();
      return;
    }
    this.pendingPointer = { x: event.clientX, y: event.clientY };
    if (this.pointerFrameId !== null || typeof requestAnimationFrame !== 'function') {
      if (this.pointerFrameId === null) this.updateSceneHover();
      return;
    }
    this.pointerFrameId = requestAnimationFrame(() => {
      this.pointerFrameId = null;
      this.updateSceneHover();
    });
  };

  private readonly handleInteractionPointerLeave = (): void => {
    this.pendingPointer = null;
    this.modelInteraction.setHovered(null);
    if (this.interactionCanvas) this.interactionCanvas.style.cursor = '';
  };

  private readonly handleInteractionPointerDown = (event: PointerEvent): void => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private readonly handleInteractionClick = (event: MouseEvent): void => {
    if (!this.isSceneInteractionEnabled() || !this.pointerDown) return;
    const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
    this.pointerDown = null;
    if (moved > 4) return;
    const target = this.pickSceneInteraction(event.clientX, event.clientY);
    if (!target) return;
    event.stopImmediatePropagation();
    void this.selectSceneInteraction(target, event.shiftKey || event.metaKey || event.ctrlKey);
  };

  constructor() {
    this.createCoreComponents();
    this.setupModelInteractionCallbacks();

    const isDevOrTest =
      (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
      Boolean(import.meta.env?.DEV) ||
      import.meta.env?.MODE === 'test';

    if (typeof window !== 'undefined' && isDevOrTest) {
      (window as any).bimEngine = this;
    }
  }

  private setupModelInteractionCallbacks(): void {
    this.modelInteraction.onHoverChange = (target) => {
      this.onSceneElementHovered?.(target?.id ?? null);
    };
    this.modelInteraction.onSelectionChange = (target) => {
      this.onSceneElementSelected?.(target?.details ?? null);
    };
    this.modelInteraction.onSelectionSetChange = (targets) => {
      this.onSceneElementsSelected?.(targets.map((target) => target.details));
    };
  }

  private createCoreComponents(): void {
    this.components = new OBC.Components();
    this.worlds = this.components.get(OBC.Worlds);
    this.fragments = this.components.get(OBC.FragmentsManager);
    this.ifcLoader = this.components.get(OBC.IfcLoader);
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.stopPerformanceSampler();
  };

  private readonly handleContextRestored = (): void => {
    this.resize();
    this.startPerformanceSampler();
  };

  private setupWebGLContextListeners(canvas: HTMLCanvasElement | null): void {
    if (this.contextCanvas === canvas) return;
    if (this.contextCanvas) {
      this.contextCanvas.removeEventListener('webglcontextlost', this.handleContextLost);
      this.contextCanvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }
    this.contextCanvas = canvas;
    if (canvas) {
      canvas.addEventListener('webglcontextlost', this.handleContextLost);
      canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    }
  }

  private setupSceneInteractionListeners(canvas: HTMLCanvasElement | null): void {
    if (this.interactionCanvas === canvas) return;
    if (this.interactionCanvas) {
      this.interactionCanvas.removeEventListener('pointermove', this.handleInteractionPointerMove);
      this.interactionCanvas.removeEventListener('pointerleave', this.handleInteractionPointerLeave);
      this.interactionCanvas.removeEventListener('pointerdown', this.handleInteractionPointerDown, true);
      this.interactionCanvas.removeEventListener('click', this.handleInteractionClick, true);
    }
    this.interactionCanvas = canvas;
    if (canvas) {
      canvas.addEventListener('pointermove', this.handleInteractionPointerMove, { passive: true });
      canvas.addEventListener('pointerleave', this.handleInteractionPointerLeave, { passive: true });
      canvas.addEventListener('pointerdown', this.handleInteractionPointerDown, true);
      canvas.addEventListener('click', this.handleInteractionClick, true);
    }
  }

  private cancelPendingInteractionFrame(): void {
    if (this.pointerFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.pointerFrameId);
    }
    this.pointerFrameId = null;
  }

  private isSceneInteractionEnabled(): boolean {
    return useBimStore.getState().activeTool === 'select' && laLimaSiteContextService.isActive();
  }

  private pickSceneInteraction(clientX: number, clientY: number): SceneInteractionTarget | null {
    const canvas = this.interactionCanvas;
    const camera = this.world?.camera?.three;
    if (!canvas || !camera) return null;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return null;
    this.interactionPointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1
    );
    return this.modelInteraction.pick(this.interactionRaycaster, camera, this.interactionPointer);
  }

  private updateSceneHover(): void {
    if (!this.pendingPointer) return;
    if (!this.isSceneInteractionEnabled()) {
      if (this.highlighter?.enabled && this.currentModelId) {
        void this.highlighter.highlight('hover', true, false);
      }
      return;
    }
    const { x, y } = this.pendingPointer;
    const target = this.pickSceneInteraction(x, y);
    this.modelInteraction.setHovered(target);
    if (this.interactionCanvas) this.interactionCanvas.style.cursor = target ? 'pointer' : '';
  }

  private async selectSceneInteraction(target: SceneInteractionTarget, append = false): Promise<void> {
    if (this.highlighter) await this.highlighter.clear('select');
    this.emitIfcSelection(null);
    if (append) {
      this.modelInteraction.toggleSelected(target);
    } else {
      this.modelInteraction.setSelected(target);
    }
  }

  public async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Initializes the That Open engine with container element.
   */
  public async init(container: HTMLElement): Promise<void> {
    if (this.disposePromise) {
      await this.disposePromise;
    }
    if (this.isDisposed) {
      this.createCoreComponents();
      this.isDisposed = false;
    }

    if (this.isInitialized) {
      if (this.container !== container) {
        this.rebindContainer(container);
      }
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      if (container && this.container !== container) {
        this.rebindContainer(container);
      }
      return;
    }

    this.container = container;
    const activeInit = (async () => {
      try {
        // 1. Create SimpleWorld
        this.world = this.worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBC.SimpleRenderer
        >();

      // 2. Setup Scene
      this.world.scene = new OBC.SimpleScene(this.components);
      this.world.scene.setup();

      // Configure background, atmospheric depth fog and lighting
      if (this.world.scene.three) {
        const initialQuality = renderQualityProfiles[this.qualityProfile];
        this.world.scene.three.background = new THREE.Color(0x111419);
        this.world.scene.three.fog = new THREE.Fog(0x111419, initialQuality.fogNear, initialQuality.fogFar);
        this.lighting.attach(this.world.scene.three);

        bimEditService.initSceneLayer(this.world.scene.three);
        bimGenerationService.initSceneLayer(this.world.scene.three);
        laLimaSiteContextService.attach(this.world.scene.three);
        this.modelInteraction.attach(this.world.scene.three);
        bimEditService.setSceneBridge({
          getWebIfcApi: () => this.webIfcApi,
          getWebIfcModelID: () => this.webIfcModelID,
          getCurrentModelId: () => this.currentModelId,
          hideElements: (ids) => this.hideElements(ids),
          unhideElements: async (ids) => {
            if (this.currentModelId && this.hider) {
              await this.hider.set(true, { [this.currentModelId]: new Set(ids) });
            }
          },
          showAll: () => this.showAll(),
          clearSelection: () => this.clearSelection(),
        });
      }

      // 3. Setup Renderer FIRST (Required by OrthoPerspectiveCamera)
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      this.world.renderer = new OBC.SimpleRenderer(this.components, container);
      if (this.world.renderer.three) {
        this.effectiveDpr = this.getInitialDpr(this.qualityProfile);
        this.configureRenderer(this.world.renderer.three);
        this.world.renderer.three.domElement.style.position = 'absolute';
        this.world.renderer.three.domElement.style.inset = '0';
        this.setupWebGLContextListeners(this.world.renderer.three.domElement);
        this.setupSceneInteractionListeners(this.world.renderer.three.domElement);
      }

      // 4. Setup Camera
      this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);
      this.world.camera.threePersp.far = 5000;
      this.world.camera.threePersp.updateProjectionMatrix();
      this.world.camera.threeOrtho.far = 5000;
      this.world.camera.threeOrtho.updateProjectionMatrix();
      if (this.world.camera.controls) {
        this.configureArchitecturalCameraControls();
        this.setupCameraActivityTracking(this.world.camera.controls as unknown as CameraControlsEvents);
      }

      // Initialize That Open components
      this.components.init();

      // Camera-dependent quality work happens only once renderer and camera both exist.
      this.applyRenderQuality(this.qualityProfile);

      // 4. FragmentsManager Worker setup
      try {
        const workerResponse = await fetch('/worker.min.mjs');
        if (workerResponse.ok) {
          const workerBlob = await workerResponse.blob();
          const workerUrl = URL.createObjectURL(workerBlob);
          this.workerBlobUrl = workerUrl;
          this.fragments.init(workerUrl);
        } else {
          const workerUrl = await OBC.FragmentsManager.getWorker();
          this.fragments.init(workerUrl);
        }
      } catch {
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
      this.highlighter.styles.set('hover', {
        color: new THREE.Color(0x79b791),
        opacity: 0.22,
        transparent: true,
        renderedFaces: FRAGS.RenderedFaces.TWO,
        preserveOriginalMaterial: true,
      });

      // Wire up highlight events
      if (this.highlighter.events?.select) {
        this.highlighter.events.select.onHighlight.add((modelIdMap) => {
          this.handleModelIdMapSelection(modelIdMap);
        });
        this.highlighter.events.select.onClear.add(() => {
          this.emitIfcSelection(null);
        });
      }

      // 7. Hider setup
      this.hider = this.components.get(OBC.Hider);

      // 8. Clipper setup
      this.clipper = this.components.get(OBC.Clipper);
      this.clipper.enabled = false;

      // 9. Measurements setup
      this.lengthMeasure = this.components.get(OBF.LengthMeasurement);
      this.lengthMeasure.world = this.world;
      this.lengthMeasure.units = 'm';
      this.lengthMeasure.rounding = 2;
      this.lengthMeasure.mode = 'free';
      this.lengthMeasure.pickMode = OBF.MeasurementPickMode.MOUSE_STOP;
      this.lengthMeasure.enabled = false;

      this.areaMeasure = this.components.get(OBF.AreaMeasurement);
      this.areaMeasure.world = this.world;
      this.areaMeasure.enabled = false;

      this.angleMeasure = this.components.get(OBF.AngleMeasurement);
      this.angleMeasure.world = this.world;
      this.angleMeasure.enabled = false;

      // 10. Initial camera view
      this.world.camera.controls.setLookAt(20, 20, 20, 0, 0, 0, false);

      // 11. Handle container resizing
      this.setupResizeObserver(container);

      // 12. Low-frequency performance monitoring
      this.startPerformanceSampler();

      this.isInitialized = true;
    } catch (error) {
      this.stopPerformanceSampler();
      this.disconnectResizeObserver();
      this.setupWebGLContextListeners(null);
      this.setupSceneInteractionListeners(null);
      this.cancelPendingInteractionFrame();
      this.setupCameraActivityTracking(null);
      this.lighting.dispose();
      this.revokeWorkerBlobUrl();
      try {
        this.components.dispose();
      } catch {
        // Preserve the original initialization error.
      }
      this.isDisposed = true;
      this.container = null;
      throw error;
    } finally {
      this.initPromise = null;
    }
  })();

  this.initPromise = activeInit;
  return activeInit;
}

  /**
   * Rebinds the existing renderer canvas and resize observer to a new container
   * without destroying or rebuilding engine state.
   */
  public rebindContainer(container: HTMLElement): void {
    if (!container) return;
    this.container = container;

    // 1. Clear any stale children in the new container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 2. Reattach the existing canvas if present
    const threeRenderer = this.world?.renderer?.three;
    const canvas = threeRenderer?.domElement;
    if (canvas) {
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      if (canvas.parentElement !== container) {
        container.appendChild(canvas);
      }
      threeRenderer.setPixelRatio(this.effectiveDpr);
      this.setupWebGLContextListeners(canvas);
      this.setupSceneInteractionListeners(canvas);
    }

    // 3. Update That Open SimpleRenderer internal container reference & events
    if (this.world?.renderer) {
      try {
        this.world.renderer.setupEvents(false);
      } catch {
        // Safe fallback if renderer does not support setupEvents
      }
      (this.world.renderer as any).container = container;
      try {
        this.world.renderer.setupEvents(true);
      } catch {
        // Safe fallback if renderer does not support setupEvents
      }
    }

    // 4. Rebind ResizeObserver to the new container
    this.setupResizeObserver(container);

    // 5. Trigger resize and aspect ratio update
    this.scheduleResize();
  }

  private setupResizeObserver(container: HTMLElement): void {
    this.disconnectResizeObserver();
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleResize();
    });
    this.resizeObserver.observe(container);
  }

  private scheduleResize(): void {
    if (this.resizeFrameId !== null) return;
    if (typeof requestAnimationFrame !== 'function') {
      this.resize();
      return;
    }
    this.resizeFrameId = requestAnimationFrame(() => {
      this.resizeFrameId = null;
      this.resize();
    });
  }

  private cancelPendingResize(): void {
    if (this.resizeFrameId === null) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.resizeFrameId);
    this.resizeFrameId = null;
  }

  private disconnectResizeObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.cancelPendingResize();
  }

  public resize(): void {
    if (!this.world || !this.container) return;
    this.world.renderer?.resize();
    this.world.camera?.updateAspect();
  }

  private setupCameraActivityTracking(controls: CameraControlsEvents | null): void {
    if (this.trackedControls === controls) return;
    this.trackedControls?.removeEventListener?.('controlstart', this.handleCameraActivity);
    this.trackedControls?.removeEventListener?.('control', this.handleCameraActivity);
    this.trackedControls?.removeEventListener?.('transitionstart', this.handleCameraActivity);
    this.trackedControls?.removeEventListener?.('rest', this.handleCameraRest);
    this.trackedControls = controls;
    controls?.addEventListener?.('controlstart', this.handleCameraActivity);
    controls?.addEventListener?.('control', this.handleCameraActivity);
    controls?.addEventListener?.('transitionstart', this.handleCameraActivity);
    controls?.addEventListener?.('rest', this.handleCameraRest);
  }

  private startPerformanceSampler(): void {
    this.stopPerformanceSampler();
    const renderer = this.world?.renderer?.three;
    this.lastTime = performance.now();
    this.lastRendererFrame = renderer?.info.render.frame ?? 0;
    this.lastCameraActivityAt = this.lastTime;

    this.performanceTimerId = setInterval(() => {
      const activeRenderer = this.world?.renderer?.three;
      if (!activeRenderer) return;

      const now = performance.now();
      const delta = now - this.lastTime;
      const currentFrame = activeRenderer.info.render.frame ?? this.lastRendererFrame;
      const renderedFrames = Math.max(0, currentFrame - this.lastRendererFrame);
      const isInteractive = this.isCameraInteractive || now - this.lastCameraActivityAt < 1200;
      if (renderedFrames > 0 && isInteractive) {
        this.fps = delta > 0 ? Math.round((renderedFrames * 1000) / delta) : 0;
        this.frameTimeMs = Math.round((delta / renderedFrames) * 10) / 10;
      }
      this.lastRendererFrame = currentFrame;
      this.lastTime = now;

      const nextDpr = this.adaptiveResolution.next(
        this.fps,
        this.effectiveDpr,
        renderQualityProfiles[this.qualityProfile],
        now,
        isInteractive && renderedFrames > 0
      );
      if (nextDpr !== null) {
        this.effectiveDpr = nextDpr;
        activeRenderer.setPixelRatio(nextDpr);
        this.resize();
      }

      const diagnostics = this.getRenderDiagnostics(isInteractive);
      this.onPerformanceUpdate?.({
        fps: diagnostics.fps,
        frameTimeMs: diagnostics.frameTimeMs,
        drawCalls: diagnostics.drawCalls,
        triangles: diagnostics.triangles,
        geometries: diagnostics.geometries,
        textures: diagnostics.textures,
      });
    }, 1000);
  }

  private getInitialDpr(profile: RenderQualityProfile): number {
    const deviceDpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    return Math.min(deviceDpr, renderQualityProfiles[profile].maxDpr);
  }

  private configureRenderer(renderer: THREE.WebGLRenderer): void {
    const profile = renderQualityProfiles[this.qualityProfile];
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = profile.toneMapping;
    renderer.toneMappingExposure = profile.exposure;
    renderer.setPixelRatio(this.effectiveDpr);
    renderer.shadowMap.enabled = false;
  }

  public getRenderQuality(): RenderQualityProfile {
    return this.qualityProfile;
  }

  public setRenderQuality(profile: RenderQualityProfile): void {
    this.applyRenderQuality(profile);
  }

  public getRenderDiagnostics(isInteractive = this.isCameraInteractive): RenderDiagnostics {
    const renderer = this.world?.renderer?.three;
    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      drawCalls: renderer?.info.render.calls ?? 0,
      triangles: renderer?.info.render.triangles ?? 0,
      geometries: renderer?.info.memory.geometries ?? 0,
      textures: renderer?.info.memory.textures ?? 0,
      effectiveDpr: this.effectiveDpr,
      qualityProfile: this.qualityProfile,
      isInteractive,
      shadowsEnabled: false,
    };
  }

  private applyRenderQuality(profile: RenderQualityProfile): void {
    this.qualityProfile = profile;
    this.adaptiveResolution.reset();
    this.effectiveDpr = this.getInitialDpr(profile);
    const renderer = this.world?.renderer?.three;
    if (renderer) this.configureRenderer(renderer);
    const config = renderQualityProfiles[profile];
    this.lighting.applyProfile(config);
    if (this.world?.scene?.three?.fog instanceof THREE.Fog) {
      this.world.scene.three.fog.near = config.fogNear;
      this.world.scene.three.fog.far = config.fogFar;
    }
    if (renderer && this.world?.camera) this.resize();
  }

  private stopPerformanceSampler(): void {
    if (this.performanceTimerId === null) return;
    clearInterval(this.performanceTimerId);
    this.performanceTimerId = null;
  }

  private revokeWorkerBlobUrl(): void {
    if (!this.workerBlobUrl) return;
    URL.revokeObjectURL(this.workerBlobUrl);
    this.workerBlobUrl = null;
  }

  private handleModelIdMapSelection(modelIdMap: OBC.ModelIdMap) {
    if (!this.webIfcApi || this.webIfcModelID === null) return;

    for (const [, expressIds] of Object.entries(modelIdMap)) {
      for (const expressID of expressIds) {
        const details = extractElementProperties(this.webIfcApi, this.webIfcModelID, expressID);
        if (details) {
          this.emitIfcSelection(details);
          return;
        }
      }
    }
  }

  private emitIfcSelection(details: SelectedElementDetails | null): void {
    this.onElementSelected?.(details);
    const sceneDetails = details
      ? {
          id: `ifc:${details.expressID}`,
          name: details.name,
          category: details.type,
          type: details.type,
          level: details.storey,
          material: details.materials?.join(', '),
          elementId: String(details.expressID),
        }
      : null;
    this.onSceneElementSelected?.(sceneDetails);
    this.onSceneElementsSelected?.(sceneDetails ? [sceneDetails] : []);
  }

  // --- CAMERA & VIEWPORT CONTROLS ---

  private configureArchitecturalCameraControls(): void {
    const controls = this.world?.camera?.controls;
    if (!controls) return;
    controls.dollyToCursor = true;
    controls.infinityDolly = false;
    controls.minDistance = 4;
    controls.maxDistance = 3000;
    controls.minZoom = 0.25;
    controls.maxZoom = 8;
    controls.minPolarAngle = 0.04;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.smoothTime = 0.18;
    controls.draggingSmoothTime = 0.08;
    controls.restThreshold = 0.01;
  }

  private shouldAnimateCamera(): boolean {
    return !(
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  public setCameraMode(mode: CameraViewMode): void {
    if (!this.world?.camera) return;
    if (mode === 'orthographic') {
      this.world.camera.projection.set('Orthographic');
    } else {
      this.world.camera.projection.set('Perspective');
    }
  }

  /**
   * Computes or retrieves bounding box for the current model.
   * Primary: currentModel.box.
   * Fallback: computed from currentModel.object via THREE.Box3().setFromObject.
   */
  public getModelBounds(): THREE.Box3 | null {
    if (!this.currentModel) return null;
    if (this.modelBoundsCache?.model === this.currentModel) {
      return this.modelBoundsCache.box;
    }
    if (this.currentModel?.box && !this.currentModel.box.isEmpty()) {
      this.modelBoundsCache = { model: this.currentModel, box: this.currentModel.box };
      return this.modelBoundsCache.box;
    }
    if (this.currentModel?.object) {
      const computed = new THREE.Box3().setFromObject(this.currentModel.object);
      if (!computed.isEmpty()) {
        this.modelBoundsCache = { model: this.currentModel, box: computed };
        return computed;
      }
    }
    return null;
  }

  public invalidateModelBounds(): void {
    this.modelBoundsCache = null;
  }

  public fitModel(box?: THREE.Box3): void {
    if (!this.world?.camera?.controls) return;
    let targetBox: THREE.Box3 | null = box && !box.isEmpty() ? box : null;

    if (!targetBox) {
      targetBox = this.getModelBounds();
    }

    if (!targetBox && !this.currentModel && laLimaSiteContextService.isActive()) {
      const siteBounds = laLimaSiteContextService.getBounds();
      if (!siteBounds.isEmpty()) targetBox = siteBounds;
    }

    // Never silently fail when valid scene geometry exists
    if (!targetBox || targetBox.isEmpty()) {
      if (bimGenerationService.hasActivePreview()) {
        const previewBox = bimGenerationService.getPreviewBounds();
        if (!previewBox.isEmpty()) {
          targetBox = previewBox;
        }
      } else if (this.world?.scene?.three) {
        const sceneBox = new THREE.Box3();
        this.world.scene.three.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh && obj.visible) {
            sceneBox.expandByObject(obj);
          }
        });
        if (!sceneBox.isEmpty()) {
          targetBox = sceneBox;
        }
      }
    }

    if (targetBox && !targetBox.isEmpty()) {
      void this.world.camera.controls.fitToBox(targetBox, this.shouldAnimateCamera());
    }
  }

  public resetView(): void {
    this.setCameraMode('perspective');
    useBimStore.getState().setCameraMode('perspective');
    this.setStandardView('isometric');
  }

  public setStandardView(direction: StandardViewDirection): void {
    if (!this.world?.camera?.controls) return;
    const box =
      this.getModelBounds() ||
      (laLimaSiteContextService.isActive() ? laLimaSiteContextService.getBounds() : null) ||
      new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 10);
    const dist = maxDim * (laLimaSiteContextService.isActive() ? 1.35 : 2.2);

    switch (direction) {
      case 'top':
        this.world.camera.controls.setLookAt(
          center.x,
          center.y + dist,
          center.z,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
        break;
      case 'bottom':
        this.world.camera.controls.setLookAt(
          center.x,
          center.y - dist,
          center.z,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
        break;
      case 'front':
        this.world.camera.controls.setLookAt(
          center.x,
          center.y,
          center.z + dist,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
        break;
      case 'back':
        this.world.camera.controls.setLookAt(
          center.x,
          center.y,
          center.z - dist,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
        break;
      case 'left':
        this.world.camera.controls.setLookAt(
          center.x - dist,
          center.y,
          center.z,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
        break;
      case 'right':
        this.world.camera.controls.setLookAt(
          center.x + dist,
          center.y,
          center.z,
          center.x,
          center.y,
          center.z,
          this.shouldAnimateCamera()
        );
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
          this.shouldAnimateCamera()
        );
        break;
    }
  }

  // --- SELECTION & VISIBILITY API ---

  public async selectElements(expressIDs: number[], zoom = true): Promise<void> {
    if (!this.currentModelId || !this.highlighter) return;
    const modelIdMap: OBC.ModelIdMap = {
      [this.currentModelId]: new Set(expressIDs),
    };
    await this.highlighter.highlightByID('select', modelIdMap, true, zoom);

    if (expressIDs.length > 0 && this.webIfcApi && this.webIfcModelID !== null) {
      const details = extractElementProperties(this.webIfcApi, this.webIfcModelID, expressIDs[0]);
      this.emitIfcSelection(details);
    }
  }

  public async clearSelection(): Promise<void> {
    if (!this.highlighter) return;
    await this.highlighter.clear('select');
    this.emitIfcSelection(null);
  }

  public async clearCurrentSelection(): Promise<void> {
    if (this.modelInteraction.getSelected()) {
      this.modelInteraction.clearSelection();
      return;
    }
    await this.clearSelection();
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
    if (this.hider) await this.hider.set(true);
    this.modelInteraction.showAll();
    const store = useBimStore.getState();
    store.setHiddenExpressIds(new Set());
    store.setIsIsolated(false);
    this.syncSceneInteractionState();
  }

  public async focusElements(expressIDs: number[]): Promise<void> {
    if (!this.currentModel || expressIDs.length === 0) {
      this.fitModel();
      return;
    }
    await this.selectElements(expressIDs, true);
  }

  public focusSelected(): void | Promise<void> {
    if (this.modelInteraction.getSelectedTargets().length > 0) {
      const bounds = this.modelInteraction.getSelectedBounds();
      if (bounds && !bounds.isEmpty() && this.world?.camera?.controls) {
        void this.world.camera.controls.fitToBox(getCameraFocusBounds(bounds), this.shouldAnimateCamera(), {
          paddingLeft: 0.12,
          paddingRight: 0.12,
          paddingTop: 0.12,
          paddingBottom: 0.12,
        });
      }
      return;
    }
    const selected = useBimStore.getState().selectedElement;
    if (selected) return this.focusElements([selected.expressID]);
  }

  public async hideSelected(): Promise<void> {
    if (this.modelInteraction.hideSelected()) {
      this.syncSceneInteractionState();
      return;
    }
    const selected = useBimStore.getState().selectedElement;
    if (!selected) return;
    await this.hideElements([selected.expressID]);
    const store = useBimStore.getState();
    store.setHiddenExpressIds(new Set([...store.hiddenExpressIds, selected.expressID]));
    await this.clearSelection();
  }

  public async isolateSelected(): Promise<void> {
    if (this.modelInteraction.isolateSelected()) {
      this.syncSceneInteractionState();
      return;
    }
    const selected = useBimStore.getState().selectedElement;
    if (!selected) return;
    await this.isolateElements([selected.expressID]);
    useBimStore.getState().setIsIsolated(true);
  }

  public getSceneExplorerGroups(query = ''): SceneInteractionGroup[] {
    return groupSceneInteractionTargets(filterSceneInteractionTargets(this.modelInteraction.getSelectableTargets(), query));
  }

  public async selectSceneElements(ids: string[], append = false, focus = false): Promise<void> {
    if (!laLimaSiteContextService.isActive()) return;
    if (this.highlighter) await this.highlighter.clear('select');
    this.emitIfcSelection(null);
    this.modelInteraction.selectByIds(ids, append);
    if (focus) this.focusSelected();
  }

  public getSceneInteractionState(): {
    hiddenIds: Set<string>;
    isolatedIds: Set<string>;
  } {
    return {
      hiddenIds: this.modelInteraction.getHiddenIds(),
      isolatedIds: this.modelInteraction.getIsolatedIds(),
    };
  }

  public resetSceneInteractions(): void {
    this.modelInteraction.reset();
    this.syncSceneInteractionState();
    this.onSceneElementHovered?.(null);
    this.onSceneElementSelected?.(null);
    this.onSceneElementsSelected?.([]);
  }

  private syncSceneInteractionState(): void {
    const state = this.getSceneInteractionState();
    const store = useBimStore.getState();
    store.setHiddenSceneElementIds(state.hiddenIds);
    store.setIsolatedSceneElementIds(state.isolatedIds);
  }

  public getProperties(expressID: number): SelectedElementDetails | null {
    if (!this.webIfcApi || this.webIfcModelID === null) return null;
    return extractElementProperties(this.webIfcApi, this.webIfcModelID, expressID);
  }

  // --- PHASE 2: FLOOR PLAN MODE (2D ↔ 3D PER STOREY) ---

  public async openFloorPlan(storeyName: string, storeyElementIds: number[]): Promise<void> {
    if (!this.world?.camera?.controls) return;

    // 1. Isolate the storey elements
    if (storeyElementIds.length > 0) {
      await this.isolateElements(storeyElementIds);
    }

    // 2. Set camera projection to Orthographic
    this.setCameraMode('orthographic');
    useBimStore.getState().setCameraMode('orthographic');

    // 3. Look straight down from +Y axis
    const box =
      this.getModelBounds() ||
      new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.z, 10);
    const dist = maxDim * 2.0;

    this.world.camera.controls.setLookAt(
      center.x,
      center.y + dist,
      center.z,
      center.x,
      center.y,
      center.z,
      true
    );

    useBimStore.getState().setActiveFloorPlanStorey(storeyName);
    useBimStore.getState().setIs2DMode(true);
  }

  public async exitFloorPlan(): Promise<void> {
    // 1. Show all model elements
    await this.showAll();

    // 2. Switch back to Perspective camera
    this.setCameraMode('perspective');
    useBimStore.getState().setCameraMode('perspective');

    // 3. Reset standard isometric view
    this.setStandardView('isometric');

    useBimStore.getState().setActiveFloorPlanStorey(null);
    useBimStore.getState().setIs2DMode(false);
  }

  // --- PHASE 2: STOREY NAVIGATION ---

  public async isolateStorey(elementIds: number[]): Promise<void> {
    await this.isolateElements(elementIds);
  }

  public async fitStorey(elementIds: number[]): Promise<void> {
    await this.selectElements(elementIds, true);
  }

  public async restoreAllStoreys(): Promise<void> {
    await this.showAll();
    this.fitModel();
    useBimStore.getState().setActiveFloorPlanStorey(null);
    useBimStore.getState().setIs2DMode(false);
  }

  // --- PHASE 2: ADVANCED SECTIONS (X / Y / Z & MULTIPLE PLANES) ---

  public async createClippingPlane(): Promise<void> {
    if (!this.clipper || !this.world) return;
    this.clipper.enabled = true;
    await this.clipper.create(this.world);
    useBimStore.getState().setSectionPlaneCount(useBimStore.getState().sectionPlaneCount + 1);
  }

  public createOrthogonalClippingPlane(axis: 'x' | 'y' | 'z'): void {
    if (!this.clipper || !this.world) return;
    this.clipper.enabled = true;
    const box =
      this.getModelBounds() ||
      new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
    const center = new THREE.Vector3();
    box.getCenter(center);

    const normal =
      axis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : axis === 'y'
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1);

    this.clipper.createFromNormalAndCoplanarPoint(this.world, normal, center);
    useBimStore.getState().setSectionPlaneCount(useBimStore.getState().sectionPlaneCount + 1);
  }

  public deleteClippingPlanes(): void {
    if (!this.clipper) return;
    this.clipper.deleteAll();
    this.clipper.enabled = false;
    useBimStore.getState().setSectionPlaneCount(0);
  }

  // --- PHASE 2: MEASUREMENTS (DISTANCE, AREA, ANGLE) ---

  public startMeasurement(type: MeasurementType = 'distance'): void {
    if (this.lengthMeasure) this.lengthMeasure.enabled = false;
    if (this.areaMeasure) this.areaMeasure.enabled = false;
    if (this.angleMeasure) this.angleMeasure.enabled = false;

    if (type === 'distance' && this.lengthMeasure) {
      this.lengthMeasure.units = 'm';
      this.lengthMeasure.enabled = true;
      this.lengthMeasure.create();
    } else if (type === 'area' && this.areaMeasure) {
      this.areaMeasure.enabled = true;
      this.areaMeasure.create();
    } else if (type === 'angle' && this.angleMeasure) {
      this.angleMeasure.enabled = true;
      this.angleMeasure.create();
    }
  }

  public deleteMeasurements(): void {
    if (this.lengthMeasure) {
      this.lengthMeasure.delete();
      this.lengthMeasure.enabled = false;
    }
    if (this.areaMeasure) {
      this.areaMeasure.delete();
      this.areaMeasure.enabled = false;
    }
    if (this.angleMeasure) {
      this.angleMeasure.delete();
      this.angleMeasure.enabled = false;
    }
  }

  public clearCurrentDistanceMeasurement(): void {
    if (!this.lengthMeasure) return;
    this.lengthMeasure.cancelCreation();
  }

  public cancelMeasurement(): void {
    if (!this.lengthMeasure) return;
    this.lengthMeasure.cancelCreation();
    this.lengthMeasure.enabled = false;
  }

  // --- PHASE 2: LOCAL BIM VIEWPOINTS ---

  public captureCurrentViewpoint(title: string, description?: string): BimViewpoint {
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();

    if (this.world?.camera?.controls) {
      this.world.camera.controls.getPosition(pos);
      this.world.camera.controls.getTarget(target);
    }

    const state = useBimStore.getState();
    const selected = state.selectedElement ? [state.selectedElement.expressID] : [];

    const vp: BimViewpoint = {
      id: `vp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim() || `Viewpoint ${state.viewpoints.length + 1}`,
      description: description?.trim(),
      cameraPosition: [
        Math.round(pos.x * 10) / 10,
        Math.round(pos.y * 10) / 10,
        Math.round(pos.z * 10) / 10,
      ],
      cameraTarget: [
        Math.round(target.x * 10) / 10,
        Math.round(target.y * 10) / 10,
        Math.round(target.z * 10) / 10,
      ],
      cameraMode: state.cameraMode,
      selectedElements: selected,
      isolatedStorey: state.activeFloorPlanStorey || undefined,
      createdAt: new Date().toLocaleTimeString(),
    };

    return vp;
  }

  public async restoreViewpoint(vp: BimViewpoint): Promise<void> {
    if (!this.world?.camera?.controls) return;

    this.setCameraMode(vp.cameraMode);
    useBimStore.getState().setCameraMode(vp.cameraMode);

    this.world.camera.controls.setLookAt(
      vp.cameraPosition[0],
      vp.cameraPosition[1],
      vp.cameraPosition[2],
      vp.cameraTarget[0],
      vp.cameraTarget[1],
      vp.cameraTarget[2],
      true
    );

    if (vp.isolatedStorey) {
      const storeysData = useBimStore.getState().storeysData;
      const storey = storeysData.find((s) => s.name === vp.isolatedStorey);
      if (storey) {
        await this.isolateElements(storey.elementIds);
      }
    } else {
      await this.showAll();
    }

    if (vp.selectedElements.length > 0) {
      await this.selectElements(vp.selectedElements, false);
    } else {
      await this.clearSelection();
    }
  }

  // --- MEMORY SAFETY & MODEL UNLOAD ---

  public async unloadModel(): Promise<void> {
    const model = this.currentModel;
    const webIfcApi = this.webIfcApi;
    const webIfcModelID = this.webIfcModelID;
    this.currentModel = null;
    this.currentModelId = null;
    this.webIfcApi = null;
    this.webIfcModelID = null;
    this.invalidateModelBounds();
    this.resetSceneInteractions();
    laLimaSiteContextService.clear();
    useBimStore.getState().setActiveSiteContextId(null);
    useBimStore.getState().setActiveSiteContextLabel(null);

    if (this.highlighter) {
      await this.highlighter.clear('select');
    }

    if (this.clipper) {
      this.clipper.deleteAll();
    }

    this.deleteMeasurements();
    await bimEditService.resetAllEdits();
    bimGenerationService.clearPreview();

    if (this.hider) {
      try {
        await this.hider.set(true);
      } catch (err) {
        console.warn('Error resetting hider:', err);
      }
    }

    if (model) {
      try {
        if (this.world?.scene?.three && model.object) {
          this.world.scene.three.remove(model.object);
        }
        await model.dispose();
      } catch (err) {
        console.warn('Error disposing fragments model:', err);
      }
    }

    if (this.ifcLoader) {
      try {
        await this.ifcLoader.cleanUp();
      } catch (err) {
        console.warn('Error cleaning up ifcLoader:', err);
      }
    }

    if (webIfcApi && webIfcModelID !== null) {
      try {
        webIfcApi.CloseModel(webIfcModelID);
      } catch (err) {
        console.warn('Error closing web-ifc model:', err);
      }
    }

    this.emitIfcSelection(null);
  }

  public dispose(): Promise<void> {
    if (this.disposePromise) return this.disposePromise;
    if (this.isDisposed) return Promise.resolve();

    const activeDispose = (async () => {
      if (this.initPromise) {
        try {
          await this.initPromise;
        } catch {
          // Initialization already cleaned up its partial resources.
        }
      }

      this.stopPerformanceSampler();
      this.disconnectResizeObserver();
      this.setupWebGLContextListeners(null);
      this.setupSceneInteractionListeners(null);
      this.cancelPendingInteractionFrame();
      this.setupCameraActivityTracking(null);
      await this.unloadModel();
      this.lighting.dispose();
      try {
        this.components.dispose();
      } catch (err) {
        console.warn('Error disposing components:', err);
      }
      this.revokeWorkerBlobUrl();
      this.modelInteraction.dispose();
      this.modelInteraction = new ModelInteraction();
      this.setupModelInteractionCallbacks();
      this.onElementSelected = undefined;
      this.onSceneElementSelected = undefined;
      this.onSceneElementsSelected = undefined;
      this.onSceneElementHovered = undefined;
      this.onPerformanceUpdate = undefined;
      this.isInitialized = false;
      this.isDisposed = true;
      this.initPromise = null;
      this.container = null;
    })();

    this.disposePromise = activeDispose.finally(() => {
      this.disposePromise = null;
    });
    return this.disposePromise;
  }
}

// Global engine singleton
export const bimEngine = new BimEngine();

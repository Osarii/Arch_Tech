import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { BimGenerationService, bimGenerationService } from '@/bim/generation/generationService';
import { BimEngine, bimEngine } from '@/bim/engine/BimEngine';
import { ToolRegistry } from '@/bim/ai/ToolRegistry';
import { RuleBasedProvider } from '@/bim/ai/providers/RuleBasedProvider';
import { AIAgent } from '@/bim/ai/AIAgent';
import { useBimStore } from '@/stores/bimStore';

describe('Phase 6A: BimGenerationService (Domain & Geometry)', () => {
  let service: BimGenerationService;
  let scene: THREE.Scene;

  beforeEach(() => {
    service = new BimGenerationService();
    scene = new THREE.Scene();
    service.initSceneLayer(scene);
    useBimStore.getState().resetModel();
  });

  it('validates generation parameters strictly and rejects invalid inputs', () => {
    // Missing length
    const res1 = service.validateParams({ width: 10, storeys: 2, storeyHeight: 3 });
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain('length');

    // Missing width
    const res2 = service.validateParams({ length: 10, storeys: 2, storeyHeight: 3 });
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain('width');

    // Missing height / storeyHeight
    const res3 = service.validateParams({ length: 10, width: 8, storeys: 2 });
    expect(res3.valid).toBe(false);
    expect(res3.error).toContain('height');

    // Wall thickness too large
    const res4 = service.validateParams({
      length: 2,
      width: 2,
      storeys: 1,
      storeyHeight: 3,
      wallThickness: 1.5,
    });
    expect(res4.valid).toBe(false);
    expect(res4.error).toContain('Wall thickness');

    // Valid parameters
    const res5 = service.validateParams({
      length: 12,
      width: 8,
      storeys: 2,
      storeyHeight: 3.5,
    });
    expect(res5.valid).toBe(true);
    expect(res5.normalized).toBeDefined();
    expect(res5.normalized?.height).toBe(7.0);
    expect(res5.normalized?.storeys).toBe(2);
  });

  it('generates a deterministic parametric plan with correct wall & slab coordinates', () => {
    const plan = service.generatePlan({
      length: 10,
      width: 6,
      storeys: 2,
      storeyHeight: 3,
      wallThickness: 0.2,
      slabThickness: 0.25,
      originX: 0,
      originY: 0,
      originZ: 0,
    });

    expect(plan.params.length).toBe(10);
    expect(plan.params.width).toBe(6);
    expect(plan.params.storeys).toBe(2);
    expect(plan.params.totalHeight).toBe(6);
    expect(plan.params.footprintArea).toBe(60);
    expect(plan.params.grossVolume).toBe(360);

    // 2 storeys * 4 walls = 8 walls
    expect(plan.walls.length).toBe(8);

    // Level 0 walls
    const l0Walls = plan.walls.filter((w) => w.storeyIndex === 0);
    expect(l0Walls.length).toBe(4);
    expect(l0Walls[0].elevation).toBe(0);
    expect(l0Walls[0].height).toBe(3);

    // Level 1 walls
    const l1Walls = plan.walls.filter((w) => w.storeyIndex === 1);
    expect(l1Walls.length).toBe(4);
    expect(l1Walls[0].elevation).toBe(3);
    expect(l1Walls[0].height).toBe(3);

    // 1 base slab + 1 intermediate floor + 1 roof slab = 3 slabs
    expect(plan.slabs.length).toBe(3);
    expect(plan.slabs[0].type).toBe('base');
    expect(plan.slabs[0].elevation).toBe(0);
    expect(plan.slabs[0].storeyIndex).toBe(0);
    expect(plan.slabs[1].type).toBe('floor');
    expect(plan.slabs[1].elevation).toBe(3);
    expect(plan.slabs[1].storeyIndex).toBe(1);
    expect(plan.slabs[2].type).toBe('roof');
    expect(plan.slabs[2].elevation).toBe(6);
    expect(plan.slabs[2].storeyIndex).toBe(1); // Belongs to last existing storey (Level 1)
    expect(plan.slabs[2].storeyName).toBe('Level 1');
  });

  it('builds disposable Three.js preview objects without mutating ChangeSet or model', () => {
    const plan = service.generatePlan({
      length: 10,
      width: 8,
      storeys: 1,
      storeyHeight: 3,
    });

    const previewGroup = service.previewPlan(plan, scene);

    expect(previewGroup.name).toBe('BimGenerationPreview');
    expect(service.hasActivePreview()).toBe(true);
    expect(service.getActivePlan()).toBe(plan);

    // 4 walls + 2 slabs = 6 meshes
    expect(previewGroup.children.length).toBe(6);

    // ChangeSet is completely untouched
    expect(useBimStore.getState().changeSet.length).toBe(0);

    // Clearing preview disposes all meshes cleanly
    service.clearPreview();
    expect(service.hasActivePreview()).toBe(false);
    expect(service.getActivePlan()).toBeNull();
    expect(previewGroup.children.length).toBe(0);
  });

  it('handles re-previewing without memory leaks or duplicate meshes', () => {
    const plan1 = service.generatePlan({
      length: 10,
      width: 8,
      storeys: 1,
      storeyHeight: 3,
    });
    service.previewPlan(plan1, scene);
    expect(service.previewGroup.children.length).toBe(6);

    const plan2 = service.generatePlan({
      length: 14,
      width: 10,
      storeys: 3,
      storeyHeight: 3,
    });
    // 3 storeys * 4 walls + 4 slabs = 16 meshes
    service.previewPlan(plan2, scene);
    expect(service.previewGroup.children.length).toBe(16);

    service.clearPreview();
    expect(service.previewGroup.children.length).toBe(0);
  });

  it('computes accurate non-empty world bounds for preview and clears cleanly', () => {
    expect(service.getPreviewBounds().isEmpty()).toBe(true);

    const plan = service.generatePlan({
      length: 10,
      width: 8,
      storeys: 2,
      storeyHeight: 3,
    });
    service.previewPlan(plan, scene);

    const bounds = service.getPreviewBounds();
    expect(bounds.isEmpty()).toBe(false);
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(10.2, 1);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(8.2, 1);
    expect(bounds.max.y - bounds.min.y).toBeGreaterThanOrEqual(6);

    service.clearPreview();
    expect(service.getPreviewBounds().isEmpty()).toBe(true);
  });
});

describe('Phase 6A: AI Assistant Integration & Strict Intent Validation', () => {
  let provider: RuleBasedProvider;
  let agent: AIAgent;

  beforeEach(() => {
    ToolRegistry.initDefaultTools();
    bimGenerationService.clearPreview();
    provider = new RuleBasedProvider();
    agent = AIAgent.getInstance();
    agent.setProvider(provider);
    agent.clearHistory();
    useBimStore.getState().resetModel();
  });

  it('parses valid building generation prompt and executes preview_generation tool', async () => {
    const res = await provider.generateResponse(
      'Preview a 10x8m 2-storey building with 3m height per storey',
      [],
      ToolRegistry.getAllTools(),
      {}
    );

    expect(res.toolCalls).toBeDefined();
    expect(res.toolCalls?.length).toBe(1);
    expect(res.toolCalls?.[0].toolName).toBe('preview_generation');
    expect(res.toolCalls?.[0].args.length).toBe(10);
    expect(res.toolCalls?.[0].args.width).toBe(8);
    expect(res.toolCalls?.[0].args.storeys).toBe(2);
    expect(res.toolCalls?.[0].args.storeyHeight).toBe(3);

    // Execute via ToolRegistry
    const toolExec = await ToolRegistry.executeTool(
      res.toolCalls![0].toolName,
      res.toolCalls![0].args
    );
    expect(toolExec.success).toBe(true);
    expect(toolExec.data.plan).toBeDefined();
    expect(bimGenerationService.hasActivePreview()).toBe(true);
  });

  it('asks for dimensions when user asks for building without specifications', async () => {
    const res1 = await provider.generateResponse(
      'generate building',
      [],
      ToolRegistry.getAllTools(),
      {}
    );
    expect(res1.toolCalls).toBeUndefined();
    expect(res1.message).toContain('please specify dimensions');

    const res2 = await provider.generateResponse(
      'preview 10x8 building',
      [],
      ToolRegistry.getAllTools(),
      {}
    );
    expect(res2.toolCalls).toBeUndefined();
    expect(res2.message).toContain('storeys');
  });

  it('discards generation preview overlay upon user request', async () => {
    // Generate first
    await ToolRegistry.executeTool('preview_generation', {
      length: 8,
      width: 6,
      storeys: 1,
      storeyHeight: 3,
    });
    expect(bimGenerationService.hasActivePreview()).toBe(true);

    const res = await provider.generateResponse(
      'discard preview',
      [],
      ToolRegistry.getAllTools(),
      {}
    );
    expect(res.toolCalls?.[0].toolName).toBe('discard_generation_preview');

    const exec = await ToolRegistry.executeTool(
      res.toolCalls![0].toolName,
      res.toolCalls![0].args
    );
    expect(exec.success).toBe(true);
    expect(bimGenerationService.hasActivePreview()).toBe(false);
  });

  it('strictly validates move and rotate without implicit defaults', async () => {
    // Move without axis/distance asks for clarification
    const moveRes = await provider.generateResponse(
      'move #44',
      [],
      ToolRegistry.getAllTools(),
      { selectedElementId: 44 }
    );
    expect(moveRes.toolCalls).toBeUndefined();
    expect(moveRes.message).toContain('Please specify the displacement distance and axis');

    // Rotate without angle asks for clarification
    const rotateRes = await provider.generateResponse(
      'rotate #44',
      [],
      ToolRegistry.getAllTools(),
      { selectedElementId: 44 }
    );
    expect(rotateRes.toolCalls).toBeUndefined();
    expect(rotateRes.message).toContain('Please specify the rotation angle in degrees');
  });
});

describe('Phase 6A: Viewport Visibility & Camera Fit Integration', () => {
  let mockFitToBox: any;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    mockFitToBox = vi.fn();
    mockScene = new THREE.Scene();
    bimEngine.world = {
      camera: {
        controls: {
          fitToBox: mockFitToBox,
        },
      },
      scene: {
        three: mockScene,
      },
    } as any;
    bimEngine.currentModel = null;
    bimGenerationService.clearPreview();
    bimGenerationService.initSceneLayer(mockScene);
  });

  it('keeps currentModel.box as primary when available and non-empty', () => {
    const primaryBox = new THREE.Box3(new THREE.Vector3(1, 2, 3), new THREE.Vector3(10, 20, 30));
    bimEngine.currentModel = {
      box: primaryBox,
      object: new THREE.Group(),
    } as any;

    bimEngine.fitModel();

    expect(mockFitToBox).toHaveBeenCalledTimes(1);
    expect(mockFitToBox).toHaveBeenCalledWith(primaryBox, true);
  });

  it('computes bounds from currentModel.object when currentModel.box is missing or empty', () => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 8),
      new THREE.MeshBasicMaterial()
    );
    mesh.position.set(10, 5, 20);
    group.add(mesh);

    bimEngine.currentModel = {
      box: undefined,
      object: group,
    } as any;

    bimEngine.fitModel();

    expect(mockFitToBox).toHaveBeenCalledTimes(1);
    const fittedBox = mockFitToBox.mock.calls[0][0] as THREE.Box3;
    expect(fittedBox.isEmpty()).toBe(false);
    expect(fittedBox.min.x).toBeCloseTo(8, 1);
    expect(fittedBox.max.x).toBeCloseTo(12, 1);
    expect(fittedBox.min.y).toBeCloseTo(2, 1);
    expect(fittedBox.max.y).toBeCloseTo(8, 1);
    expect(fittedBox.min.z).toBeCloseTo(16, 1);
    expect(fittedBox.max.z).toBeCloseTo(24, 1);
  });

  it('caches computed model bounds until geometry is explicitly invalidated', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial()));
    bimEngine.currentModel = { object: group } as any;
    bimEngine.invalidateModelBounds();
    const setFromObject = vi.spyOn(THREE.Box3.prototype, 'setFromObject');

    bimEngine.getModelBounds();
    bimEngine.getModelBounds();
    expect(setFromObject).toHaveBeenCalledTimes(1);

    bimEngine.invalidateModelBounds();
    bimEngine.getModelBounds();
    expect(setFromObject).toHaveBeenCalledTimes(2);
  });

  it('falls back to active preview bounds when no IFC model is loaded', () => {
    const plan = bimGenerationService.generatePlan({
      length: 12,
      width: 6,
      storeys: 1,
      storeyHeight: 3,
    });
    bimGenerationService.previewPlan(plan, mockScene);

    bimEngine.fitModel();

    expect(mockFitToBox).toHaveBeenCalledTimes(1);
    const fittedBox = mockFitToBox.mock.calls[0][0] as THREE.Box3;
    expect(fittedBox.isEmpty()).toBe(false);
    expect(fittedBox.max.x - fittedBox.min.x).toBeCloseTo(12.2, 1);
    expect(fittedBox.max.z - fittedBox.min.z).toBeCloseTo(6.2, 1);
  });

  it('preview_generation tool automatically fits camera to non-empty preview world bounds', async () => {
    const fitSpy = vi.spyOn(bimEngine, 'fitModel');

    const result = await ToolRegistry.executeTool('preview_generation', {
      length: 10,
      width: 8,
      storeys: 2,
      storeyHeight: 3,
    });

    expect(result.success).toBe(true);
    expect(result.data.previewBounds).toBeDefined();
    expect(result.data.previewBounds.max[0] - result.data.previewBounds.min[0]).toBeCloseTo(10.2, 1);
    expect(result.data.previewBounds.max[2] - result.data.previewBounds.min[2]).toBeCloseTo(8.2, 1);

    expect(fitSpy).toHaveBeenCalledTimes(1);
    const passedBox = fitSpy.mock.calls[0][0] as THREE.Box3;
    expect(passedBox).toBeDefined();
    expect(passedBox.isEmpty()).toBe(false);
    expect(mockFitToBox).toHaveBeenCalledTimes(1);
  });

  it('discard_generation_preview safely clears preview and refits camera to IFC model when present', async () => {
    // Generate preview
    await ToolRegistry.executeTool('preview_generation', {
      length: 10,
      width: 8,
      storeys: 1,
      storeyHeight: 3,
    });
    expect(bimGenerationService.hasActivePreview()).toBe(true);

    // Mock an IFC model
    const ifcBox = new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 10, 5));
    bimEngine.currentModel = {
      box: ifcBox,
      object: new THREE.Group(),
    } as any;

    const fitSpy = vi.spyOn(bimEngine, 'fitModel');

    const result = await ToolRegistry.executeTool('discard_generation_preview', {});
    expect(result.success).toBe(true);
    expect(bimGenerationService.hasActivePreview()).toBe(false);

    expect(fitSpy).toHaveBeenCalled();
    expect(mockFitToBox).toHaveBeenCalledWith(ifcBox, true);
  });
});

describe('Phase 6A Lifecycle Hardening: Viewport & Engine Lifecycle', () => {
  let mockContainer1: HTMLElement;
  let mockContainer2: HTMLElement;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockContainer1 = document.createElement('div');
    mockContainer2 = document.createElement('div');
    mockCanvas = document.createElement('canvas');

    (bimEngine as any).isInitialized = false;
    (bimEngine as any).initPromise = null;
    (bimEngine as any).container = null;
    (bimEngine as any).resizeFrameId = null;
    bimEngine.world = {
      renderer: {
        three: {
          domElement: mockCanvas,
          setSize: vi.fn(),
          setPixelRatio: vi.fn(),
        },
        resize: vi.fn(),
        setupEvents: vi.fn(),
      },
      camera: {
        updateAspect: vi.fn(),
        controls: {
          fitToBox: vi.fn(),
        },
      },
      scene: {
        three: new THREE.Scene(),
      },
    } as any;
  });

  it('rebindContainer reparents existing canvas and updates resize observer without rebuilding engine', () => {
    mockContainer1.appendChild(mockCanvas);
    expect(mockCanvas.parentElement).toBe(mockContainer1);

    // Stale child in container 2 that should be cleared
    const staleChild = document.createElement('span');
    mockContainer2.appendChild(staleChild);

    bimEngine.rebindContainer(mockContainer2);
    bimEngine.resize();

    expect(mockCanvas.parentElement).toBe(mockContainer2);
    expect(mockContainer2.contains(staleChild)).toBe(false);
    expect((bimEngine as any).container).toBe(mockContainer2);
    expect((bimEngine.world?.renderer as any).container).toBe(mockContainer2);
    expect((bimEngine.world?.renderer as any).resize).toHaveBeenCalled();
    expect((bimEngine.world?.camera as any).updateAspect).toHaveBeenCalled();
  });

  it('init with new container calls rebindContainer when already initialized', async () => {
    (bimEngine as any).isInitialized = true;
    (bimEngine as any).container = mockContainer1;

    const rebindSpy = vi.spyOn(bimEngine, 'rebindContainer');

    await bimEngine.init(mockContainer2);

    expect(rebindSpy).toHaveBeenCalledWith(mockContainer2);
  });

  it('init with identical container is an immediate no-op when already initialized', async () => {
    (bimEngine as any).isInitialized = true;
    (bimEngine as any).container = mockContainer1;

    const rebindSpy = vi.spyOn(bimEngine, 'rebindContainer');

    await bimEngine.init(mockContainer1);

    expect(rebindSpy).not.toHaveBeenCalled();
  });

  it('concurrent init calls share the active promise and rebind if container changes', async () => {
    (bimEngine as any).isInitialized = false;

    let resolveActiveInit: () => void = () => {};
    const activePromise = new Promise<void>((resolve) => {
      resolveActiveInit = resolve;
    });

    (bimEngine as any).initPromise = activePromise;
    const rebindSpy = vi.spyOn(bimEngine, 'rebindContainer');

    const call1 = bimEngine.init(mockContainer1);
    const call2 = bimEngine.init(mockContainer2);

    // Resolve in-flight init, setting container to mockContainer1
    (bimEngine as any).container = mockContainer1;
    resolveActiveInit();

    await Promise.all([call1, call2]);

    // call1 had mockContainer1 (matching container), call2 had mockContainer2 (triggered rebind)
    expect(rebindSpy).toHaveBeenCalledWith(mockContainer2);
  });

  it('waitForInit resolves immediately when initialized or awaits active promise', async () => {
    (bimEngine as any).isInitialized = true;
    await expect(bimEngine.waitForInit()).resolves.toBeUndefined();

    (bimEngine as any).isInitialized = false;
    let resolved = false;
    (bimEngine as any).initPromise = new Promise<void>((res) => {
      setTimeout(() => {
        resolved = true;
        res();
      }, 10);
    });

    await bimEngine.waitForInit();
    expect(resolved).toBe(true);
  });

  it('coalesces repeated resize notifications into one update per frame', () => {
    let frameCallback: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 7;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    const resize = vi.spyOn(bimEngine, 'resize');

    (bimEngine as any).scheduleResize();
    (bimEngine as any).scheduleResize();

    expect(requestFrame).toHaveBeenCalledTimes(1);
    frameCallback?.(0);
    expect(resize).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('samples renderer statistics once per second and stops cleanly', () => {
    vi.useFakeTimers();
    const engine = new BimEngine();
    const info = {
      render: { frame: 0, calls: 2, triangles: 12 },
      memory: { geometries: 3, textures: 4 },
    };
    engine.world = { renderer: { three: { info } } } as any;
    engine.onPerformanceUpdate = vi.fn();

    (engine as any).startPerformanceSampler();
    info.render.frame = 30;
    vi.advanceTimersByTime(1000);
    expect(engine.onPerformanceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ fps: 30, drawCalls: 2, triangles: 12, geometries: 3, textures: 4 })
    );

    (engine as any).stopPerformanceSampler();
    vi.advanceTimersByTime(1000);
    expect(engine.onPerformanceUpdate).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not resize while applying a render profile before camera initialization', () => {
    const engine = new BimEngine();
    const resize = vi.spyOn(engine, 'resize');
    engine.world = {
      renderer: {
        three: {
          setPixelRatio: vi.fn(),
          shadowMap: {},
        },
      },
      scene: { three: new THREE.Scene() },
    } as any;

    engine.setRenderQuality('performance');

    expect(resize).not.toHaveBeenCalled();
  });

  it('dispose waits for model cleanup and is idempotent', async () => {
    const engine = new BimEngine();
    const unload = vi.spyOn(engine, 'unloadModel').mockResolvedValue(undefined);
    const disposeComponents = vi.spyOn(engine.components, 'dispose').mockImplementation(() => {});
    const disconnect = vi.fn();
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL');
    (engine as any).isInitialized = true;
    (engine as any).container = mockContainer1;
    (engine as any).resizeObserver = { disconnect };
    (engine as any).resizeFrameId = 42;
    (engine as any).performanceTimerId = setInterval(() => {}, 1000);
    (engine as any).workerBlobUrl = 'blob:test-worker';

    await Promise.all([engine.dispose(), engine.dispose()]);
    await engine.dispose();

    expect(unload).toHaveBeenCalledTimes(1);
    expect(disposeComponents).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-worker');
    expect((engine as any).performanceTimerId).toBeNull();
    expect((engine as any).resizeFrameId).toBeNull();
    expect((engine as any).container).toBeNull();
    expect((engine as any).isInitialized).toBe(false);
  });
});

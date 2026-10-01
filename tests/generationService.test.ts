import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { BimGenerationService, bimGenerationService } from '@/bim/generation/generationService';
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
    expect(plan.slabs[1].type).toBe('floor');
    expect(plan.slabs[1].elevation).toBe(3);
    expect(plan.slabs[2].type).toBe('roof');
    expect(plan.slabs[2].elevation).toBe(6);
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

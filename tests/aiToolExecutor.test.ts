import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from '@/bim/ai/ToolRegistry';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';
import { bimEngine } from '@/bim/engine/BimEngine';
import { bimGenerationService } from '@/bim/generation/generationService';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { IfcAuthoringService } from '@/bim/generation/ifcAuthoringService';
import { BimTreeNode } from '@/types/bim';

describe('ToolRegistry & AI Tool Executor', () => {
  const sampleTree: BimTreeNode[] = [
    {
      id: 'proj',
      name: 'Sample Project',
      type: 'IFCPROJECT',
      visible: true,
      children: [
        {
          id: 'site',
          name: 'Building Site',
          type: 'IFCSITE',
          visible: true,
          children: [
            {
              id: 'bldg',
              name: 'Main Building',
              type: 'IFCBUILDING',
              visible: true,
              children: [
                {
                  id: 'storey-1',
                  name: 'Level 1',
                  type: 'IFCBUILDINGSTOREY',
                  visible: true,
                  children: [
                    {
                      id: 'elem-101',
                      name: 'Exterior Wall South',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 101,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-102',
                      name: 'Exterior Wall North',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 102,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-103',
                      name: 'Floor Slab 01',
                      type: 'IFCSLAB',
                      category: 'Slabs',
                      expressID: 103,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-104',
                      name: 'Entrance Door',
                      type: 'IFCDOOR',
                      category: 'Doors',
                      expressID: 104,
                      visible: true,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    ToolRegistry.initDefaultTools();
    useBimStore.getState().resetModel();
    useBimStore.getState().setSpatialTree(sampleTree);
    await bimEditService.resetAllEdits();
  });

  describe('Tool Definitions and Categorization', () => {
    it('registers all required READ tools', () => {
      const readTools = [
        'select_element',
        'select_category',
        'hide_element',
        'hide_category',
        'isolate_category',
        'show_all',
        'fit_view',
        'get_element_properties',
        'calculate_quantities',
        'query_elements',
        'export_changes',
      ];
      for (const t of readTools) {
        const tool = ToolRegistry.getTool(t);
        expect(tool, `Tool ${t} must be registered`).toBeDefined();
        expect(tool?.category).toBe('READ');
      }
    });

    it('registers all required WRITE tools', () => {
      const writeTools = [
        'move_element',
        'rotate_element',
        'set_color_override',
        'delete_element',
        'reset_all_edits',
        'undo',
        'redo',
      ];
      for (const t of writeTools) {
        const tool = ToolRegistry.getTool(t);
        expect(tool, `Tool ${t} must be registered`).toBeDefined();
        expect(tool?.category).toBe('WRITE');
      }
    });

    it('isWriteAction properly identifies write tools and format-dependent confirmation', () => {
      expect(ToolRegistry.isWriteAction('undo')).toBe(true);
      expect(ToolRegistry.isWriteAction('redo')).toBe(true);
      expect(ToolRegistry.isWriteAction('move_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('rotate_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('set_color_override')).toBe(true);
      expect(ToolRegistry.isWriteAction('delete_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('reset_all_edits')).toBe(true);
      expect(ToolRegistry.isWriteAction('export_changes', { format: 'ifc' })).toBe(true);
      expect(ToolRegistry.isWriteAction('export_changes', { format: 'json' })).toBe(false);
      expect(ToolRegistry.isWriteAction('select_element')).toBe(false);
      expect(ToolRegistry.isWriteAction('query_elements')).toBe(false);
    });
  });

  describe('READ Tool Executions & Spatial Querying', () => {
    it('query_elements filters by category, type, and storey', async () => {
      const resWalls = await ToolRegistry.executeTool('query_elements', { category: 'walls' });
      expect(resWalls.success).toBe(true);
      expect(resWalls.data.totalFound).toBe(2);
      expect(resWalls.data.elements.map((e: any) => e.id)).toEqual([101, 102]);

      const resDoor = await ToolRegistry.executeTool('query_elements', { type: 'ifcdoor' });
      expect(resDoor.success).toBe(true);
      expect(resDoor.data.totalFound).toBe(1);
      expect(resDoor.data.elements[0].id).toBe(104);

      const resStorey = await ToolRegistry.executeTool('query_elements', { storey: 'level 1' });
      expect(resStorey.success).toBe(true);
      expect(resStorey.data.totalFound).toBe(4);
    });

    it('isolate_category collects all category IDs and triggers engine isolation', async () => {
      const isolateSpy = vi.spyOn(bimEngine, 'isolateElements').mockResolvedValue(undefined);

      const res = await ToolRegistry.executeTool('isolate_category', { category: 'walls' });
      expect(res.success).toBe(true);
      expect(res.data.isolatedCount).toBe(2);
      expect(res.data.ids).toEqual([101, 102]);
      expect(isolateSpy).toHaveBeenCalledWith([101, 102]);

      isolateSpy.mockRestore();
    });

    it('select_category collects category IDs and triggers engine selection', async () => {
      const selectSpy = vi.spyOn(bimEngine, 'selectElements').mockResolvedValue(undefined);
      const focusSpy = vi.spyOn(bimEngine, 'focusElements').mockResolvedValue(undefined);

      const res = await ToolRegistry.executeTool('select_category', { category: 'slabs' });
      expect(res.success).toBe(true);
      expect(res.data.selectedCount).toBe(1);
      expect(res.data.ids).toEqual([103]);
      expect(selectSpy).toHaveBeenCalledWith([103], true);
      expect(focusSpy).toHaveBeenCalledWith([103]);

      selectSpy.mockRestore();
      focusSpy.mockRestore();
    });

    it('hide_element and hide_category call engine hider', async () => {
      const hideSpy = vi.spyOn(bimEngine, 'hideElements').mockResolvedValue(undefined);

      const resElem = await ToolRegistry.executeTool('hide_element', { elementId: 104 });
      expect(resElem.success).toBe(true);
      expect(hideSpy).toHaveBeenCalledWith([104]);

      const resCat = await ToolRegistry.executeTool('hide_category', { category: 'doors' });
      expect(resCat.success).toBe(true);
      expect(hideSpy).toHaveBeenCalledWith([104]);

      hideSpy.mockRestore();
    });

    it('show_all and fit_view call engine controls', async () => {
      const showSpy = vi.spyOn(bimEngine, 'showAll').mockResolvedValue(undefined);
      const fitSpy = vi.spyOn(bimEngine, 'fitModel').mockReturnValue(undefined);

      const resShow = await ToolRegistry.executeTool('show_all', {});
      expect(resShow.success).toBe(true);
      expect(showSpy).toHaveBeenCalled();

      const resFit = await ToolRegistry.executeTool('fit_view', {});
      expect(resFit.success).toBe(true);
      expect(fitSpy).toHaveBeenCalled();

      showSpy.mockRestore();
      fitSpy.mockRestore();
    });

    it('export_changes validates non-empty changeSet', async () => {
      // Empty changeset returns error
      const emptyRes = await ToolRegistry.executeTool('export_changes', { format: 'json' });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain('empty');

      // Add a modification
      await bimEditService.transformElement(101, 'Wall', {
        x: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      });

      const res = await ToolRegistry.executeTool('export_changes', { format: 'json' });
      expect(res.success).toBe(true);
      expect(res.data.count).toBe(1);
      expect(res.data.format).toBe('json');
    });
  });

  describe('WRITE Tool Safety Enforcements', () => {
    it('calling WRITE tools without confirmation returns proposal and DOES NOT execute', async () => {
      const unconfirmed = await ToolRegistry.executeTool(
        'move_element',
        { elementId: 101, x: 2 },
        false
      );

      expect(unconfirmed.success).toBe(true);
      expect(unconfirmed.proposal).toBeDefined();
      expect(unconfirmed.proposal?.status).toBe('pending');
      expect(useBimStore.getState().changeSet).toHaveLength(0);
    });

    it('calling WRITE tools with confirmed=true executes and records in Change Set', async () => {
      const confirmed = await ToolRegistry.executeTool(
        'move_element',
        { elementId: 101, x: 2, y: 0, z: 0 },
        true
      );

      expect(confirmed.success).toBe(true);
      expect(useBimStore.getState().changeSet).toHaveLength(1);
      expect(useBimStore.getState().changeSet[0].elementId).toBe(101);
      expect(useBimStore.getState().changeSet[0].type).toBe('move');
    });

    it('undo and redo require confirmation and do not mutate state when unconfirmed', async () => {
      const undoSpy = vi.spyOn(bimEditService, 'undo').mockResolvedValue(undefined);
      const redoSpy = vi.spyOn(bimEditService, 'redo').mockResolvedValue(undefined);
      useBimStore.getState().setCanUndo(true);
      useBimStore.getState().setCanRedo(true);

      // Unconfirmed undo returns proposal
      const unconfirmedUndo = await ToolRegistry.executeTool('undo', {}, false);
      expect(unconfirmedUndo.success).toBe(true);
      expect(unconfirmedUndo.proposal).toBeDefined();
      expect(unconfirmedUndo.proposal?.toolName).toBe('undo');
      expect(undoSpy).not.toHaveBeenCalled();

      // Confirmed undo executes
      const confirmedUndo = await ToolRegistry.executeTool('undo', {}, true);
      expect(confirmedUndo.success).toBe(true);
      expect(undoSpy).toHaveBeenCalled();

      // Unconfirmed redo returns proposal
      const unconfirmedRedo = await ToolRegistry.executeTool('redo', {}, false);
      expect(unconfirmedRedo.success).toBe(true);
      expect(unconfirmedRedo.proposal).toBeDefined();
      expect(unconfirmedRedo.proposal?.toolName).toBe('redo');
      expect(redoSpy).not.toHaveBeenCalled();

      undoSpy.mockRestore();
      redoSpy.mockRestore();
    });

    it('export_changes format=ifc requires confirmation while format=json executes directly', async () => {
      // Setup a change so export has data
      await bimEditService.transformElement(101, 'Wall', {
        x: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      });

      // format=ifc unconfirmed produces proposal
      const ifcUnconfirmed = await ToolRegistry.executeTool(
        'export_changes',
        { format: 'ifc' },
        false
      );
      expect(ifcUnconfirmed.success).toBe(true);
      expect(ifcUnconfirmed.proposal).toBeDefined();
      expect(ifcUnconfirmed.proposal?.toolName).toBe('export_changes');
      expect(ifcUnconfirmed.proposal?.args.format).toBe('ifc');

      // format=json unconfirmed executes directly
      const jsonDirect = await ToolRegistry.executeTool(
        'export_changes',
        { format: 'json' },
        false
      );
      expect(jsonDirect.success).toBe(true);
      expect(jsonDirect.proposal).toBeUndefined();
      expect(jsonDirect.data.format).toBe('json');
    });

    it('commit_generation is gated as a WRITE tool requiring explicit confirmation', async () => {
      // Unconfirmed execution returns a PendingWriteProposal
      const unconfirmed = await ToolRegistry.executeTool('commit_generation', {}, false);
      expect(unconfirmed.success).toBe(true);
      expect(unconfirmed.proposal).toBeDefined();
      expect(unconfirmed.proposal?.toolName).toBe('commit_generation');
      expect(unconfirmed.proposal?.status).toBe('pending');
      expect(unconfirmed.proposal?.summary).toContain('Author real IFC4 model');
    });

    it('commit_generation fails safely if confirmed without an active generation plan', async () => {
      bimGenerationService.clearPreview();
      const res = await ToolRegistry.executeTool('commit_generation', {}, true);
      expect(res.success).toBe(false);
      expect(res.error).toContain('No active generation plan');
    });

    it('commit_generation authors IFC4, validates it, and loads it when confirmed with active plan', async () => {
      // 1. Setup active preview
      const plan = bimGenerationService.generatePlan({
        length: 10,
        width: 8,
        storeys: 1,
        storeyHeight: 3,
      });
      bimGenerationService.previewPlan(plan);
      expect(bimGenerationService.hasActivePreview()).toBe(true);

      const loadSpy = vi.spyOn(IfcLoaderService, 'loadIfc').mockResolvedValue(undefined);

      // 2. Execute confirmed commit
      const res = await ToolRegistry.executeTool('commit_generation', {}, true);
      expect(res.success).toBe(true);
      expect(res.data.fileName).toContain('generated_building_1s.ifc');
      expect(res.data.stats.wallsCount).toBe(4);
      expect(res.data.stats.slabsCount).toBe(2);
      expect(loadSpy).toHaveBeenCalled();
      // Preview cleared after successful commit
      expect(bimGenerationService.hasActivePreview()).toBe(false);

      loadSpy.mockRestore();
    });

    it('commit_generation is atomic: failure during reload preserves old model, spatial tree, and preview', async () => {
      // 1. Establish existing loaded model & tree in engine and store
      const mockOldModel = {
        modelId: 'existing-model-123',
        object: { visible: true },
        dispose: vi.fn(),
      } as any;
      bimEngine.currentModel = mockOldModel;
      bimEngine.currentModelId = 'existing-model-123';
      useBimStore.getState().setSpatialTree(sampleTree);

      // 2. Generate plan and preview
      const plan = bimGenerationService.generatePlan({
        length: 12,
        width: 8,
        storeys: 1,
        storeyHeight: 3,
      });
      bimGenerationService.previewPlan(plan);
      expect(bimGenerationService.hasActivePreview()).toBe(true);

      // 3. Mock IfcLoaderService.loadIfc to simulate a reload failure AFTER authoring and validation
      const loadSpy = vi.spyOn(IfcLoaderService, 'loadIfc').mockRejectedValue(new Error('Simulated fragment load failure'));

      // 4. Execute confirmed commit
      const res = await ToolRegistry.executeTool('commit_generation', {}, true);

      // 5. Assert: commit failed with error message
      expect(res.success).toBe(false);
      expect(res.error).toContain('Simulated fragment load failure');

      // 6. Assert: existing model remains active, tree remains intact, preview survives
      expect(bimEngine.currentModel).toBe(mockOldModel);
      expect(bimEngine.currentModelId).toBe('existing-model-123');
      expect(mockOldModel.dispose).not.toHaveBeenCalled();
      expect(useBimStore.getState().spatialTree).toEqual(sampleTree);
      expect(bimGenerationService.hasActivePreview()).toBe(true);

      loadSpy.mockRestore();
      bimEngine.currentModel = null;
      bimEngine.currentModelId = null;
    });

    it('IfcLoaderService.loadIfc is transactional: preflight failure leaves active model and store untouched', async () => {
      const mockOldModel = {
        modelId: 'existing-model-456',
        object: { visible: true },
        dispose: vi.fn(),
      } as any;
      bimEngine.currentModel = mockOldModel;
      bimEngine.currentModelId = 'existing-model-456';
      useBimStore.getState().setSpatialTree(sampleTree);

      const unloadSpy = vi.spyOn(bimEngine, 'unloadModel');

      // Call loadIfc with invalid data that fails during WebIFC parsing preflight
      const corruptData = new Uint8Array([1, 2, 3, 4, 5]);
      await expect(IfcLoaderService.loadIfc(corruptData, 'corrupt.ifc')).rejects.toThrow();

      // Ensure unloadModel was NEVER called
      expect(unloadSpy).not.toHaveBeenCalled();
      expect(bimEngine.currentModel).toBe(mockOldModel);
      expect(useBimStore.getState().spatialTree).toEqual(sampleTree);

      unloadSpy.mockRestore();
      bimEngine.currentModel = null;
      bimEngine.currentModelId = null;
    });

    it('IfcLoaderService.loadIfc rolls back cleanly if commit fails after staging succeeds', async () => {
      // 1. Establish existing loaded model, webIfc API, scene object, and store state
      const mockOldSceneObj = { id: 'old-scene-mesh', visible: true };
      const mockOldModel = {
        modelId: 'existing-model-789',
        object: mockOldSceneObj,
        dispose: vi.fn(),
      } as any;
      const mockOldApi = {
        CloseModel: vi.fn(),
      } as any;
      const mockOldModelId = 555;

      bimEngine.currentModel = mockOldModel;
      bimEngine.currentModelId = 'existing-model-789';
      bimEngine.webIfcApi = mockOldApi;
      bimEngine.webIfcModelID = mockOldModelId;
      useBimStore.getState().setSpatialTree(sampleTree);

      // Track objects in the three.js scene
      const sceneObjects: any[] = [mockOldSceneObj];
      if (!bimEngine.world) bimEngine.world = {} as any;
      if (!bimEngine.world.scene) bimEngine.world.scene = {} as any;
      bimEngine.world.scene.three = {
        add: vi.fn((obj: any) => sceneObjects.push(obj)),
        remove: vi.fn((obj: any) => {
          const idx = sceneObjects.indexOf(obj);
          if (idx !== -1) sceneObjects.splice(idx, 1);
        }),
      } as any;

      // 2. Set up active preview
      const plan = bimGenerationService.generatePlan({
        length: 10,
        width: 8,
        storeys: 2,
        storeyHeight: 3,
      });
      bimGenerationService.previewPlan(plan);
      expect(bimGenerationService.hasActivePreview()).toBe(true);

      // 3. Mock staged resources:
      // bimEngine.ifcLoader.load returns stagedFragmentsModel
      const stagedDisposeSpy = vi.fn();
      const mockStagedSceneObj = { id: 'staged-scene-mesh' };
      const mockStagedModel = {
        modelId: 'staged-new-model-999',
        object: mockStagedSceneObj,
        dispose: stagedDisposeSpy,
      };

      if (!bimEngine.ifcLoader) bimEngine.ifcLoader = {} as any;
      const loadLoaderSpy = vi.spyOn(bimEngine.ifcLoader, 'load').mockResolvedValue(mockStagedModel as any);
      const waitInitSpy = vi.spyOn(bimEngine, 'waitForInit').mockResolvedValue(undefined);

      // 4. Author real valid IFC4 bytes for staging to parse
      const ifcData = await IfcAuthoringService.generateIfc4(plan);

      // 5. Force an exception DURING commit (e.g. camera fit throws)
      const fitSpy = vi.spyOn(bimEngine, 'fitModel').mockImplementation(() => {
        throw new Error('Simulated WebGPU out of memory error during commit camera fitting');
      });

      // 6. Execute loadIfc and assert it rejects with the commit failure
      await expect(IfcLoaderService.loadIfc(ifcData, 'fail_commit.ifc')).rejects.toThrow(
        'Simulated WebGPU out of memory error during commit camera fitting'
      );

      // 7. Verify ROLLBACK guarantees:
      // - old currentModel restored
      expect(bimEngine.currentModel).toBe(mockOldModel);
      expect(bimEngine.currentModelId).toBe('existing-model-789');
      expect(mockOldModel.dispose).not.toHaveBeenCalled();

      // - old webIfc API/modelID restored
      expect(bimEngine.webIfcApi).toBe(mockOldApi);
      expect(bimEngine.webIfcModelID).toBe(mockOldModelId);
      expect(mockOldApi.CloseModel).not.toHaveBeenCalled();

      // - old spatial tree restored
      expect(useBimStore.getState().spatialTree).toEqual(sampleTree);

      // - old scene object still present
      expect(sceneObjects).toContain(mockOldSceneObj);
      expect(sceneObjects).not.toContain(mockStagedSceneObj);

      // - preview remains active
      expect(bimGenerationService.hasActivePreview()).toBe(true);

      // - staged new resources disposed
      expect(stagedDisposeSpy).toHaveBeenCalled();

      // Clean up spies
      loadLoaderSpy.mockRestore();
      waitInitSpy.mockRestore();
      fitSpy.mockRestore();
      bimEngine.currentModel = null;
      bimEngine.currentModelId = null;
      bimEngine.webIfcApi = null;
      bimEngine.webIfcModelID = null;
    });

    it('excludes spatial hierarchy containers from element queries even if they have an expressID', async () => {
      const treeWithSpatialIDs: BimTreeNode[] = [
        {
          id: 'proj',
          name: 'Project',
          type: 'IFCPROJECT',
          expressID: 1,
          visible: true,
          children: [
            {
              id: 'site',
              name: 'Site',
              type: 'IFCSITE',
              expressID: 2,
              visible: true,
              children: [
                {
                  id: 'storey',
                  name: 'Level 1',
                  type: 'IFCBUILDINGSTOREY',
                  expressID: 3,
                  visible: true,
                  children: [
                    {
                      id: 'wall-1',
                      name: 'Wall 101',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 101,
                      visible: true,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      useBimStore.getState().setSpatialTree(treeWithSpatialIDs);

      const res = await ToolRegistry.executeTool('query_elements', {});
      expect(res.success).toBe(true);
      // Only the wall (101) is returned, spatial containers 1, 2, 3 are excluded
      expect(res.data.totalFound).toBe(1);
      expect(res.data.elements[0].id).toBe(101);
    });
  });
});

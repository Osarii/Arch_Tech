import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import * as THREE from 'three';
import * as WebIFC from 'web-ifc';
import { IfcPersistenceService } from '../src/bim/persistence/ifcPersistenceService';
import { IfcAuthoringService } from '../src/bim/generation/ifcAuthoringService';
import { BimGenerationService } from '../src/bim/generation/generationService';
import { IfcLoaderService } from '../src/bim/loaders/ifcLoaderService';
import { bimEngine } from '../src/bim/engine/BimEngine';
import { bimEditService } from '../src/bim/edit/bimEditService';
import { buildSpatialTree } from '../src/bim/tree/spatialTreeBuilder';
import { useBimStore } from '../src/stores/bimStore';
import { BimChange } from '../src/types/bim';

describe('IfcPersistenceService (Real IFC Persistence & Change Set JSON)', () => {
  let ifcApi: WebIFC.IfcAPI;
  let smallIfcBuffer: Uint8Array;

  beforeAll(async () => {
    ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    const data = fs.readFileSync('./public/small_model.ifc');
    smallIfcBuffer = new Uint8Array(data);
  });

  it('exports and imports Change Set JSON accurately', () => {
    const changes: BimChange[] = [
      {
        id: 'c-1',
        elementId: 44,
        elementName: 'floor',
        type: 'move',
        description: 'Moved element',
        originalValue: { x: 0, y: 0, z: 0 },
        newValue: { x: 2.5, y: 0, z: 0 },
        timestamp: '12:00:00',
      },
      {
        id: 'c-2',
        elementId: 44,
        elementName: 'floor',
        type: 'color',
        description: 'Color override',
        originalValue: null,
        newValue: { color: '#06b6d4' },
        timestamp: '12:01:00',
      },
    ];

    const json = IfcPersistenceService.exportChangeSetAsJson(changes);
    expect(json).toContain('"totalChanges": 2');
    expect(json).toContain('"version": "1.0.0"');

    const imported = IfcPersistenceService.importChangeSetFromJson(json);
    expect(imported.success).toBe(true);
    expect(imported.changes.length).toBe(2);
    expect(imported.changes[0].elementId).toBe(44);
    expect(imported.changes[0].newValue.x).toBe(2.5);

    // Invalid JSON test
    const invalid = IfcPersistenceService.importChangeSetFromJson('{ malformed');
    expect(invalid.success).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it('detects model length unit scale factor', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));
    const scale = IfcPersistenceService.getModelLengthUnitScale(ifcApi, modelID);
    expect(scale).toBe(1000); // Millimeters in small_model.ifc
    ifcApi.CloseModel(modelID);
  });

  it('persists Move translation to real IFC CartesianPoint and survives reload', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

    const change: BimChange = {
      id: 'move-1',
      elementId: 44,
      elementName: 'floor',
      type: 'move',
      description: 'Moved +1.5m X',
      originalValue: { x: 0, y: 0, z: 0 },
      newValue: { x: 1.5, y: 0, z: 0 },
      timestamp: '12:00:00',
    };

    const result = IfcPersistenceService.applyChangeSetToIfc(ifcApi, modelID, [change]);
    expect(result.success).toBe(true);
    expect(result.persistedCount).toBe(1);

    // Save modified IFC
    const savedBytes = ifcApi.SaveModel(modelID);
    ifcApi.CloseModel(modelID);

    // Reopen saved IFC in fresh modelID and assert persisted coordinates
    const reModelID = ifcApi.OpenModel(savedBytes);
    const element = ifcApi.GetLine(reModelID, 44);
    const placement = ifcApi.GetLine(reModelID, element.ObjectPlacement.value);
    const axis2 = ifcApi.GetLine(reModelID, placement.RelativePlacement.value);
    const point = ifcApi.GetLine(reModelID, axis2.Location.value);

    // Initial was 200 + (1.5 * 1000) = 1700
    const xCoord = point.Coordinates[0].value ?? point.Coordinates[0];
    expect(xCoord).toBe(1700);

    ifcApi.CloseModel(reModelID);
  });

  it('persists Rotate yaw to real IFC Direction vector and survives reload', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

    const change: BimChange = {
      id: 'rot-1',
      elementId: 44,
      elementName: 'floor',
      type: 'rotate',
      description: 'Rotated 90 degrees',
      originalValue: { rotationY: 0 },
      newValue: { rotationY: 90 },
      timestamp: '12:00:00',
    };

    const result = IfcPersistenceService.applyChangeSetToIfc(ifcApi, modelID, [change]);
    expect(result.success).toBe(true);
    expect(result.persistedCount).toBe(1);

    // Save and reload
    const savedBytes = ifcApi.SaveModel(modelID);
    ifcApi.CloseModel(modelID);

    const reModelID = ifcApi.OpenModel(savedBytes);
    const element = ifcApi.GetLine(reModelID, 44);
    const placement = ifcApi.GetLine(reModelID, element.ObjectPlacement.value);
    const axis2 = ifcApi.GetLine(reModelID, placement.RelativePlacement.value);
    const refDir = ifcApi.GetLine(reModelID, axis2.RefDirection.value);

    // cos(90) ~ 0, sin(90) = 1
    const r0 = Math.round((refDir.DirectionRatios[0].value ?? refDir.DirectionRatios[0]) * 100) / 100;
    const r1 = Math.round((refDir.DirectionRatios[1].value ?? refDir.DirectionRatios[1]) * 100) / 100;

    expect(r0).toBe(0);
    expect(r1).toBe(1);

    ifcApi.CloseModel(reModelID);
  });

  it('safely deletes element from spatial container and removes line', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

    const change: BimChange = {
      id: 'del-1',
      elementId: 44,
      elementName: 'floor',
      type: 'delete',
      description: 'Delete floor slab',
      originalValue: false,
      newValue: true,
      timestamp: '12:00:00',
    };

    const result = IfcPersistenceService.applyChangeSetToIfc(ifcApi, modelID, [change]);
    expect(result.success).toBe(true);
    expect(result.persistedCount).toBe(1);

    const savedBytes = ifcApi.SaveModel(modelID);
    ifcApi.CloseModel(modelID);

    // Reopen and verify element is gone
    const reModelID = ifcApi.OpenModel(savedBytes);
    let deletedFound = true;
    try {
      const line = ifcApi.GetLine(reModelID, 44);
      if (!line) deletedFound = false;
    } catch {
      deletedFound = false;
    }

    expect(deletedFound).toBe(false);
    ifcApi.CloseModel(reModelID);
  });

  it('marks unsupported operations explicitly without failing', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

    const changes: BimChange[] = [
      {
        id: 'col-1',
        elementId: 44,
        elementName: 'floor',
        type: 'color',
        description: 'Cyan override',
        originalValue: null,
        newValue: { color: '#06b6d4' },
        timestamp: '12:00:00',
      },
      {
        id: 'dup-1',
        elementId: 44,
        elementName: 'floor',
        type: 'duplicate',
        description: 'Duplicate instance',
        originalValue: null,
        newValue: 100044,
        timestamp: '12:00:00',
      },
    ];

    const result = IfcPersistenceService.applyChangeSetToIfc(ifcApi, modelID, changes);
    expect(result.unsupportedCount).toBe(2);
    expect(result.persistedCount).toBe(0);
    expect(result.operations[0].status).toBe('unsupported');
    expect(result.operations[1].status).toBe('unsupported');

    ifcApi.CloseModel(modelID);
  });

  it('exports modified IFC with new filename without overwriting original', () => {
    const modelID = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

    const change: BimChange = {
      id: 'move-2',
      elementId: 44,
      elementName: 'floor',
      type: 'move',
      description: 'Move +1m',
      originalValue: { x: 0, y: 0, z: 0 },
      newValue: { x: 1, y: 0, z: 0 },
      timestamp: '12:00:00',
    };

    const exported = IfcPersistenceService.exportModifiedIfc(
      ifcApi,
      modelID,
      [change],
      'Building-Architecture.ifc'
    );

    expect(exported.filename).toBe('Building-Architecture_persisted.ifc');
    expect(exported.data.byteLength).toBeGreaterThan(50000);
    expect(exported.result.persistedCount).toBe(1);

    ifcApi.CloseModel(modelID);
  });

  describe('Phase 6B.2 Persistence Sync Regressions (Detached & Idempotent Round-Trip)', () => {
    it('1. active IFC unchanged after export', () => {
      const activeModelId = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

      // Read baseline coordinates and direction of element 44 in active model
      const baseElement = ifcApi.GetLine(activeModelId, 44);
      const basePlacement = ifcApi.GetLine(activeModelId, baseElement.ObjectPlacement.value);
      const baseAxis2 = ifcApi.GetLine(activeModelId, basePlacement.RelativePlacement.value);
      const basePoint = ifcApi.GetLine(activeModelId, baseAxis2.Location.value);
      const baseX = basePoint.Coordinates[0].value ?? basePoint.Coordinates[0];
      const baseY = basePoint.Coordinates[1].value ?? basePoint.Coordinates[1];
      const baseZ = basePoint.Coordinates[2]?.value ?? basePoint.Coordinates[2] ?? 0;

      const baseRefDir = ifcApi.GetLine(activeModelId, baseAxis2.RefDirection.value);
      const baseDir0 = baseRefDir.DirectionRatios[0].value ?? baseRefDir.DirectionRatios[0];
      const baseDir1 = baseRefDir.DirectionRatios[1].value ?? baseRefDir.DirectionRatios[1];

      const changes: BimChange[] = [
        {
          id: 'move-test-1',
          elementId: 44,
          elementName: 'floor',
          type: 'move',
          description: 'Move floor',
          originalValue: { x: 0, y: 0, z: 0 },
          newValue: { x: 3.5, y: 1.0, z: 2.0 },
          timestamp: '12:00:00',
        },
        {
          id: 'rot-test-1',
          elementId: 44,
          elementName: 'floor',
          type: 'rotate',
          description: 'Rotate floor',
          originalValue: { rotationY: 0 },
          newValue: { rotationY: 45 },
          timestamp: '12:00:01',
        },
      ];

      const exported = IfcPersistenceService.exportModifiedIfc(
        ifcApi,
        activeModelId,
        changes,
        'test_active.ifc'
      );
      expect(exported.result.success).toBe(true);
      expect(exported.result.persistedCount).toBe(2);

      // Verify active model was NOT mutated in-place
      const afterElement = ifcApi.GetLine(activeModelId, 44);
      const afterPlacement = ifcApi.GetLine(activeModelId, afterElement.ObjectPlacement.value);
      const afterAxis2 = ifcApi.GetLine(activeModelId, afterPlacement.RelativePlacement.value);
      const afterPoint = ifcApi.GetLine(activeModelId, afterAxis2.Location.value);

      const afterX = afterPoint.Coordinates[0].value ?? afterPoint.Coordinates[0];
      const afterY = afterPoint.Coordinates[1].value ?? afterPoint.Coordinates[1];
      const afterZ = afterPoint.Coordinates[2]?.value ?? afterPoint.Coordinates[2] ?? 0;

      const afterRefDir = ifcApi.GetLine(activeModelId, afterAxis2.RefDirection.value);
      const afterDir0 = afterRefDir.DirectionRatios[0].value ?? afterRefDir.DirectionRatios[0];
      const afterDir1 = afterRefDir.DirectionRatios[1].value ?? afterRefDir.DirectionRatios[1];

      expect(afterX).toBe(baseX);
      expect(afterY).toBe(baseY);
      expect(afterZ).toBe(baseZ);
      expect(afterDir0).toBe(baseDir0);
      expect(afterDir1).toBe(baseDir1);

      ifcApi.CloseModel(activeModelId);
    });

    it('2. two identical exports do not double movement', () => {
      const activeModelId = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));

      const scale = IfcPersistenceService.getModelLengthUnitScale(ifcApi, activeModelId);
      const baseElement = ifcApi.GetLine(activeModelId, 44);
      const basePlacement = ifcApi.GetLine(activeModelId, baseElement.ObjectPlacement.value);
      const baseAxis2 = ifcApi.GetLine(activeModelId, basePlacement.RelativePlacement.value);
      const basePoint = ifcApi.GetLine(activeModelId, baseAxis2.Location.value);
      const baseX = basePoint.Coordinates[0].value ?? basePoint.Coordinates[0];

      const change: BimChange = {
        id: 'move-idempotent',
        elementId: 44,
        elementName: 'floor',
        type: 'move',
        description: 'Move 2m',
        originalValue: { x: 0, y: 0, z: 0 },
        newValue: { x: 2.0, y: 0, z: 0 },
        timestamp: '12:00:00',
      };

      const exp1 = IfcPersistenceService.exportModifiedIfc(ifcApi, activeModelId, [change]);
      const exp2 = IfcPersistenceService.exportModifiedIfc(ifcApi, activeModelId, [change]);

      expect(exp1.result.success).toBe(true);
      expect(exp2.result.success).toBe(true);

      // Verify first export
      const m1 = ifcApi.OpenModel(exp1.data);
      const p1 = ifcApi.GetLine(m1, ifcApi.GetLine(m1, ifcApi.GetLine(m1, 44).ObjectPlacement.value).RelativePlacement.value);
      const pt1 = ifcApi.GetLine(m1, p1.Location.value);
      const x1 = pt1.Coordinates[0].value ?? pt1.Coordinates[0];
      ifcApi.CloseModel(m1);

      // Verify second export
      const m2 = ifcApi.OpenModel(exp2.data);
      const p2 = ifcApi.GetLine(m2, ifcApi.GetLine(m2, ifcApi.GetLine(m2, 44).ObjectPlacement.value).RelativePlacement.value);
      const pt2 = ifcApi.GetLine(m2, p2.Location.value);
      const x2 = pt2.Coordinates[0].value ?? pt2.Coordinates[0];
      ifcApi.CloseModel(m2);

      const expectedX = baseX + 2.0 * scale;
      expect(x1).toBe(expectedX);
      expect(x2).toBe(expectedX);
      expect(x2).toBe(x1); // Not doubled!

      ifcApi.CloseModel(activeModelId);
    });

    it('3. generated 2-storey IFC survives edit → export → reload', async () => {
      // 1. Author valid 2-storey IFC4
      const genService = new BimGenerationService();
      const plan = genService.generatePlan({
        length: 10,
        width: 8,
        storeys: 2,
        storeyHeight: 3,
      });
      const ifcData = await IfcAuthoringService.generateIfc4(plan, ifcApi);

      // Setup mock engine & world for IfcLoaderService
      const mockScene = new THREE.Scene();
      if (!bimEngine.world) bimEngine.world = {} as any;
      if (!bimEngine.world.scene) bimEngine.world.scene = {} as any;
      bimEngine.world.scene.three = mockScene;
      if (!bimEngine.ifcLoader) bimEngine.ifcLoader = {} as any;
      vi.spyOn(bimEngine.ifcLoader, 'load').mockImplementation(async (_bytes, _, name) => {
        const group = new THREE.Group();
        group.name = name || 'mock-model';
        return {
          modelId: `model-${Date.now()}`,
          object: group,
          dispose: vi.fn(),
        } as any;
      });
      vi.spyOn(bimEngine, 'waitForInit').mockResolvedValue(undefined);

      // Load generated IFC
      await IfcLoaderService.loadIfc(ifcData, 'gen_building_2s.ifc');
      expect(useBimStore.getState().modelMetadata?.elementCount).toBe(11);
      expect(useBimStore.getState().storeys.length).toBe(2);

      // Pick a wall from the loaded model in bimEngine
      const loadedApi = bimEngine.webIfcApi!;
      const loadedModelId = bimEngine.webIfcModelID!;
      const wallIds = loadedApi.GetLineIDsWithType(loadedModelId, WebIFC.IFCWALL);
      expect(wallIds.size()).toBe(8);
      const wallId = wallIds.get(0);

      // Move the wall by +2.5m in X
      const wallElement = loadedApi.GetLine(loadedModelId, wallId);
      const wallPlacement = loadedApi.GetLine(loadedModelId, wallElement.ObjectPlacement.value);
      const wallAxis2 = loadedApi.GetLine(loadedModelId, wallPlacement.RelativePlacement.value);
      const wallPoint = loadedApi.GetLine(loadedModelId, wallAxis2.Location.value);
      const baseWallX = wallPoint.Coordinates[0].value ?? wallPoint.Coordinates[0];

      const change: BimChange = {
        id: 'move-wall-1',
        elementId: wallId,
        elementName: 'Wall',
        type: 'move',
        description: 'Move wall +2.5m',
        originalValue: { x: 0, y: 0, z: 0 },
        newValue: { x: 2.5, y: 0, z: 0 },
        timestamp: '12:00:00',
      };

      // Detached export
      const exported = IfcPersistenceService.exportModifiedIfc(
        loadedApi,
        loadedModelId,
        [change],
        'gen_building_2s.ifc'
      );
      expect(exported.result.success).toBe(true);
      expect(exported.result.persistedCount).toBe(1);

      // Reload persisted IFC
      await bimEditService.resetAllEdits();
      await IfcLoaderService.loadIfc(exported.data, exported.filename);

      // Verify tree/counts/changes
      expect(useBimStore.getState().modelMetadata?.elementCount).toBe(11);
      expect(useBimStore.getState().storeys.length).toBe(2);
      expect(bimEngine.webIfcApi).not.toBeNull();

      // Verify persisted coordinate in the newly reloaded active model
      const reloadedApi = bimEngine.webIfcApi!;
      const reloadedModelId = bimEngine.webIfcModelID!;
      const reElement = reloadedApi.GetLine(reloadedModelId, wallId);
      const rePlacement = reloadedApi.GetLine(reloadedModelId, reElement.ObjectPlacement.value);
      const reAxis2 = reloadedApi.GetLine(reloadedModelId, rePlacement.RelativePlacement.value);
      const rePoint = reloadedApi.GetLine(reloadedModelId, reAxis2.Location.value);
      const reWallX = rePoint.Coordinates[0].value ?? rePoint.Coordinates[0];

      // Scale for generated model is 1 (meters)
      expect(reWallX).toBeCloseTo(baseWallX + 2.5, 3);
    });

    it('4. second edit/export/reload also succeeds', async () => {
      // Continuing on the active loaded model from Test 3
      const activeApi = bimEngine.webIfcApi!;
      const activeModelId = bimEngine.webIfcModelID!;
      expect(activeApi).toBeDefined();

      const wallIds = activeApi.GetLineIDsWithType(activeModelId, WebIFC.IFCWALL);
      const wallId = wallIds.get(1); // second wall

      const secondChange: BimChange = {
        id: 'rotate-wall-2',
        elementId: wallId,
        elementName: 'Wall 2',
        type: 'rotate',
        description: 'Rotate wall 90 deg',
        originalValue: { rotationY: 0 },
        newValue: { rotationY: 90 },
        timestamp: '12:05:00',
      };

      const exported2 = IfcPersistenceService.exportModifiedIfc(
        activeApi,
        activeModelId,
        [secondChange],
        'gen_building_2s_persisted.ifc'
      );
      expect(exported2.result.success).toBe(true);
      expect(exported2.result.persistedCount).toBe(1);

      // Reload again
      await bimEditService.resetAllEdits();
      await IfcLoaderService.loadIfc(exported2.data, exported2.filename);

      expect(useBimStore.getState().modelMetadata?.elementCount).toBe(11);
      expect(useBimStore.getState().storeys.length).toBe(2);

      // Verify RefDirection of wall 2 in newly loaded model
      const reApi = bimEngine.webIfcApi!;
      const reModelId = bimEngine.webIfcModelID!;
      const reElement = reApi.GetLine(reModelId, wallId);
      const rePlacement = reApi.GetLine(reModelId, reElement.ObjectPlacement.value);
      const reAxis2 = reApi.GetLine(reModelId, rePlacement.RelativePlacement.value);
      const reRefDir = reApi.GetLine(reModelId, reAxis2.RefDirection.value);

      const r0 = reRefDir.DirectionRatios[0].value ?? reRefDir.DirectionRatios[0];
      const r1 = reRefDir.DirectionRatios[1].value ?? reRefDir.DirectionRatios[1];

      expect(r0).toBeCloseTo(0, 3);
      expect(r1).toBeCloseTo(1, 3);
    });

    it('5. delete preserves valid spatial hierarchy', async () => {
      const genService = new BimGenerationService();
      const plan = genService.generatePlan({
        length: 10,
        width: 8,
        storeys: 2,
        storeyHeight: 3,
      });
      const ifcData = await IfcAuthoringService.generateIfc4(plan, ifcApi);

      const modelId = ifcApi.OpenModel(ifcData);
      const wallIds = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCWALL);
      const wallIdToDelete = wallIds.get(0);

      const deleteChange: BimChange = {
        id: 'del-wall-1',
        elementId: wallIdToDelete,
        elementName: 'Wall to delete',
        type: 'delete',
        description: 'Delete first wall',
        originalValue: false,
        newValue: true,
        timestamp: '12:10:00',
      };

      const exported = IfcPersistenceService.exportModifiedIfc(
        ifcApi,
        modelId,
        [deleteChange],
        'delete_test.ifc'
      );
      expect(exported.result.success).toBe(true);
      expect(exported.result.persistedCount).toBe(1);

      // Reopen persisted bytes in a fresh model
      const reModelId = ifcApi.OpenModel(exported.data);

      // Build spatial tree from the persisted model
      const treeResult = buildSpatialTree(ifcApi, reModelId);
      expect(treeResult.totalElements).toBe(10); // 11 - 1 = 10
      expect(treeResult.elementCounts.walls).toBe(7); // 8 - 1 = 7
      expect(treeResult.elementCounts.slabs).toBe(3);
      expect(treeResult.storeys.length).toBe(2);

      // Verify deleted wall is not in the tree
      expect(treeResult.expressIdToStorey.has(wallIdToDelete)).toBe(false);
      expect(treeResult.expressIdToCategory.has(wallIdToDelete)).toBe(false);

      // Verify deleted wall line is gone
      let lineExists = false;
      try {
        const line = ifcApi.GetLine(reModelId, wallIdToDelete);
        if (line && Object.keys(line).length > 0) lineExists = true;
      } catch {
        lineExists = false;
      }
      expect(lineExists).toBe(false);

      // Verify containment does not reference it
      const relLines = ifcApi.GetLineIDsWithType(reModelId, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
      for (let i = 0; i < relLines.size(); i++) {
        const rel = ifcApi.GetLine(reModelId, relLines.get(i));
        if (rel && Array.isArray(rel.RelatedElements)) {
          const found = rel.RelatedElements.some((h: any) => (h?.value ?? h) === wallIdToDelete);
          expect(found).toBe(false);
        }
      }

      ifcApi.CloseModel(reModelId);
      ifcApi.CloseModel(modelId);
    });

    it('6. corrupted persisted result is rejected before reload', async () => {
      // A) Corrupted bytes passed to IfcLoaderService.loadIfc are rejected before touching engine
      const currentModelBefore = bimEngine.currentModel;
      const corruptBytes = new Uint8Array([0x49, 0x53, 0x4f, 0x00, 0x99, 0x88]);
      await expect(IfcLoaderService.loadIfc(corruptBytes, 'corrupt.ifc')).rejects.toThrow();
      expect(bimEngine.currentModel).toBe(currentModelBefore);

      // B) Semantic verification rejects corrupted or incorrect placement
      const activeModelId = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));
      const badChange: BimChange = {
        id: 'bad-move',
        elementId: 44,
        elementName: 'floor',
        type: 'move',
        description: 'Move bad',
        originalValue: { x: 0, y: 0, z: 0 },
        newValue: { x: 1.0, y: 0, z: 0 },
        timestamp: '12:00:00',
      };

      // Open a model without the change applied, and simulate semantic verification failure
      const unmodifiedReopenedId = ifcApi.OpenModel(new Uint8Array(smallIfcBuffer));
      const fakeResult = {
        success: true,
        persistedCount: 1,
        unsupportedCount: 0,
        failedCount: 0,
        operations: [
          {
            changeId: 'bad-move',
            elementId: 44,
            elementName: 'floor',
            type: 'move' as const,
            status: 'persisted' as const,
          },
        ],
      };

      expect(() => {
        IfcPersistenceService.verifySemanticPersistence(
          ifcApi,
          activeModelId,
          unmodifiedReopenedId,
          [badChange],
          fakeResult
        );
      }).toThrow(/Semantic verification failed: element #44 placement changed incorrectly/);

      ifcApi.CloseModel(unmodifiedReopenedId);
      ifcApi.CloseModel(activeModelId);
    });
  });
});

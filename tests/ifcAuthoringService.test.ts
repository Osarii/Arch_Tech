import { describe, it, expect } from 'vitest';
import * as WebIFC from 'web-ifc';
import {
  IfcAuthoringService,
  createIfcGuid,
} from '@/bim/generation/ifcAuthoringService';
import { bimGenerationService } from '@/bim/generation/generationService';

describe('IfcAuthoringService', () => {
  describe('createIfcGuid', () => {
    it('generates a valid 22-character IFC base64 GUID', () => {
      const guid = createIfcGuid();
      expect(guid).toBeTypeOf('string');
      expect(guid.length).toBe(22);
      expect(guid).toMatch(/^[0-9A-Za-z_$]{22}$/);
    });

    it('generates unique GUIDs across multiple invocations', () => {
      const guids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        guids.add(createIfcGuid());
      }
      expect(guids.size).toBe(50);
    });
  });

  describe('generateIfc4 and validateIfc', () => {
    it('authors and validates a 1-storey building plan', async () => {
      const plan = bimGenerationService.generatePlan({
        length: 12,
        width: 8,
        storeys: 1,
        storeyHeight: 3.5,
        wallThickness: 0.25,
        slabThickness: 0.2,
      });

      expect(plan.walls.length).toBe(4);
      expect(plan.slabs.length).toBe(2); // base + roof

      const ifcData = await IfcAuthoringService.generateIfc4(plan);
      expect(ifcData).toBeInstanceOf(Uint8Array);
      expect(ifcData.byteLength).toBeGreaterThan(1000);

      // Verify ISO STEP-21 header
      const text = new TextDecoder().decode(ifcData.slice(0, 1000));
      expect(text).toContain('ISO-10303-21;');
      expect(text).toContain('IFC4');

      // Validate by reopening with web-ifc
      const validation = await IfcAuthoringService.validateIfc(ifcData);
      expect(validation.valid).toBe(true);
      expect(validation.stats).toBeDefined();
      expect(validation.stats?.wallsCount).toBe(4);
      expect(validation.stats?.slabsCount).toBe(2);
      expect(validation.stats?.storeysCount).toBe(1); // Exactly 1 storey: Level 0
    });

    it('authors and validates a multi-storey building plan with exact counts', async () => {
      const plan = bimGenerationService.generatePlan({
        length: 15,
        width: 10,
        storeys: 3,
        storeyHeight: 3,
        wallThickness: 0.2,
        slabThickness: 0.2,
      });

      expect(plan.walls.length).toBe(12); // 4 walls * 3 storeys
      expect(plan.slabs.length).toBe(4); // 1 base + 2 floor + 1 roof

      const ifcData = await IfcAuthoringService.generateIfc4(plan);
      const validation = await IfcAuthoringService.validateIfc(ifcData);

      expect(validation.valid).toBe(true);
      expect(validation.stats?.wallsCount).toBe(12);
      expect(validation.stats?.slabsCount).toBe(4);
      expect(validation.stats?.totalElements).toBe(16);
      expect(validation.stats?.storeysCount).toBe(3); // Exactly 3 storeys: Level 0, 1, 2
    });

    it('authors a 10x8 2-storey building with exactly 2 storeys, 8 walls, 3 slabs (11 physical elements) and ROOF predefined type', async () => {
      const plan = bimGenerationService.generatePlan({
        length: 10,
        width: 8,
        storeys: 2,
        storeyHeight: 3,
      });

      expect(plan.walls.length).toBe(8);
      expect(plan.slabs.length).toBe(3);

      const ifcData = await IfcAuthoringService.generateIfc4(plan);
      const validation = await IfcAuthoringService.validateIfc(ifcData);

      expect(validation.valid).toBe(true);
      expect(validation.stats?.storeysCount).toBe(2); // Level 0, Level 1 (NO Roof Level storey)
      expect(validation.stats?.wallsCount).toBe(8);
      expect(validation.stats?.slabsCount).toBe(3);
      expect(validation.stats?.totalElements).toBe(11);

      // Verify that roof slab has PredefinedType = ROOF and belongs to last existing storey
      const ifcApi = new WebIFC.IfcAPI();
      await ifcApi.Init();
      const modelID = ifcApi.OpenModel(ifcData);

      try {
        const slabIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSLAB);
        expect(slabIds.size()).toBe(3);

        const roofSlabLine = ifcApi.GetLine(modelID, slabIds.get(2)); // 3rd slab is roof slab
        expect(roofSlabLine.PredefinedType.value).toBe('ROOF');

        // Check building storeys
        const storeyIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
        expect(storeyIds.size()).toBe(2);
        const s0 = ifcApi.GetLine(modelID, storeyIds.get(0));
        const s1 = ifcApi.GetLine(modelID, storeyIds.get(1));
        expect(s0.Name.value).toBe('Level 0 (Ground Floor)');
        expect(s1.Name.value).toBe('Level 1');
      } finally {
        ifcApi.CloseModel(modelID);
      }
    });

    it('creates correct spatial hierarchy and containment relations', async () => {
      const plan = bimGenerationService.generatePlan({
        length: 10,
        width: 8,
        storeys: 2,
        storeyHeight: 3,
      });

      const ifcData = await IfcAuthoringService.generateIfc4(plan);

      const ifcApi = new WebIFC.IfcAPI();
      await ifcApi.Init();
      const modelID = ifcApi.OpenModel(ifcData);

      try {
        // Project
        const projectIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
        expect(projectIds.size()).toBe(1);

        // Site
        const siteIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSITE);
        expect(siteIds.size()).toBe(1);

        // Building
        const buildingIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDING);
        expect(buildingIds.size()).toBe(1);

        // Aggregates: Project->Site, Site->Building, Building->Storeys
        const relAggIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELAGGREGATES);
        expect(relAggIds.size()).toBe(3);

        // Containment relations
        const relContIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
        expect(relContIds.size()).toBeGreaterThanOrEqual(2);

        // Units: SI Meters and Radians
        const unitAssignmentIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCUNITASSIGNMENT);
        expect(unitAssignmentIds.size()).toBe(1);
      } finally {
        ifcApi.CloseModel(modelID);
      }
    });

    it('rejects invalid or corrupted IFC buffer gracefully without crashing', async () => {
      const emptyBuffer = new Uint8Array(0);
      const resEmpty = await IfcAuthoringService.validateIfc(emptyBuffer);
      expect(resEmpty.valid).toBe(false);
      expect(resEmpty.error).toBeDefined();

      const corruptBuffer = new Uint8Array([1, 2, 3, 4, 5]);
      const resCorrupt = await IfcAuthoringService.validateIfc(corruptBuffer);
      expect(resCorrupt.valid).toBe(false);
      expect(resCorrupt.error).toBeDefined();
    });

    it('does not leak models across repeated generation cycles', async () => {
      const plan = bimGenerationService.generatePlan({
        length: 8,
        width: 6,
        storeys: 1,
        storeyHeight: 3,
      });

      for (let i = 0; i < 5; i++) {
        const ifcData = await IfcAuthoringService.generateIfc4(plan);
        const val = await IfcAuthoringService.validateIfc(ifcData);
        expect(val.valid).toBe(true);
      }
    });
  });
});

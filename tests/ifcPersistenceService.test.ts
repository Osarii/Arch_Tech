import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import * as WebIFC from 'web-ifc';
import { IfcPersistenceService } from '../src/bim/persistence/ifcPersistenceService';
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
});

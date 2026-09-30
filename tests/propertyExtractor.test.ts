import { describe, it, expect, beforeAll } from 'vitest';
import * as WebIFC from 'web-ifc';
import fs from 'fs';
import path from 'path';
import { extractElementProperties } from '../src/bim/properties/propertyExtractor';

describe('extractElementProperties', () => {
  let ifcApi: WebIFC.IfcAPI;
  let modelID: number;

  beforeAll(async () => {
    ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    const filePath = path.resolve(__dirname, '../public/small_model.ifc');
    const data = fs.readFileSync(filePath);
    modelID = ifcApi.OpenModel(new Uint8Array(data));
  });

  it('extracts real attributes, GUID, and property sets for a wall entity', () => {
    const walls = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCWALL);
    expect(walls.size()).toBeGreaterThan(0);
    const wallId = walls.get(0);

    const details = extractElementProperties(ifcApi, modelID, wallId);
    expect(details).not.toBeNull();
    expect(details?.expressID).toBe(wallId);
    expect(details?.globalId).toBeDefined();
    expect(details?.type).toBe('IFCWALL');
    expect(details?.propertyGroups.length).toBeGreaterThan(0);

    // Verify Attributes group exists
    const attrGroup = details?.propertyGroups.find((g) => g.name === 'Attributes');
    expect(attrGroup).toBeDefined();
    expect(attrGroup?.properties.some((p) => p.name === 'GlobalId')).toBe(true);

    // Verify quantities or psets are extracted
    const qtoGroup = details?.propertyGroups.find((g) => g.name.includes('Quantities'));
    expect(qtoGroup).toBeDefined();
    expect(qtoGroup?.properties.length).toBeGreaterThan(0);
  });
});

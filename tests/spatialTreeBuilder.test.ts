import { describe, it, expect, beforeAll } from 'vitest';
import * as WebIFC from 'web-ifc';
import fs from 'fs';
import path from 'path';
import { buildSpatialTree } from '../src/bim/tree/spatialTreeBuilder';

describe('buildSpatialTree', () => {
  let ifcApi: WebIFC.IfcAPI;
  let modelID: number;

  beforeAll(async () => {
    ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    const filePath = path.resolve(__dirname, '../public/small_model.ifc');
    const data = fs.readFileSync(filePath);
    modelID = ifcApi.OpenModel(new Uint8Array(data));
  });

  it('builds spatial tree with Project, Site, Building, and Storey', () => {
    const result = buildSpatialTree(ifcApi, modelID);

    expect(result.tree.length).toBeGreaterThan(0);
    const root = result.tree[0];
    expect(root.type).toBe('IFCPROJECT');
    expect(root.name).toContain('project');

    expect(result.totalElements).toBeGreaterThan(0);
    expect(result.categories).toContain('Walls');
    expect(result.elementCounts.walls).toBeGreaterThanOrEqual(4);
  });

  it('correctly maps express IDs to categories and storeys', () => {
    const result = buildSpatialTree(ifcApi, modelID);

    expect(result.expressIdToCategory.size).toBeGreaterThan(0);
    const wallEntries = Array.from(result.expressIdToCategory.entries()).filter(
      ([, cat]) => cat === 'Walls'
    );
    expect(wallEntries.length).toBeGreaterThanOrEqual(4);
  });
});

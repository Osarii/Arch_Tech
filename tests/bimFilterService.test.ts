import { describe, it, expect, beforeAll } from 'vitest';
import * as WebIFC from 'web-ifc';
import fs from 'fs';
import path from 'path';
import { BimFilterService } from '../src/bim/filter/bimFilterService';
import { BimAnalysisService } from '../src/bim/analysis/bimAnalysisService';
import { buildSpatialTree } from '../src/bim/tree/spatialTreeBuilder';

describe('BimFilterService', () => {
  let ifcApi: WebIFC.IfcAPI;
  let modelID: number;
  let allElementIds: number[];
  let expressIdToCategory: Map<number, string>;
  let expressIdToStorey: Map<number, string>;

  beforeAll(async () => {
    ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    const filePath = path.resolve(__dirname, '../public/small_model.ifc');
    const data = fs.readFileSync(filePath);
    modelID = ifcApi.OpenModel(new Uint8Array(data));

    const treeResult = buildSpatialTree(ifcApi, modelID);
    expressIdToCategory = treeResult.expressIdToCategory;
    expressIdToStorey = treeResult.expressIdToStorey;

    const analysisResult = BimAnalysisService.analyzeModel(ifcApi, modelID);
    allElementIds = [];
    for (const s of analysisResult.storeysData) {
      allElementIds.push(...s.elementIds);
    }
  });

  it('filters elements by category type (e.g. Walls)', () => {
    const walls = BimFilterService.filterElements(
      ifcApi,
      modelID,
      allElementIds,
      { type: 'Walls' },
      expressIdToCategory,
      expressIdToStorey
    );

    expect(walls.length).toBeGreaterThan(0);
    expect(walls.length).toBeLessThanOrEqual(allElementIds.length);
    for (const wid of walls) {
      expect(expressIdToCategory.get(wid)).toBe('Walls');
    }
  });

  it('filters elements by name query', () => {
    const results = BimFilterService.filterElements(
      ifcApi,
      modelID,
      allElementIds,
      { nameQuery: 'wall' },
      expressIdToCategory,
      expressIdToStorey
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('returns all elements when criteria is empty', () => {
    const results = BimFilterService.filterElements(
      ifcApi,
      modelID,
      allElementIds,
      {},
      expressIdToCategory,
      expressIdToStorey
    );

    expect(results.length).toBe(allElementIds.length);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import * as WebIFC from 'web-ifc';
import fs from 'fs';
import path from 'path';
import { BimAnalysisService } from '../src/bim/analysis/bimAnalysisService';

describe('BimAnalysisService', () => {
  let ifcApi: WebIFC.IfcAPI;
  let modelID: number;

  beforeAll(async () => {
    ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    const filePath = path.resolve(__dirname, '../public/small_model.ifc');
    const data = fs.readFileSync(filePath);
    modelID = ifcApi.OpenModel(new Uint8Array(data));
  });

  it('analyzes model storeys, elevations, and element distribution', () => {
    const result = BimAnalysisService.analyzeModel(ifcApi, modelID);

    expect(result.storeysData.length).toBeGreaterThan(0);
    const firstStorey = result.storeysData[0];
    expect(firstStorey.name).toBeTruthy();
    expect(firstStorey.elementCount).toBeGreaterThan(0);
    expect(firstStorey.categories.length).toBeGreaterThan(0);

    expect(result.analysis.totalElements).toBeGreaterThan(0);
    expect(result.analysis.categoryCounts.Walls).toBeGreaterThan(0);
  });

  it('extracts real quantities and model metadata', () => {
    const result = BimAnalysisService.analyzeModel(ifcApi, modelID);

    expect(result.analysis.schema).toContain('IFC');
    expect(result.analysis.quantities).toBeDefined();
    expect(result.analysis.totalStoreys).toBeGreaterThan(0);
  });
});

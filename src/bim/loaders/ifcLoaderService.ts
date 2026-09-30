import * as WebIFC from 'web-ifc';
import { bimEngine } from '../engine/BimEngine';
import { useBimStore } from '@/stores/bimStore';
import { buildSpatialTree } from '../tree/spatialTreeBuilder';
import { BimAnalysisService } from '../analysis/bimAnalysisService';
import { ModelMetadata } from '@/types/bim';

export class IfcLoaderService {
  /**
   * Loads a real IFC file from an ArrayBuffer or File object through That Open and WebIFC.
   */
  public static async loadIfc(
    source: File | ArrayBuffer,
    fileName = 'model.ifc'
  ): Promise<void> {
    const store = useBimStore.getState();

    try {
      // 0. Cleanup any existing model first
      await bimEngine.unloadModel();
      store.resetModel();

      // 1. Stage: Reading IFC
      store.setLoading({
        isBusy: true,
        stage: 'Reading IFC',
        progress: 15,
        filename: fileName,
        error: undefined,
      });

      let buffer: ArrayBuffer;
      let sizeBytes = 0;
      if (source instanceof File) {
        fileName = source.name;
        sizeBytes = source.size;
        buffer = await source.arrayBuffer();
      } else {
        buffer = source;
        sizeBytes = buffer.byteLength;
      }

      if (buffer.byteLength === 0) {
        throw new Error('IFC file is empty.');
      }

      const uint8 = new Uint8Array(buffer);

      // 2. Stage: Parsing model (Metadata & IFC schema via WebIFC)
      store.setLoading({
        stage: 'Parsing model',
        progress: 35,
      });

      const webIfcApi = new WebIFC.IfcAPI();
      const wasmPath = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
      webIfcApi.SetWasmPath(wasmPath, true);
      await webIfcApi.Init(undefined, true);
      const modelID = webIfcApi.OpenModel(uint8);

      bimEngine.webIfcApi = webIfcApi;
      bimEngine.webIfcModelID = modelID;

      // Extract schema
      let schema = 'IFC2X3';
      try {
        const header = webIfcApi.GetHeaderLine(modelID, 2); // FILE_SCHEMA
        if (header) schema = header;
      } catch {
        // fallback
      }

      // 3. Stage: Creating fragments (That Open Geometry Loader)
      store.setLoading({
        stage: 'Creating fragments',
        progress: 60,
      });

      await bimEngine.waitForInit();
      const fragmentsModel = await bimEngine.ifcLoader.load(uint8, true, fileName);
      bimEngine.currentModel = fragmentsModel;
      bimEngine.currentModelId = fragmentsModel.modelId;

      // 4. Stage: Preparing scene
      store.setLoading({
        stage: 'Preparing scene',
        progress: 80,
      });

      if (fragmentsModel.object && bimEngine.world?.scene?.three) {
        bimEngine.world.scene.three.add(fragmentsModel.object);
      }

      // Frame camera to fit model
      bimEngine.fitModel();

      // 5. Stage: Building BIM tree & Analysis
      store.setLoading({
        stage: 'Building BIM tree',
        progress: 92,
      });

      const treeResult = buildSpatialTree(webIfcApi, modelID);
      const analysisResult = BimAnalysisService.analyzeModel(webIfcApi, modelID);

      const metadata: ModelMetadata = {
        id: fragmentsModel.modelId,
        name: fileName,
        sizeBytes,
        schema,
        elementCount: treeResult.totalElements,
        counts: treeResult.elementCounts,
      };

      store.setModelMetadata(metadata);
      store.setSpatialTree(treeResult.tree);
      store.setCategories(treeResult.categories);
      store.setStoreys(treeResult.storeys);
      store.setExpressIdToCategory(treeResult.expressIdToCategory);
      store.setExpressIdToStorey(treeResult.expressIdToStorey);
      store.setStoreysData(analysisResult.storeysData);
      store.setAnalysisData(analysisResult.analysis);
      store.setMaterials(analysisResult.materials);

      // 6. Stage: Ready
      store.setLoading({
        isBusy: false,
        stage: 'Ready',
        progress: 100,
      });
    } catch (err: any) {
      console.error('Failed to load IFC file:', err);
      store.setLoading({
        isBusy: false,
        stage: 'Error',
        progress: 0,
        error: err.message || 'Unknown error occurred while loading IFC.',
      });
      throw err;
    }
  }

  /**
   * Unloads current model and resets state.
   */
  public static async unload(): Promise<void> {
    await bimEngine.unloadModel();
    useBimStore.getState().resetModel();
  }
}

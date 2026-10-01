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
    source: File | ArrayBuffer | Uint8Array,
    fileName = 'model.ifc'
  ): Promise<void> {
    const store = useBimStore.getState();

    let webIfcApi: WebIFC.IfcAPI | null = null;
    let modelID: number | null = null;
    let fragmentsModel: any = null;

    try {
      // 1. Stage: Reading IFC
      store.setLoading({
        isBusy: true,
        stage: 'Reading IFC',
        progress: 15,
        filename: fileName,
        error: undefined,
      });

      let uint8: Uint8Array;
      let sizeBytes = 0;
      if (source instanceof File) {
        fileName = source.name;
        sizeBytes = source.size;
        const buffer = await source.arrayBuffer();
        uint8 = new Uint8Array(buffer);
      } else if (source instanceof Uint8Array) {
        uint8 = source;
        sizeBytes = source.byteLength;
      } else {
        uint8 = new Uint8Array(source);
        sizeBytes = source.byteLength;
      }

      if (uint8.byteLength === 0) {
        store.setLoading({
          isBusy: false,
          stage: 'Error',
          progress: 0,
          error: 'IFC file is empty.',
        });
        throw new Error('IFC file is empty.');
      }

      // 2. Stage: Parsing model (Metadata & IFC schema via WebIFC)
      store.setLoading({
        stage: 'Parsing model',
        progress: 35,
      });

        webIfcApi = new WebIFC.IfcAPI();
        const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
        if (!isNode && typeof window !== 'undefined') {
          const wasmPath = `${window.location.origin}/`;
          webIfcApi.SetWasmPath(wasmPath, true);
        }
        await webIfcApi.Init(undefined, true);
        modelID = webIfcApi.OpenModel(uint8);

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
        fragmentsModel = await bimEngine.ifcLoader.load(uint8, true, fileName);

        // 4. Stage: Building BIM tree & Analysis
        store.setLoading({
          stage: 'Building BIM tree',
          progress: 80,
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

        // 5. ATOMIC SWAP: Preflight parsing, geometry, and tree are validated!
        // Safely dispose old model and wipe old store records
        await bimEngine.unloadModel();
        store.resetModel();

        // Mount new model into engine and scene
        bimEngine.webIfcApi = webIfcApi;
        bimEngine.webIfcModelID = modelID;
        bimEngine.currentModel = fragmentsModel;
        bimEngine.currentModelId = fragmentsModel.modelId;

        if (fragmentsModel.object && bimEngine.world?.scene?.three) {
          bimEngine.world.scene.three.add(fragmentsModel.object);
        }

        // Frame camera to fit model
        bimEngine.fitModel();

        // Mount new model into Zustand store
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

        // Clean up newly created preflight resources if swap did not complete
        if (fragmentsModel && fragmentsModel !== bimEngine.currentModel) {
          try {
            if (fragmentsModel.object && bimEngine.world?.scene?.three) {
              bimEngine.world.scene.three.remove(fragmentsModel.object);
            }
            await fragmentsModel.dispose?.();
          } catch {
            // ignore cleanup error
          }
        }

        if (webIfcApi && modelID !== null && webIfcApi !== bimEngine.webIfcApi) {
          try {
            webIfcApi.CloseModel(modelID);
          } catch {
            // ignore cleanup error
          }
        }

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

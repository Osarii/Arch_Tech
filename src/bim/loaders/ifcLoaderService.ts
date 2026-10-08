import * as WebIFC from 'web-ifc';
import { bimEngine } from '../engine/BimEngine';
import { useBimStore } from '@/stores/bimStore';
import { buildSpatialTree } from '../tree/spatialTreeBuilder';
import { BimAnalysisService } from '../analysis/bimAnalysisService';
import { bimEditService } from '../edit/bimEditService';
import { bimGenerationService } from '../generation/generationService';
import { laLimaSiteContextService } from '../site';
import { ModelMetadata } from '@/types/bim';

export class IfcLoaderService {
  private static loadGeneration = 0;
  private static readonly staleRequest = Symbol('stale-ifc-load');

  /**
   * Loads a real IFC file from an ArrayBuffer or File object through That Open and WebIFC.
   * Transactional and non-destructive: stages new model and only swaps upon complete validation.
   * Fully rolls back to existing model, spatial tree, and scene state on any staging or commit failure.
   */
  public static async loadIfc(
    source: File | ArrayBuffer | Uint8Array,
    fileName = 'model.ifc'
  ): Promise<void> {
    const requestGeneration = ++this.loadGeneration;
    const ensureCurrent = () => {
      if (requestGeneration !== this.loadGeneration) throw this.staleRequest;
    };
    const store = useBimStore.getState();
    bimEngine.resetSceneInteractions();
    laLimaSiteContextService.clear();
    store.setActiveSiteContextId(null);
    store.setActiveSiteContextLabel(null);

    // Preserve references to active OLD model, engine, scene, and store state
    const prevEngineState = {
      currentModel: bimEngine.currentModel,
      currentModelId: bimEngine.currentModelId,
      webIfcApi: bimEngine.webIfcApi,
      webIfcModelID: bimEngine.webIfcModelID,
      oldSceneObject: bimEngine.currentModel?.object,
    };

    const prevStoreState = {
      modelMetadata: store.modelMetadata,
      activeSiteContextId: store.activeSiteContextId,
      activeSiteContextLabel: store.activeSiteContextLabel,
      selectedElement: store.selectedElement,
      selectedNodeId: store.selectedNodeId,
      spatialTree: store.spatialTree,
      categories: store.categories,
      storeys: store.storeys,
      storeysData: store.storeysData,
      analysisData: store.analysisData,
      materials: store.materials,
      viewpoints: store.viewpoints,
      expressIdToCategory: store.expressIdToCategory,
      expressIdToStorey: store.expressIdToStorey,
      filterCriteria: store.filterCriteria,
      filteredElementIds: store.filteredElementIds,
      hiddenCategories: store.hiddenCategories,
      hiddenStoreys: store.hiddenStoreys,
      hiddenExpressIds: store.hiddenExpressIds,
      isIsolated: store.isIsolated,
      activeFloorPlanStorey: store.activeFloorPlanStorey,
      is2DMode: store.is2DMode,
      sectionPlaneCount: store.sectionPlaneCount,
      treeSearchQuery: store.treeSearchQuery,
    };

    let webIfcApi: WebIFC.IfcAPI | null = null;
    let modelID: number | null = null;
    let fragmentsModel: any = null;
    let commitStarted = false;
    let commitCompleted = false;

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
        ensureCurrent();
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
      ensureCurrent();
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
      ensureCurrent();
      fragmentsModel = await bimEngine.ifcLoader.load(uint8, true, fileName);
      ensureCurrent();

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

      // Clear active overlays before the synchronous commit boundary.
      if (bimEngine.highlighter) {
        await bimEngine.highlighter.clear('select');
        ensureCurrent();
      }
      if (bimEngine.clipper) {
        bimEngine.clipper.deleteAll();
      }
      bimEngine.deleteMeasurements();

      // 5. REVERSIBLE COMMIT NEW: after this token check the swap is synchronous.
      ensureCurrent();
      commitStarted = true;

      // Switch scene model
      if (prevEngineState.oldSceneObject && bimEngine.world?.scene?.three) {
        bimEngine.world.scene.three.remove(prevEngineState.oldSceneObject);
      }

      if (fragmentsModel.object && bimEngine.world?.scene?.three) {
        bimEngine.world.scene.three.add(fragmentsModel.object);
      }

      // Attach new model into bimEngine
      bimEngine.webIfcApi = webIfcApi;
      bimEngine.webIfcModelID = modelID;
      bimEngine.currentModel = fragmentsModel;
      bimEngine.currentModelId = fragmentsModel.modelId;
      bimEngine.invalidateModelBounds();

      // Frame camera to fit new model
      bimEngine.fitModel();

      // Mount new model into Zustand store
      store.resetModel();
      store.setModelMetadata(metadata);
      store.setSpatialTree(treeResult.tree);
      store.setCategories(treeResult.categories);
      store.setStoreys(treeResult.storeys);
      store.setExpressIdToCategory(treeResult.expressIdToCategory);
      store.setExpressIdToStorey(treeResult.expressIdToStorey);
      store.setStoreysData(analysisResult.storeysData);
      store.setAnalysisData(analysisResult.analysis);
      store.setMaterials(analysisResult.materials);

      // 6. Stage: Ready - Transaction is committed
      store.setLoading({
        isBusy: false,
        stage: 'Ready',
        progress: 100,
      });

      // Mark commit as completed BEFORE destroying OLD resources
      commitCompleted = true;
    } catch (err: any) {
      const stale = err === this.staleRequest || requestGeneration !== this.loadGeneration;
      if (!stale) console.error('Failed to load IFC file:', err);

      if (commitStarted && !commitCompleted && !stale && bimEngine.currentModel === fragmentsModel) {
        // ROLLBACK: Restore OLD engine references
        bimEngine.webIfcApi = prevEngineState.webIfcApi;
        bimEngine.webIfcModelID = prevEngineState.webIfcModelID;
        bimEngine.currentModel = prevEngineState.currentModel;
        bimEngine.currentModelId = prevEngineState.currentModelId;
        bimEngine.invalidateModelBounds();

        // Restore scene objects
        if (bimEngine.world?.scene?.three) {
          if (fragmentsModel?.object) {
            bimEngine.world.scene.three.remove(fragmentsModel.object);
          }
          if (prevEngineState.oldSceneObject) {
            bimEngine.world.scene.three.add(prevEngineState.oldSceneObject);
          }
        }

        // Restore OLD store state
        useBimStore.setState(prevStoreState);
      }

      // Clean up newly created staged resources on failure (staging failure or commit rollback)
      if (fragmentsModel && fragmentsModel !== bimEngine.currentModel) {
        try {
          if (
            fragmentsModel.object &&
            fragmentsModel.object !== bimEngine.currentModel?.object &&
            bimEngine.world?.scene?.three
          ) {
            bimEngine.world.scene.three.remove(fragmentsModel.object);
          }
          await fragmentsModel.dispose?.();
        } catch {
          // ignore cleanup error
        }
      }

      if (
        webIfcApi &&
        modelID !== null &&
        modelID !== undefined &&
        (webIfcApi !== bimEngine.webIfcApi || modelID !== bimEngine.webIfcModelID)
      ) {
        try {
          webIfcApi.CloseModel(modelID);
        } catch {
          // ignore cleanup error
        }
      }

      if (stale) return;

      store.setLoading({
        isBusy: false,
        stage: 'Error',
        progress: 0,
        error: err.message || 'Unknown error occurred while loading IFC.',
      });

      throw err;
    }

    // 7. POST-COMMIT CLEANUP:
    // Model swap has successfully committed. Post-commit cleanup failures
    // MUST NOT trigger rollback to disposed old resources.
    if (commitCompleted) {
      if (
        prevEngineState.currentModel &&
        prevEngineState.currentModel !== fragmentsModel &&
        prevEngineState.currentModel !== bimEngine.currentModel
      ) {
        try {
          await prevEngineState.currentModel.dispose?.();
        } catch (e) {
          console.warn('Error disposing old fragments model during post-commit cleanup:', e);
        }
      }

      if (
        prevEngineState.webIfcApi &&
        prevEngineState.webIfcModelID !== null &&
        prevEngineState.webIfcModelID !== undefined &&
        prevEngineState.webIfcApi !== webIfcApi &&
        (prevEngineState.webIfcApi !== bimEngine.webIfcApi ||
          prevEngineState.webIfcModelID !== bimEngine.webIfcModelID)
      ) {
        try {
          prevEngineState.webIfcApi.CloseModel(prevEngineState.webIfcModelID);
        } catch (e) {
          console.warn('Error closing old web-ifc model during post-commit cleanup:', e);
        }
      }

      // Reset old edit state (best-effort)
      try {
        await bimEditService.resetAllEdits();
      } catch (e) {
        console.warn('Error resetting edit state during post-commit cleanup:', e);
      }

      // Clear generation preview (best-effort)
      try {
        bimGenerationService.clearPreview();
      } catch (e) {
        console.warn('Error clearing generation preview during post-commit cleanup:', e);
      }
    }
  }

  /**
   * Unloads current model and resets state.
   */
  public static async unload(): Promise<void> {
    this.loadGeneration++;
    await bimEngine.unloadModel();
    useBimStore.getState().resetModel();
  }
}

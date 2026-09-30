import * as WebIFC from 'web-ifc';
import { BimAnalysisData, StoreyData } from '@/types/bim';

export class BimAnalysisService {
  /**
   * Generates comprehensive BIM analysis, storey breakdowns, and quantity takeoffs directly from WebIFC.
   */
  public static analyzeModel(ifcApi: WebIFC.IfcAPI, modelID: number): {
    analysis: BimAnalysisData;
    storeysData: StoreyData[];
    storeyToElementIds: Map<string, number[]>;
    materials: string[];
  } {
    const storeyToElementIds = new Map<string, number[]>();
    const storeysData: StoreyData[] = [];
    const materialsSet = new Set<string>();

    const categoryCounts: Record<string, number> = {
      Walls: 0,
      Doors: 0,
      Windows: 0,
      Slabs: 0,
      Columns: 0,
      Beams: 0,
      Spaces: 0,
      Stairs: 0,
      Roofs: 0,
      Other: 0,
    };

    const storeyDistributions: Record<string, Record<string, number>> = {};

    let totalWallGrossArea = 0;
    let totalWallNetArea = 0;
    let totalSlabArea = 0;
    let totalVolume = 0;
    let totalElements = 0;

    // 1. Resolve Storeys
    const storeyIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
    const storeyIdToName = new Map<number, string>();
    const storeyElevationMap = new Map<string, number>();

    for (let i = 0; i < storeyIds.size(); i++) {
      const id = storeyIds.get(i);
      const storey = ifcApi.GetLine(modelID, id);
      const name = storey.Name?.value || `Level ${i + 1}`;
      const elevation = storey.Elevation?.value ?? 0;
      storeyIdToName.set(id, name);
      storeyElevationMap.set(name, elevation);
      storeyToElementIds.set(name, []);
      storeyDistributions[name] = {
        Walls: 0,
        Doors: 0,
        Windows: 0,
        Slabs: 0,
        Columns: 0,
        Beams: 0,
        Spaces: 0,
        Stairs: 0,
        Roofs: 0,
        Other: 0,
      };
    }

    // 2. Map Elements to Storeys via IfcRelContainedInSpatialStructure
    const relContsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
    for (let i = 0; i < relContsIds.size(); i++) {
      const rel = ifcApi.GetLine(modelID, relContsIds.get(i));
      if (rel.RelatingStructure && rel.RelatedElements) {
        const structId = rel.RelatingStructure.value;
        const storeyName = storeyIdToName.get(structId) || 'Default Storey';

        if (!storeyToElementIds.has(storeyName)) {
          storeyToElementIds.set(storeyName, []);
          storeyDistributions[storeyName] = {
            Walls: 0,
            Doors: 0,
            Windows: 0,
            Slabs: 0,
            Columns: 0,
            Beams: 0,
            Spaces: 0,
            Stairs: 0,
            Roofs: 0,
            Other: 0,
          };
        }

        const ids = rel.RelatedElements.map((o: { value: number }) => o.value);
        for (const elemId of ids) {
          storeyToElementIds.get(storeyName)!.push(elemId);
        }
      }
    }

    // Helper for category classification
    function classifyType(typeStr: string): string {
      const t = typeStr.toUpperCase();
      if (t.includes('WALL')) return 'Walls';
      if (t.includes('DOOR')) return 'Doors';
      if (t.includes('WINDOW')) return 'Windows';
      if (t.includes('SLAB')) return 'Slabs';
      if (t.includes('COLUMN')) return 'Columns';
      if (t.includes('BEAM')) return 'Beams';
      if (t.includes('SPACE')) return 'Spaces';
      if (t.includes('STAIR')) return 'Stairs';
      if (t.includes('ROOF')) return 'Roofs';
      return 'Other';
    }

    // Process all storey elements
    for (const [sName, elemIds] of storeyToElementIds.entries()) {
      const catCountMap = new Map<string, number>();

      for (const eid of elemIds) {
        totalElements++;
        const elem = ifcApi.GetLine(modelID, eid);
        if (!elem) continue;
        const cat = classifyType(elem.constructor?.name || '');
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        storeyDistributions[sName][cat] = (storeyDistributions[sName][cat] || 0) + 1;
        catCountMap.set(cat, (catCountMap.get(cat) || 0) + 1);
      }

      const categoriesSummary = Array.from(catCountMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));

      storeysData.push({
        id: `storey-${sName}`,
        name: sName,
        elevation: storeyElevationMap.get(sName) ?? 0,
        elementCount: elemIds.length,
        elementIds: elemIds,
        categories: categoriesSummary,
      });
    }

    // 3. Extract Real Quantities from IfcRelDefinesByProperties (IfcElementQuantity)
    try {
      const relDefinesIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
      for (let i = 0; i < relDefinesIds.size(); i++) {
        const rel = ifcApi.GetLine(modelID, relDefinesIds.get(i));
        if (!rel.RelatingPropertyDefinition) continue;

        const pset = ifcApi.GetLine(modelID, rel.RelatingPropertyDefinition.value);
        if (!pset || !pset.Quantities || !Array.isArray(pset.Quantities)) continue;

        for (const qRef of pset.Quantities) {
          const q = ifcApi.GetLine(modelID, qRef.value);
          if (!q || !q.Name?.value) continue;
          const qName = q.Name.value.toLowerCase();

          const areaVal = q.AreaValue?.value;
          const volVal = q.VolumeValue?.value;

          if (typeof areaVal === 'number' && !isNaN(areaVal)) {
            if (qName.includes('gross') && qName.includes('side')) {
              totalWallGrossArea += areaVal;
            } else if (qName.includes('net') && qName.includes('side')) {
              totalWallNetArea += areaVal;
            } else if (qName.includes('slab') || (pset.Name?.value?.toLowerCase().includes('slab') && qName.includes('area'))) {
              totalSlabArea += areaVal;
            } else {
              totalWallGrossArea += areaVal;
            }
          }

          if (typeof volVal === 'number' && !isNaN(volVal)) {
            totalVolume += volVal;
          }
        }
      }
    } catch {
      // Fallback if schema does not have QTO definitions
    }

    // 4. Extract Real Materials
    try {
      const relMatIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELASSOCIATESMATERIAL);
      for (let i = 0; i < relMatIds.size(); i++) {
        const rel = ifcApi.GetLine(modelID, relMatIds.get(i));
        if (!rel.RelatingMaterial) continue;

        const mat = ifcApi.GetLine(modelID, rel.RelatingMaterial.value);
        if (mat) {
          if (mat.Name?.value) {
            materialsSet.add(mat.Name.value);
          } else if (mat.ForLayerSet?.value) {
            const layerSet = ifcApi.GetLine(modelID, mat.ForLayerSet.value);
            if (layerSet && layerSet.MaterialLayers) {
              for (const lRef of layerSet.MaterialLayers) {
                const layer = ifcApi.GetLine(modelID, lRef.value);
                if (layer && layer.Material?.value) {
                  const m = ifcApi.GetLine(modelID, layer.Material.value);
                  if (m?.Name?.value) materialsSet.add(m.Name.value);
                }
              }
            }
          }
        }
      }
    } catch {
      // Non-critical
    }

    // Header schema
    let schema = 'IFC2X3';
    try {
      const header = ifcApi.GetHeaderLine(modelID, 2);
      if (header) schema = header;
    } catch {
      // fallback
    }

    const materials = Array.from(materialsSet).sort();

    const analysis: BimAnalysisData = {
      totalElements,
      schema,
      totalStoreys: storeysData.length,
      totalMaterials: materials.length,
      materials,
      categoryCounts,
      storeyDistributions,
      quantities: {
        totalWallGrossArea: Math.round(totalWallGrossArea * 100) / 100,
        totalWallNetArea: Math.round(totalWallNetArea * 100) / 100,
        totalSlabArea: Math.round(totalSlabArea * 100) / 100,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalDoorsCount: categoryCounts.Doors || 0,
        totalWindowsCount: categoryCounts.Windows || 0,
        totalSpacesCount: categoryCounts.Spaces || 0,
      },
    };

    return {
      analysis,
      storeysData,
      storeyToElementIds,
      materials,
    };
  }
}

import * as WebIFC from 'web-ifc';
import { BimFilterCriteria } from '@/types/bim';

export class BimFilterService {
  /**
   * Evaluates filter criteria against real IFC elements in the active model.
   */
  public static filterElements(
    ifcApi: WebIFC.IfcAPI,
    modelID: number,
    allElementIds: number[],
    criteria: BimFilterCriteria,
    expressIdToCategory: Map<number, string>,
    expressIdToStorey: Map<number, string>
  ): number[] {
    if (
      !criteria.type &&
      !criteria.storey &&
      !criteria.nameQuery &&
      !criteria.material &&
      !criteria.propertyName &&
      !criteria.propertyValue
    ) {
      return allElementIds;
    }

    const matches: number[] = [];

    // Pre-calculate material mapping if criteria includes material
    const elementMaterialMap = new Map<number, Set<string>>();
    if (criteria.material) {
      const relMatIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELASSOCIATESMATERIAL);
      for (let i = 0; i < relMatIds.size(); i++) {
        const rel = ifcApi.GetLine(modelID, relMatIds.get(i));
        if (!rel.RelatingMaterial || !rel.RelatedObjects) continue;
        const mat = ifcApi.GetLine(modelID, rel.RelatingMaterial.value);
        let matName = mat?.Name?.value || '';
        if (matName) {
          for (const obj of rel.RelatedObjects) {
            const eid = obj.value;
            if (!elementMaterialMap.has(eid)) elementMaterialMap.set(eid, new Set());
            elementMaterialMap.get(eid)!.add(matName.toLowerCase());
          }
        }
      }
    }

    // Pre-calculate property set mapping if criteria includes propertyName
    const elementPropertiesMap = new Map<number, Map<string, any>>();
    if (criteria.propertyName) {
      const relDefinesIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
      for (let i = 0; i < relDefinesIds.size(); i++) {
        const rel = ifcApi.GetLine(modelID, relDefinesIds.get(i));
        if (!rel.RelatedObjects || !rel.RelatingPropertyDefinition) continue;

        const pset = ifcApi.GetLine(modelID, rel.RelatingPropertyDefinition.value);
        if (!pset || !pset.HasProperties) continue;

        for (const pRef of pset.HasProperties) {
          const prop = ifcApi.GetLine(modelID, pRef.value);
          if (prop && prop.Name?.value) {
            const pName = prop.Name.value.toLowerCase();
            const pVal = prop.NominalValue?.value;

            for (const obj of rel.RelatedObjects) {
              const eid = obj.value;
              if (!elementPropertiesMap.has(eid)) elementPropertiesMap.set(eid, new Map());
              elementPropertiesMap.get(eid)!.set(pName, pVal);
            }
          }
        }
      }
    }

    const lowerQuery = criteria.nameQuery?.toLowerCase().trim();
    const lowerType = criteria.type?.toLowerCase();
    const targetStorey = criteria.storey;
    const lowerMaterial = criteria.material?.toLowerCase();
    const targetPropName = criteria.propertyName?.toLowerCase();
    const targetPropVal = criteria.propertyValue?.toLowerCase();

    for (const id of allElementIds) {
      const elem = ifcApi.GetLine(modelID, id);
      if (!elem) continue;

      // 1. Type / Category Filter
      if (lowerType) {
        const category = expressIdToCategory.get(id)?.toLowerCase() || '';
        const rawType = (elem.constructor?.name || '').toLowerCase();
        const baseType = lowerType.replace(/s$/, '');
        if (
          category !== lowerType &&
          !rawType.includes(lowerType) &&
          !rawType.includes(baseType)
        ) {
          continue;
        }
      }

      // 2. Storey Filter
      if (targetStorey) {
        const elemStorey = expressIdToStorey.get(id);
        if (elemStorey !== targetStorey) {
          continue;
        }
      }

      // 3. Name Filter
      if (lowerQuery) {
        const elemName = (elem.Name?.value || '').toLowerCase();
        if (!elemName.includes(lowerQuery)) {
          continue;
        }
      }

      // 4. Material Filter
      if (lowerMaterial) {
        const mats = elementMaterialMap.get(id);
        if (!mats || !Array.from(mats).some((m) => m.includes(lowerMaterial))) {
          continue;
        }
      }

      // 5. Property Name & Value Filter
      if (targetPropName) {
        const props = elementPropertiesMap.get(id);
        if (!props || !props.has(targetPropName)) {
          continue;
        }
        if (targetPropVal !== undefined && targetPropVal !== '') {
          const valStr = String(props.get(targetPropName) ?? '').toLowerCase();
          if (!valStr.includes(targetPropVal)) {
            continue;
          }
        }
      }

      matches.push(id);
    }

    return matches;
  }
}

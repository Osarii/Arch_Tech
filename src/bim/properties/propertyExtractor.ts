import * as WebIFC from 'web-ifc';
import { SelectedElementDetails, PropertyGroup, PropertyItem } from '@/types/bim';

/**
 * Extracts authentic IFC properties, property sets, and quantities for an expressID.
 */
export function extractElementProperties(
  ifcApi: WebIFC.IfcAPI,
  modelID: number,
  expressID: number
): SelectedElementDetails | null {
  try {
    const entity = ifcApi.GetLine(modelID, expressID);
    if (!entity) return null;

    const ifcType = entity.constructor?.name || 'IFCELEMENT';
    const globalId = entity.GlobalId?.value || 'N/A';
    const name = entity.Name?.value || `${ifcType} #${expressID}`;
    const description = entity.Description?.value || undefined;

    const propertyGroups: PropertyGroup[] = [];

    // 1. Identity & Base Attributes Group
    const baseProps: PropertyItem[] = [
      { name: 'ExpressID', value: expressID, type: 'Identifier' },
      { name: 'GlobalId', value: globalId, type: 'IfcGloballyUniqueId' },
      { name: 'IFC Class', value: ifcType.toUpperCase(), type: 'Schema Type' },
      { name: 'Name', value: name, type: 'IfcLabel' },
    ];

    if (entity.ObjectType?.value) {
      baseProps.push({ name: 'ObjectType', value: entity.ObjectType.value, type: 'IfcLabel' });
    }
    if (entity.Tag?.value) {
      baseProps.push({ name: 'Tag', value: entity.Tag.value, type: 'IfcLabel' });
    }

    propertyGroups.push({
      name: 'Attributes',
      properties: baseProps,
    });

    // 2. Resolve Property Sets & Quantities via IfcRelDefinesByProperties
    const relDefinesIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
    for (let i = 0; i < relDefinesIds.size(); i++) {
      const rel = ifcApi.GetLine(modelID, relDefinesIds.get(i));
      if (!rel.RelatedObjects || !rel.RelatingPropertyDefinition) continue;

      const isRelated = rel.RelatedObjects.some((o: { value: number }) => o.value === expressID);
      if (!isRelated) continue;

      const pset = ifcApi.GetLine(modelID, rel.RelatingPropertyDefinition.value);
      if (!pset) continue;

      const psetName = pset.Name?.value || pset.constructor?.name || 'Property Set';
      const items: PropertyItem[] = [];

      // Regular properties
      if (pset.HasProperties && Array.isArray(pset.HasProperties)) {
        for (const pRef of pset.HasProperties) {
          const prop = ifcApi.GetLine(modelID, pRef.value);
          if (prop && prop.Name?.value) {
            let val: string | number | boolean | null = null;
            if (prop.NominalValue) {
              val = prop.NominalValue.value;
            }
            items.push({
              name: prop.Name.value,
              value: val,
              type: prop.constructor?.name,
            });
          }
        }
      }

      // Quantities
      if (pset.Quantities && Array.isArray(pset.Quantities)) {
        for (const qRef of pset.Quantities) {
          const q = ifcApi.GetLine(modelID, qRef.value);
          if (q && q.Name?.value) {
            const val =
              q.LengthValue?.value ??
              q.AreaValue?.value ??
              q.VolumeValue?.value ??
              q.CountValue?.value ??
              q.WeightValue?.value ??
              q.TimeValue?.value ??
              null;
            items.push({
              name: q.Name.value,
              value: typeof val === 'number' ? Math.round(val * 1000) / 1000 : val,
              type: q.constructor?.name,
            });
          }
        }
      }

      if (items.length > 0) {
        propertyGroups.push({
          name: psetName,
          properties: items,
        });
      }
    }

    // 3. Resolve Materials via IfcRelAssociatesMaterial
    const materials: string[] = [];
    const relMatIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELASSOCIATESMATERIAL);
    for (let i = 0; i < relMatIds.size(); i++) {
      const rel = ifcApi.GetLine(modelID, relMatIds.get(i));
      if (!rel.RelatedObjects || !rel.RelatingMaterial) continue;

      const isRelated = rel.RelatedObjects.some((o: { value: number }) => o.value === expressID);
      if (!isRelated) continue;

      const mat = ifcApi.GetLine(modelID, rel.RelatingMaterial.value);
      if (mat) {
        if (mat.Name?.value) {
          materials.push(mat.Name.value);
        } else if (mat.ForLayerSet?.value) {
          const layerSet = ifcApi.GetLine(modelID, mat.ForLayerSet.value);
          if (layerSet && layerSet.MaterialLayers) {
            for (const lRef of layerSet.MaterialLayers) {
              const layer = ifcApi.GetLine(modelID, lRef.value);
              if (layer?.Material?.value) {
                const subMat = ifcApi.GetLine(modelID, layer.Material.value);
                if (subMat?.Name?.value) materials.push(subMat.Name.value);
              }
            }
          }
        }
      }
    }

    if (materials.length > 0) {
      propertyGroups.push({
        name: 'Materials',
        properties: materials.map((m, idx) => ({
          name: `Material ${idx + 1}`,
          value: m,
          type: 'IfcMaterial',
        })),
      });
    }

    // 4. Resolve Storey via IfcRelContainedInSpatialStructure
    let storey: string | undefined = undefined;
    const relContIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
    for (let i = 0; i < relContIds.size(); i++) {
      const rel = ifcApi.GetLine(modelID, relContIds.get(i));
      if (!rel.RelatedElements || !rel.RelatingStructure) continue;

      const isRelated = rel.RelatedElements.some((o: { value: number }) => o.value === expressID);
      if (!isRelated) continue;

      const struct = ifcApi.GetLine(modelID, rel.RelatingStructure.value);
      if (struct && struct.Name?.value) {
        storey = struct.Name.value;
        break;
      }
    }

    return {
      expressID,
      globalId,
      type: ifcType.toUpperCase(),
      name,
      description,
      storey,
      materials: materials.length > 0 ? materials : undefined,
      propertyGroups,
    };
  } catch (err) {
    console.warn(`Failed to extract properties for expressID ${expressID}:`, err);
    return null;
  }
}

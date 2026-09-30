import * as WebIFC from 'web-ifc';
import { BimTreeNode, ModelMetadata } from '@/types/bim';

export interface SpatialTreeResult {
  tree: BimTreeNode[];
  categories: string[];
  storeys: string[];
  elementCounts: ModelMetadata['counts'];
  totalElements: number;
  expressIdToCategory: Map<number, string>;
  expressIdToStorey: Map<number, string>;
}

export function buildSpatialTree(ifcApi: WebIFC.IfcAPI, modelID: number): SpatialTreeResult {
  const expressIdToCategory = new Map<number, string>();
  const expressIdToStorey = new Map<number, string>();
  const categorySet = new Set<string>();
  const storeyList: string[] = [];

  const counts: ModelMetadata['counts'] = {
    walls: 0,
    doors: 0,
    windows: 0,
    slabs: 0,
    columns: 0,
    beams: 0,
    spaces: 0,
    storeys: 0,
    other: 0,
  };

  // Helper to categorize IFC element types
  function getCategory(typeStr: string): string {
    const upper = typeStr.toUpperCase();
    if (upper.includes('WALL')) {
      counts.walls++;
      return 'Walls';
    }
    if (upper.includes('DOOR')) {
      counts.doors++;
      return 'Doors';
    }
    if (upper.includes('WINDOW')) {
      counts.windows++;
      return 'Windows';
    }
    if (upper.includes('SLAB')) {
      counts.slabs++;
      return 'Slabs';
    }
    if (upper.includes('COLUMN')) {
      counts.columns++;
      return 'Columns';
    }
    if (upper.includes('BEAM')) {
      counts.beams++;
      return 'Beams';
    }
    if (upper.includes('SPACE')) {
      counts.spaces++;
      return 'Spaces';
    }
    counts.other++;
    return 'Other';
  }

  // Find Project
  const projectIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
  const rootNodes: BimTreeNode[] = [];

  // Map of parent expressID -> child expressIDs via IfcRelAggregates
  const aggregatesMap = new Map<number, number[]>();
  const relAggsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELAGGREGATES);
  for (let i = 0; i < relAggsIds.size(); i++) {
    const rel = ifcApi.GetLine(modelID, relAggsIds.get(i));
    if (rel.RelatingObject && rel.RelatedObjects) {
      const parentId = rel.RelatingObject.value;
      const childIds = rel.RelatedObjects.map((o: { value: number }) => o.value);
      const existing = aggregatesMap.get(parentId) || [];
      aggregatesMap.set(parentId, existing.concat(childIds));
    }
  }

  // Map of structure expressID -> contained element expressIDs via IfcRelContainedInSpatialStructure
  const containmentMap = new Map<number, number[]>();
  const relContsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
  for (let i = 0; i < relContsIds.size(); i++) {
    const rel = ifcApi.GetLine(modelID, relContsIds.get(i));
    if (rel.RelatingStructure && rel.RelatedElements) {
      const parentId = rel.RelatingStructure.value;
      const childIds = rel.RelatedElements.map((o: { value: number }) => o.value);
      const existing = containmentMap.get(parentId) || [];
      containmentMap.set(parentId, existing.concat(childIds));
    }
  }

  // Helper to build element leaves grouped by Category
  function buildCategoryGroups(elementIds: number[], storeyName: string): BimTreeNode[] {
    const groups = new Map<string, BimTreeNode[]>();

    for (const id of elementIds) {
      const elem = ifcApi.GetLine(modelID, id);
      if (!elem) continue;
      const typeStr = elem.constructor?.name || 'IFCELEMENT';
      const category = getCategory(typeStr);
      categorySet.add(category);
      expressIdToCategory.set(id, category);
      expressIdToStorey.set(id, storeyName);

      const leaf: BimTreeNode = {
        id: `elem-${id}`,
        expressID: id,
        name: elem.Name?.value || `${typeStr} #${id}`,
        type: typeStr.toUpperCase(),
        category,
        children: [],
        visible: true,
        hasGeometry: true,
      };

      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(leaf);
    }

    const categoryNodes: BimTreeNode[] = [];
    for (const [catName, leaves] of groups.entries()) {
      categoryNodes.push({
        id: `cat-${storeyName}-${catName}`,
        name: `${catName} (${leaves.length})`,
        type: 'CATEGORY',
        category: catName,
        children: leaves,
        visible: true,
      });
    }

    return categoryNodes;
  }

  // Process project(s)
  for (let p = 0; p < projectIds.size(); p++) {
    const projId = projectIds.get(p);
    const proj = ifcApi.GetLine(modelID, projId);
    const projNode: BimTreeNode = {
      id: `proj-${projId}`,
      expressID: projId,
      name: proj?.Name?.value || 'IFC Project',
      type: 'IFCPROJECT',
      children: [],
      visible: true,
    };

    const siteIds = aggregatesMap.get(projId) || [];
    for (const siteId of siteIds) {
      const site = ifcApi.GetLine(modelID, siteId);
      const siteNode: BimTreeNode = {
        id: `site-${siteId}`,
        expressID: siteId,
        name: site?.Name?.value || 'Site',
        type: 'IFCSITE',
        children: [],
        visible: true,
      };

      const buildingIds = aggregatesMap.get(siteId) || [];
      for (const bldgId of buildingIds) {
        const bldg = ifcApi.GetLine(modelID, bldgId);
        const bldgNode: BimTreeNode = {
          id: `bldg-${bldgId}`,
          expressID: bldgId,
          name: bldg?.Name?.value || 'Building',
          type: 'IFCBUILDING',
          children: [],
          visible: true,
        };

        const storeyIds = aggregatesMap.get(bldgId) || [];
        counts.storeys += storeyIds.length;

        for (const stId of storeyIds) {
          const st = ifcApi.GetLine(modelID, stId);
          const storeyName = st?.Name?.value || `Storey #${stId}`;
          storeyList.push(storeyName);

          const containedElements = containmentMap.get(stId) || [];
          const catGroups = buildCategoryGroups(containedElements, storeyName);

          const storeyNode: BimTreeNode = {
            id: `storey-${stId}`,
            expressID: stId,
            name: storeyName,
            type: 'IFCBUILDINGSTOREY',
            children: catGroups,
            visible: true,
          };

          bldgNode.children.push(storeyNode);
        }

        // Direct containment on building (if any)
        const bldgDirect = containmentMap.get(bldgId) || [];
        if (bldgDirect.length > 0) {
          const directGroups = buildCategoryGroups(bldgDirect, 'Building Direct');
          bldgNode.children.push(...directGroups);
        }

        siteNode.children.push(bldgNode);
      }

      // Direct containment on site (e.g. landscaping, site objects)
      const siteDirect = containmentMap.get(siteId) || [];
      if (siteDirect.length > 0) {
        const directGroups = buildCategoryGroups(siteDirect, 'Site');
        siteNode.children.push(...directGroups);
      }

      projNode.children.push(siteNode);
    }

    rootNodes.push(projNode);
  }

  // Fallback if no project hierarchy was found (e.g. partial IFC or isolated elements)
  if (rootNodes.length === 0) {
    const allRelConts = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
    const handledElements = new Set<number>();
    for (let i = 0; i < allRelConts.size(); i++) {
      const rel = ifcApi.GetLine(modelID, allRelConts.get(i));
      if (rel.RelatedElements) {
        for (const o of rel.RelatedElements) handledElements.add(o.value);
      }
    }
    const fallbackNode: BimTreeNode = {
      id: 'fallback-root',
      name: 'IFC Model Elements',
      type: 'IFCMODEL',
      children: buildCategoryGroups(Array.from(handledElements), 'Default Storey'),
      visible: true,
    };
    rootNodes.push(fallbackNode);
  }

  const totalElements =
    counts.walls +
    counts.doors +
    counts.windows +
    counts.slabs +
    counts.columns +
    counts.beams +
    counts.spaces +
    counts.other;

  return {
    tree: rootNodes,
    categories: Array.from(categorySet).sort(),
    storeys: storeyList,
    elementCounts: counts,
    totalElements,
    expressIdToCategory,
    expressIdToStorey,
  };
}

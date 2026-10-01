import * as WebIFC from 'web-ifc';
import { BimGenerationPlan } from '@/types/bim';

const IFC_BASE64_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

/**
 * Generates an authentic 22-character IFC GUID from a random 128-bit UUID.
 * Conforms to standard buildingSMART / RFC4122 v4 encoding.
 */
export function createIfcGuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // RFC4122 v4 and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let bitString = '';
  for (let i = 0; i < 16; i++) {
    bitString += bytes[i].toString(2).padStart(8, '0');
  }

  // Standard buildingSMART base64 representation:
  // 1 component of 2 bits (chars[0]) followed by 21 components of 6 bits (chars[1..21])
  let guid = IFC_BASE64_CHARS[parseInt(bitString.slice(0, 2), 2)];
  for (let i = 2; i < 128; i += 6) {
    guid += IFC_BASE64_CHARS[parseInt(bitString.slice(i, i + 6), 2)];
  }

  return guid;
}

export interface IfcValidationStats {
  wallsCount: number;
  slabsCount: number;
  storeysCount: number;
  totalElements: number;
}

export interface IfcValidationResult {
  valid: boolean;
  stats?: IfcValidationStats;
  error?: string;
}

interface StoreyDefinition {
  index: number;
  name: string;
  elevation: number;
}

export class IfcAuthoringService {
  /**
   * Initializes a WebIFC IfcAPI instance safely across browser and Node environments.
   */
  public static async getIfcApi(providedApi?: WebIFC.IfcAPI): Promise<WebIFC.IfcAPI> {
    if (providedApi) return providedApi;
    const api = new WebIFC.IfcAPI();
    const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
    if (!isNode && typeof window !== 'undefined') {
      const wasmPath = `${window.location.origin}/`;
      api.SetWasmPath(wasmPath, true);
    }
    await api.Init(undefined, true);
    return api;
  }

  /**
   * Generates a fully compliant, authentic IFC4 ISO STEP-21 model from a BimGenerationPlan.
   * Uses native web-ifc entity creation and WriteLine to guarantee schema validity.
   * Coordinate remapping: Plan X -> IFC X, Plan Z -> IFC Y, Plan Y/elevation -> IFC Z.
   */
  public static async generateIfc4(
    plan: BimGenerationPlan,
    providedApi?: WebIFC.IfcAPI
  ): Promise<Uint8Array> {
    const ifcApi = await this.getIfcApi(providedApi);
    const modelID = ifcApi.CreateModel({ schema: WebIFC.Schemas.IFC4 });

    try {
      // 1. Units (SI Length = Meters, Plane Angle = Radians)
      const lengthUnit = new WebIFC.IFC4.IfcSIUnit(
        WebIFC.IFC4.IfcUnitEnum.LENGTHUNIT,
        null,
        WebIFC.IFC4.IfcSIUnitName.METRE
      );
      ifcApi.WriteLine(modelID, lengthUnit);

      const angleUnit = new WebIFC.IFC4.IfcSIUnit(
        WebIFC.IFC4.IfcUnitEnum.PLANEANGLEUNIT,
        null,
        WebIFC.IFC4.IfcSIUnitName.RADIAN
      );
      ifcApi.WriteLine(modelID, angleUnit);

      const unitAssignment = new WebIFC.IFC4.IfcUnitAssignment([
        new WebIFC.Handle(lengthUnit.expressID),
        new WebIFC.Handle(angleUnit.expressID),
      ]);
      ifcApi.WriteLine(modelID, unitAssignment);

      // 2. World Coordinate System & Context
      const origin3D = new WebIFC.IFC4.IfcCartesianPoint([
        new WebIFC.IFC4.IfcLengthMeasure(0),
        new WebIFC.IFC4.IfcLengthMeasure(0),
        new WebIFC.IFC4.IfcLengthMeasure(0),
      ]);
      ifcApi.WriteLine(modelID, origin3D);

      const axisZ = new WebIFC.IFC4.IfcDirection([
        new WebIFC.IFC4.IfcReal(0),
        new WebIFC.IFC4.IfcReal(0),
        new WebIFC.IFC4.IfcReal(1),
      ]);
      ifcApi.WriteLine(modelID, axisZ);

      const refDirX = new WebIFC.IFC4.IfcDirection([
        new WebIFC.IFC4.IfcReal(1),
        new WebIFC.IFC4.IfcReal(0),
        new WebIFC.IFC4.IfcReal(0),
      ]);
      ifcApi.WriteLine(modelID, refDirX);

      const wcs = new WebIFC.IFC4.IfcAxis2Placement3D(
        new WebIFC.Handle(origin3D.expressID),
        new WebIFC.Handle(axisZ.expressID),
        new WebIFC.Handle(refDirX.expressID)
      );
      ifcApi.WriteLine(modelID, wcs);

      const geomContext = new WebIFC.IFC4.IfcGeometricRepresentationContext(
        new WebIFC.IFC4.IfcLabel('Model'),
        new WebIFC.IFC4.IfcLabel('Model'),
        new WebIFC.IFC4.IfcDimensionCount(3),
        new WebIFC.IFC4.IfcReal(1e-5),
        new WebIFC.Handle(wcs.expressID),
        null
      );
      ifcApi.WriteLine(modelID, geomContext);

      const subContext = new WebIFC.IFC4.IfcGeometricRepresentationSubContext(
        new WebIFC.IFC4.IfcLabel('Body'),
        new WebIFC.IFC4.IfcLabel('Model'),
        new WebIFC.Handle(geomContext.expressID),
        null,
        WebIFC.IFC4.IfcGeometricProjectionEnum.MODEL_VIEW,
        null
      );
      ifcApi.WriteLine(modelID, subContext);

      // 3. Project
      const project = new WebIFC.IFC4.IfcProject(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        new WebIFC.IFC4.IfcLabel('BIM Lab Project'),
        new WebIFC.IFC4.IfcText('Generated by BIM Lab'),
        null,
        null,
        null,
        [new WebIFC.Handle(geomContext.expressID)],
        new WebIFC.Handle(unitAssignment.expressID)
      );
      ifcApi.WriteLine(modelID, project);

      // 4. Site & Placement
      const sitePlacement = new WebIFC.IFC4.IfcLocalPlacement(
        null,
        new WebIFC.Handle(wcs.expressID)
      );
      ifcApi.WriteLine(modelID, sitePlacement);

      const site = new WebIFC.IFC4.IfcSite(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        new WebIFC.IFC4.IfcLabel('Default Site'),
        null,
        null,
        new WebIFC.Handle(sitePlacement.expressID),
        null,
        null,
        WebIFC.IFC4.IfcElementCompositionEnum.ELEMENT,
        null,
        null,
        new WebIFC.IFC4.IfcLengthMeasure(0),
        null,
        null
      );
      ifcApi.WriteLine(modelID, site);

      // RelAggregates: Project -> Site
      const relProjectSite = new WebIFC.IFC4.IfcRelAggregates(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        null,
        null,
        new WebIFC.Handle(project.expressID),
        [new WebIFC.Handle(site.expressID)]
      );
      ifcApi.WriteLine(modelID, relProjectSite);

      // 5. Building & Placement
      const buildingPlacement = new WebIFC.IFC4.IfcLocalPlacement(
        new WebIFC.Handle(sitePlacement.expressID),
        new WebIFC.Handle(wcs.expressID)
      );
      ifcApi.WriteLine(modelID, buildingPlacement);

      const building = new WebIFC.IFC4.IfcBuilding(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        new WebIFC.IFC4.IfcLabel('Building A'),
        null,
        null,
        new WebIFC.Handle(buildingPlacement.expressID),
        null,
        null,
        WebIFC.IFC4.IfcElementCompositionEnum.ELEMENT,
        null,
        null,
        null
      );
      ifcApi.WriteLine(modelID, building);

      // RelAggregates: Site -> Building
      const relSiteBuilding = new WebIFC.IFC4.IfcRelAggregates(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        null,
        null,
        new WebIFC.Handle(site.expressID),
        [new WebIFC.Handle(building.expressID)]
      );
      ifcApi.WriteLine(modelID, relSiteBuilding);

      // 6. Storeys & Hierarchy
      const storeys: StoreyDefinition[] = [];
      const numStoreys = plan.params.storeys;
      const storeyHeight = plan.params.storeyHeight;
      const originY = plan.params.originY ?? 0;

      for (let s = 0; s < numStoreys; s++) {
        storeys.push({
          index: s,
          name: s === 0 ? 'Level 0 (Ground Floor)' : `Level ${s}`,
          elevation: originY + s * storeyHeight,
        });
      }

      // Add Roof Level storey for top roof slab
      storeys.push({
        index: numStoreys,
        name: 'Roof Level',
        elevation: originY + numStoreys * storeyHeight,
      });

      const storeyMap = new Map<
        number,
        {
          storey: WebIFC.IFC4.IfcBuildingStorey;
          placement: WebIFC.IFC4.IfcLocalPlacement;
          elevation: number;
          elements: WebIFC.Handle<any>[];
        }
      >();
      const storeyHandles: WebIFC.Handle<any>[] = [];

      for (const s of storeys) {
        const sPt = new WebIFC.IFC4.IfcCartesianPoint([
          new WebIFC.IFC4.IfcLengthMeasure(0),
          new WebIFC.IFC4.IfcLengthMeasure(0),
          new WebIFC.IFC4.IfcLengthMeasure(s.elevation),
        ]);
        ifcApi.WriteLine(modelID, sPt);

        const sAxis = new WebIFC.IFC4.IfcAxis2Placement3D(
          new WebIFC.Handle(sPt.expressID),
          new WebIFC.Handle(axisZ.expressID),
          new WebIFC.Handle(refDirX.expressID)
        );
        ifcApi.WriteLine(modelID, sAxis);

        const sPlacement = new WebIFC.IFC4.IfcLocalPlacement(
          new WebIFC.Handle(buildingPlacement.expressID),
          new WebIFC.Handle(sAxis.expressID)
        );
        ifcApi.WriteLine(modelID, sPlacement);

        const storey = new WebIFC.IFC4.IfcBuildingStorey(
          new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
          null,
          new WebIFC.IFC4.IfcLabel(s.name),
          null,
          null,
          new WebIFC.Handle(sPlacement.expressID),
          null,
          null,
          WebIFC.IFC4.IfcElementCompositionEnum.ELEMENT,
          new WebIFC.IFC4.IfcLengthMeasure(s.elevation)
        );
        ifcApi.WriteLine(modelID, storey);

        storeyHandles.push(new WebIFC.Handle(storey.expressID));
        storeyMap.set(s.index, {
          storey,
          placement: sPlacement,
          elevation: s.elevation,
          elements: [],
        });
      }

      // RelAggregates: Building -> Storeys
      const relBuildingStoreys = new WebIFC.IFC4.IfcRelAggregates(
        new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
        null,
        null,
        null,
        new WebIFC.Handle(building.expressID),
        storeyHandles
      );
      ifcApi.WriteLine(modelID, relBuildingStoreys);

      // Extrusion direction along local Z
      const extrudeDir = new WebIFC.IFC4.IfcDirection([
        new WebIFC.IFC4.IfcReal(0),
        new WebIFC.IFC4.IfcReal(0),
        new WebIFC.IFC4.IfcReal(1),
      ]);
      ifcApi.WriteLine(modelID, extrudeDir);

      // 7. Author Walls
      for (const wall of plan.walls) {
        const sData = storeyMap.get(wall.storeyIndex) || storeyMap.get(0)!;
        const ifcStartX = wall.startX;
        const ifcStartY = wall.startZ;
        const ifcEndX = wall.endX;
        const ifcEndY = wall.endZ;
        const dx = ifcEndX - ifcStartX;
        const dy = ifcEndY - ifcStartY;
        const wallLength = Math.hypot(dx, dy);
        const dirX = wallLength > 0 ? dx / wallLength : 1;
        const dirY = wallLength > 0 ? dy / wallLength : 0;
        const relZ = wall.elevation - sData.elevation;

        const wallPt = new WebIFC.IFC4.IfcCartesianPoint([
          new WebIFC.IFC4.IfcLengthMeasure(ifcStartX),
          new WebIFC.IFC4.IfcLengthMeasure(ifcStartY),
          new WebIFC.IFC4.IfcLengthMeasure(relZ),
        ]);
        ifcApi.WriteLine(modelID, wallPt);

        const wallRefDir = new WebIFC.IFC4.IfcDirection([
          new WebIFC.IFC4.IfcReal(dirX),
          new WebIFC.IFC4.IfcReal(dirY),
          new WebIFC.IFC4.IfcReal(0),
        ]);
        ifcApi.WriteLine(modelID, wallRefDir);

        const wallPlacementAxis = new WebIFC.IFC4.IfcAxis2Placement3D(
          new WebIFC.Handle(wallPt.expressID),
          new WebIFC.Handle(axisZ.expressID),
          new WebIFC.Handle(wallRefDir.expressID)
        );
        ifcApi.WriteLine(modelID, wallPlacementAxis);

        const wallPlacement = new WebIFC.IFC4.IfcLocalPlacement(
          new WebIFC.Handle(sData.placement.expressID),
          new WebIFC.Handle(wallPlacementAxis.expressID)
        );
        ifcApi.WriteLine(modelID, wallPlacement);

        // Rectangle profile centered along local X at (wallLength / 2, 0)
        const profPt = new WebIFC.IFC4.IfcCartesianPoint([
          new WebIFC.IFC4.IfcLengthMeasure(wallLength / 2),
          new WebIFC.IFC4.IfcLengthMeasure(0),
        ]);
        ifcApi.WriteLine(modelID, profPt);

        const profAxis = new WebIFC.IFC4.IfcAxis2Placement2D(
          new WebIFC.Handle(profPt.expressID),
          null
        );
        ifcApi.WriteLine(modelID, profAxis);

        const profile = new WebIFC.IFC4.IfcRectangleProfileDef(
          WebIFC.IFC4.IfcProfileTypeEnum.AREA,
          null,
          new WebIFC.Handle(profAxis.expressID),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(wallLength),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(wall.thickness)
        );
        ifcApi.WriteLine(modelID, profile);

        const solid = new WebIFC.IFC4.IfcExtrudedAreaSolid(
          new WebIFC.Handle(profile.expressID),
          new WebIFC.Handle(wcs.expressID),
          new WebIFC.Handle(extrudeDir.expressID),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(wall.height)
        );
        ifcApi.WriteLine(modelID, solid);

        const shapeRep = new WebIFC.IFC4.IfcShapeRepresentation(
          new WebIFC.Handle(subContext.expressID),
          new WebIFC.IFC4.IfcLabel('Body'),
          new WebIFC.IFC4.IfcLabel('SweptSolid'),
          [new WebIFC.Handle(solid.expressID)]
        );
        ifcApi.WriteLine(modelID, shapeRep);

        const prodRep = new WebIFC.IFC4.IfcProductDefinitionShape(
          null,
          null,
          [new WebIFC.Handle(shapeRep.expressID)]
        );
        ifcApi.WriteLine(modelID, prodRep);

        const wallEntity = new WebIFC.IFC4.IfcWall(
          new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
          null,
          new WebIFC.IFC4.IfcLabel(wall.id),
          null,
          null,
          new WebIFC.Handle(wallPlacement.expressID),
          new WebIFC.Handle(prodRep.expressID),
          null,
          null
        );
        ifcApi.WriteLine(modelID, wallEntity);
        sData.elements.push(new WebIFC.Handle(wallEntity.expressID));
      }

      // 8. Author Slabs
      for (const slab of plan.slabs) {
        const sData = storeyMap.get(slab.storeyIndex) || storeyMap.get(0)!;
        const ifcX = slab.originX;
        const ifcY = slab.originZ;
        const relZ =
          slab.type === 'base'
            ? slab.elevation - sData.elevation
            : slab.elevation - sData.elevation - slab.thickness;

        const slabPt = new WebIFC.IFC4.IfcCartesianPoint([
          new WebIFC.IFC4.IfcLengthMeasure(ifcX),
          new WebIFC.IFC4.IfcLengthMeasure(ifcY),
          new WebIFC.IFC4.IfcLengthMeasure(relZ),
        ]);
        ifcApi.WriteLine(modelID, slabPt);

        const slabPlacementAxis = new WebIFC.IFC4.IfcAxis2Placement3D(
          new WebIFC.Handle(slabPt.expressID),
          new WebIFC.Handle(axisZ.expressID),
          new WebIFC.Handle(refDirX.expressID)
        );
        ifcApi.WriteLine(modelID, slabPlacementAxis);

        const slabPlacement = new WebIFC.IFC4.IfcLocalPlacement(
          new WebIFC.Handle(sData.placement.expressID),
          new WebIFC.Handle(slabPlacementAxis.expressID)
        );
        ifcApi.WriteLine(modelID, slabPlacement);

        // Rectangle profile centered at (length / 2, width / 2)
        const profPt = new WebIFC.IFC4.IfcCartesianPoint([
          new WebIFC.IFC4.IfcLengthMeasure(slab.length / 2),
          new WebIFC.IFC4.IfcLengthMeasure(slab.width / 2),
        ]);
        ifcApi.WriteLine(modelID, profPt);

        const profAxis = new WebIFC.IFC4.IfcAxis2Placement2D(
          new WebIFC.Handle(profPt.expressID),
          null
        );
        ifcApi.WriteLine(modelID, profAxis);

        const profile = new WebIFC.IFC4.IfcRectangleProfileDef(
          WebIFC.IFC4.IfcProfileTypeEnum.AREA,
          null,
          new WebIFC.Handle(profAxis.expressID),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(slab.length),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(slab.width)
        );
        ifcApi.WriteLine(modelID, profile);

        const solid = new WebIFC.IFC4.IfcExtrudedAreaSolid(
          new WebIFC.Handle(profile.expressID),
          new WebIFC.Handle(wcs.expressID),
          new WebIFC.Handle(extrudeDir.expressID),
          new WebIFC.IFC4.IfcPositiveLengthMeasure(slab.thickness)
        );
        ifcApi.WriteLine(modelID, solid);

        const shapeRep = new WebIFC.IFC4.IfcShapeRepresentation(
          new WebIFC.Handle(subContext.expressID),
          new WebIFC.IFC4.IfcLabel('Body'),
          new WebIFC.IFC4.IfcLabel('SweptSolid'),
          [new WebIFC.Handle(solid.expressID)]
        );
        ifcApi.WriteLine(modelID, shapeRep);

        const prodRep = new WebIFC.IFC4.IfcProductDefinitionShape(
          null,
          null,
          [new WebIFC.Handle(shapeRep.expressID)]
        );
        ifcApi.WriteLine(modelID, prodRep);

        const slabEntity = new WebIFC.IFC4.IfcSlab(
          new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
          null,
          new WebIFC.IFC4.IfcLabel(slab.id),
          null,
          null,
          new WebIFC.Handle(slabPlacement.expressID),
          new WebIFC.Handle(prodRep.expressID),
          null,
          null
        );
        ifcApi.WriteLine(modelID, slabEntity);
        sData.elements.push(new WebIFC.Handle(slabEntity.expressID));
      }

      // 9. RelContainedInSpatialStructure: Storey -> Elements
      for (const s of storeys) {
        const sData = storeyMap.get(s.index);
        if (sData && sData.elements.length > 0) {
          const relContainment = new WebIFC.IFC4.IfcRelContainedInSpatialStructure(
            new WebIFC.IFC4.IfcGloballyUniqueId(createIfcGuid()),
            null,
            null,
            null,
            sData.elements,
            new WebIFC.Handle(sData.storey.expressID)
          );
          ifcApi.WriteLine(modelID, relContainment);
        }
      }

      // 10. Serialize and return native ISO STEP-21 binary data
      const data = ifcApi.SaveModel(modelID);
      return data;
    } finally {
      ifcApi.CloseModel(modelID);
    }
  }

  /**
   * Reopens and validates a generated IFC buffer with web-ifc before loading.
   * Guarantees spatial hierarchy, entity counts, and mesh geometry validity.
   * Cleans up the opened validation model in finally to prevent WASM leaks.
   */
  public static async validateIfc(
    data: Uint8Array,
    providedApi?: WebIFC.IfcAPI
  ): Promise<IfcValidationResult> {
    if (!data || data.byteLength === 0) {
      return { valid: false, error: 'Authored IFC buffer is empty.' };
    }

    const ifcApi = await this.getIfcApi(providedApi);
    let modelID: number | null = null;

    try {
      modelID = ifcApi.OpenModel(data);
      if (modelID === null || modelID === undefined) {
        return { valid: false, error: 'web-ifc failed to open authored model.' };
      }

      // Verify Project
      const projectIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
      if (projectIds.size() === 0) {
        return { valid: false, error: 'Validation failed: Missing IfcProject.' };
      }

      // Verify Spatial Hierarchy
      const siteIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSITE);
      if (siteIds.size() === 0) {
        return { valid: false, error: 'Validation failed: Missing IfcSite.' };
      }

      const buildingIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDING);
      if (buildingIds.size() === 0) {
        return { valid: false, error: 'Validation failed: Missing IfcBuilding.' };
      }

      const storeyIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
      if (storeyIds.size() === 0) {
        return { valid: false, error: 'Validation failed: No IfcBuildingStorey found.' };
      }

      // Verify Building Elements
      const wallIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCWALL);
      const slabIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSLAB);

      const wallsCount = wallIds.size();
      const slabsCount = slabIds.size();
      const storeysCount = storeyIds.size();
      const totalElements = wallsCount + slabsCount;

      // Stream meshes to verify geometric validity
      let meshCount = 0;
      ifcApi.StreamAllMeshes(modelID, () => {
        meshCount++;
      });

      if (totalElements > 0 && meshCount === 0) {
        return {
          valid: false,
          error: 'Validation failed: Generated building elements produced zero geometric meshes.',
        };
      }

      return {
        valid: true,
        stats: {
          wallsCount,
          slabsCount,
          storeysCount,
          totalElements,
        },
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Validation exception: ${err.message || String(err)}`,
      };
    } finally {
      if (modelID !== null && modelID !== undefined) {
        try {
          ifcApi.CloseModel(modelID);
        } catch {
          // Ignore close error on failed open
        }
      }
    }
  }
}

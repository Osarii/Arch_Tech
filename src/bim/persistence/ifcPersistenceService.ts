import * as WebIFC from 'web-ifc';
import {
  BimChange,
  PersistenceOperationStatus,
  PersistenceResult,
} from '@/types/bim';

export class IfcPersistenceService {
  /**
   * Serializes the in-memory Change Set to formatted JSON.
   */
  public static exportChangeSetAsJson(changeSet: BimChange[]): string {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalChanges: changeSet.length,
      changes: changeSet,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Parses and validates an imported Change Set JSON string.
   */
  public static importChangeSetFromJson(
    jsonString: string
  ): { success: boolean; changes: BimChange[]; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const changes: BimChange[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.changes)
        ? parsed.changes
        : [];

      // Validate each change structure
      for (const change of changes) {
        if (!change.id || typeof change.elementId !== 'number' || !change.type) {
          return {
            success: false,
            changes: [],
            error: 'Invalid change record: missing id, elementId, or type.',
          };
        }
      }

      return { success: true, changes };
    } catch (err: any) {
      return {
        success: false,
        changes: [],
        error: `Failed to parse JSON: ${err.message}`,
      };
    }
  }

  /**
   * Triggers browser download for a JSON string.
   */
  public static downloadJsonFile(filename: string, jsonString: string): void {
    if (typeof window === 'undefined' || typeof URL?.createObjectURL === 'undefined') return;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Triggers browser download for a raw IFC byte buffer.
   */
  public static downloadIfcFile(filename: string, data: Uint8Array): void {
    if (typeof window === 'undefined' || typeof URL?.createObjectURL === 'undefined') return;
    const blob = new Blob([data as any], { type: 'application/x-step' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Inspects the model's IFCUNITASSIGNMENT to determine length scale factor.
   * Standard building models use Millimeters (factor 1000) or Meters (factor 1).
   */
  public static getModelLengthUnitScale(
    ifcApi: WebIFC.IfcAPI,
    modelID: number
  ): number {
    try {
      const unitLines = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSIUNIT);
      for (let i = 0; i < unitLines.size(); i++) {
        const id = unitLines.get(i);
        const unit = ifcApi.GetLine(modelID, id);
        const unitType = unit.UnitType?.value ?? unit.UnitType;
        if (unitType === 'LENGTHUNIT' || unitType === '.LENGTHUNIT.') {
          const prefix = unit.Prefix?.value ?? unit.Prefix;
          if (prefix === 'MILLI' || prefix === '.MILLI.') return 1000;
          if (prefix === 'CENTI' || prefix === '.CENTI.') return 100;
          if (prefix === 'DECI' || prefix === '.DECI.') return 10;
          return 1;
        }
      }
    } catch {
      // Fallback
    }
    return 1000; // IFC standard default is millimeters
  }

  /**
   * Applies the supported Phase 3 operations directly to the WebIFC model in memory.
   * Unsupported operations (such as transient color overrides) are marked explicitly.
   */
  public static applyChangeSetToIfc(
    ifcApi: WebIFC.IfcAPI,
    modelID: number,
    changeSet: BimChange[]
  ): PersistenceResult {
    const operations: PersistenceOperationStatus[] = [];
    let persistedCount = 0;
    let unsupportedCount = 0;
    let failedCount = 0;

    const scale = this.getModelLengthUnitScale(ifcApi, modelID);

    for (const change of changeSet) {
      const { id, elementId, elementName, type } = change;

      // 1. Move Operation (Translates IfcCartesianPoint of element placement)
      if (type === 'move') {
        try {
          const element = ifcApi.GetLine(modelID, elementId);
          if (!element || !element.ObjectPlacement) {
            operations.push({
              changeId: id,
              elementId,
              elementName,
              type,
              status: 'failed',
              reason: 'Element does not possess an ObjectPlacement line in IFC.',
            });
            failedCount++;
            continue;
          }

          const placement = ifcApi.GetLine(modelID, element.ObjectPlacement.value);
          const axis2Placement = ifcApi.GetLine(
            modelID,
            placement.RelativePlacement.value
          );
          const point = ifcApi.GetLine(modelID, axis2Placement.Location.value);

          // delta values are in meters from the UI, scale converts to IFC units
          const deltaX = (change.newValue.x - (change.originalValue?.x || 0)) * scale;
          const deltaY = (change.newValue.y - (change.originalValue?.y || 0)) * scale;
          const deltaZ = (change.newValue.z - (change.originalValue?.z || 0)) * scale;

          if (point.Coordinates && point.Coordinates.length >= 2) {
            // Coordinate 0 (X)
            if (typeof point.Coordinates[0] === 'object' && point.Coordinates[0] !== null) {
              point.Coordinates[0].value = (point.Coordinates[0].value ?? 0) + deltaX;
            } else {
              point.Coordinates[0] = (point.Coordinates[0] ?? 0) + deltaX;
            }

            // Coordinate 1 (Y)
            if (typeof point.Coordinates[1] === 'object' && point.Coordinates[1] !== null) {
              point.Coordinates[1].value = (point.Coordinates[1].value ?? 0) + deltaY;
            } else {
              point.Coordinates[1] = (point.Coordinates[1] ?? 0) + deltaY;
            }

            // Coordinate 2 (Z) if 3D
            if (point.Coordinates.length >= 3) {
              if (typeof point.Coordinates[2] === 'object' && point.Coordinates[2] !== null) {
                point.Coordinates[2].value = (point.Coordinates[2].value ?? 0) + deltaZ;
              } else {
                point.Coordinates[2] = (point.Coordinates[2] ?? 0) + deltaZ;
              }
            }

            ifcApi.WriteLine(modelID, point);

            operations.push({
              changeId: id,
              elementId,
              elementName,
              type,
              status: 'persisted',
              details: `Translated IfcCartesianPoint #${point.expressID} by [${deltaX}, ${deltaY}, ${deltaZ}]`,
            });
            persistedCount++;
          } else {
            operations.push({
              changeId: id,
              elementId,
              elementName,
              type,
              status: 'failed',
              reason: 'IfcCartesianPoint coordinates array malformed.',
            });
            failedCount++;
          }
        } catch (err: any) {
          operations.push({
            changeId: id,
            elementId,
            elementName,
            type,
            status: 'failed',
            reason: `Error during move persistence: ${err.message}`,
          });
          failedCount++;
        }
      }

      // 2. Rotate Operation (Updates IfcDirection of RefDirection in IfcAxis2Placement3D)
      else if (type === 'rotate') {
        try {
          const element = ifcApi.GetLine(modelID, elementId);
          if (!element || !element.ObjectPlacement) {
            operations.push({
              changeId: id,
              elementId,
              elementName,
              type,
              status: 'failed',
              reason: 'Element does not possess an ObjectPlacement line in IFC.',
            });
            failedCount++;
            continue;
          }

          const placement = ifcApi.GetLine(modelID, element.ObjectPlacement.value);
          const axis2Placement = ifcApi.GetLine(
            modelID,
            placement.RelativePlacement.value
          );

          if (axis2Placement.RefDirection) {
            const refDir = ifcApi.GetLine(modelID, axis2Placement.RefDirection.value);
            const rotDeg = change.newValue.rotationY || 0;
            const rotRad = (rotDeg * Math.PI) / 180;

            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            if (refDir.DirectionRatios && refDir.DirectionRatios.length >= 2) {
              if (typeof refDir.DirectionRatios[0] === 'object' && refDir.DirectionRatios[0] !== null) {
                refDir.DirectionRatios[0].value = cos;
              } else {
                refDir.DirectionRatios[0] = cos;
              }

              if (typeof refDir.DirectionRatios[1] === 'object' && refDir.DirectionRatios[1] !== null) {
                refDir.DirectionRatios[1].value = sin;
              } else {
                refDir.DirectionRatios[1] = sin;
              }

              if (refDir.DirectionRatios.length >= 3) {
                if (typeof refDir.DirectionRatios[2] === 'object' && refDir.DirectionRatios[2] !== null) {
                  refDir.DirectionRatios[2].value = 0;
                } else {
                  refDir.DirectionRatios[2] = 0;
                }
              }

              ifcApi.WriteLine(modelID, refDir);

              operations.push({
                changeId: id,
                elementId,
                elementName,
                type,
                status: 'persisted',
                details: `Updated IfcDirection #${refDir.expressID} DirectionRatios to [${cos.toFixed(4)}, ${sin.toFixed(4)}, 0]`,
              });
              persistedCount++;
            }
          } else {
            operations.push({
              changeId: id,
              elementId,
              elementName,
              type,
              status: 'unsupported',
              reason: 'Placement does not contain an explicit RefDirection vector.',
            });
            unsupportedCount++;
          }
        } catch (err: any) {
          operations.push({
            changeId: id,
            elementId,
            elementName,
            type,
            status: 'failed',
            reason: `Error during rotate persistence: ${err.message}`,
          });
          failedCount++;
        }
      }

      // 3. Delete Operation (Safely unlinks from spatial containment and deletes line)
      else if (type === 'delete') {
        try {
          // Unlink from spatial containment structures
          const relLines = ifcApi.GetLineIDsWithType(
            modelID,
            WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE
          );
          let unlinked = false;

          for (let i = 0; i < relLines.size(); i++) {
            const relId = relLines.get(i);
            const rel = ifcApi.GetLine(modelID, relId);
            if (rel && Array.isArray(rel.RelatedElements)) {
              const originalCount = rel.RelatedElements.length;
              rel.RelatedElements = rel.RelatedElements.filter(
                (h: any) => h.value !== elementId
              );
              if (rel.RelatedElements.length !== originalCount) {
                ifcApi.WriteLine(modelID, rel);
                unlinked = true;
              }
            }
          }

          // Delete the element line
          ifcApi.DeleteLine(modelID, elementId);

          operations.push({
            changeId: id,
            elementId,
            elementName,
            type,
            status: 'persisted',
            details: `Unlinked from spatial hierarchy (found in ${unlinked ? 1 : 0} containers) and deleted line #${elementId}`,
          });
          persistedCount++;
        } catch (err: any) {
          operations.push({
            changeId: id,
            elementId,
            elementName,
            type,
            status: 'failed',
            reason: `Error during delete persistence: ${err.message}`,
          });
          failedCount++;
        }
      }

      // 4. Color / Opacity Visual Overrides (Explicitly Unsupported for native STEP-21)
      else if (type === 'color' || type === 'opacity') {
        operations.push({
          changeId: id,
          elementId,
          elementName,
          type,
          status: 'unsupported',
          reason:
            'Visual appearance overrides are transient viewport styling; STEP-21 surface styles require full presentation schema binding.',
        });
        unsupportedCount++;
      }

      // 5. Duplication (Explicitly Unsupported in V1)
      else if (type === 'duplicate') {
        operations.push({
          changeId: id,
          elementId,
          elementName,
          type,
          status: 'unsupported',
          reason:
            'Instance duplication without deep-copied geometry representation is viewport-only.',
        });
        unsupportedCount++;
      }

      // Catch-all
      else {
        operations.push({
          changeId: id,
          elementId,
          elementName,
          type,
          status: 'unsupported',
          reason: `Operation type '${type}' is not supported for native IFC persistence.`,
        });
        unsupportedCount++;
      }
    }

    return {
      success: failedCount === 0,
      persistedCount,
      unsupportedCount,
      failedCount,
      operations,
    };
  }

  /**
   * Applies the Change Set and serializes a brand new modified IFC byte array.
   * Never modifies or overwrites the original IFC file.
   */
  public static exportModifiedIfc(
    ifcApi: WebIFC.IfcAPI,
    modelID: number,
    changeSet: BimChange[],
    originalFilename = 'model.ifc'
  ): { filename: string; data: Uint8Array; result: PersistenceResult } {
    // 1. Apply changes in memory
    const result = this.applyChangeSetToIfc(ifcApi, modelID, changeSet);

    // 2. Serialize model via native WebIFC STEP-21 engine
    const data = ifcApi.SaveModel(modelID);

    // 3. Generate safe non-colliding filename
    const base = originalFilename.replace(/\.ifc$/i, '');
    const filename = `${base}_persisted.ifc`;

    result.newIfcData = data;
    result.newFilename = filename;

    return { filename, data, result };
  }
}

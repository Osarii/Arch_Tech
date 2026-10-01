import * as WebIFC from 'web-ifc';
import {
  BimChange,
  PersistenceOperationStatus,
  PersistenceResult,
} from '@/types/bim';
import { buildSpatialTree } from '@/bim/tree/spatialTreeBuilder';

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
                (h: any) => (h?.value ?? h) !== elementId
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
   * Detached and idempotent: leaves the active WebIFC model 100% untouched.
   *
   * Flow:
   * ACTIVE IFC
   * -> SaveModel baseline bytes
   * -> open TEMP WebIFC model
   * -> apply ChangeSet to TEMP only
   * -> SaveModel persisted bytes
   * -> reopen persisted bytes
   * -> semantic verification
   * -> CloseModel all TEMP models
   * -> active IFC remains untouched
   */
  public static exportModifiedIfc(
    ifcApi: WebIFC.IfcAPI,
    modelID: number,
    changeSet: BimChange[],
    originalFilename = 'model.ifc'
  ): { filename: string; data: Uint8Array; result: PersistenceResult } {
    let tempModelId: number | null = null;
    let verifyModelId: number | null = null;

    try {
      // 1. Save baseline bytes from active model (active model is only read, never mutated)
      const baselineBytes = ifcApi.SaveModel(modelID);
      if (!baselineBytes || baselineBytes.byteLength === 0) {
        throw new Error('Active IFC model failed to serialize baseline bytes.');
      }

      // 2. Open isolated temporary WebIFC model
      tempModelId = ifcApi.OpenModel(baselineBytes);
      if (tempModelId === null || tempModelId === undefined) {
        throw new Error('Failed to open temporary WebIFC model from baseline.');
      }

      // 3. Apply changes to temporary model ONLY
      const result = this.applyChangeSetToIfc(ifcApi, tempModelId, changeSet);

      // 4. Serialize persisted bytes from temporary model
      const persistedBytes = ifcApi.SaveModel(tempModelId);
      if (!persistedBytes || persistedBytes.byteLength === 0) {
        throw new Error('Failed to serialize persisted bytes from temporary WebIFC model.');
      }

      // 5. Reopen persisted bytes in temporary verification model
      try {
        verifyModelId = ifcApi.OpenModel(persistedBytes);
      } catch (err: any) {
        throw new Error(`Persisted IFC is corrupted and cannot be reopened: ${err.message}`);
      }

      if (verifyModelId === null || verifyModelId === undefined) {
        throw new Error('Persisted IFC is corrupted and cannot be reopened by WebIFC.');
      }

      // 6. Semantic verification
      this.verifySemanticPersistence(ifcApi, modelID, verifyModelId, changeSet, result);

      // 7. Generate safe non-colliding filename
      const base = originalFilename.replace(/\.ifc$/i, '');
      const filename = `${base}_persisted.ifc`;

      result.newIfcData = persistedBytes;
      result.newFilename = filename;

      return { filename, data: persistedBytes, result };
    } finally {
      // Always close all temporary models to prevent WASM memory leaks
      if (verifyModelId !== null) {
        try {
          ifcApi.CloseModel(verifyModelId);
        } catch {
          // best-effort cleanup
        }
      }
      if (tempModelId !== null) {
        try {
          ifcApi.CloseModel(tempModelId);
        } catch {
          // best-effort cleanup
        }
      }
    }
  }

  /**
   * Verifies that persisted modifications are accurately reflected in the re-opened model
   * exactly once and that spatial hierarchy and STEP semantics remain intact.
   */
  public static verifySemanticPersistence(
    ifcApi: WebIFC.IfcAPI,
    baselineModelId: number,
    verifyModelId: number,
    changeSet: BimChange[],
    result: PersistenceResult
  ): void {
    const scale = this.getModelLengthUnitScale(ifcApi, baselineModelId);

    // Only verify operations that were successfully marked as persisted
    const persistedOps = new Set(
      result.operations.filter((op) => op.status === 'persisted').map((op) => op.changeId)
    );

    // Aggregate net expected changes per element
    const netMoves = new Map<number, { dx: number; dy: number; dz: number }>();
    const lastRotates = new Map<number, number>();
    const deletedIds = new Set<number>();

    for (const change of changeSet) {
      if (!persistedOps.has(change.id)) continue;

      if (change.type === 'move') {
        const dx = (change.newValue.x - (change.originalValue?.x || 0)) * scale;
        const dy = (change.newValue.y - (change.originalValue?.y || 0)) * scale;
        const dz = (change.newValue.z - (change.originalValue?.z || 0)) * scale;
        const existing = netMoves.get(change.elementId) || { dx: 0, dy: 0, dz: 0 };
        existing.dx += dx;
        existing.dy += dy;
        existing.dz += dz;
        netMoves.set(change.elementId, existing);
      } else if (change.type === 'rotate') {
        lastRotates.set(change.elementId, change.newValue.rotationY || 0);
      } else if (change.type === 'delete') {
        deletedIds.add(change.elementId);
      }
    }

    // 1. Verify MOVE: exported placement changed exactly once
    for (const [elementId, netDelta] of netMoves.entries()) {
      if (deletedIds.has(elementId)) continue;

      const baseElement = ifcApi.GetLine(baselineModelId, elementId);
      if (!baseElement?.ObjectPlacement) continue;
      const basePlacement = ifcApi.GetLine(baselineModelId, baseElement.ObjectPlacement.value);
      const baseAxis2 = ifcApi.GetLine(baselineModelId, basePlacement.RelativePlacement.value);
      const basePoint = ifcApi.GetLine(baselineModelId, baseAxis2.Location.value);

      const baseX =
        typeof basePoint.Coordinates[0] === 'object' && basePoint.Coordinates[0] !== null
          ? (basePoint.Coordinates[0].value ?? 0)
          : (basePoint.Coordinates[0] ?? 0);
      const baseY =
        typeof basePoint.Coordinates[1] === 'object' && basePoint.Coordinates[1] !== null
          ? (basePoint.Coordinates[1].value ?? 0)
          : (basePoint.Coordinates[1] ?? 0);
      const baseZ =
        basePoint.Coordinates.length >= 3
          ? typeof basePoint.Coordinates[2] === 'object' && basePoint.Coordinates[2] !== null
            ? (basePoint.Coordinates[2].value ?? 0)
            : (basePoint.Coordinates[2] ?? 0)
          : 0;

      const repElement = ifcApi.GetLine(verifyModelId, elementId);
      if (!repElement || !repElement.ObjectPlacement) {
        throw new Error(`Semantic verification failed: element #${elementId} missing in persisted IFC.`);
      }
      const repPlacement = ifcApi.GetLine(verifyModelId, repElement.ObjectPlacement.value);
      const repAxis2 = ifcApi.GetLine(verifyModelId, repPlacement.RelativePlacement.value);
      const repPoint = ifcApi.GetLine(verifyModelId, repAxis2.Location.value);

      const repX =
        typeof repPoint.Coordinates[0] === 'object' && repPoint.Coordinates[0] !== null
          ? (repPoint.Coordinates[0].value ?? 0)
          : (repPoint.Coordinates[0] ?? 0);
      const repY =
        typeof repPoint.Coordinates[1] === 'object' && repPoint.Coordinates[1] !== null
          ? (repPoint.Coordinates[1].value ?? 0)
          : (repPoint.Coordinates[1] ?? 0);
      const repZ =
        repPoint.Coordinates.length >= 3
          ? typeof repPoint.Coordinates[2] === 'object' && repPoint.Coordinates[2] !== null
            ? (repPoint.Coordinates[2].value ?? 0)
            : (repPoint.Coordinates[2] ?? 0)
          : 0;

      const expectedX = baseX + netDelta.dx;
      const expectedY = baseY + netDelta.dy;
      const expectedZ = baseZ + netDelta.dz;

      const tol = 1e-2;
      if (
        Math.abs(repX - expectedX) > tol ||
        Math.abs(repY - expectedY) > tol ||
        Math.abs(repZ - expectedZ) > tol
      ) {
        throw new Error(
          `Semantic verification failed: element #${elementId} placement changed incorrectly. Expected [${expectedX}, ${expectedY}, ${expectedZ}], got [${repX}, ${repY}, ${repZ}].`
        );
      }
    }

    // 2. Verify ROTATE: exported RefDirection changed exactly once
    for (const [elementId, rotDeg] of lastRotates.entries()) {
      if (deletedIds.has(elementId)) continue;

      const repElement = ifcApi.GetLine(verifyModelId, elementId);
      if (!repElement?.ObjectPlacement) continue;
      const repPlacement = ifcApi.GetLine(verifyModelId, repElement.ObjectPlacement.value);
      const repAxis2 = ifcApi.GetLine(verifyModelId, repPlacement.RelativePlacement.value);
      if (!repAxis2.RefDirection) continue;

      const repRefDir = ifcApi.GetLine(verifyModelId, repAxis2.RefDirection.value);
      const rotRad = (rotDeg * Math.PI) / 180;
      const expectedCos = Math.cos(rotRad);
      const expectedSin = Math.sin(rotRad);

      const repCos =
        typeof repRefDir.DirectionRatios[0] === 'object' && repRefDir.DirectionRatios[0] !== null
          ? repRefDir.DirectionRatios[0].value
          : repRefDir.DirectionRatios[0];
      const repSin =
        typeof repRefDir.DirectionRatios[1] === 'object' && repRefDir.DirectionRatios[1] !== null
          ? repRefDir.DirectionRatios[1].value
          : repRefDir.DirectionRatios[1];

      const tol = 1e-2;
      if (Math.abs(repCos - expectedCos) > tol || Math.abs(repSin - expectedSin) > tol) {
        throw new Error(
          `Semantic verification failed: element #${elementId} RefDirection changed incorrectly for rotation ${rotDeg}°. Expected [${expectedCos.toFixed(4)}, ${expectedSin.toFixed(4)}], got [${repCos.toFixed(4)}, ${repSin.toFixed(4)}].`
        );
      }
    }

    // 3. Verify DELETE: element absent and removed from spatial containment
    for (const elementId of deletedIds) {
      let elementPresent = false;
      try {
        const line = ifcApi.GetLine(verifyModelId, elementId);
        if (line && Object.keys(line).length > 0) {
          elementPresent = true;
        }
      } catch {
        elementPresent = false;
      }
      if (elementPresent) {
        throw new Error(`Semantic verification failed: deleted element #${elementId} is still present in persisted IFC.`);
      }

      const relLines = ifcApi.GetLineIDsWithType(verifyModelId, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
      for (let i = 0; i < relLines.size(); i++) {
        const relId = relLines.get(i);
        const rel = ifcApi.GetLine(verifyModelId, relId);
        if (rel && Array.isArray(rel.RelatedElements)) {
          const found = rel.RelatedElements.some((h: any) => (h?.value ?? h) === elementId);
          if (found) {
            throw new Error(
              `Semantic verification failed: deleted element #${elementId} is still referenced in spatial containment relation #${relId}.`
            );
          }
        }
      }
    }

    // 4. Verify overall spatial tree hierarchy validity
    try {
      const tree = buildSpatialTree(ifcApi, verifyModelId);
      if (!tree || tree.totalElements < 0) {
        throw new Error('Spatial tree construction failed for persisted IFC.');
      }
    } catch (err: any) {
      throw new Error(`Semantic verification failed: invalid spatial hierarchy in persisted model: ${err.message}`);
    }
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getPolygonArea, getPolylineLength, getPolylineSegments } from '@/bim/interaction';
import { useBimStore } from '@/stores/bimStore';
import { BimEngine } from '@/bim/engine/BimEngine';

describe('BIM V3.4 advanced tool state', () => {
  beforeEach(() => {
    useBimStore.getState().resetModel();
  });

  it('calculates planar polygon areas in world coordinates', () => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4, 0, 0),
      new THREE.Vector3(4, 0, 3),
      new THREE.Vector3(0, 0, 3),
    ];

    expect(getPolygonArea(points)).toBe(12);
    expect(getPolygonArea(points.slice(0, 2))).toBe(0);
  });

  it('keeps chained measurement segments and their total deterministic', () => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(3, 4, 0),
    ];

    expect(getPolylineSegments(points)).toEqual([3, 4]);
    expect(getPolylineLength(points)).toBe(7);
  });

  it('coordinates exclusive measure and section modes without retaining a section', () => {
    const engine = Object.create(BimEngine.prototype) as BimEngine;
    const store = useBimStore.getState();
    store.setSectionPlane({ axis: 'y', offset: 25, inverted: false });

    engine.activateTool('measure', 'polyline');

    expect(useBimStore.getState().activeTool).toBe('measure');
    expect(useBimStore.getState().measureMode).toBe('polyline');
    expect(useBimStore.getState().sectionPlane).toBeNull();
  });

  it('resets section and unfinished polyline state predictably', () => {
    const store = useBimStore.getState();
    store.setSectionPlane({ axis: 'z', offset: -50, inverted: true });
    store.setPolylineMeasurement({ pointCount: 3, segmentLengths: [4, 5], totalLength: 9 });

    store.resetModel();

    expect(useBimStore.getState().sectionPlane).toBeNull();
    expect(useBimStore.getState().sectionPlaneCount).toBe(0);
    expect(useBimStore.getState().polylineMeasurement).toEqual({ pointCount: 0, segmentLengths: [], totalLength: 0 });
    expect(useBimStore.getState().activeTool).toBe('select');
  });

  it('moves, inverts, and clears the single active section plane', () => {
    const createFromNormalAndCoplanarPoint = vi.fn();
    const deleteAll = vi.fn();
    const engine = Object.create(BimEngine.prototype) as BimEngine;
    (engine as any).clipper = { enabled: false, deleteAll, createFromNormalAndCoplanarPoint };
    (engine as any).world = {};
    (engine as any).getModelBounds = () => new THREE.Box3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(100, 40, 80),
    );
    (engine as any).cancelMeasurement = vi.fn();

    engine.setSectionPlane('x', 10);
    engine.moveSectionPlane(5);
    engine.invertSectionPlane();

    expect(useBimStore.getState().sectionPlane).toEqual({ axis: 'x', offset: 15, inverted: true });
    const [, normal, point] = createFromNormalAndCoplanarPoint.mock.calls.at(-1)!;
    expect(normal.x).toBe(-1);
    expect(Math.abs(normal.y)).toBe(0);
    expect(Math.abs(normal.z)).toBe(0);
    expect(point).toMatchObject({ x: 65, y: 20, z: 40 });

    engine.resetSectionPlane();
    expect(deleteAll).toHaveBeenCalled();
    expect((engine as any).clipper.enabled).toBe(false);
    expect(useBimStore.getState().sectionPlane).toBeNull();
  });

  it('retains the camera state needed for a local saved view', () => {
    const view = {
      id: 'view-north',
      title: 'North overview',
      cameraPosition: [40, 30, 20] as [number, number, number],
      cameraTarget: [0, 0, 0] as [number, number, number],
      cameraMode: 'perspective' as const,
      selectedElements: [],
      selectedSceneElementIds: ['site:corporate-1'],
      createdAt: '10:00',
    };

    useBimStore.getState().addViewpoint(view);

    expect(useBimStore.getState().viewpoints).toEqual([view]);
    expect(useBimStore.getState().viewpoints[0].selectedSceneElementIds).toEqual(['site:corporate-1']);
  });

  it('restores a saved camera bookmark and its scene selection', async () => {
    const setLookAt = vi.fn();
    const engine = Object.create(BimEngine.prototype) as BimEngine;
    (engine as any).world = { camera: { controls: { setLookAt } } };
    (engine as any).setCameraMode = vi.fn();
    (engine as any).showAll = vi.fn();
    (engine as any).clearSelection = vi.fn();
    (engine as any).selectSceneElements = vi.fn();

    await engine.restoreViewpoint({
      id: 'view-south',
      title: 'South overview',
      cameraPosition: [30, 20, 10],
      cameraTarget: [1, 2, 3],
      cameraMode: 'orthographic',
      selectedElements: [],
      selectedSceneElementIds: ['site:warehouse-1'],
      createdAt: '10:00',
    });

    expect(setLookAt).toHaveBeenCalledWith(30, 20, 10, 1, 2, 3, true);
    expect((engine as any).setCameraMode).toHaveBeenCalledWith('orthographic');
    expect((engine as any).selectSceneElements).toHaveBeenCalledWith(['site:warehouse-1'], false);
  });
});

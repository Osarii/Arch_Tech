import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  LaLimaSiteContextService,
  laLimaSiteContextService,
} from '@/bim/site';
import { bimEngine } from '@/bim/engine/BimEngine';
import { IfcLoaderService } from '@/bim/loaders/ifcLoaderService';
import { useBimStore } from '@/stores/bimStore';

describe('La Lima concept site context', () => {
  let scene: THREE.Scene;
  let service: LaLimaSiteContextService;

  beforeEach(() => {
    scene = new THREE.Scene();
    service = new LaLimaSiteContextService();
    service.attach(scene);
  });

  afterEach(() => {
    service.clear();
    laLimaSiteContextService.clear();
    useBimStore.getState().resetModel();
  });

  it('builds an organized 1000 x 790 meter industrial and corporate masterplan', () => {
    const group = service.load();
    const size = service.getBounds().getSize(new THREE.Vector3());
    const warehouses = group.getObjectByName('IndustrialWarehouses') as THREE.InstancedMesh;
    const corporateBuildings = group.getObjectByName('CorporateBuildings') as THREE.InstancedMesh;
    const roads = group.getObjectByName('RoadSurfaces') as THREE.InstancedMesh;
    let drawables = 0;
    let logicalObjects = 0;
    group.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        drawables++;
        logicalObjects += (object as THREE.InstancedMesh).isInstancedMesh
          ? (object as THREE.InstancedMesh).count
          : 1;
      }
    });

    expect(size.x).toBeCloseTo(1000, 0);
    expect(size.z).toBeCloseTo(790, 0);
    expect(service.getBounds().isEmpty()).toBe(false);
    expect(warehouses.count).toBe(6);
    expect(corporateBuildings.count).toBe(5);
    expect(roads.count).toBeGreaterThanOrEqual(8);
    expect(group.getObjectByName('LogisticsYards')).toBeDefined();
    expect(group.getObjectByName('ParkingAreas')).toBeDefined();
    expect(group.userData.corporateDistrictAreaHectares).toBeCloseTo(8, 1);
    expect(drawables).toBe(15);
    expect(logicalObjects).toBe(222);
  });

  it('load is idempotent and never duplicates the site group', () => {
    const first = service.load();
    const second = service.load();

    expect(second).toBe(first);
    expect(scene.children.filter((child) => child.name === 'LaLimaConceptSite')).toHaveLength(1);
    expect(service.isActive()).toBe(true);
  });

  it('clear removes the group and disposes shared GPU resources once', () => {
    const group = service.load();
    const road = group.getObjectByName('RoadSurfaces') as THREE.InstancedMesh;
    const disposeGeometry = vi.spyOn(road.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(road.material as THREE.Material, 'dispose');

    service.clear();

    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(scene.getObjectByName('LaLimaConceptSite')).toBeUndefined();
    expect(service.isActive()).toBe(false);
    expect(service.getBounds().isEmpty()).toBe(true);
  });

  it('leaves no residual objects through repeated load and clear cycles', () => {
    for (let cycle = 0; cycle < 3; cycle++) {
      service.load();
      expect(scene.getObjectByName('LaLimaConceptSite')).toBeDefined();
      service.clear();
      expect(scene.getObjectByName('LaLimaConceptSite')).toBeUndefined();
    }
    expect(scene.children).toHaveLength(0);
  });

  it('removes the active site context before attempting a real IFC load', async () => {
    laLimaSiteContextService.attach(scene);
    laLimaSiteContextService.load();
    const store = useBimStore.getState();
    store.setActiveSiteContextId('la-lima-concept-site');
    store.setActiveSiteContextLabel('La Lima Concept Site');

    await expect(IfcLoaderService.loadIfc(new Uint8Array(), 'empty.ifc')).rejects.toThrow(
      'IFC file is empty.'
    );

    expect(laLimaSiteContextService.isActive()).toBe(false);
    expect(useBimStore.getState().activeSiteContextId).toBeNull();
    expect(useBimStore.getState().activeSiteContextLabel).toBeNull();
  });

  it('lets BimEngine fit the kilometer-scale site when no IFC model is active', () => {
    const previousWorld = bimEngine.world;
    const previousModel = bimEngine.currentModel;
    const fitToBox = vi.fn();
    laLimaSiteContextService.attach(scene);
    laLimaSiteContextService.load();
    bimEngine.currentModel = null;
    bimEngine.world = {
      camera: { controls: { fitToBox } },
      scene: { three: scene },
    } as any;

    try {
      bimEngine.fitModel();
      const fittedBounds = fitToBox.mock.calls[0][0] as THREE.Box3;
      expect(fittedBounds.getSize(new THREE.Vector3()).x).toBeCloseTo(1000, 0);
      expect(fitToBox).toHaveBeenCalledWith(expect.any(THREE.Box3), true);
    } finally {
      bimEngine.world = previousWorld;
      bimEngine.currentModel = previousModel;
    }
  });
});

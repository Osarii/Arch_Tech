import * as THREE from 'three';

const CASTERS = new Set(['IndustrialWarehouses', 'MultitenantBuilding', 'CorporateBuildings']);
const RECEIVERS = new Set([
  'SiteBase',
  'GreenBuffers',
  'RoadSurfaces',
  'LogisticsYards',
  'CorporateDistrictPad',
  'ParkingPads',
]);

/** Applies shadows only to major local architecture and ground surfaces, never IFC fragments or site detail. */
export function applySelectiveShadows(scene: THREE.Scene, enabled: boolean): void {
  const site = scene.getObjectByName('LaLimaConceptSite');
  if (!site) return;
  site.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = enabled && CASTERS.has(mesh.name);
    mesh.receiveShadow = enabled && RECEIVERS.has(mesh.name);
  });
}

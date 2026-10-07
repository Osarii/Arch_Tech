import * as THREE from 'three';

/** Applies shadows only to local static site masses, never arbitrary IFC fragments. */
export function applySelectiveShadows(scene: THREE.Scene, enabled: boolean): void {
  const site = scene.getObjectByName('LaLimaConceptSite');
  if (!site) return;
  site.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const [x, y, z] = mesh.scale.toArray();
    const largeMass = x * y * z >= 30000;
    mesh.castShadow = enabled && largeMass;
    mesh.receiveShadow = enabled && (largeMass || y <= 2);
  });
}

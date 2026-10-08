import * as THREE from 'three';

export const getPolylineSegments = (points: readonly THREE.Vector3[]): number[] =>
  points.slice(1).map((point, index) => point.distanceTo(points[index]));

export const getPolylineLength = (points: readonly THREE.Vector3[]): number =>
  getPolylineSegments(points).reduce((total, length) => total + length, 0);

/** Computes the area of a planar 3D polygon without changing its source points. */
export const getPolygonArea = (points: readonly THREE.Vector3[]): number => {
  if (points.length < 3) return 0;

  const normal = new THREE.Vector3();
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    normal.x += (current.y - next.y) * (current.z + next.z);
    normal.y += (current.z - next.z) * (current.x + next.x);
    normal.z += (current.x - next.x) * (current.y + next.y);
  }
  return normal.length() / 2;
};

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ModelInteraction, getCameraFocusBounds } from '@/bim/interaction';

const buildScene = () => {
  const scene = new THREE.Scene();
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial(), 2);
  mesh.name = 'TestMasses';
  mesh.userData = {
    selectable: true,
    interaction: [
      { id: 'mass:one', name: 'Mass One', type: 'Warehouse massing', category: 'Industrial', zone: 'North' },
      { id: 'mass:two', name: 'Mass Two', type: 'Office massing', category: 'Corporate', material: 'Concrete' },
    ],
  };
  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(-5, 0, 0);
  mesh.setMatrixAt(0, matrix);
  matrix.makeTranslation(5, 0, 0);
  mesh.setMatrixAt(1, matrix);
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  return { scene, mesh };
};

describe('procedural model interaction', () => {
  it('keeps hover and persistent selection independent', () => {
    const { scene } = buildScene();
    const interaction = new ModelInteraction();
    interaction.attach(scene);
    const [first, second] = interaction.getSelectableTargets();

    interaction.setHovered(first);
    interaction.setSelected(second);

    expect(interaction.getHovered()?.id).toBe('mass:one');
    expect(interaction.getSelected()?.id).toBe('mass:two');
  });

  it('maps only supplied metadata and restores hidden or isolated instances deterministically', () => {
    const { scene, mesh } = buildScene();
    const interaction = new ModelInteraction();
    interaction.attach(scene);
    const [first, second] = interaction.getSelectableTargets();
    const before = new THREE.Matrix4();
    mesh.getMatrixAt(1, before);

    expect(first.details).toMatchObject({ name: 'Mass One', category: 'Industrial', zone: 'North' });
    expect(first.details.material).toBeUndefined();

    interaction.setSelected(first);
    expect(interaction.isolateSelected()).toBe(true);
    expect(interaction.getHiddenIds()).toEqual(new Set(['mass:two']));
    expect(interaction.getIsolatedId()).toBe('mass:one');

    interaction.showAll();
    const after = new THREE.Matrix4();
    mesh.getMatrixAt(1, after);
    expect(after.equals(before)).toBe(true);
    expect(interaction.getHiddenIds()).toEqual(new Set());
    expect(interaction.getIsolatedId()).toBeNull();

    interaction.setSelected(second);
    expect(interaction.hideSelected()).toBe(true);
    expect(interaction.getSelected()).toBeNull();
    expect(interaction.getHiddenIds()).toEqual(new Set(['mass:two']));
    interaction.showAll();
    mesh.getMatrixAt(1, after);
    expect(after.equals(before)).toBe(true);
  });

  it('creates a bounded focus box around the selected element', () => {
    const source = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 4, 2));
    const focus = getCameraFocusBounds(source);

    expect(focus.min.x).toBeLessThan(source.min.x);
    expect(focus.max.x).toBeGreaterThan(source.max.x);
    expect(source.equals(new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 4, 2)))).toBe(true);
  });
});

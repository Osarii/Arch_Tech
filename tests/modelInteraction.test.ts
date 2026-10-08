import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  ModelInteraction,
  filterSceneInteractionTargets,
  getCameraFocusBounds,
  groupSceneInteractionTargets,
} from '@/bim/interaction';

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
    interaction.toggleSelected(second);
    expect(interaction.isolateSelected()).toBe(true);
    expect(interaction.getHiddenIds()).toEqual(new Set());
    expect(interaction.getIsolatedIds()).toEqual(new Set(['mass:one', 'mass:two']));

    interaction.setSelected(first);
    interaction.showAll();
    interaction.isolateSelected();
    const after = new THREE.Matrix4();
    mesh.getMatrixAt(1, after);
    expect(after.equals(before)).toBe(false);
    interaction.showAll();
    mesh.getMatrixAt(1, after);
    expect(after.equals(before)).toBe(true);
    expect(interaction.getHiddenIds()).toEqual(new Set());
    expect(interaction.getIsolatedIds()).toEqual(new Set());

    interaction.setSelected(second);
    expect(interaction.hideSelected()).toBe(true);
    expect(interaction.getSelected()).toBeNull();
    expect(interaction.getHiddenIds()).toEqual(new Set(['mass:two']));
    interaction.showAll();
    mesh.getMatrixAt(1, after);
    expect(after.equals(before)).toBe(true);
  });

  it('adds and removes multi-selection without changing source materials', () => {
    const { scene, mesh } = buildScene();
    const material = mesh.material;
    const interaction = new ModelInteraction();
    interaction.attach(scene);
    const [first, second] = interaction.getSelectableTargets();

    interaction.setSelected(first);
    interaction.toggleSelected(second);
    expect(interaction.getSelectedTargets().map((target) => target.id)).toEqual(['mass:one', 'mass:two']);
    interaction.toggleSelected(first);
    expect(interaction.getSelectedTargets().map((target) => target.id)).toEqual(['mass:two']);
    expect(mesh.material).toBe(material);
  });

  it('groups and filters only real selectable metadata for the explorer', () => {
    const { scene } = buildScene();
    const interaction = new ModelInteraction();
    interaction.attach(scene);
    const targets = interaction.getSelectableTargets();

    expect(groupSceneInteractionTargets(targets).map((group) => group.name)).toEqual(['Corporate', 'Industrial']);
    expect(filterSceneInteractionTargets(targets, 'north').map((target) => target.id)).toEqual(['mass:one']);
    expect(filterSceneInteractionTargets(targets, 'missing')).toEqual([]);
  });

  it('creates a bounded focus box around the selected element', () => {
    const source = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 4, 2));
    const focus = getCameraFocusBounds(source);

    expect(focus.min.x).toBeLessThan(source.min.x);
    expect(focus.max.x).toBeGreaterThan(source.max.x);
    expect(source.equals(new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 4, 2)))).toBe(true);
  });
});

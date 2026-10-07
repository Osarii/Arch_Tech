import { Mesh, MeshBuilder, Scene, TransformNode, type AbstractMesh } from '@babylonjs/core';
import { LA_LIMA_SITE, SITE_DETAIL_BATCHES, type BoxTransform, type MaterialKey, type SiteBatch } from './laLimaData';
import { createLaLimaMaterials } from './materials';

export type LaLimaSite = {
  root: TransformNode;
  meshes: AbstractMesh[];
  shadowCasters: AbstractMesh[];
  setDetail(enabled: boolean): void;
  dispose(): void;
};

function applyTransform(mesh: AbstractMesh, { position, scale }: BoxTransform) {
  mesh.position.set(...position);
  mesh.scaling.set(...scale);
  mesh.freezeWorldMatrix();
}

function buildInstancedGroup(
  scene: Scene,
  template: Mesh,
  batches: SiteBatch[],
  materialKey: MaterialKey,
  materials: Awaited<ReturnType<typeof createLaLimaMaterials>>,
) {
  const entries = batches.flatMap(batch => batch.transforms.map((transform, index) => ({ batch, transform, index })));
  const first = entries[0];
  const source = template.clone(first.batch.name);
  if (!source) throw new Error(`Could not create Babylon source mesh for ${materialKey}.`);
  source.setEnabled(true);
  source.material = materials[materialKey];
  source.isPickable = Boolean(first.batch.pickable);
  source.receiveShadows = true;
  source.metadata = { category: first.batch.name, logicalIndex: first.index, materialKey };
  applyTransform(source, first.transform);
  const meshes: AbstractMesh[] = [source];
  entries.slice(1).forEach(({ batch, transform, index }) => {
    const instance = source.createInstance(`${batch.name}-${index + 1}`);
    instance.isPickable = Boolean(batch.pickable);
    instance.receiveShadows = true;
    instance.metadata = { category: batch.name, logicalIndex: index, materialKey };
    applyTransform(instance, transform);
    meshes.push(instance);
  });
  return { source, meshes };
}

export async function createLaLimaSite(scene: Scene): Promise<LaLimaSite> {
  const materials = await createLaLimaMaterials(scene);
  const root = new TransformNode('LaLimaConceptSite', scene);
  root.metadata = { ...LA_LIMA_SITE };
  const template = MeshBuilder.CreateBox('LaLimaSharedBoxGeometry', { size: 1 }, scene);
  template.setEnabled(false);
  template.isPickable = false;

  const grouped = LA_LIMA_SITE.batches.reduce<Partial<Record<MaterialKey, SiteBatch[]>>>((result, batch) => {
    (result[batch.material] ??= []).push(batch);
    return result;
  }, {});
  const meshes: AbstractMesh[] = [];
  const shadowCasters: AbstractMesh[] = [];
  Object.entries(grouped).forEach(([key, batches]) => {
    if (!batches?.length) return;
    const group = buildInstancedGroup(scene, template, batches, key as MaterialKey, materials);
    group.meshes.forEach(mesh => { mesh.parent = root; meshes.push(mesh); });
    if (batches.some(batch => batch.shadowCaster)) shadowCasters.push(group.source);
  });

  let detailRoots: Mesh[] = [];
  const setDetail = (enabled: boolean) => {
    detailRoots.forEach(source => source.dispose(false, false));
    detailRoots = [];
    if (!enabled) return;
    SITE_DETAIL_BATCHES.forEach(batch => {
      const group = buildInstancedGroup(scene, template, [batch], batch.material, materials);
      group.meshes.forEach(mesh => { mesh.parent = root; });
      detailRoots.push(group.source);
    });
  };

  return {
    root,
    meshes,
    shadowCasters,
    setDetail,
    dispose() {
      detailRoots.forEach(source => source.dispose(false, false));
      root.dispose(false, false);
      template.dispose(false, false);
      Object.values(materials).forEach(material => material.dispose(true, true));
    },
  };
}

import {
  Color3,
  Matrix,
  Mesh,
  PBRMaterial,
  PointerEventTypes,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  VertexData,
  type Observer,
  type PointerInfo,
} from '@babylonjs/core';
import { IfcAPI } from 'web-ifc';

export type IfcSmokeStats = {
  loadTimeMs: number;
  meshes: number;
  triangles: number;
  fileBytes: number;
};

export class BabylonIfcSmokeTest {
  root: TransformNode | null = null;
  stats: IfcSmokeStats | null = null;
  private api: IfcAPI | null = null;
  private modelId: number | null = null;
  private pickObserver: Observer<PointerInfo> | null = null;

  constructor(private scene: Scene) {}

  async load(path = '/ifc_open_house.ifc'): Promise<IfcSmokeStats> {
    if (this.stats && this.root) {
      this.root.setEnabled(true);
      return this.stats;
    }
    const started = performance.now();
    const response = await fetch(path);
    if (!response.ok) throw new Error(`IFC request failed: ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const api = new IfcAPI();
    api.SetWasmPath('/', true);
    await api.Init(undefined, true);
    const modelId = api.OpenModel(bytes);
    const root = new TransformNode('IfcOpenHouseSmokeTest', this.scene);
    root.rotationQuaternion = Quaternion.FromEulerAngles(-Math.PI / 2, 0, 0);
    const materials = new Map<string, PBRMaterial>();
    let meshCount = 0;
    let triangles = 0;

    api.StreamAllMeshes(modelId, flatMesh => {
      for (let index = 0; index < flatMesh.geometries.size(); index++) {
        const placed = flatMesh.geometries.get(index);
        const geometry = api.GetGeometry(modelId, placed.geometryExpressID);
        try {
          const packedVertices = api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
          const sourceIndices = api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
          if (packedVertices.length === 0 || sourceIndices.length === 0) continue;
          const positions: number[] = [];
          const normals: number[] = [];
          for (let offset = 0; offset < packedVertices.length; offset += 6) {
            positions.push(packedVertices[offset], packedVertices[offset + 1], packedVertices[offset + 2]);
            normals.push(packedVertices[offset + 3], packedVertices[offset + 4], packedVertices[offset + 5]);
          }
          const mesh = new Mesh(`IFC-${flatMesh.expressID}-${placed.geometryExpressID}-${index}`, this.scene);
          const data = new VertexData();
          data.positions = positions;
          data.normals = normals;
          data.indices = Array.from(sourceIndices);
          data.applyToMesh(mesh, true);
          const transform = Matrix.FromArray(placed.flatTransformation);
          const scaling = new Vector3();
          const rotation = new Quaternion();
          const translation = new Vector3();
          transform.decompose(scaling, rotation, translation);
          mesh.scaling.copyFrom(scaling);
          mesh.rotationQuaternion = rotation;
          mesh.position.copyFrom(translation);
          mesh.parent = root;
          mesh.isPickable = true;
          mesh.metadata = { expressId: flatMesh.expressID };
          const colorKey = [placed.color.x, placed.color.y, placed.color.z, placed.color.w].map(value => value.toFixed(2)).join('-');
          let material = materials.get(colorKey);
          if (!material) {
            material = new PBRMaterial(`IFC-material-${colorKey}`, this.scene);
            material.albedoColor = new Color3(placed.color.x, placed.color.y, placed.color.z);
            material.alpha = placed.color.w;
            material.metallic = 0;
            material.roughness = .78;
            material.transparencyMode = placed.color.w < .99 ? PBRMaterial.PBRMATERIAL_ALPHABLEND : PBRMaterial.PBRMATERIAL_OPAQUE;
            materials.set(colorKey, material);
          }
          mesh.material = material;
          mesh.freezeWorldMatrix();
          triangles += sourceIndices.length / 3;
          meshCount++;
        } finally {
          geometry.delete();
        }
      }
    });

    this.api = api;
    this.modelId = modelId;
    this.root = root;
    this.stats = { loadTimeMs: performance.now() - started, meshes: meshCount, triangles, fileBytes: bytes.byteLength };
    this.pickObserver = this.scene.onPointerObservable.add(pointer => {
      if (pointer.type !== PointerEventTypes.POINTERPICK) return;
      this.scene.meshes.forEach(mesh => { mesh.renderOutline = false; });
      const picked = pointer.pickInfo?.pickedMesh;
      if (picked?.parent === root) {
        picked.outlineColor = new Color3(1, .75, 0);
        picked.outlineWidth = .05;
        picked.renderOutline = true;
      }
    });
    return this.stats;
  }

  setEnabled(enabled: boolean) {
    this.root?.setEnabled(enabled);
  }

  getBounds() {
    return this.root?.getHierarchyBoundingVectors(true) ?? null;
  }

  dispose() {
    if (this.pickObserver) this.scene.onPointerObservable.remove(this.pickObserver);
    this.pickObserver = null;
    this.root?.dispose(false, true);
    this.root = null;
    if (this.api && this.modelId !== null) this.api.CloseModel(this.modelId);
    this.api?.Dispose();
    this.api = null;
    this.modelId = null;
    this.stats = null;
  }
}

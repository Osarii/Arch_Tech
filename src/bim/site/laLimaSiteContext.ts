import * as THREE from 'three';
import { createLaLimaMaterialPalette } from './laLimaMaterials';
import type { SceneInteractionDetails } from '../interaction';

export const LA_LIMA_SITE_CONTEXT_ID = 'la-lima-concept-site';
export const LA_LIMA_SITE_CONTEXT_LABEL = 'La Lima Concept Site';

type BoxTransform = {
  position: [number, number, number];
  scale: [number, number, number];
};

const siteElement = (
  id: string,
  name: string,
  type: string,
  category: string,
  zone: string,
  material: string
): SceneInteractionDetails => ({
  id,
  name,
  type,
  category,
  zone,
  project: LA_LIMA_SITE_CONTEXT_LABEL,
  material,
  elementId: id,
});

export class LaLimaSiteContextService {
  private scene: THREE.Scene | null = null;
  private group: THREE.Group | null = null;
  private bounds = new THREE.Box3();

  public attach(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.group && this.group.parent !== scene) {
      this.group.removeFromParent();
      scene.add(this.group);
    }
  }

  public load(): THREE.Group {
    if (!this.scene) throw new Error('Attach the La Lima site context to a scene before loading it.');
    if (this.group) {
      if (this.group.parent !== this.scene) this.scene.add(this.group);
      return this.group;
    }

    const group = new THREE.Group();
    group.name = 'LaLimaConceptSite';
    group.userData = {
      siteWidthMeters: 1000,
      siteDepthMeters: 790,
      corporateDistrictAreaHectares: 7.98,
      warehouseCount: 6,
      corporateBuildingCount: 5,
      logicalObjectCount: 297,
      estimatedDrawCalls: 21,
      estimatedTriangles: 3564,
    };

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = createLaLimaMaterialPalette();

    group.add(this.createBox('SiteBase', geometry, materials.terrain, [0, -1, 0], [1000, 2, 790]));
    group.add(
      this.createInstances('GreenBuffers', geometry, materials.grass, [
        { position: [0, 0.25, -385], scale: [1000, 0.5, 20] },
        { position: [0, 0.25, 385], scale: [1000, 0.5, 20] },
        { position: [-490, 0.25, 0], scale: [20, 0.5, 750] },
        { position: [490, 0.25, 0], scale: [20, 0.5, 750] },
        { position: [181, 0.35, 0], scale: [6, 0.7, 750] },
        { position: [207, 0.35, -247.5], scale: [8, 0.7, 285] },
      ])
    );

    const roadGroup = new THREE.Group();
    roadGroup.name = 'RoadNetwork';
    const roads: BoxTransform[] = [
      { position: [170, 0.45, 0], scale: [14, 0.5, 750] },
      { position: [192, 0.45, 0], scale: [14, 0.5, 750] },
      { position: [0, 0.45, -95], scale: [960, 0.5, 18] },
      { position: [0, 0.45, 145], scale: [960, 0.5, 18] },
      { position: [0, 0.45, 335], scale: [960, 0.5, 18] },
      { position: [-455, 0.45, 0], scale: [18, 0.5, 730] },
      { position: [-185, 0.45, -175], scale: [540, 0.5, 18] },
      { position: [145, 0.45, 215], scale: [18, 0.5, 240] },
    ];
    roadGroup.add(this.createInstances('RoadSurfaces', geometry, materials.roadAsphalt, roads));

    const markings: BoxTransform[] = [];
    for (const x of [170, 192]) {
      for (let z = -350; z <= 350; z += 30) {
        markings.push({ position: [x, 0.73, z], scale: [0.7, 0.08, 12] });
      }
    }
    for (const z of [-95, 145, 335]) {
      for (let x = -430; x <= 430; x += 45) {
        markings.push({ position: [x, 0.73, z], scale: [18, 0.08, 0.7] });
      }
    }
    roadGroup.add(this.createInstances('RoadMarkings', geometry, materials.roadMarking, markings));
    group.add(roadGroup);

    const industrialGroup = new THREE.Group();
    industrialGroup.name = 'IndustrialDistrict';
    const warehouseCenters: Array<[number, number]> = [
      [-350, 55],
      [-150, 55],
      [50, 55],
      [-350, 240],
      [-150, 240],
      [50, 240],
    ];
    industrialGroup.add(
      this.createInstances(
        'IndustrialWarehouses',
        geometry,
        materials.industrialPanel,
        warehouseCenters.map(([x, z]) => ({ position: [x, 9, z], scale: [160, 18, 82] })),
        {
          kind: 'warehouse',
          logicalCount: 6,
          selectable: true,
          interaction: warehouseCenters.map((_, index) => siteElement(
            `la-lima:warehouse:${index + 1}`,
            `Industrial Warehouse ${index + 1}`,
            'Warehouse massing',
            'Industrial',
            'Industrial District',
            'La Lima Industrial Metal Panel'
          )),
        }
      )
    );
    industrialGroup.add(
      this.createInstances(
        'IndustrialWarehouseRoofs',
        geometry,
        materials.industrialRoof,
        warehouseCenters.map(([x, z]) => ({ position: [x, 18.4, z], scale: [164, 1.2, 86] }))
      )
    );
    industrialGroup.add(
      this.createInstances(
        'LoadingDocks',
        geometry,
        materials.loadingDock,
        warehouseCenters.flatMap(([x, z]) => [
          { position: [x - 42, 1.2, z - 47], scale: [34, 2.4, 10] as [number, number, number] },
          { position: [x + 42, 1.2, z - 47], scale: [34, 2.4, 10] as [number, number, number] },
        ])
      )
    );
    industrialGroup.add(
      this.createInstances(
        'IndustrialDockDoors',
        geometry,
        materials.darkMetal,
        warehouseCenters.flatMap(([x, z]) =>
          [-48, 0, 48].map((offset) => ({
            position: [x + offset, 5.5, z - 41.6] as [number, number, number],
            scale: [24, 9, 0.8] as [number, number, number],
          }))
        )
      )
    );
    industrialGroup.add(
      this.createInstances(
        'IndustrialSkylights',
        geometry,
        materials.corporateFacade,
        warehouseCenters.flatMap(([x, z]) =>
          [-45, 0, 45].map((offset) => ({
            position: [x + offset, 19.15, z] as [number, number, number],
            scale: [24, 0.3, 12] as [number, number, number],
          }))
        )
      )
    );
    industrialGroup.add(
      this.createBox(
        'MultitenantBuilding',
        geometry,
        materials.industrialPanel,
        [40, 12, -35],
        [180, 24, 72],
        {
          selectable: true,
          interaction: siteElement(
            'la-lima:multitenant',
            'Multitenant Building',
            'Multitenant massing',
            'Industrial',
            'Industrial District',
            'La Lima Industrial Metal Panel'
          ),
        }
      )
    );
    industrialGroup.add(
      this.createBox('MultitenantRoof', geometry, materials.industrialRoof, [40, 24.6, -35], [184, 1.2, 76])
    );
    group.add(industrialGroup);

    const logisticsGroup = new THREE.Group();
    logisticsGroup.name = 'LogisticsDistrict';
    logisticsGroup.add(
      this.createInstances(
        'LogisticsYards',
        geometry,
        materials.industrialConcrete,
        [
          { position: [-340, 0.6, -255], scale: [190, 1.2, 120] },
          { position: [-105, 0.6, -255], scale: [190, 1.2, 120] },
        ],
        {
          kind: 'logistics-yard',
          logicalCount: 2,
          selectable: true,
          interaction: ['North Logistics Yard', 'South Logistics Yard'].map((name, index) => siteElement(
            `la-lima:logistics-yard:${index + 1}`,
            name,
            'Logistics yard',
            'Logistics',
            'Logistics District',
            'La Lima Industrial Concrete'
          )),
        }
      )
    );
    logisticsGroup.add(
      this.createInstances(
        'LogisticsDockDoors',
        geometry,
        materials.darkMetal,
        [-340, -105].flatMap((x) =>
          [-60, -20, 20, 60].map((offset) => ({
            position: [x + offset, 3, -194.5] as [number, number, number],
            scale: [24, 6, 1] as [number, number, number],
          }))
        )
      )
    );
    group.add(logisticsGroup);

    const corporateGroup = new THREE.Group();
    corporateGroup.name = 'CorporateDistrict';
    corporateGroup.userData.areaHectares = 7.98;
    corporateGroup.add(
      this.createBox('CorporateDistrictPad', geometry, materials.grass, [350, 0.2, -247.5], [280, 0.4, 285])
    );
    const corporateBuildings: BoxTransform[] = [
      { position: [255, 16, -305], scale: [44, 32, 44] },
      { position: [335, 22, -305], scale: [54, 44, 44] },
      { position: [425, 18, -305], scale: [48, 36, 44] },
      { position: [285, 15, -185], scale: [58, 30, 42] },
      { position: [405, 20, -185], scale: [66, 40, 42] },
    ];
    corporateGroup.add(
      this.createInstances('CorporateBuildings', geometry, materials.corporateConcrete, corporateBuildings, {
        kind: 'corporate-building',
        logicalCount: 5,
        selectable: true,
        interaction: corporateBuildings.map((_, index) => siteElement(
          `la-lima:corporate:${index + 1}`,
          `Corporate Building ${index + 1}`,
          'Corporate office massing',
          'Corporate',
          'Corporate District',
          'La Lima Corporate Concrete'
        )),
      })
    );
    corporateGroup.add(
      this.createInstances(
        'CorporateRoofs',
        geometry,
        materials.industrialRoof,
        corporateBuildings.map(({ position, scale }) => ({
          position: [position[0], position[1] * 2 + 0.6, position[2]],
          scale: [scale[0] + 3, 1.2, scale[2] + 3],
        }))
      )
    );
    corporateGroup.add(
      this.createInstances(
        'CorporateGlassBands',
        geometry,
        materials.corporateFacade,
        corporateBuildings.flatMap(({ position: [x, y, z], scale: [width, , depth] }) => [
          { position: [x, y * 0.75, z + depth / 2 + 0.45], scale: [width * 0.72, 4, 0.8] },
          { position: [x, y * 1.25, z + depth / 2 + 0.45], scale: [width * 0.72, 4, 0.8] },
          { position: [x + width / 2 + 0.45, y * 0.75, z], scale: [0.8, 4, depth * 0.72] },
          { position: [x + width / 2 + 0.45, y * 1.25, z], scale: [0.8, 4, depth * 0.72] },
        ])
      )
    );
    corporateGroup.add(
      this.createInstances(
        'CorporateEntrances',
        geometry,
        materials.corporateFacade,
        corporateBuildings.map(({ position: [x, , z], scale: [, , depth] }) => ({
          position: [x, 2.5, z + depth / 2 + 2],
          scale: [12, 5, 4],
        }))
      )
    );
    group.add(corporateGroup);

    const parkingGroup = new THREE.Group();
    parkingGroup.name = 'ParkingAreas';
    const parkingPads: BoxTransform[] = [
      { position: [350, 0.55, -365], scale: [250, 0.7, 30] },
      { position: [350, 0.55, -245], scale: [250, 0.7, 30] },
      { position: [40, 0.55, -78], scale: [180, 0.7, 24] },
    ];
    parkingGroup.add(this.createInstances('ParkingPads', geometry, materials.parkingAsphalt, parkingPads));
    const parkingLines: BoxTransform[] = [];
    for (const z of [-365, -245]) {
      for (let x = 235; x <= 465; x += 12) {
        parkingLines.push({ position: [x, 0.94, z], scale: [0.35, 0.08, 12] });
      }
    }
    for (let x = -40; x <= 120; x += 10) {
      parkingLines.push({ position: [x, 0.94, -78], scale: [0.3, 0.08, 10] });
    }
    parkingGroup.add(this.createInstances('ParkingLines', geometry, materials.parkingMarking, parkingLines));
    parkingGroup.add(
      this.createInstances(
        'ParkingMedians',
        geometry,
        materials.industrialConcrete,
        [-365, -245].flatMap((z) =>
          [235, 350, 465].map((x) => ({
            position: [x, 1.1, z] as [number, number, number],
            scale: [7, 1.4, 24] as [number, number, number],
          }))
        )
      )
    );
    group.add(parkingGroup);

    this.group = group;
    this.scene.add(group);
    group.updateWorldMatrix(true, true);
    this.bounds.setFromObject(group);
    return group;
  }

  public clear(): void {
    if (!this.group) return;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => materials.add(material));
      else if (mesh.material) materials.add(mesh.material);
    });
    this.group.removeFromParent();
    this.group.clear();
    materials.forEach((material) => {
      const mapped = material as THREE.MeshStandardMaterial;
      for (const texture of [mapped.map, mapped.normalMap, mapped.roughnessMap, mapped.metalnessMap]) {
        if (texture) textures.add(texture);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    this.group = null;
    this.bounds.makeEmpty();
  }

  public isActive(): boolean {
    return Boolean(this.group?.parent);
  }

  public getBounds(): THREE.Box3 {
    return this.bounds.clone();
  }

  private createBox(
    name: string,
    geometry: THREE.BoxGeometry,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
    userData: Record<string, unknown> = {}
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.userData = userData;
    return mesh;
  }

  private createInstances(
    name: string,
    geometry: THREE.BoxGeometry,
    material: THREE.Material,
    transforms: BoxTransform[],
    userData: Record<string, unknown> = {}
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    const transform = new THREE.Object3D();
    transforms.forEach(({ position, scale }, index) => {
      transform.position.set(...position);
      transform.scale.set(...scale);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    mesh.name = name;
    mesh.userData = { logicalCount: transforms.length, ...userData };
    return mesh;
  }
}

export const laLimaSiteContextService = new LaLimaSiteContextService();

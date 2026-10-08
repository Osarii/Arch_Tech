import * as THREE from 'three';

type TextureChannel = 'color' | 'normal' | 'roughness' | 'metalness';

type LaLimaMaterialSpec = {
  source: 'ambientcg' | 'polyhaven';
  materialId: string;
  tier: 512;
  license: 'CC0-1.0';
  sourceUrl: string;
  authors: readonly string[];
  channels: Partial<Record<TextureChannel, string>>;
  repeat: number;
};

const assetPath = (folder: string, channel: TextureChannel) =>
  `/materials/la-lima/${folder}/${channel}.png`;

export const LA_LIMA_MATERIAL_SPECS = {
  roadAsphalt: {
    source: 'ambientcg',
    materialId: 'Asphalt007',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/Asphalt007',
    authors: [],
    channels: {
      color: assetPath('road-asphalt', 'color'),
      normal: assetPath('road-asphalt', 'normal'),
    },
    repeat: 48,
  },
  parkingAsphalt: {
    source: 'ambientcg',
    materialId: 'Asphalt005',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/Asphalt005',
    authors: [],
    channels: {
      color: assetPath('parking-asphalt', 'color'),
      normal: assetPath('parking-asphalt', 'normal'),
    },
    repeat: 20,
  },
  grass: {
    source: 'ambientcg',
    materialId: 'Grass001',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/Grass001',
    authors: [],
    channels: { color: assetPath('grass', 'color') },
    repeat: 32,
  },
  industrialConcrete: {
    source: 'ambientcg',
    materialId: 'Concrete003',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/Concrete003',
    authors: [],
    channels: {
      color: assetPath('industrial-concrete', 'color'),
      normal: assetPath('industrial-concrete', 'normal'),
    },
    repeat: 12,
  },
  corporateConcrete: {
    source: 'polyhaven',
    materialId: 'brushed_concrete',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://polyhaven.com/a/brushed_concrete',
    authors: ['Dario Barresi', 'Dimitrios Savva'],
    channels: {
      color: assetPath('corporate-concrete', 'color'),
      normal: assetPath('corporate-concrete', 'normal'),
    },
    repeat: 10,
  },
  industrialMetal: {
    source: 'ambientcg',
    materialId: 'CorrugatedSteel005',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/CorrugatedSteel005',
    authors: [],
    channels: {
      color: assetPath('industrial-metal', 'color'),
      normal: assetPath('industrial-metal', 'normal'),
      metalness: assetPath('industrial-metal', 'metalness'),
    },
    repeat: 18,
  },
  corporateFacade: {
    source: 'ambientcg',
    materialId: 'Facade001',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://ambientcg.com/a/Facade001',
    authors: [],
    channels: {
      color: assetPath('corporate-facade', 'color'),
      normal: assetPath('corporate-facade', 'normal'),
      metalness: assetPath('corporate-facade', 'metalness'),
    },
    repeat: 6,
  },
  roofProfile: {
    source: 'polyhaven',
    materialId: 'box_profile_metal_sheet',
    tier: 512,
    license: 'CC0-1.0',
    sourceUrl: 'https://polyhaven.com/a/box_profile_metal_sheet',
    authors: ['Amal Kumar'],
    channels: {
      normal: assetPath('roof-profile', 'normal'),
      roughness: assetPath('roof-profile', 'roughness'),
      metalness: assetPath('roof-profile', 'metalness'),
    },
    repeat: 24,
  },
} as const satisfies Record<string, LaLimaMaterialSpec>;

export type LaLimaMaterialPalette = {
  terrain: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  roadAsphalt: THREE.MeshStandardMaterial;
  parkingAsphalt: THREE.MeshStandardMaterial;
  industrialConcrete: THREE.MeshStandardMaterial;
  corporateConcrete: THREE.MeshStandardMaterial;
  industrialPanel: THREE.MeshStandardMaterial;
  industrialMetal: THREE.MeshStandardMaterial;
  industrialRoof: THREE.MeshStandardMaterial;
  loadingDock: THREE.MeshStandardMaterial;
  corporateFacade: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  roadMarking: THREE.MeshBasicMaterial;
  parkingMarking: THREE.MeshBasicMaterial;
};

export function createLaLimaMaterialPalette(
  loader: THREE.TextureLoader = new THREE.TextureLoader()
): LaLimaMaterialPalette {
  const textures = new Map<string, THREE.Texture>();
  const loadTexture = (path: string | undefined, repeat: number, color: boolean) => {
    if (!path) return null;
    const cached = textures.get(path);
    if (cached) return cached;
    const texture = loader.load(path);
    texture.name = `La Lima ${path.split('/').slice(-2).join(' ')}`;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = 2;
    textures.set(path, texture);
    return texture;
  };
  const maps = (spec: LaLimaMaterialSpec) => ({
    map: loadTexture(spec.channels.color, spec.repeat, true),
    normalMap: loadTexture(spec.channels.normal, spec.repeat, false),
    roughnessMap: loadTexture(spec.channels.roughness, spec.repeat, false),
    metalnessMap: loadTexture(spec.channels.metalness, spec.repeat, false),
  });

  const industrialConcrete = new THREE.MeshStandardMaterial({
    name: 'La Lima Industrial Concrete',
    ...maps(LA_LIMA_MATERIAL_SPECS.industrialConcrete),
    color: 0xb0b6b2,
    roughness: 0.8,
    metalness: 0.06,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  const industrialMetal = new THREE.MeshStandardMaterial({
    name: 'La Lima Industrial Metal Panel',
    ...maps(LA_LIMA_MATERIAL_SPECS.industrialMetal),
    color: 0xb6c0c5,
    roughness: 0.38,
    metalness: 0.75,
    normalScale: new THREE.Vector2(0.6, 0.6),
  });

  return {
    terrain: new THREE.MeshStandardMaterial({
      name: 'La Lima Terrain',
      color: 0x1e2221,
      roughness: 0.96,
      metalness: 0.04,
    }),
    grass: new THREE.MeshStandardMaterial({
      name: 'La Lima Grass',
      ...maps(LA_LIMA_MATERIAL_SPECS.grass),
      color: 0x445c48,
      roughness: 0.9,
      metalness: 0.02,
    }),
    roadAsphalt: new THREE.MeshStandardMaterial({
      name: 'La Lima Road Asphalt',
      ...maps(LA_LIMA_MATERIAL_SPECS.roadAsphalt),
      color: 0x24272a,
      roughness: 0.78,
      metalness: 0.08,
      normalScale: new THREE.Vector2(0.58, 0.58),
    }),
    parkingAsphalt: new THREE.MeshStandardMaterial({
      name: 'La Lima Parking Asphalt',
      ...maps(LA_LIMA_MATERIAL_SPECS.parkingAsphalt),
      color: 0x3a3e42,
      roughness: 0.86,
      metalness: 0.05,
      normalScale: new THREE.Vector2(0.4, 0.4),
    }),
    industrialConcrete,
    corporateConcrete: new THREE.MeshStandardMaterial({
      name: 'La Lima Corporate Concrete',
      ...maps(LA_LIMA_MATERIAL_SPECS.corporateConcrete),
      color: 0xd8dedc,
      roughness: 0.62,
      metalness: 0.09,
      normalScale: new THREE.Vector2(0.32, 0.32),
    }),
    industrialPanel: industrialMetal,
    industrialMetal,
    industrialRoof: new THREE.MeshStandardMaterial({
      name: 'La Lima Neutral Roof Profile',
      ...maps(LA_LIMA_MATERIAL_SPECS.roofProfile),
      color: 0x546066,
      roughness: 0.46,
      metalness: 0.82,
      normalScale: new THREE.Vector2(0.72, 0.72),
    }),
    loadingDock: industrialConcrete,
    corporateFacade: new THREE.MeshStandardMaterial({
      name: 'La Lima Corporate Facade',
      ...maps(LA_LIMA_MATERIAL_SPECS.corporateFacade),
      color: 0x162836,
      roughness: 0.04,
      metalness: 0.94,
      normalScale: new THREE.Vector2(0.08, 0.08),
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      name: 'La Lima Dark Metal',
      color: 0x14181c,
      roughness: 0.32,
      metalness: 0.85,
    }),
    roadMarking: new THREE.MeshBasicMaterial({
      name: 'La Lima Road Marking',
      color: 0xf2c842,
    }),
    parkingMarking: new THREE.MeshBasicMaterial({
      name: 'La Lima Parking Marking',
      color: 0xf5f7f5,
    }),
  };
}

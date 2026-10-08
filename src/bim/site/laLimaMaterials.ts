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
    color: 0xb5bcb8,
    roughness: 0.82,
    metalness: 0.05,
    normalScale: new THREE.Vector2(0.45, 0.45),
  });
  const industrialMetal = new THREE.MeshStandardMaterial({
    name: 'La Lima Industrial Metal Panel',
    ...maps(LA_LIMA_MATERIAL_SPECS.industrialMetal),
    color: 0xb8c2c7,
    roughness: 0.42,
    metalness: 0.72,
    normalScale: new THREE.Vector2(0.55, 0.55),
  });

  return {
    terrain: new THREE.MeshStandardMaterial({
      name: 'La Lima Terrain',
      color: 0x222625,
      roughness: 0.95,
      metalness: 0.05,
    }),
    grass: new THREE.MeshStandardMaterial({
      name: 'La Lima Grass',
      ...maps(LA_LIMA_MATERIAL_SPECS.grass),
      color: 0x4a634e,
      roughness: 0.92,
      metalness: 0.02,
    }),
    roadAsphalt: new THREE.MeshStandardMaterial({
      name: 'La Lima Road Asphalt',
      ...maps(LA_LIMA_MATERIAL_SPECS.roadAsphalt),
      color: 0x2d3033,
      roughness: 0.82,
      metalness: 0.06,
      normalScale: new THREE.Vector2(0.5, 0.5),
    }),
    parkingAsphalt: new THREE.MeshStandardMaterial({
      name: 'La Lima Parking Asphalt',
      ...maps(LA_LIMA_MATERIAL_SPECS.parkingAsphalt),
      color: 0x42464a,
      roughness: 0.88,
      metalness: 0.04,
      normalScale: new THREE.Vector2(0.38, 0.38),
    }),
    industrialConcrete,
    corporateConcrete: new THREE.MeshStandardMaterial({
      name: 'La Lima Corporate Concrete',
      ...maps(LA_LIMA_MATERIAL_SPECS.corporateConcrete),
      color: 0xd6dcda,
      roughness: 0.68,
      metalness: 0.08,
      normalScale: new THREE.Vector2(0.35, 0.35),
    }),
    industrialPanel: industrialMetal,
    industrialMetal,
    industrialRoof: new THREE.MeshStandardMaterial({
      name: 'La Lima Neutral Roof Profile',
      ...maps(LA_LIMA_MATERIAL_SPECS.roofProfile),
      color: 0x647076,
      roughness: 0.52,
      metalness: 0.78,
      normalScale: new THREE.Vector2(0.65, 0.65),
    }),
    loadingDock: industrialConcrete,
    corporateFacade: new THREE.MeshStandardMaterial({
      name: 'La Lima Corporate Facade',
      ...maps(LA_LIMA_MATERIAL_SPECS.corporateFacade),
      color: 0x1d3545,
      roughness: 0.08,
      metalness: 0.88,
      normalScale: new THREE.Vector2(0.12, 0.12),
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      name: 'La Lima Dark Metal',
      color: 0x1a2126,
      roughness: 0.35,
      metalness: 0.82,
    }),
    roadMarking: new THREE.MeshBasicMaterial({
      name: 'La Lima Road Marking',
      color: 0xf0c644,
    }),
    parkingMarking: new THREE.MeshBasicMaterial({
      name: 'La Lima Parking Marking',
      color: 0xf2f5f2,
    }),
  };
}

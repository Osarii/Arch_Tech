import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  LA_LIMA_MATERIAL_SPECS,
  createLaLimaMaterialPalette,
} from '@/bim/site/laLimaMaterials';
import { LaLimaSiteContextService } from '@/bim/site';

const REQUIRED_PALETTE_KEYS = [
  'terrain',
  'grass',
  'roadAsphalt',
  'parkingAsphalt',
  'industrialConcrete',
  'corporateConcrete',
  'industrialPanel',
  'industrialMetal',
  'industrialRoof',
  'loadingDock',
  'corporateFacade',
  'darkMetal',
  'roadMarking',
  'parkingMarking',
] as const;

function mockTextureLoader() {
  return vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation((url) => {
    const texture = new THREE.Texture<HTMLImageElement>();
    texture.userData.path = url;
    return texture;
  });
}

describe('La Lima material system', () => {
  afterEach(() => vi.restoreAllMocks());

  it('defines the approved material sources, IDs, tier and local asset paths', () => {
    expect(
      Object.fromEntries(
        Object.entries(LA_LIMA_MATERIAL_SPECS).map(([key, spec]) => [
          key,
          [spec.source, spec.materialId, spec.tier],
        ])
      )
    ).toEqual({
      roadAsphalt: ['ambientcg', 'Asphalt007', 512],
      parkingAsphalt: ['ambientcg', 'Asphalt005', 512],
      grass: ['ambientcg', 'Grass001', 512],
      industrialConcrete: ['ambientcg', 'Concrete003', 512],
      corporateConcrete: ['polyhaven', 'brushed_concrete', 512],
      industrialMetal: ['ambientcg', 'CorrugatedSteel005', 512],
      corporateFacade: ['ambientcg', 'Facade001', 512],
      roofProfile: ['polyhaven', 'box_profile_metal_sheet', 512],
    });

    for (const spec of Object.values(LA_LIMA_MATERIAL_SPECS)) {
      for (const path of Object.values(spec.channels)) {
        expect(path).toMatch(/^\/materials\/la-lima\/[a-z-]+\/(color|normal|roughness|metalness)\.png$/);
        expect(existsSync(join(process.cwd(), 'public', path.slice(1)))).toBe(true);
      }
    }
  });

  it('creates every required shared runtime material', () => {
    mockTextureLoader();
    const palette = createLaLimaMaterialPalette();

    for (const key of REQUIRED_PALETTE_KEYS) expect(palette[key]).toBeDefined();
    expect(palette.industrialPanel).toBe(palette.industrialMetal);
    expect(palette.loadingDock).toBe(palette.industrialConcrete);
    expect(new Set(Object.values(palette))).toHaveLength(12);
    expect(palette.roadMarking).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(palette.terrain).toBeInstanceOf(THREE.MeshStandardMaterial);
  });

  it('configures repeating sRGB color maps and linear PBR data maps', () => {
    const load = mockTextureLoader();
    createLaLimaMaterialPalette();

    const colorPaths = new Set(
      Object.values(LA_LIMA_MATERIAL_SPECS)
        .map((spec) => ('color' in spec.channels ? spec.channels.color : undefined))
        .filter(Boolean)
    );
    const textures = load.mock.results.map((result) => result.value as THREE.Texture);
    expect(textures).toHaveLength(18);
    for (const texture of textures) {
      expect(texture.wrapS).toBe(THREE.RepeatWrapping);
      expect(texture.wrapT).toBe(THREE.RepeatWrapping);
      expect(texture.repeat.x).toBeGreaterThan(1);
      expect(texture.colorSpace).toBe(
        colorPaths.has(texture.userData.path) ? THREE.SRGBColorSpace : THREE.NoColorSpace
      );
    }
  });

  it('uses roof profile structure without loading its red color map', () => {
    mockTextureLoader();
    const palette = createLaLimaMaterialPalette();

    expect(LA_LIMA_MATERIAL_SPECS.roofProfile.channels).not.toHaveProperty('color');
    expect(palette.industrialRoof.map).toBeNull();
    expect(palette.industrialRoof.normalMap).toBeTruthy();
    expect(palette.industrialRoof.roughnessMap).toBeTruthy();
    expect(palette.industrialRoof.metalnessMap).toBeTruthy();
  });

  it('shares site materials and disposes each loaded texture once', () => {
    const load = mockTextureLoader();
    const service = new LaLimaSiteContextService();
    service.attach(new THREE.Scene());
    const group = service.load();

    expect(
      (group.getObjectByName('IndustrialWarehouses') as THREE.Mesh).material
    ).toBe((group.getObjectByName('MultitenantBuilding') as THREE.Mesh).material);
    expect(
      (group.getObjectByName('IndustrialWarehouseRoofs') as THREE.Mesh).material
    ).toBe((group.getObjectByName('CorporateRoofs') as THREE.Mesh).material);

    const textures = load.mock.results.map((result) => result.value as THREE.Texture);
    const disposals = textures.map((texture) => vi.spyOn(texture, 'dispose'));
    service.clear();

    expect(new Set(textures).size).toBe(18);
    disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1));
  });
});

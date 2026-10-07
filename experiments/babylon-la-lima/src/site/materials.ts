import { Color3, PBRMaterial, Scene, Texture } from '@babylonjs/core';
import type { MaterialKey } from './laLimaData';

const ROOT = '/materials/la-lima';

function texture(scene: Scene, path: string, repeat: number, color = false, level = 1) {
  const value = new Texture(path, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
  value.wrapU = value.wrapV = Texture.WRAP_ADDRESSMODE;
  value.uScale = value.vScale = repeat;
  value.gammaSpace = color;
  value.level = level;
  return value;
}

function pbr(scene: Scene, name: string, color: string, roughness: number, metallic = 0) {
  const material = new PBRMaterial(name, scene);
  material.albedoColor = Color3.FromHexString(color);
  material.roughness = roughness;
  material.metallic = metallic;
  material.environmentIntensity = .68;
  return material;
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = path;
  await image.decode();
  return image;
}

async function packedRoofMap(scene: Scene): Promise<Texture> {
  const [roughness, metalness] = await Promise.all([
    loadImage(`${ROOT}/roof-profile/roughness.png`),
    loadImage(`${ROOT}/roof-profile/metalness.png`),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = roughness.naturalWidth;
  canvas.height = roughness.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required to pack the local roof PBR maps.');
  context.drawImage(roughness, 0, 0);
  const roughPixels = context.getImageData(0, 0, canvas.width, canvas.height);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(metalness, 0, 0);
  const metalPixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const packed = context.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < packed.data.length; index += 4) {
    packed.data[index] = 255;
    packed.data[index + 1] = roughPixels.data[index];
    packed.data[index + 2] = metalPixels.data[index];
    packed.data[index + 3] = 255;
  }
  context.putImageData(packed, 0, 0);
  const value = new Texture(canvas.toDataURL('image/png'), scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
  value.name = 'roofProfile/roughness+metalness (runtime packed)';
  value.wrapU = value.wrapV = Texture.WRAP_ADDRESSMODE;
  value.uScale = value.vScale = 24;
  value.gammaSpace = false;
  return value;
}

export async function createLaLimaMaterials(scene: Scene): Promise<Record<MaterialKey, PBRMaterial>> {
  const terrain = pbr(scene, 'terrain', '#827d68', .96);
  const grass = pbr(scene, 'grass', '#496d46', .94);
  grass.albedoTexture = texture(scene, `${ROOT}/grass/color.png`, 32, true);

  const roadAsphalt = pbr(scene, 'roadAsphalt', '#444842', .94);
  roadAsphalt.albedoTexture = texture(scene, `${ROOT}/road-asphalt/color.png`, 48, true);
  roadAsphalt.bumpTexture = texture(scene, `${ROOT}/road-asphalt/normal.png`, 48, false, .35);

  const parkingAsphalt = pbr(scene, 'parkingAsphalt', '#565b55', .91);
  parkingAsphalt.albedoTexture = texture(scene, `${ROOT}/parking-asphalt/color.png`, 20, true);
  parkingAsphalt.bumpTexture = texture(scene, `${ROOT}/parking-asphalt/normal.png`, 20, false, .3);

  const industrialConcrete = pbr(scene, 'industrialConcrete', '#a4a49a', .88);
  industrialConcrete.albedoTexture = texture(scene, `${ROOT}/industrial-concrete/color.png`, 12, true);
  industrialConcrete.bumpTexture = texture(scene, `${ROOT}/industrial-concrete/normal.png`, 12, false, .25);

  const corporateConcrete = pbr(scene, 'corporateConcrete', '#b0afa6', .8);
  corporateConcrete.albedoTexture = texture(scene, `${ROOT}/corporate-concrete/color.png`, 10, true);
  corporateConcrete.bumpTexture = texture(scene, `${ROOT}/corporate-concrete/normal.png`, 10, false, .24);

  const industrialMetal = pbr(scene, 'industrialMetal', '#98a198', .55, .68);
  industrialMetal.albedoTexture = texture(scene, `${ROOT}/industrial-metal/color.png`, 18, true);
  industrialMetal.bumpTexture = texture(scene, `${ROOT}/industrial-metal/normal.png`, 18, false, .65);
  industrialMetal.metallicTexture = texture(scene, `${ROOT}/industrial-metal/metalness.png`, 18);
  industrialMetal.useMetallnessFromMetallicTextureBlue = true;
  industrialMetal.useRoughnessFromMetallicTextureGreen = false;

  const corporateFacade = pbr(scene, 'corporateFacade', '#334a50', .28, .35);
  corporateFacade.albedoTexture = texture(scene, `${ROOT}/corporate-facade/color.png`, 6, true);
  corporateFacade.bumpTexture = texture(scene, `${ROOT}/corporate-facade/normal.png`, 6, false, .35);
  corporateFacade.metallicTexture = texture(scene, `${ROOT}/corporate-facade/metalness.png`, 6);
  corporateFacade.useMetallnessFromMetallicTextureBlue = true;
  corporateFacade.useRoughnessFromMetallicTextureGreen = false;
  corporateFacade.environmentIntensity = .92;

  const roofProfile = pbr(scene, 'roofProfile', '#b9b7ab', .58, .72);
  roofProfile.bumpTexture = texture(scene, `${ROOT}/roof-profile/normal.png`, 24, false, .72);
  roofProfile.metallicTexture = await packedRoofMap(scene);
  roofProfile.useRoughnessFromMetallicTextureGreen = true;
  roofProfile.useMetallnessFromMetallicTextureBlue = true;

  const darkMetal = pbr(scene, 'darkMetal', '#20282a', .46, .64);
  const roadMarking = pbr(scene, 'roadMarking', '#f1d376', .74);
  const parkingMarking = pbr(scene, 'parkingMarking', '#edf4ed', .75);

  return {
    terrain, grass, roadAsphalt, roadMarking, industrialMetal, roofProfile,
    industrialConcrete, darkMetal, corporateConcrete, corporateFacade,
    parkingAsphalt, parkingMarking,
  };
}

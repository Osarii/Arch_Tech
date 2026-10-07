import * as THREE from 'three';

export type RenderQualityProfile = 'performance' | 'balanced' | 'quality';

export type RenderQualityConfig = {
  maxDpr: number;
  minDpr: number;
  adaptiveResolution: boolean;
  toneMapping: THREE.ToneMapping;
  exposure: number;
  shadows: boolean;
  shadowResolution: number;
  hemisphereIntensity: number;
  sunIntensity: number;
};

export const RENDER_QUALITY_STORAGE_KEY = 'arch-tech-render-quality';

export const renderQualityProfiles: Record<RenderQualityProfile, RenderQualityConfig> = {
  performance: {
    maxDpr: 1.25,
    minDpr: 0.9,
    adaptiveResolution: true,
    toneMapping: THREE.NoToneMapping,
    exposure: 1,
    shadows: false,
    shadowResolution: 0,
    hemisphereIntensity: 1.1,
    sunIntensity: 1.25,
  },
  balanced: {
    maxDpr: 1.25,
    minDpr: 0.9,
    adaptiveResolution: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1,
    shadows: true,
    shadowResolution: 1024,
    hemisphereIntensity: 1.25,
    sunIntensity: 1.45,
  },
  quality: {
    maxDpr: 1.5,
    minDpr: 1,
    adaptiveResolution: false,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.05,
    shadows: true,
    shadowResolution: 2048,
    hemisphereIntensity: 1.35,
    sunIntensity: 1.6,
  },
};

export const isRenderQualityProfile = (value: string | null): value is RenderQualityProfile =>
  value === 'performance' || value === 'balanced' || value === 'quality';

export function getStoredRenderQualityProfile(): RenderQualityProfile {
  if (typeof window === 'undefined') return 'balanced';
  const stored = window.localStorage.getItem(RENDER_QUALITY_STORAGE_KEY);
  return isRenderQualityProfile(stored) ? stored : 'balanced';
}

export function storeRenderQualityProfile(profile: RenderQualityProfile): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(RENDER_QUALITY_STORAGE_KEY, profile);
}

import * as THREE from 'three';

export type RenderQualityProfile = 'performance' | 'balanced' | 'presentation';

export type RenderQualityConfig = {
  minDpr: number;
  maxDpr: number;
  adaptiveResolution: boolean;
  adaptiveDownFps: number;
  adaptiveUpFps: number;
  toneMapping: THREE.ToneMapping;
  exposure: number;
  hemisphereIntensity: number;
  sunIntensity: number;
};

/** Intel UHD 630-safe profiles. Shadows and post-processing stay disabled by policy. */
export const renderQualityProfiles: Record<RenderQualityProfile, RenderQualityConfig> = {
  performance: {
    minDpr: 0.85,
    maxDpr: 1,
    adaptiveResolution: true,
    adaptiveDownFps: 42,
    adaptiveUpFps: 56,
    toneMapping: THREE.NoToneMapping,
    exposure: 1,
    hemisphereIntensity: 1.05,
    sunIntensity: 1.15,
  },
  balanced: {
    minDpr: 0.9,
    maxDpr: 1.15,
    adaptiveResolution: true,
    adaptiveDownFps: 48,
    adaptiveUpFps: 58,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1,
    hemisphereIntensity: 1.15,
    sunIntensity: 1.3,
  },
  presentation: {
    minDpr: 1.25,
    maxDpr: 1.25,
    adaptiveResolution: false,
    adaptiveDownFps: 0,
    adaptiveUpFps: 0,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.05,
    hemisphereIntensity: 1.2,
    sunIntensity: 1.4,
  },
};

export type RenderDiagnostics = {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  effectiveDpr: number;
  qualityProfile: RenderQualityProfile;
  isInteractive: boolean;
  shadowsEnabled: false;
};

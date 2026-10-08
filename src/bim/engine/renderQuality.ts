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
  fogNear: number;
  fogFar: number;
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
    hemisphereIntensity: 0.95,
    sunIntensity: 1.2,
    fogNear: 950,
    fogFar: 3200,
  },
  balanced: {
    minDpr: 0.9,
    maxDpr: 1.15,
    adaptiveResolution: true,
    adaptiveDownFps: 48,
    adaptiveUpFps: 58,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1,
    hemisphereIntensity: 1.1,
    sunIntensity: 1.4,
    fogNear: 800,
    fogFar: 2600,
  },
  presentation: {
    minDpr: 1.25,
    maxDpr: 1.25,
    adaptiveResolution: false,
    adaptiveDownFps: 0,
    adaptiveUpFps: 0,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.08,
    hemisphereIntensity: 1.15,
    sunIntensity: 1.6,
    fogNear: 700,
    fogFar: 2400,
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

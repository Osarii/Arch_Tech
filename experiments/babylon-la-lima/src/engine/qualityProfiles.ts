export type QualityProfileId = 'performance' | 'balanced' | 'ultra';
export type RendererPreference = 'auto' | 'webgl2' | 'webgpu';
export type ImageProcessingMode = 'raw' | 'architectural';

export type QualityProfile = {
  id: QualityProfileId;
  label: string;
  effectiveDpr: number;
  shadowMapSize: number;
  shadows: boolean;
  ssao: boolean;
  ssaoRatio: number;
  anisotropy: number;
  samples: number;
};

export const QUALITY_PROFILES: Record<QualityProfileId, QualityProfile> = {
  performance: { id: 'performance', label: 'Performance', effectiveDpr: 1.25, shadowMapSize: 0, shadows: false, ssao: false, ssaoRatio: .5, anisotropy: 2, samples: 1 },
  balanced: { id: 'balanced', label: 'Balanced', effectiveDpr: 1.25, shadowMapSize: 1024, shadows: true, ssao: true, ssaoRatio: .5, anisotropy: 4, samples: 2 },
  ultra: { id: 'ultra', label: 'Ultra', effectiveDpr: Math.min(devicePixelRatio || 1, 2), shadowMapSize: 2048, shadows: true, ssao: true, ssaoRatio: 1, anisotropy: 8, samples: 4 },
};

import type { RenderQualityConfig } from './renderQuality';

const STEP = 0.05;
const LOW_FPS_SAMPLES = 3;
const HIGH_FPS_SAMPLES = 6;
const COOLDOWN_MS = 5000;

/** Changes DPR only after sustained, interactive rendering pressure. */
export class AdaptiveResolution {
  private lowSamples = 0;
  private highSamples = 0;
  private lastChangeAt = -Infinity;

  public reset(): void {
    this.lowSamples = 0;
    this.highSamples = 0;
    this.lastChangeAt = -Infinity;
  }

  public next(
    fps: number,
    currentDpr: number,
    profile: RenderQualityConfig,
    now: number,
    isInteractive: boolean
  ): number | null {
    if (!profile.adaptiveResolution || !isInteractive || now - this.lastChangeAt < COOLDOWN_MS) {
      return null;
    }

    this.lowSamples = fps < profile.adaptiveDownFps ? this.lowSamples + 1 : 0;
    this.highSamples = fps > profile.adaptiveUpFps ? this.highSamples + 1 : 0;

    const next =
      this.lowSamples >= LOW_FPS_SAMPLES && currentDpr > profile.minDpr
        ? Math.max(profile.minDpr, Number((currentDpr - STEP).toFixed(2)))
        : this.highSamples >= HIGH_FPS_SAMPLES && currentDpr < profile.maxDpr
          ? Math.min(profile.maxDpr, Number((currentDpr + STEP).toFixed(2)))
          : null;

    if (next === null || next === currentDpr) return null;
    this.lowSamples = 0;
    this.highSamples = 0;
    this.lastChangeAt = now;
    return next;
  }
}

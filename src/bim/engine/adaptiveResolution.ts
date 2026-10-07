import type { RenderQualityConfig } from './renderQuality';

const STEP = 0.1;
const LOW_FPS_SAMPLES = 3;
const HIGH_FPS_SAMPLES = 5;
const COOLDOWN_MS = 4500;

export class AdaptiveResolution {
  private lowSamples = 0;
  private highSamples = 0;
  private lastChangeAt = -Infinity;

  public reset(): void {
    this.lowSamples = 0;
    this.highSamples = 0;
    this.lastChangeAt = -Infinity;
  }

  public next(fps: number, currentDpr: number, profile: RenderQualityConfig, now: number): number | null {
    if (!profile.adaptiveResolution) return null;
    if (now - this.lastChangeAt < COOLDOWN_MS) return null;

    this.lowSamples = fps < 45 ? this.lowSamples + 1 : 0;
    this.highSamples = fps > 58 ? this.highSamples + 1 : 0;

    let next: number | null = null;
    if (this.lowSamples >= LOW_FPS_SAMPLES && currentDpr > profile.minDpr) {
      next = Math.max(profile.minDpr, Number((currentDpr - STEP).toFixed(2)));
    } else if (this.highSamples >= HIGH_FPS_SAMPLES && currentDpr < profile.maxDpr) {
      next = Math.min(profile.maxDpr, Number((currentDpr + STEP).toFixed(2)));
    }

    if (next === null || next === currentDpr) return null;
    this.lowSamples = 0;
    this.highSamples = 0;
    this.lastChangeAt = now;
    return next;
  }
}

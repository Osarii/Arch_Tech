import { describe, expect, it } from 'vitest';
import { AdaptiveResolution } from '@/bim/engine/adaptiveResolution';
import { renderQualityProfiles } from '@/bim/engine/renderQuality';

describe('render quality profiles', () => {
  it('keeps the Intel UHD profiles within their declared DPR budgets', () => {
    expect(renderQualityProfiles.performance).toMatchObject({ maxDpr: 1.25, shadows: false, adaptiveResolution: true });
    expect(renderQualityProfiles.balanced).toMatchObject({ maxDpr: 1.25, shadowResolution: 1024, adaptiveResolution: true });
    expect(renderQualityProfiles.quality).toMatchObject({ maxDpr: 1.5, minDpr: 1, shadowResolution: 2048, adaptiveResolution: false });
  });

  it('uses hysteresis, bounds, and cooldown before changing adaptive DPR', () => {
    const adaptive = new AdaptiveResolution();
    const profile = renderQualityProfiles.balanced;
    expect(adaptive.next(40, 1.25, profile, 0)).toBeNull();
    expect(adaptive.next(40, 1.25, profile, 1000)).toBeNull();
    expect(adaptive.next(40, 1.25, profile, 2000)).toBe(1.15);
    expect(adaptive.next(40, 1.15, profile, 3000)).toBeNull();

    expect(adaptive.next(60, 1.15, profile, 7000)).toBeNull();
    expect(adaptive.next(60, 1.15, profile, 8000)).toBeNull();
    expect(adaptive.next(60, 1.15, profile, 9000)).toBeNull();
    expect(adaptive.next(60, 1.15, profile, 10000)).toBeNull();
    expect(adaptive.next(60, 1.15, profile, 11000)).toBe(1.25);
  });

  it('does not adapt the quality profile', () => {
    const adaptive = new AdaptiveResolution();
    expect(adaptive.next(20, 1.5, renderQualityProfiles.quality, 10000)).toBeNull();
  });
});

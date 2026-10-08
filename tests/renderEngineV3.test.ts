import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { AdaptiveResolution } from '@/bim/engine/adaptiveResolution';
import { BimEngine } from '@/bim/engine/BimEngine';
import { renderQualityProfiles } from '@/bim/engine/renderQuality';
import { SceneLighting } from '@/bim/engine/sceneLighting';

describe('Render Engine V3 foundation', () => {
  it('keeps every preset within the Intel UHD DPR budget and disables shadows', () => {
    for (const profile of Object.values(renderQualityProfiles)) {
      expect(profile.maxDpr).toBeLessThanOrEqual(1.25);
      expect(profile.minDpr).toBeLessThanOrEqual(profile.maxDpr);
      expect(profile.fogNear).toBeLessThan(profile.fogFar);
    }
    expect(renderQualityProfiles.balanced.toneMapping).toBe(THREE.ACESFilmicToneMapping);
    expect(renderQualityProfiles.presentation.adaptiveResolution).toBe(false);
  });

  it('adapts only sustained interactive load, using bounded gradual DPR changes', () => {
    const adaptive = new AdaptiveResolution();
    const profile = renderQualityProfiles.balanced;

    expect(adaptive.next(20, 1.15, profile, 0, false)).toBeNull();
    expect(adaptive.next(20, 1.15, profile, 1000, true)).toBeNull();
    expect(adaptive.next(20, 1.15, profile, 2000, true)).toBeNull();
    expect(adaptive.next(20, 1.15, profile, 3000, true)).toBe(1.1);
    expect(adaptive.next(20, 1.1, profile, 3500, true)).toBeNull();
  });

  it('reuses the daylight pair and never enables a shadow pass', () => {
    const scene = new THREE.Scene();
    const lighting = new SceneLighting();
    lighting.attach(scene);
    lighting.attach(scene);
    lighting.applyProfile(renderQualityProfiles.presentation);

    const lights = scene.children.filter((child): child is THREE.Light => child instanceof THREE.Light);
    expect(lights).toHaveLength(2);
    expect((lights.find((light) => light instanceof THREE.DirectionalLight) as THREE.DirectionalLight).castShadow).toBe(false);

    lighting.dispose();
    expect(scene.children.filter((child): child is THREE.Light => child instanceof THREE.Light)).toHaveLength(0);
  });

  it('reports renderer diagnostics and applies profiles without recreating the renderer', () => {
    const engine = new BimEngine();
    const setPixelRatio = vi.fn();
    const resize = vi.fn();
    const updateAspect = vi.fn();
    (engine as any).world = {
      renderer: {
        three: {
          info: { render: { calls: 21, triangles: 3564 }, memory: { geometries: 1, textures: 18 } },
          setPixelRatio,
          shadowMap: { enabled: true },
        },
        resize,
      },
      camera: { updateAspect },
    };
    (engine as any).container = document.createElement('div');

    engine.setRenderQuality('presentation');
    const diagnostics = engine.getRenderDiagnostics();

    expect(engine.getRenderQuality()).toBe('presentation');
    expect(setPixelRatio).toHaveBeenCalled();
    expect(resize).toHaveBeenCalledTimes(1);
    expect(updateAspect).toHaveBeenCalledTimes(1);
    expect(diagnostics).toMatchObject({
      drawCalls: 21,
      triangles: 3564,
      geometries: 1,
      textures: 18,
      qualityProfile: 'presentation',
      shadowsEnabled: false,
    });
  });
});

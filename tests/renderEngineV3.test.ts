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

  it('configures Day and Overcast lighting presets independently from quality profiles', () => {
    const scene = new THREE.Scene();
    const lighting = new SceneLighting();
    lighting.attach(scene);
    lighting.applyProfile(renderQualityProfiles.presentation);

    expect(lighting.getPreset()).toBe('day');
    const sun = scene.children.find((child): child is THREE.DirectionalLight => child instanceof THREE.DirectionalLight)!;
    const hemi = scene.children.find((child): child is THREE.HemisphereLight => child instanceof THREE.HemisphereLight)!;

    // Day: strong directional sun (5600K 0xfffbf2) with 3-quarter rake angle
    expect(sun.color.getHex()).toBe(0xfffbf2);
    expect(sun.position.x).toBe(160);
    expect(sun.position.y).toBe(240);
    expect(sun.position.z).toBe(130);
    expect(sun.intensity).toBeCloseTo(1.6, 2);

    // Switch to Overcast: diffuse silver sky, subdued sun, high zenith position
    lighting.setPreset('overcast');
    expect(lighting.getPreset()).toBe('overcast');
    expect(hemi.color.getHex()).toBe(0xd0d8e2);
    expect(sun.color.getHex()).toBe(0xe6ebf0);
    expect(sun.position.y).toBe(290);
    expect(sun.intensity).toBeLessThan(1.6); // Subdued sun intensity
    expect(hemi.intensity).toBeGreaterThan(1.15); // Boosted diffuse ambient fill

    lighting.dispose();
  });

  it('enforces shadow policy: disabled by default for Intel UHD 630 safety, with pre-configured bounds', () => {
    const scene = new THREE.Scene();
    const lighting = new SceneLighting();
    lighting.attach(scene);

    const sun = scene.children.find((child): child is THREE.DirectionalLight => child instanceof THREE.DirectionalLight)!;
    expect(lighting.isShadowsEnabled()).toBe(false);
    expect(sun.castShadow).toBe(false);

    // Architectural shadow bounds and map resolution configured
    expect(sun.shadow.mapSize.width).toBe(1024);
    expect(sun.shadow.mapSize.height).toBe(1024);
    expect(sun.shadow.camera.near).toBe(50);
    expect(sun.shadow.camera.far).toBe(1200);
    expect(sun.shadow.bias).toBe(-0.0003);
    expect(sun.shadow.normalBias).toBe(0.02);

    // Selective shadow activation for Presentation evaluation
    lighting.enableShadows(true);
    expect(lighting.isShadowsEnabled()).toBe(true);
    expect(sun.castShadow).toBe(true);

    lighting.enableShadows(false);
    expect(lighting.isShadowsEnabled()).toBe(false);
    expect(sun.castShadow).toBe(false);

    lighting.dispose();
  });

  it('manages lighting preset and selective shadows on BimEngine', () => {
    const engine = new BimEngine();
    expect(engine.getLightingPreset()).toBe('day');
    expect(engine.isShadowsEnabled()).toBe(false);

    engine.setLightingPreset('overcast');
    expect(engine.getLightingPreset()).toBe('overcast');

    engine.setShadowsEnabled(true);
    expect(engine.isShadowsEnabled()).toBe(true);

    engine.setShadowsEnabled(false);
    expect(engine.isShadowsEnabled()).toBe(false);
  });
});

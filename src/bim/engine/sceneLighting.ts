import * as THREE from 'three';
import type { RenderQualityConfig } from './renderQuality';

export type LightingPreset = 'day' | 'overcast';

export type LightingPresetConfig = {
  skyColor: number;
  groundColor: number;
  sunColor: number;
  sunPosition: [number, number, number];
  hemisphereMultiplier: number;
  sunMultiplier: number;
};

export const lightingPresets: Record<LightingPreset, LightingPresetConfig> = {
  day: {
    // Architectural clear daylight: crisp cool sky, subtle warm earth bounce, 5600K solar sun
    skyColor: 0xe4edff,
    groundColor: 0x363a35,
    sunColor: 0xfffbf2,
    sunPosition: [160, 240, 130], // 3-quarter rake angle (~38° az, ~46° alt)
    hemisphereMultiplier: 1.0,
    sunMultiplier: 1.0,
  },
  overcast: {
    // Architectural overcast: diffuse silver-slate sky, neutral ground bounce, softened zenith daylight
    skyColor: 0xd0d8e2,
    groundColor: 0x42464a,
    sunColor: 0xe6ebf0,
    sunPosition: [80, 290, 70], // High diffuse zenith angle for soft, low-contrast shadows
    hemisphereMultiplier: 1.45,
    sunMultiplier: 0.55,
  },
};

/** Owns the stable, low-cost daylight pair used by every workspace profile. */
export class SceneLighting {
  private scene: THREE.Scene | null = null;
  private hemisphere: THREE.HemisphereLight | null = null;
  private sun: THREE.DirectionalLight | null = null;
  private preset: LightingPreset = 'day';
  private currentQualityConfig: RenderQualityConfig | null = null;
  private shadowsEnabled = false;

  public attach(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    this.dispose();
    this.scene = scene;

    const presetConfig = lightingPresets[this.preset];
    this.hemisphere = new THREE.HemisphereLight(
      presetConfig.skyColor,
      presetConfig.groundColor,
      1
    );
    this.sun = new THREE.DirectionalLight(presetConfig.sunColor, 1);
    this.sun.position.set(...presetConfig.sunPosition);
    this.sun.castShadow = this.shadowsEnabled;

    // Architectural shadow bounds and bias setup (pre-configured for site fidelity)
    this.sun.shadow.mapSize.width = 1024;
    this.sun.shadow.mapSize.height = 1024;
    this.sun.shadow.camera.near = 50;
    this.sun.shadow.camera.far = 1200;
    this.sun.shadow.camera.left = -600;
    this.sun.shadow.camera.right = 600;
    this.sun.shadow.camera.top = 600;
    this.sun.shadow.camera.bottom = -600;
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.02;

    scene.add(this.hemisphere, this.sun);
    if (this.currentQualityConfig) {
      this.updateIntensities();
    }
  }

  public setPreset(preset: LightingPreset): void {
    this.preset = preset;
    if (!this.hemisphere || !this.sun) return;
    const config = lightingPresets[preset];
    this.hemisphere.color.setHex(config.skyColor);
    this.hemisphere.groundColor.setHex(config.groundColor);
    this.sun.color.setHex(config.sunColor);
    this.sun.position.set(...config.sunPosition);
    this.updateIntensities();
  }

  public getPreset(): LightingPreset {
    return this.preset;
  }

  public applyProfile(profile: RenderQualityConfig): void {
    this.currentQualityConfig = profile;
    this.updateIntensities();
  }

  private updateIntensities(): void {
    if (!this.hemisphere || !this.sun || !this.currentQualityConfig) return;
    const presetConfig = lightingPresets[this.preset];
    this.hemisphere.intensity =
      this.currentQualityConfig.hemisphereIntensity * presetConfig.hemisphereMultiplier;
    this.sun.intensity =
      this.currentQualityConfig.sunIntensity * presetConfig.sunMultiplier;
  }

  public enableShadows(enabled: boolean): void {
    this.shadowsEnabled = enabled;
    if (this.sun) {
      this.sun.castShadow = enabled;
    }
  }

  public isShadowsEnabled(): boolean {
    return this.shadowsEnabled;
  }

  public dispose(): void {
    if (!this.scene) return;
    if (this.hemisphere) this.scene.remove(this.hemisphere);
    if (this.sun) this.scene.remove(this.sun);
    this.scene = null;
    this.hemisphere = null;
    this.sun = null;
  }
}

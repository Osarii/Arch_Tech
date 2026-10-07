import * as THREE from 'three';
import type { RenderQualityConfig } from './renderQuality';

/** Owns the stable, low-cost daylight pair used by every workspace profile. */
export class SceneLighting {
  private scene: THREE.Scene | null = null;
  private hemisphere: THREE.HemisphereLight | null = null;
  private sun: THREE.DirectionalLight | null = null;

  public attach(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    this.dispose();
    this.scene = scene;
    this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x333945, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.sun.position.set(120, 220, 100);
    this.sun.castShadow = false;
    scene.add(this.hemisphere, this.sun);
  }

  public applyProfile(profile: RenderQualityConfig): void {
    if (!this.hemisphere || !this.sun) return;
    this.hemisphere.intensity = profile.hemisphereIntensity;
    this.sun.intensity = profile.sunIntensity;
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

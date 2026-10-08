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
    // Architectural daylight: crisp cool sky (0xe4edff), subtle warm earth bounce (0x363a35)
    this.hemisphere = new THREE.HemisphereLight(0xe4edff, 0x363a35, 1);
    // Warm natural sunlight (5600K architectural solar color: 0xfffbf2)
    this.sun = new THREE.DirectionalLight(0xfffbf2, 1);
    // Architectural rake angle (azimuth ~38°, altitude ~46°) providing distinct facade and roof separation
    this.sun.position.set(160, 240, 130);
    this.sun.castShadow = false;

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

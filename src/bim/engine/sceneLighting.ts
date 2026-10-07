import * as THREE from 'three';
import type { RenderQualityConfig } from './renderQuality';

/** Owns the two lights shared by all workspace profiles. */
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
    this.sun.target.position.set(0, 0, 0);
    scene.add(this.hemisphere, this.sun, this.sun.target);
  }

  public applyProfile(profile: RenderQualityConfig): THREE.DirectionalLight | null {
    if (!this.hemisphere || !this.sun) return null;
    this.hemisphere.intensity = profile.hemisphereIntensity;
    this.sun.intensity = profile.sunIntensity;
    this.sun.castShadow = profile.shadows;
    this.sun.shadow.mapSize.set(profile.shadowResolution || 1, profile.shadowResolution || 1);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 1400;
    this.sun.shadow.camera.left = -650;
    this.sun.shadow.camera.right = 650;
    this.sun.shadow.camera.top = 650;
    this.sun.shadow.camera.bottom = -650;
    this.sun.shadow.bias = -0.00015;
    this.sun.shadow.camera.updateProjectionMatrix();
    return this.sun;
  }

  public dispose(): void {
    if (!this.scene) return;
    if (this.hemisphere) this.scene.remove(this.hemisphere);
    if (this.sun) {
      this.scene.remove(this.sun, this.sun.target);
      this.sun.shadow.map?.dispose();
    }
    this.scene = null;
    this.hemisphere = null;
    this.sun = null;
  }
}

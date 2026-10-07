import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** A dim local PMREM gives PBR surfaces neutral reflections without an HDR request. */
export class EnvironmentLighting {
  private scene: THREE.Scene | null = null;
  private target: THREE.WebGLRenderTarget | null = null;

  public apply(renderer: THREE.WebGLRenderer, scene: THREE.Scene, enabled: boolean): void {
    if (!enabled) {
      if (this.scene) this.scene.environment = null;
      return;
    }
    if (this.scene !== scene || !this.target) {
      this.dispose();
      const pmrem = new THREE.PMREMGenerator(renderer);
      this.target = pmrem.fromScene(new RoomEnvironment(), 0.04);
      pmrem.dispose();
      this.scene = scene;
    }
    scene.environment = this.target.texture;
    scene.environmentIntensity = 0.22;
  }

  public dispose(): void {
    if (this.scene) this.scene.environment = null;
    this.target?.dispose();
    this.target = null;
    this.scene = null;
  }
}

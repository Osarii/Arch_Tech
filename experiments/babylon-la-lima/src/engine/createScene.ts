import { ArcRotateCamera, Color3, Color4, DirectionalLight, HemisphericLight, Scene, Vector3 } from '@babylonjs/core';

export function createScene(engine: import('@babylonjs/core').AbstractEngine, canvas: HTMLCanvasElement) {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(.027, .055, .043, 1);
  scene.ambientColor = new Color3(.18, .21, .18);
  scene.skipPointerMovePicking = true;

  const camera = new ArcRotateCamera('site-camera', -Math.PI / 4, .92, 980, Vector3.Zero(), scene);
  camera.minZ = .5;
  camera.maxZ = 5000;
  camera.lowerRadiusLimit = 80;
  camera.upperRadiusLimit = 2200;
  camera.wheelDeltaPercentage = .012;
  camera.panningSensibility = 28;
  camera.inertia = .72;
  camera.attachControl(canvas, true);

  const ambient = new HemisphericLight('architectural-ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 1.05;
  ambient.diffuse = new Color3(.86, .96, .88);
  ambient.groundColor = new Color3(.16, .19, .17);

  const sun = new DirectionalLight('architectural-sun', new Vector3(-.48, -.88, .31), scene);
  sun.position = new Vector3(420, 720, -380);
  sun.intensity = 2.35;
  sun.diffuse = new Color3(1, .96, .83);

  return { scene, camera, sun, ambient };
}

import { Engine, Scene, SceneInstrumentation, WebGPUEngine, type AbstractEngine, type ArcRotateCamera } from '@babylonjs/core';
import type { QualityProfileId } from './qualityProfiles';

export type DiagnosticsSnapshot = {
  renderer: string;
  gpu: string;
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeMeshes: number;
  totalMeshes: number;
  materials: number;
  textures: number;
  hardwareScaling: number;
  effectiveDpr: number;
  shadows: string;
  ssao: boolean;
  profile: QualityProfileId;
};

export type BenchmarkResult = {
  timestamp: string;
  durationMs: number;
  renderer: string;
  gpu: string;
  profile: QualityProfileId;
  averageFps: number;
  minimumFps: number;
  averageFrameTimeMs: number;
  p95FrameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeMeshes: number;
  totalMeshes: number;
  materials: number;
  textures: number;
  hardwareScaling: number;
  effectiveDpr: number;
  shadows: string;
  ssao: boolean;
};

function gpuName(engine: AbstractEngine): string {
  if (engine instanceof Engine) {
    const info = engine.getGlInfo();
    return info.renderer || info.vendor || 'WebGL adapter unavailable';
  }
  if (engine instanceof WebGPUEngine) {
    const info = (engine as WebGPUEngine & { adapterInfo?: GPUAdapterInfo }).adapterInfo;
    return info?.device || info?.description || info?.vendor || 'WebGPU adapter';
  }
  return 'Unavailable';
}

export class DiagnosticsSampler {
  private instrumentation: SceneInstrumentation;
  private timer: number | null = null;

  constructor(private scene: Scene, private engine: AbstractEngine) {
    this.instrumentation = new SceneInstrumentation(scene);
    this.instrumentation.captureFrameTime = true;
    this.instrumentation.captureRenderTime = true;
  }

  snapshot(profile: QualityProfileId, shadows: string, ssao: boolean, renderer: string): DiagnosticsSnapshot {
    const fps = this.engine.getFps();
    return {
      renderer,
      gpu: gpuName(this.engine),
      fps,
      frameTimeMs: fps > 0 ? 1000 / fps : this.instrumentation.frameTimeCounter.lastSecAverage,
      drawCalls: this.instrumentation.drawCallsCounter.current,
      triangles: Math.round(this.scene.meshes.filter(mesh => mesh.isEnabled()).reduce((sum, mesh) => sum + mesh.getTotalIndices(), 0) / 3),
      activeMeshes: this.scene.getActiveMeshes().length,
      totalMeshes: this.scene.meshes.filter(mesh => mesh.isEnabled()).length,
      materials: this.scene.materials.length,
      textures: this.scene.textures.length,
      hardwareScaling: this.engine.getHardwareScalingLevel(),
      effectiveDpr: (devicePixelRatio || 1) / this.engine.getHardwareScalingLevel(),
      shadows,
      ssao,
      profile,
    };
  }

  start(read: () => Pick<DiagnosticsSnapshot, 'profile' | 'shadows' | 'ssao' | 'renderer'>, onUpdate: (value: DiagnosticsSnapshot) => void) {
    this.stop();
    const update = () => {
      const state = read();
      onUpdate(this.snapshot(state.profile, state.shadows, state.ssao, state.renderer));
    };
    update();
    this.timer = window.setInterval(update, 500);
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  dispose() {
    this.stop();
    this.instrumentation.dispose();
  }
}

export async function runBenchmark(
  scene: Scene,
  camera: ArcRotateCamera,
  sampler: DiagnosticsSampler,
  state: Pick<DiagnosticsSnapshot, 'profile' | 'shadows' | 'ssao' | 'renderer'>,
  durationMs = 15000,
): Promise<BenchmarkResult> {
  const fpsSamples: number[] = [];
  const frameTimes: number[] = [];
  const original = { alpha: camera.alpha, beta: camera.beta, radius: camera.radius };
  const started = performance.now();
  let previous = started;
  const observer = scene.onAfterRenderObservable.add(() => {
    const now = performance.now();
    const elapsed = now - started;
    const delta = now - previous;
    previous = now;
    if (delta > 0 && delta < 250) {
      frameTimes.push(delta);
      fpsSamples.push(1000 / delta);
    }
    const phase = elapsed / durationMs;
    if (phase >= 1 / 3 && phase < 2 / 3) camera.alpha += .0015;
    if (phase >= 2 / 3) camera.radius = original.radius * .68;
  });
  await new Promise(resolve => window.setTimeout(resolve, durationMs));
  scene.onAfterRenderObservable.remove(observer);
  camera.alpha = original.alpha;
  camera.beta = original.beta;
  camera.radius = original.radius;
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const snapshot = sampler.snapshot(state.profile, state.shadows, state.ssao, state.renderer);
  return {
    timestamp: new Date().toISOString(),
    durationMs,
    renderer: snapshot.renderer,
    gpu: snapshot.gpu,
    profile: state.profile,
    averageFps: fpsSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, fpsSamples.length),
    minimumFps: Math.min(...fpsSamples),
    averageFrameTimeMs: frameTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, frameTimes.length),
    p95FrameTimeMs: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? 0,
    drawCalls: snapshot.drawCalls,
    triangles: snapshot.triangles,
    activeMeshes: snapshot.activeMeshes,
    totalMeshes: snapshot.totalMeshes,
    materials: snapshot.materials,
    textures: snapshot.textures,
    hardwareScaling: snapshot.hardwareScaling,
    effectiveDpr: snapshot.effectiveDpr,
    shadows: snapshot.shadows,
    ssao: snapshot.ssao,
  };
}

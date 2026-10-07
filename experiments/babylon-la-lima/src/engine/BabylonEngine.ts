import {
  CascadedShadowGenerator,
  Engine,
  ImageProcessingConfiguration,
  SSAO2RenderingPipeline,
  Vector3,
  WebGPUEngine,
  type AbstractEngine,
  type ArcRotateCamera,
  type DirectionalLight,
  type Scene,
} from '@babylonjs/core';
import { createLaLimaSite, type LaLimaSite } from '../site';
import { BabylonIfcSmokeTest, type IfcSmokeStats } from '../ifc/BabylonIfcSmokeTest';
import { createScene } from './createScene';
import { DiagnosticsSampler, type DiagnosticsSnapshot } from './diagnostics';
import { QUALITY_PROFILES, type ImageProcessingMode, type QualityProfileId, type RendererPreference } from './qualityProfiles';

export class BabylonLabEngine {
  engine!: AbstractEngine;
  scene!: Scene;
  camera!: ArcRotateCamera;
  site!: LaLimaSite;
  renderer = 'WebGL2';
  profile: QualityProfileId = 'performance';
  shadows = 'Off';
  ssaoEnabled = false;
  webGpuAvailable = false;
  diagnostics!: DiagnosticsSampler;
  ifcSmoke!: BabylonIfcSmokeTest;
  private sun!: DirectionalLight;
  private shadowGenerator: CascadedShadowGenerator | null = null;
  private ssao: SSAO2RenderingPipeline | null = null;
  private resize = () => this.engine.resize();

  async init(canvas: HTMLCanvasElement, rendererPreference: RendererPreference) {
    this.webGpuAvailable = await WebGPUEngine.IsSupportedAsync;
    if (rendererPreference === 'webgpu' && this.webGpuAvailable) {
      const engine = new WebGPUEngine(canvas, { antialias: true });
      await engine.initAsync();
      this.engine = engine;
      this.renderer = 'WebGPU';
    } else {
      this.engine = new Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: true,
        disableWebGL2Support: false,
        powerPreference: 'high-performance',
      });
      this.renderer = 'WebGL2';
    }
    const created = createScene(this.engine, canvas);
    this.scene = created.scene;
    this.camera = created.camera;
    this.sun = created.sun;
    this.site = await createLaLimaSite(this.scene);
    this.ifcSmoke = new BabylonIfcSmokeTest(this.scene);
    this.resetView();
    await this.applyQuality('performance');
    this.diagnostics = new DiagnosticsSampler(this.scene, this.engine);
    window.addEventListener('resize', this.resize, { passive: true });
    this.engine.runRenderLoop(() => this.scene.render());
    await this.scene.whenReadyAsync();
  }

  get diagnosticsState() {
    return { profile: this.profile, shadows: this.shadows, ssao: this.ssaoEnabled, renderer: this.renderer };
  }

  startDiagnostics(onUpdate: (snapshot: DiagnosticsSnapshot) => void) {
    this.diagnostics.start(() => this.diagnosticsState, onUpdate);
  }

  async applyQuality(profileId: QualityProfileId, ssaoOverride?: boolean) {
    const profile = QUALITY_PROFILES[profileId];
    this.profile = profileId;
    this.engine.setHardwareScalingLevel(Math.max(1, (devicePixelRatio || 1) / profile.effectiveDpr));
    this.scene.textures.forEach(texture => { texture.anisotropicFilteringLevel = profile.anisotropy; });
    this.shadowGenerator?.dispose();
    this.shadowGenerator = null;
    this.sun.shadowEnabled = false;
    this.shadows = 'Off';
    if (profile.shadows) {
      try {
        const shadows = new CascadedShadowGenerator(profile.shadowMapSize, this.sun, true, this.camera);
        shadows.numCascades = profileId === 'ultra' ? 4 : 3;
        shadows.lambda = .78;
        shadows.cascadeBlendPercentage = .08;
        shadows.shadowMaxZ = 1800;
        shadows.bias = .0015;
        shadows.normalBias = .03;
        shadows.usePercentageCloserFiltering = true;
        shadows.filteringQuality = profileId === 'ultra' ? CascadedShadowGenerator.QUALITY_HIGH : CascadedShadowGenerator.QUALITY_MEDIUM;
        this.site.shadowCasters.forEach(mesh => shadows.addShadowCaster(mesh, true));
        this.sun.shadowEnabled = true;
        this.shadowGenerator = shadows;
        this.shadows = `CSM ${profile.shadowMapSize}px / ${shadows.numCascades} cascades`;
      } catch (error) {
        console.warn('Selective cascaded shadows unavailable; continuing without shadows.', error);
      }
    }
    await this.setSsao(ssaoOverride ?? profile.ssao);
    this.applyImageProcessing(profileId === 'performance' ? 'raw' : 'architectural');
    this.engine.resize();
  }

  async setSsao(enabled: boolean) {
    this.ssao?.dispose(true);
    this.ssao = null;
    this.ssaoEnabled = false;
    if (!enabled || !SSAO2RenderingPipeline.IsSupported) return;
    try {
      const profile = QUALITY_PROFILES[this.profile];
      const pipeline = new SSAO2RenderingPipeline('site-ssao', this.scene, {
        ssaoRatio: profile.ssaoRatio,
        blurRatio: .5,
      }, [this.camera], true);
      pipeline.radius = 3.2;
      pipeline.totalStrength = .72;
      pipeline.base = .12;
      pipeline.samples = this.profile === 'ultra' ? 16 : 8;
      pipeline.textureSamples = profile.samples;
      pipeline.maxZ = 1800;
      this.ssao = pipeline;
      this.ssaoEnabled = true;
    } catch (error) {
      console.warn('SSAO2 is unavailable on this renderer; continuing without it.', error);
    }
  }

  applyImageProcessing(mode: ImageProcessingMode) {
    const image = this.scene.imageProcessingConfiguration;
    if (mode === 'raw') {
      image.toneMappingEnabled = false;
      image.exposure = 1;
      image.contrast = 1;
    } else {
      image.toneMappingEnabled = true;
      image.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
      image.exposure = 1.08;
      image.contrast = 1.08;
    }
  }

  setSiteDetail(enabled: boolean) {
    this.site.setDetail(enabled);
  }

  resetView() {
    this.camera.inertialAlphaOffset = 0;
    this.camera.inertialBetaOffset = 0;
    this.camera.inertialRadiusOffset = 0;
    this.camera.inertialPanningX = 0;
    this.camera.inertialPanningY = 0;
    this.camera.alpha = -Math.PI / 4;
    this.camera.beta = .92;
    this.camera.radius = 980;
    this.camera.setTarget(new Vector3(0, 0, -15));
  }

  fitSite() {
    this.camera.inertialAlphaOffset = 0;
    this.camera.inertialBetaOffset = 0;
    this.camera.inertialRadiusOffset = 0;
    this.camera.inertialPanningX = 0;
    this.camera.inertialPanningY = 0;
    const bounds = this.site.root.getHierarchyBoundingVectors(true);
    const center = bounds.min.add(bounds.max).scale(.5);
    const extent = bounds.max.subtract(bounds.min);
    this.camera.setTarget(center);
    this.camera.radius = Math.max(extent.x, extent.y, extent.z) * .98;
  }

  async showIfc(): Promise<IfcSmokeStats> {
    this.site.root.setEnabled(false);
    const stats = await this.ifcSmoke.load();
    this.ifcSmoke.setEnabled(true);
    const bounds = this.ifcSmoke.getBounds();
    if (bounds) {
      const center = bounds.min.add(bounds.max).scale(.5);
      const extent = bounds.max.subtract(bounds.min);
      this.camera.setTarget(center);
      this.camera.radius = Math.max(extent.x, extent.y, extent.z) * 1.6;
    }
    return stats;
  }

  showLaLima() {
    this.ifcSmoke.setEnabled(false);
    this.site.root.setEnabled(true);
    this.resetView();
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.diagnostics?.dispose();
    this.ssao?.dispose(true);
    this.shadowGenerator?.dispose();
    this.site?.dispose();
    this.ifcSmoke?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}

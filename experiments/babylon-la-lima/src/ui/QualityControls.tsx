import type { ImageProcessingMode, QualityProfileId, RendererPreference } from '../engine/qualityProfiles';

type Props = {
  profile: QualityProfileId;
  renderer: RendererPreference;
  webGpuAvailable: boolean;
  ssao: boolean;
  imageMode: ImageProcessingMode;
  detail: boolean;
  onProfile(profile: QualityProfileId): void;
  onRenderer(renderer: RendererPreference): void;
  onSsao(enabled: boolean): void;
  onImageMode(mode: ImageProcessingMode): void;
  onDetail(enabled: boolean): void;
};

export function QualityControls(props: Props) {
  return <section className="control-card" aria-labelledby="quality-title">
    <div className="section-heading"><span>02</span><h2 id="quality-title">Render quality</h2></div>
    <label>Renderer
      <select value={props.renderer} onChange={event => props.onRenderer(event.target.value as RendererPreference)}>
        <option value="auto">Auto · WebGL2 primary</option>
        <option value="webgl2">WebGL2</option>
        <option value="webgpu" disabled={!props.webGpuAvailable}>WebGPU{props.webGpuAvailable ? '' : ' · unavailable'}</option>
      </select>
    </label>
    <div className="segmented" aria-label="Quality profile">
      {(['performance', 'balanced', 'ultra'] as const).map(profile =>
        <button key={profile} className={props.profile === profile ? 'active' : ''} onClick={() => props.onProfile(profile)}>{profile}</button>
      )}
    </div>
    <label>Image processing
      <select value={props.imageMode} onChange={event => props.onImageMode(event.target.value as ImageProcessingMode)}>
        <option value="raw">Raw</option>
        <option value="architectural">Architectural</option>
      </select>
    </label>
    <label className="toggle"><input type="checkbox" checked={props.ssao} onChange={event => props.onSsao(event.target.checked)} /><span>SSAO2</span></label>
    <label className="toggle"><input type="checkbox" checked={props.detail} onChange={event => props.onDetail(event.target.checked)} /><span>Site Detail Test</span></label>
  </section>;
}

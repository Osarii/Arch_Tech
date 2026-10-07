import type { BenchmarkResult, DiagnosticsSnapshot } from '../engine/diagnostics';

const number = (value: number, digits = 0) => Number.isFinite(value) ? value.toFixed(digits) : '—';

type Props = {
  diagnostics: DiagnosticsSnapshot | null;
  result: BenchmarkResult | null;
  running: boolean;
  onRun(): void;
  onCopy(): void;
};

export function BenchmarkPanel({ diagnostics, result, running, onRun, onCopy }: Props) {
  const entries: Array<[string, string]> = diagnostics ? [
    ['Renderer', diagnostics.renderer], ['GPU', diagnostics.gpu],
    ['FPS', number(diagnostics.fps, 1)], ['Frame', `${number(diagnostics.frameTimeMs, 2)} ms`],
    ['Draw calls', number(diagnostics.drawCalls)], ['Triangles', number(diagnostics.triangles)],
    ['Meshes', `${diagnostics.activeMeshes} active / ${diagnostics.totalMeshes} total`],
    ['Materials', String(diagnostics.materials)], ['Textures', String(diagnostics.textures)],
    ['DPR', `${number(diagnostics.effectiveDpr, 2)} effective`],
    ['Shadows', diagnostics.shadows], ['SSAO', diagnostics.ssao ? 'On' : 'Off'],
  ] : [];
  return <section className="benchmark-card" aria-labelledby="benchmark-title">
    <div className="section-heading"><span>03</span><h2 id="benchmark-title">Diagnostics</h2></div>
    <dl>{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd></div>)}</dl>
    <button className="primary" disabled={running} onClick={onRun}>{running ? 'Running 15 s benchmark…' : 'Run 15 s benchmark'}</button>
    {result && <div className="result" aria-live="polite">
      <strong>{result.profile.toUpperCase()} RESULT</strong>
      <span>{number(result.averageFps, 1)} avg FPS</span>
      <span>{number(result.minimumFps, 1)} min FPS</span>
      <span>{number(result.p95FrameTimeMs, 2)} ms p95</span>
      <button onClick={onCopy}>Copy JSON</button>
    </div>}
  </section>;
}

import { useEffect, useRef, useState } from 'react';
import { BabylonLabEngine } from './engine/BabylonEngine';
import { runBenchmark, type BenchmarkResult, type DiagnosticsSnapshot } from './engine/diagnostics';
import type { ImageProcessingMode, QualityProfileId, RendererPreference } from './engine/qualityProfiles';
import type { IfcSmokeStats } from './ifc/BabylonIfcSmokeTest';
import { BenchmarkPanel } from './ui/BenchmarkPanel';
import { QualityControls } from './ui/QualityControls';

function initialRenderer(): RendererPreference {
  const value = new URLSearchParams(location.search).get('renderer');
  return value === 'webgpu' || value === 'webgl2' ? value : 'auto';
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labRef = useRef<BabylonLabEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [renderer, setRenderer] = useState<RendererPreference>(initialRenderer);
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const [profile, setProfile] = useState<QualityProfileId>('performance');
  const [ssao, setSsao] = useState(false);
  const [imageMode, setImageMode] = useState<ImageProcessingMode>('raw');
  const [detail, setDetail] = useState(false);
  const [mode, setMode] = useState<'site' | 'ifc'>('site');
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSnapshot | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [ifcStats, setIfcStats] = useState<IfcSmokeStats | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lab = new BabylonLabEngine();
    labRef.current = lab;
    let active = true;
    lab.init(canvas, renderer).then(() => {
      if (!active) return;
      setWebGpuAvailable(lab.webGpuAvailable);
      setReady(true);
      lab.startDiagnostics(setDiagnostics);
      Object.assign(window, { __BABYLON_LAB__: lab });
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)));
    return () => { active = false; lab.dispose(); delete (window as Window & { __BABYLON_LAB__?: unknown }).__BABYLON_LAB__; };
  }, []);

  const changeRenderer = (next: RendererPreference) => {
    const url = new URL(location.href);
    if (next === 'auto') url.searchParams.delete('renderer'); else url.searchParams.set('renderer', next);
    location.assign(url);
  };

  const changeProfile = async (next: QualityProfileId) => {
    const lab = labRef.current;
    if (!lab) return;
    await lab.applyQuality(next);
    setProfile(next);
    setSsao(lab.ssaoEnabled);
    setImageMode(next === 'performance' ? 'raw' : 'architectural');
  };

  const changeSsao = async (enabled: boolean) => {
    const lab = labRef.current;
    if (!lab) return;
    await lab.setSsao(enabled);
    setSsao(lab.ssaoEnabled);
  };

  const changeMode = async (next: 'site' | 'ifc') => {
    const lab = labRef.current;
    if (!lab) return;
    setError('');
    try {
      if (next === 'ifc') setIfcStats(await lab.showIfc()); else lab.showLaLima();
      setMode(next);
    } catch (reason) {
      lab.showLaLima();
      setMode('site');
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const startBenchmark = async () => {
    const lab = labRef.current;
    if (!lab) return;
    setBenchmarking(true);
    try { setBenchmark(await runBenchmark(lab.scene, lab.camera, lab.diagnostics, lab.diagnosticsState)); }
    finally { setBenchmarking(false); }
  };

  const copyBenchmark = () => benchmark && navigator.clipboard.writeText(JSON.stringify(benchmark, null, 2));

  return <main className="lab-shell">
    <canvas ref={canvasRef} aria-label="Interactive Babylon rendering viewport" />
    <header className="lab-header">
      <div><small>GARNIER ARCHITECTURE · EXPERIMENT 01</small><h1>La Lima<br />Babylon Lab</h1></div>
      <div className="mode-switch" aria-label="Laboratory mode">
        <button className={mode === 'site' ? 'active' : ''} onClick={() => changeMode('site')}>La Lima</button>
        <button className={mode === 'ifc' ? 'active' : ''} onClick={() => changeMode('ifc')}>IFC Smoke Test</button>
      </div>
    </header>
    <aside className="lab-panel">
      <section className="control-card intro">
        <div className="section-heading"><span>01</span><h2>View</h2></div>
        <p>{mode === 'site' ? '1,000 × 790 m experimental mirror · 297 logical objects' : 'IfcOpenHouse · web-ifc → Babylon geometry'}</p>
        {ifcStats && mode === 'ifc' && <p className="ifc-stats">{ifcStats.meshes} meshes · {Math.round(ifcStats.triangles).toLocaleString()} tris · {ifcStats.loadTimeMs.toFixed(0)} ms</p>}
        <div className="action-row"><button onClick={() => labRef.current?.resetView()}>Reset view</button><button onClick={() => labRef.current?.fitSite()} disabled={mode === 'ifc'}>Fit site</button></div>
      </section>
      <QualityControls profile={profile} renderer={renderer} webGpuAvailable={webGpuAvailable} ssao={ssao} imageMode={imageMode} detail={detail}
        onProfile={changeProfile} onRenderer={changeRenderer} onSsao={changeSsao}
        onImageMode={next => { labRef.current?.applyImageProcessing(next); setImageMode(next); }}
        onDetail={enabled => { labRef.current?.setSiteDetail(enabled); setDetail(enabled); }} />
      <BenchmarkPanel diagnostics={diagnostics} result={benchmark} running={benchmarking} onRun={startBenchmark} onCopy={copyBenchmark} />
    </aside>
    <footer className="lab-footer"><span>{ready ? `${labRef.current?.renderer} · ${profile.toUpperCase()}` : 'INITIALIZING ENGINE'}</span><span>Orbit · Pan · Zoom · Pick IFC</span></footer>
    {!ready && !error && <div className="loading">Preparing local PBR scene…</div>}
    {error && <div className="error" role="alert">{error}</div>}
  </main>;
}

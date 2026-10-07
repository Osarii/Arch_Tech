# La Lima Babylon Rendering Lab

An isolated rendering benchmark that mirrors the production La Lima concept site in Babylon.js without changing or wiring into the production Three.js / That Open workspace.

## Isolation

The lab lives only in `experiments/babylon-la-lima/` on `experiment/babylon-la-lima`. It has its own package manifest and lockfile. Vite reads the existing repository `public/` directory so the 5.98 MiB La Lima texture set and `/ifc_open_house.ifc` are not duplicated. No production route, BIM engine, store, service, or root dependency is changed.

The implementation was authored for this experiment. `eldinor/babylon-ifc-viewer` and the requested model-viewer concepts were reviewed only as architectural references; no source was copied.

## Stack

- Babylon.js `8.56.2`
- React `19.3.0`
- Vite `6.4.4`
- `web-ifc` `0.0.78`

## Start

```bash
cd /Users/osariii/Documents/arch_tech-babylon-lab/experiments/babylon-la-lima
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Controls

- Drag: orbit
- Secondary drag: pan
- Wheel / trackpad: zoom
- **Reset view**: restore the common benchmark camera
- **Fit site**: frame the complete 1,000 × 790 m masterplan
- **La Lima / IFC Smoke Test**: switch between the procedural masterplan and `/ifc_open_house.ifc`
- IFC click: outline the selected mesh

## Quality profiles

- **Performance**: effective DPR 1.25, 12 base scene draw calls, no shadows, no SSAO, raw image processing.
- **Balanced**: effective DPR 1.25, selective 1024 px three-cascade CSM, subtle half-resolution SSAO2, ACES image processing.
- **Ultra**: native DPR up to 2, selective 2048 px four-cascade CSM, full-resolution SSAO2, stronger sampling and ACES processing.

SSAO2 and Raw/Architectural image processing can be overridden independently. **Site Detail Test** adds a small removable instanced set of lights, signs, and vehicles; it is off for all recorded base benchmarks.

## Benchmark

**Run 15 s benchmark** executes three five-second phases: static isometric, slow orbit, and closer site view. It records average/minimum FPS plus average/p95 frame time and current scene counters. Results can be copied as JSON.

Recorded results and methodology are in [`../../BABYLON_BENCHMARK.md`](../../BABYLON_BENCHMARK.md). Machine-readable output is in `results/benchmark-results.json`; profile screenshots are stored beside it.

## Renderer selection

WebGL2 is the default and the recorded comparison backend. Auto also selects WebGL2 to keep the comparison stable. WebGPU is enabled only when `WebGPUEngine.IsSupportedAsync` succeeds; choosing it reloads the isolated lab with `?renderer=webgpu`. The tested browser reported WebGPU available and completed a clean scene smoke test, but no WebGPU performance figures are presented as WebGL2 results.

## IFC smoke test

The smoke test initializes `web-ifc`, parses the local 110.6 KiB OpenHouse file, converts streamed positions/normals/indices to Babylon meshes, fits the ArcRotateCamera, and supports basic mesh picking. It intentionally omits spatial trees, property inspection, visibility workflows, editing, persistence, and That Open feature parity.

## Material and rendering notes

The lab uses the exact local La Lima source textures documented in root `LA_LIMA_MATERIALS.md`. Color maps are sRGB; normal, metalness, and roughness data remain linear. The two roof scalar maps are packed into Babylon's green-roughness / blue-metalness convention in memory, so no duplicate runtime asset is committed. Lighting is procedural and local (hemisphere + directional); no HDRI or external request is used.

The masterplan uses one shared box geometry and 12 material sources with Babylon instances. This keeps the base scene at 12 draw calls, 3,564 triangles, and 297 logical meshes. Balanced/Ultra counters rise because their shadow and postprocess passes are included.

## Limitations

- The lab is a renderer benchmark, not a migration plan.
- The scene intentionally keeps production box geometry and does not add interiors, dense vegetation, or vehicle crowds.
- Performance is browser, GPU, window-state, and VSync dependent. Use the JSON hardware string and effective DPR when comparing runs.
- The production baseline and Babylon run use different sampling procedures; visual and structural counters are the reliable cross-engine comparison.
- The generated roof metallic/roughness texture is packed at startup using a local same-origin canvas.

## Remove safely

After preserving any wanted experiment commits, run from the production repository:

```bash
git worktree remove /Users/osariii/Documents/arch_tech-babylon-lab
git branch -D experiment/babylon-la-lima
```

This removes the isolated lab without editing production source files.

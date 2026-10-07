# Babylon La Lima Benchmark

## Purpose and method

This branch compares an isolated Babylon.js 8.56.2 mirror of the production La Lima masterplan with the existing Three.js / That Open reference. It is not a production engine migration.

Babylon measurements were captured in headed Chromium on the target Mac using WebGL2, `ANGLE Metal Renderer: Intel(R) UHD Graphics 630`, a 1536 × 960 CSS viewport, and device DPR 2. Performance/Balanced cap effective DPR at 1.25; Ultra uses DPR 2. Each profile ran the built-in fixed 15-second sequence (static, slow orbit, closer view). Site Detail Test remained off. Browser VSync limits the upper result around 60 FPS.

## Three.js / That Open reference

| Metric | Reference |
| --- | ---: |
| Draw calls | 21 |
| Triangles | 3,564 |
| Geometry count | 1 |
| Observed FPS | ~124 |
| Observed frame time | ~8.1 ms |
| DPR | 1.25 |
| Shadows | Off |
| Hardware | Intel UHD Graphics 630 |

The reference FPS was observed interactively using the production diagnostic path. It was not re-run or modified for this experiment.

## Babylon WebGL2 results

| Metric | Performance | Balanced | Ultra |
| --- | ---: | ---: | ---: |
| Average FPS | 60.2 | 47.0 | 22.2 |
| Minimum FPS | 54.6 | 26.5 | 12.5 |
| Average frame time | 16.66 ms | 22.46 ms | 47.52 ms |
| p95 frame time | 17.70 ms | 31.00 ms | 50.30 ms |
| Draw calls | 12 | 38 | 41 |
| Triangles | 3,564 | 3,564 | 3,564 |
| Total meshes | 297 | 297 | 297 |
| Shared geometries | 1 | 1 | 1 |
| Scene materials | 13 | 13 | 13 |
| Scene textures | 18 | 24 | 24 |
| Hardware scaling | 1.60 | 1.60 | 1.00 |
| Effective DPR | 1.25 | 1.25 | 2.00 |
| Shadows | Off | CSM 1024 / 3 cascades | CSM 2048 / 4 cascades |
| SSAO2 | Off | On, half resolution | On, full resolution |
| Image processing | Raw | ACES architectural | ACES architectural |

The scene reports 13 materials because Babylon includes its default material alongside the 12 shared La Lima PBR materials. Performance reports 18 textures including Babylon's BRDF support texture and the in-memory packed roof map. SSAO2 adds six render textures in Balanced and Ultra.

Performance satisfies the base target of at most 30 draw calls and fewer than 10,000 triangles. Balanced and Ultra exceed 30 reported draw calls because the instrumentation counts CSM/SSAO passes; site geometry and material batching remain unchanged.

## Fairness note

The Babylon run is VSync limited while the historical Three reference reports ~124 FPS, so the FPS figures are not a direct engine throughput ratio. Stable structural counters are comparable: Babylon preserves 3,564 triangles and one shared geometry while reducing the base draw calls from 21 to 12. Balanced and Ultra intentionally spend that headroom on depth cues.

## Qualitative comparison

| Area | Observation |
| --- | --- |
| Asphalt | The exact Asphalt007/005 color and normal maps separate roads from parking at full-site scale; detail remains restrained at the benchmark camera distance. |
| Concrete | Industrial and corporate concrete read as distinct surfaces through their local color/normal maps without adding geometry. |
| Grass | Grass001 breaks up the site border and corporate pad while retaining the planned district geometry. |
| Industrial metal | CorrugatedSteel005 uses albedo, normal, and metalness response; direct light gives warehouse walls more variation than the flat reference treatment. |
| Roofs | The local roof normal plus runtime-packed roughness/metalness channels produce controlled highlights without the excluded red source albedo. |
| Corporate facade | Opaque dark blue-gray PBR glazing stays readable against concrete without transmission/refraction cost. |
| Depth perception | Performance remains intentionally flat and fast. Balanced adds useful grounding from selective CSM and subtle SSAO. Ultra sharpens those cues but is too expensive for the target iGPU. |
| Shadow quality | Balanced is the practical visual mode. Ultra improves resolution/cascade coverage but its 22.2 FPS average and 50.3 ms p95 are unsuitable for routine navigation. |
| Camera feel | ArcRotateCamera orbit, cursor-centered zoom, pan, fit, and reset remain immediate on the kilometer-scale site. |

## Renderer and WebGPU

Primary results use WebGL2. The same Chromium/Intel session reported `WebGPUEngine.IsSupportedAsync = true`; the isolated `?renderer=webgpu` path initialized, rendered, and produced no console exception. WebGPU remains an optional selector and was not mixed into the WebGL2 comparison table.

## IFC smoke test

`/ifc_open_house.ifc` loaded through `web-ifc` in Performance/WebGL2:

| Metric | Result |
| --- | ---: |
| File size | 113,264 bytes |
| Load + conversion | 151.6 ms |
| Babylon meshes | 38 |
| Triangles | 1,098 |
| Observed FPS | 60.0 |
| Picking | Pass |
| Camera fit | Pass |

This proves basic render compatibility only; it does not reproduce That Open BIM behavior.

## Captures and raw result

- `experiments/babylon-la-lima/results/performance.jpg`
- `experiments/babylon-la-lima/results/balanced.jpg`
- `experiments/babylon-la-lima/results/ultra.jpg`
- `experiments/babylon-la-lima/results/benchmark-results.json`

All runtime requests in the final automated pass were local. The pass reported no console exceptions, failed requests, missing materials, or external asset requests.

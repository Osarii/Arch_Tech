# Render Engine V3 Foundation

## Baseline

V3 begins from the existing That Open `SimpleRenderer`, `OrthoPerspectiveCamera`, Fragments IFC workflow, and the procedural La Lima concept site. La Lima already uses one shared box geometry, instancing for repeated development elements, 12 shared PBR material instances, and 18 local 512px textures.

| Baseline measurement | Value | Source |
| --- | ---: | --- |
| La Lima draw calls | 21 | renderer diagnostics / material validation |
| La Lima triangles | 3,564 | renderer diagnostics / material validation |
| Unique site geometry | 1 | shared `BoxGeometry` |
| Logical site objects | 297 | site validation |
| Runtime textures | 18 | material validation |
| Headless Chromium isometric FPS | 23 | automated software rendering; not hardware-comparable |

The target remains a MacBook Pro 2019 with Intel UHD 630. This is a performance-first BIM viewer: DPR is capped at 1.25, shadows, bloom, SSAO, and post-processing stay off.

## Bottlenecks and measured constraints

The scene structure is already below the 25 draw-call and 10,000-triangle site budgets. The remaining variable cost is raster resolution, material texture sampling, and camera-driven render cadence. Adding LOD meshes, shadow maps, an HDR environment, or another render loop would add cost without addressing the measured bottleneck.

## V3 changes

- Added engine-owned Performance, Balanced, and Presentation profiles.
- Applied renderer-safe settings before camera construction and camera-dependent profile work only after camera initialization.
- Added a low-frequency diagnostics snapshot with FPS, frame time, draw calls, triangles, geometries, textures, effective DPR, profile, interaction state, and shadow state.
- Added conservative adaptive DPR: 0.05 steps, three sustained low-FPS samples, six sustained high-FPS samples, and a five-second cooldown.
- Adaptive DPR receives samples only while camera interaction or a camera transition is active; idle render cadence cannot lower resolution.
- Replaced ad-hoc scene lights with an idempotent shared daylight pair that changes intensity per profile without rebuilding the renderer or scene.

## Quality presets

| Profile | DPR range | Tone mapping | Adaptive DPR | Use |
| --- | ---: | --- | --- | --- |
| Performance | 0.85–1.00 | None | Yes | large IFC or constrained hardware |
| Balanced | 0.90–1.15 | ACES | Yes | default architectural/BIM work |
| Presentation | 1.25 | ACES | No | deliberate still inspection |

All profiles retain sRGB output and PBR `MeshStandardMaterial` response. All profiles keep shadows disabled for the target hardware.

## Materials, lighting, LOD, and instancing

La Lima keeps its consolidated PBR palette: semantic aliases reuse material instances, textures remain local 512px assets, color maps use sRGB, and data maps stay linear. No extra environment texture or PMREM target is created.

The site’s warehouses, roads, parking, corporate masses, details, and markings are already instanced. A separate LOD hierarchy is intentionally deferred: at 3,564 triangles it would add selection, lifecycle, and visual-consistency cost without a measurable rendering benefit. Texture loading is browser-progressive through `TextureLoader`; geometry is available immediately and no blocking asset fetch is introduced.

The daylight pair is limited to a hemisphere and directional source. Shadows remain off, so there is no oversized site shadow frustum or caster traversal. This preserves stable isometric/site-plan views and avoids expensive shadow resources.

## Before and after metrics

The V3 foundation does not add geometry, textures, materials, draw calls, shadow maps, or post-processing. Its comparable structural result is therefore unchanged: 21 draw calls, 3,564 triangles, one shared site geometry, and 18 textures for La Lima. Hardware FPS must be captured on the target Mac after this foundation is exercised; headless Chromium is intentionally not presented as a target-Mac benchmark.

## Remaining limitations

- No GPU timer-query instrumentation: WebGL support is inconsistent and the low-frequency renderer counters are sufficient for profile decisions.
- No automatic scene LOD: revisit only after a validated IFC/site exceeds the current draw-call or triangle budgets.
- Quality selection is engine API only in this foundation; public UI controls are intentionally outside this render-scope change.

## V3.2 interaction and camera controls

V3.2 adds a procedural-scene interaction layer without changing La Lima geometry, material ownership, instancing, quality presets, or adaptive DPR. Semantic warehouse, logistics-yard, multitenant, and corporate-massing instances carry existing concept-site metadata for selection. IFC selection continues through That Open's Highlighter and property extraction.

- Hover and selection use two reusable `Box3Helper` overlays. Source material instances are never recolored or cloned.
- An `InstancedMesh` remains instanced; instance IDs identify selected and hidden site masses. Hide/isolate saves original instance matrices and `Show All` restores them without a scene reload.
- The compact viewport inspector only shows supplied metadata. It provides Focus, Isolate, Hide, Close Selection, and Show All.
- Architectural camera controls constrain dolly distance to 4–3000m, prevent under-terrain orbiting, retain cursor dolly, and respect system reduced motion for Fit, Reset, standard views, and selection focus.
- The static La Lima baseline remains 21 draw calls, 3,564 triangles, and 18 textures. A selected/hovered mass adds only the visible helper-line overlay draw calls; no site geometry or texture count changes.

## V3.3 Architectural Render Presentation Polish (V3.3B)

V3.3 refines the visual realism, architectural depth, and material differentiation of the ARCH_TECH 3D viewer while preserving the exact zero-overhead runtime baseline: 21 draw calls, 3,564 triangles, 12 shared material instances, and 18 local 512px textures.

### 1. Architectural Daylight & Sun Calibration
- **Directional Sunlight**: Sun position relocated from `(120, 220, 100)` to `(160, 240, 130)` (~38° azimuth, ~46° altitude). This 3-quarter rake angle creates crisp architectural separation between roof planes and vertical facade envelopes. Solar daylight color calibrated to 5600K (`0xfffbf2`).
- **Hemisphere Fill**: Calibrated from flat white/gray (`0xffffff`, `0x333945`) to a cool architectural sky (`0xe4edff`) and warm earth bounce (`0x363a35`), preventing washed-out shadows and eliminating flat illumination across recessed loading docks and plazas.
- **Directional Shadow Setup**: Directional shadow bounds pre-configured (`1024x1024` map, `near 50`, `far 1200`, `[-600, 600]` ortho bounds, `bias -0.0003`, `normalBias 0.02`), keeping `castShadow = false` by policy to protect Intel UHD 630 performance while ensuring immediate readiness for targeted renders.

### 2. Atmospheric Depth & Horizon Fog
- **Background Slate**: Scene background updated from raw dark blue (`0x0e1117`) to architectural graphite (`0x111419`), aligning with the ARCH_TECH and Garnier corporate visual system.
- **Atmospheric Fog**: Integrated linear `THREE.Fog(0x111419, fogNear, fogFar)` matching the background tone. Distant boundaries of the 1,000m masterplan smoothly recede into the canvas without harsh clipping edges.

### 3. Architectural PBR Material Differentiation
The 12 shared materials were systematically tuned for distinct tactile readability without increasing texture memory or draw calls:
- **Standing Seam Roofs vs. Facade Panels**: Roof profiles darkened to `0x647076` (`metalness 0.78`, `roughness 0.52`, `normalScale 0.65`) against lighter insulated sandwich facade panels `0xb8c2c7` (`metalness 0.72`, `roughness 0.42`, `normalScale 0.55`), making building forms instantly readable from aerial and masterplan perspectives.
- **Roadway Asphalt vs. Parking Aggregate**: Arterial roads tuned to dark freshly paved asphalt `0x2d3033` (`roughness 0.82`, `normalScale 0.5`) with bright yellow highway markings `0xf0c644`, while parking lots use weathered aggregate `0x42464a` (`roughness 0.88`, `normalScale 0.38`) with crisp stall striping `0xf2f5f2`.
- **Precast Corporate Concrete vs. Industrial Foundation**: Corporate masses use refined architectural cast stone `0xd6dcda` (`roughness 0.68`, `metalness 0.08`, `normalScale 0.35`), while logistics yards and loading docks use rugged poured structural concrete `0xb5bcb8` (`roughness 0.82`, `metalness 0.05`, `normalScale 0.45`).
- **Corporate Solar Glazing**: Glazing bands and skylights use deep solar-reflective architectural glass `0x1d3545` (`roughness 0.08`, `metalness 0.88`, `normalScale 0.12`). Sharp specular response mirrors the sky and sunlight realistically under ACES Filmic tone mapping without expensive transparency sorting or refractive passes.
- **Corporate Green Landscape**: Grass tuned from pale sage to natural corporate landscape green `0x4a634e` (`roughness 0.92`, `metalness 0.02`), resting on a deep grounded earth pad `0x222625`.

### 4. Quality Profiles Comparison Matrix

| Property | Performance | Balanced | Presentation |
| --- | --- | --- | --- |
| **DPR Range** | 0.85 – 1.00 (Adaptive) | 0.90 – 1.15 (Adaptive) | 1.25 (Fixed) |
| **Tone Mapping** | NoToneMapping | ACESFilmicToneMapping | ACESFilmicToneMapping |
| **Exposure** | 1.00 | 1.00 | 1.08 |
| **Sun Intensity** | 1.20 | 1.40 | 1.60 |
| **Hemisphere Fill** | 0.95 | 1.10 | 1.15 |
| **Fog Near / Far** | 950m / 3200m | 800m / 2600m | 700m / 2400m |
| **Target Hardware** | Intel UHD 630 battery | Standard workflow | High-fidelity still / client review |
| **Draw Calls** | 21 | 21 | 21 |
| **Triangles** | 3,564 | 3,564 | 3,564 |
| **Textures** | 18 | 18 | 18 |

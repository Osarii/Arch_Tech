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

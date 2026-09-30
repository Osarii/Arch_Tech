# Project Journal

## Milestones & Architectural History

### 2026-09-30 — BIM Lab V1 Implementation Complete
- **Scaffolding**: Configured React 19, TypeScript 5.7, Vite 6, Tailwind CSS with dark technical theme.
- **BIM Core Engine**: Integrated That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`).
- **Intel UHD Graphics 630 Baseline**: Clamped DPR to max 1.25, disabled shadows and postprocessing, tuned directional and ambient lighting.
- **WASM & Workers**: Copied local `web-ifc.wasm` and `worker.min.mjs` to `public/` to run self-contained offline.
- **Real IFC Loading**: Integrated multi-stage loading pipeline ("Reading IFC" → "Parsing model" → "Creating fragments" → "Preparing scene" → "Building BIM tree" → "Ready").
- **Properties & Spatial Tree**: Implemented authentic IFC metadata extraction (Attributes, Psets, Qto, Materials, Storey relations) without fake data.
- **Inspection Tools**: Wired section planes (Clipper) and distance measurement (LengthMeasurement).
- **Verification**: Verified with Vitest (unit tests) and Playwright (E2E testing).

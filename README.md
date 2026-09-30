# BIM LAB V1 — OpenBIM Engineering Platform

A professional desktop-first web application capable of loading, visualizing, inspecting, filtering, measuring, sectioning, and navigating real `.ifc` files.

## Technology Stack
- **BIM Core**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React
- **State**: Zustand
- **Testing**: Vitest, Playwright

## Target Hardware Baseline
- Minimum target: MacBook Pro 2019 / Intel UHD Graphics 630 (1536 MB)
- Max DPR: 1.25, Shadows OFF, Postprocessing OFF, Lightweight Ambient + Directional lighting

## Architecture & Data Pipeline
```text
IFC File
   ↓
web-ifc (WASM) & That Open IfcLoader
   ↓
FragmentsManager & Three.js Scene
   ↓
Highlighter (Selection) & Hider (Visibility)
   ↓
Spatial BIM Tree & Collapsible Property Sets (Psets, Qto)
```

## Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests
npm run test:ui

# Production build
npm run build
```

## Internal AI-Callable Tools Exposed
The engine exposes clean internal functions ready for future agent tool-calling:
- `selectElements(expressIDs: number[], zoom?: boolean)`
- `hideElements(expressIDs: number[])`
- `isolateElements(expressIDs: number[])`
- `showAll()`
- `focusElements(expressIDs: number[])`
- `getProperties(expressID: number)`
- `setStandardView(view: StandardViewDirection)`
- `setCameraMode(mode: CameraViewMode)`
- `createClippingPlane()`
- `startMeasurement()`
- `unloadModel()`

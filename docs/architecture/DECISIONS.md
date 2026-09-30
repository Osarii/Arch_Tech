# Architectural Decisions

- **DEC-001**: That Open Components & Fragments are the primary BIM runtime.
- **DEC-002**: React Three Fiber is not the main BIM renderer (direct Three.js managed by That Open World).
- **DEC-003**: Intel UHD Graphics 630 is the minimum performance baseline (DPR max 1.25, no bloom/shadows/SSAO).
- **DEC-004**: Separation of BIM engine from React UI state. Zustand stores lightweight primitives only.
- **DEC-005**: Real IFC parsing via `web-ifc` and That Open `IfcLoader` with local WASM assets.

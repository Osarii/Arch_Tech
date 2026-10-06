# Architectural Decisions

- **DEC-001**: That Open Components & Fragments are the primary BIM runtime.
- **DEC-002**: React Three Fiber is not the main BIM renderer (direct Three.js managed by That Open World).
- **DEC-003**: Intel UHD Graphics 630 is the minimum performance baseline (DPR max 1.25, no bloom/shadows/SSAO).
- **DEC-004**: Separation of BIM engine from React UI state. Zustand stores lightweight primitives only.
- **DEC-005**: Real IFC parsing via `web-ifc` and That Open `IfcLoader` with local WASM assets.
- **DEC-006**: Vitest remains the unit/domain test runner. Do not migrate to Jest without explicit instruction.
- **DEC-007**: Motion architecture is split between `src/motion` (technical/accessibility policy) and `src/components/motion` (visual presentation primitives). Visual components consume the canonical technical motion layer.
- **DEC-008**: Public project route transitions are scoped only to public portfolio/project navigation (`/` ↔ `/projects/:projectId`) and must bypass portal/BIM/login/error routing.
- **DEC-009**: Reduced-motion behavior is a first-class invariant. Decorative motion must never block navigation or content visibility.

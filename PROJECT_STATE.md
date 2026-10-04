# PROJECT_STATE.md — Current Working State & Canonical Handoff

> Purpose: Single authoritative state document for new ChatGPT / Antigravity sessions to resume work without scanning or re-reading the repository.

---

## 1. Project Purpose & Scope
**ARCH_TECH** is a dual-capability architecture & engineering platform:
1. **Public Development Portfolio & Portal**: Sourced from real-estate development concepts in Costa Rica (free zones, corporate districts, hospitality, AI compute campuses, medical facilities). Features a client portal with role-based access for Clients, Architects, and Admins.
2. **Authoritative OpenBIM Engineering Workspace**: Desktop-first browser-based CAD environment capable of loading, visualizing, inspecting, editing, generating, and persisting authentic ISO STEP-21 `.ifc` files directly in WebGL using That Open Components, Fragments, and `web-ifc` WASM.

---

## 2. Technology Stack
- **Core Engine & BIM**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend & App Framework**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React icons
- **State Management**: Lightweight Zustand (`src/stores/bimStore.ts` for BIM state; `src/portal/data.ts` for portal state snapshot)
- **Database & Persistence**: `db.json` (demo seed), `localStorage` (`arch-tech-portal-state`, schema version 2), native STEP-21 IFC persistence
- **Testing & Tooling**: Vitest 3.x (unit/domain), Playwright (E2E browser workflows)

---

## 3. Application Routing Model
- `/` — Public Editorial Landing Page with hero showcase, project register, development approach, and Client Login modal.
- `/projects/:id` — Public Project Detail view featuring the SpatialRail media carousel, project specifications, scope statement, and milestone roadmap.
- `/dashboard` — Protected Client Portal Dashboard (project progress, milestone tracking, project updates, document vault, approval actions).
- `/architect` — Protected Architect Portal Dashboard (curated architectural designs, technical specifications, and submission approval queues).
- `/admin` — Protected Admin Portal (full project portfolio register, user role assignments, project creation form, publication toggle).
- `/workspace` — Production OpenBIM Engineering Workspace (portal-authenticated in production; supports dev/test legacy direct entry via `/?view=workspace`, `?app=true`, or `#workspace`). Features `← Landing` return control.

---

## 4. Multi-Role Portal & User Access Structure
- **Data Source**: `db.json` serves as the initial seed; runtime mutations persist in `localStorage` under `arch-tech-portal-state` (Schema Version 2).
- **Client Role**: Accesses assigned projects, project status, milestones, documents, updates, and pending approvals.
- **Architect Role**: Accesses architectural drawings, technical specs, and design approval workflows.
- **Admin Role**: Full portal control—publishes projects, creates new development projects, assigns user roles, and modifies project metadata.
- **Demo Auth**: Handled via `src/portal/demoAuth.ts` with quick-login role presets.

---

## 5. BIM Workspace Status
- **Core Capabilities**:
  - IFC parsing & streaming geometry (`IfcLoaderService.ts`)
  - Spatial tree hierarchy (`IfcProject` -> `IfcSite` -> `IfcBuilding` -> `IfcBuildingStorey` -> `Categories` -> `Elements`)
  - Property set inspection (Psets, Qto)
  - Element visibility controls (Hide, Isolate, Fit to View, Show All)
  - 2D Floor Plan rendering & 3D Section Planes (X/Y/Z clipping)
  - Length measurement & interactive viewport tools
  - Quantity & area/volume analysis (`BimAnalysisService.ts`)
  - Non-destructive visual editing (`BimEditService.ts` proxy mesh layer: move, rotate, delete/restore, undo/redo, ChangeSet tracking)
  - **Real IFC Persistence**: Authentic STEP-21 exports via detached, idempotent execution on isolated temp WebIFC models (`IfcPersistenceService.ts`), with exact coordinate remapping and relative rotation composition.
  - **Parametric Building Generation**: Deterministic massing plan generation (`GenerationPlan`) authored directly to valid IFC4 STEP-21 models (`IfcAuthoringService.ts`) with pre-load reopening validation.
  - **AI Assistant**: Deterministic offline rule-based AI agent (`AIAgent.ts`) with explicit human confirmation gates (`ToolRegistry.ts`) for all `WRITE` actions.

---

## 6. Current 6 Public Projects
The public portfolio features six Costa Rica commercial and technological development projects:
1. **Pacific Nexus Free Zone Campus** (`pacific-nexus`)
2. **Summit Point Corporate District** (`summit-point`)
3. **Mar Vista Hospitality District** (`mar-vista`)
4. **Caribbean AI Compute Campus** (`caribbean-compute`)
5. **Guanacaste Renewable Compute Campus** (`guanacaste-compute`)
6. **Pacific Regional Medical Campus** (`pacific-medical`)

---

## 7. Project Image System & Migration Status
- **Asset Storage**: Canonical project image packs stored as zip archives under `src/imgs/` and unpacked to `public/projects/<project-slug>/`.
- **Media Schema**: Standardized media structure (`image` for primary hero, plus `media.aerial`, `media.campusOverview`, `media.masterplan`, `media.sitePlan`, `media.floorPlan`, `media.interior`, `media.conceptBoard`).
- **Migration Status**: **CLOSED / COMPLETE**. Legacy placeholder assets removed; schema version 2 automatically migrates runtime storage, sanitizing legacy asset paths and preserving safe `/projects/...` paths.

---

## 8. Current SpatialRail / Project Detail State
- **Implementation**: `src/components/gallery/SpatialRail.tsx`
- **Features**:
  - Custom high-performance horizontal image carousel built with native CSS scroll-snap.
  - IntersectionObserver slide tracking with smooth programmatic button scrolling.
  - Aspect ratio handling: `wide` (16:9/16:10, cover) for exterior/aerial shots; `technical` (4:3, contain) for masterplans and floor plans.
  - Thin editorial progress bar and active slide indicators (`01 / 08`).
  - Scoped keyboard navigation (Left/Right arrows, Escape key).
  - Fullscreen Lightbox viewer (`rail-fullscreen`) with zoom inspection and keyboard controls.
  - Replaced prior Motion and Embla carousel dependencies, reducing bundle size.

---

## 9. Performance Optimization Status
- **Hardware Baseline**: MacBook Pro 2019 / Intel UHD Graphics 630 (1536 MB VRAM).
- **Viewer Constraints**: DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF, lightweight ambient + directional lighting.
- **Image Optimization**: Priority-based loading (`eager` hero images, `lazy` offscreen slides, `high`/`low` fetchPriority, `decoding="async"`).
- **Build Optimization**: Code splitting with Vite, workers offloaded for WASM execution.

---

## 10. Agent Workflow Rules & Tool Policy
- **Serena**: Use for targeted symbol and declaration lookups. **Never scan the full repo**.
- **RTK**: Use to compress and analyze long test/build outputs and verbose diffs.
- **Ponytail**: YAGNI gate before adding new dependencies, abstractions, or new documentation files.
- **Prompt Workflow Conventions**:
  - **Diff-First**: Run `git status` and `git diff` before loading files.
  - **Context Routing**: Read `AGENTS.md` + `PROJECT_STATE.md`, then consult `docs/context/CONTEXT.md` by line range.
  - **Fast Task Mode**: No intermediate narration; run targeted tests first; execute clean verification before reporting results.

---

## 11. What Is Finished
- **Phase 6A**: Viewport lifecycle and state reset hardening.
- **Phase 6B.1**: Transactional IFC4 building generation from `GenerationPlan`.
- **Phase 6B.2**: Detached & idempotent real IFC persistence round-trip (UI X->IFC X, UI Y->IFC Z, UI Z->IFC Y coordinate mapping; relative rotation delta composition; delete/restore containment unlinking reconciliation; transactional reload rollback boundary).
- **Public Experience & Portal**: Costa Rica development portfolio, multi-role access (Client/Architect/Admin), demo auth, dark architectural editorial design.
- **SpatialRail Media Carousel**: High-performance scroll-snap media rail & lightbox.
- **Portfolio Asset Pipeline**: Canonical zip image packs integrated & schema v2 migration completed.

---

## 12. What Is Currently Being Worked On
- Handoff documentation consolidation and verification across `PROJECT_STATE.md`, `README.md`, `CODEX_CONTEXT_ARCH_TECH.md`, and `docs/context/CONTEXT.md`.

---

## 13. Known Issues & Tech Debt
1. **Metadata Extractor Schema Discrepancy**: `IfcOpenHouse_IFC4.ifc` file header specifies `IFC4`, but property extractor metadata reports `IFC2X3` in viewer UI. Do not alter loader/schema code without an explicit directive.
2. **Vite Bundle Size Warning**: Production build emits bundle size warning for `Workspace` (~7 MB) and `worker` (~3.2 MB) due to embedded `web-ifc` WASM binaries and Three.js engine overhead; expected for complex browser CAD.

---

## 14. Next Recommended Tasks
1. **Phase 6B.3**: OpenBIM authoring extensions (Doors, Windows, Openings, Material relations).
2. **Phase 6C**: Advanced spatial analytics & automated compliance rules.

---

## 15. Invariants — DO NOT CHANGE ACCIDENTALLY
- **BIM Viewer Isolation**: Never mutate `src/bim/` engine code while making landing/portal UI edits.
- **Coordinate Mapping**: UI X -> IFC X, UI Y (vertical) -> IFC Z, UI Z (depth) -> IFC Y.
- **Detached Persistence**: Always run persistence exports against isolated temporary WebIFC models, keeping active model untouched.
- **Human Confirmation Gate**: All `WRITE` tools (edits, generation commit, persistence save) require explicit human confirmation.
- **Sample Files**: Do not delete `public/small_model.ifc` or `public/ifc_open_house.ifc`.
- **Documentation Policy**: Extend `docs/context/CONTEXT.md` or update `PROJECT_STATE.md` / `README.md`; do not create duplicate `.md` files without approval.

---

## 16. Current Verification Status
- **Vitest Unit/Domain Tests**: **134 / 134 PASSED** across 13 test files.
- **Production Build**: **SUCCESS** (`tsc -b && vite build` clean exit code 0).
- **Playwright E2E Tests**: **14 / 14 PASSED** (full browser verification suite).
- **Git Diff**: Clean.

# PROJECT_STATE.md — Current Working State & Canonical Handoff

> Purpose: Single authoritative state document for new ChatGPT / Antigravity sessions to resume work without scanning or re-reading the repository.

---

## 1. Project Purpose & Scope
**Verified application checkpoint:** The current integrated checkpoint is the Git `HEAD` produced by the latest verified run. This reliability pass began from `948101b081f98c75218a130cf9a3252393bb5716`; every task must still resolve its actual `BASE` from current remote `main` before execution.

**ARCH_TECH** is a dual-capability architecture & engineering platform with this product hierarchy:
1. **Public Identity**: Large-scale developments and infrastructure: free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and complex sites.
2. **Portal Experience**: Project/client/architect/admin workflows for tracking portfolio progress, milestones, documents, approvals and project activity.
3. **OpenBIM / IFC Capability**: A fundamental technical capability demonstrated inside the platform/workspace, not the dominant public landing identity. The Workspace can load, visualize, inspect, edit, generate and persist authentic ISO STEP-21 `.ifc` files directly in WebGL using That Open Components, Fragments and `web-ifc` WASM.

---

## 2. Technology Stack
- **Core Engine & BIM**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend & App Framework**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React icons
- **State Management**: Lightweight Zustand (`src/stores/bimStore.ts` for BIM state; `src/portal/data.ts` for portal state snapshot)
- **Database & Persistence**: `db.json` (demo seed), `localStorage` (`arch-tech-portal-state`, schema version 2), native STEP-21 IFC persistence
- **Testing & Tooling**: Vitest 3.x (unit/domain), Playwright (E2E browser workflows)

---

## 3. Product Direction and Application Routing Model

ARCH_TECH's primary public identity is large-scale development and infrastructure. The public experience should communicate campuses, districts, utilities, complex delivery and long-term value; it must not read as a residential architecture or house-design studio. OpenBIM/IFC remains a fundamental technical capability inside the platform and portal, especially for Architect/Admin workflows, but is intentionally secondary to the public landing identity. The desired first impression is: “This organization works on large, complex developments, campuses and infrastructure.” The portal and Workspace then demonstrate the deeper OpenBIM capability.

Garnier & Garnier is only a conceptual reference for scale, positioning and enterprise perception. ARCH_TECH must not copy its branding, website design or assets, and must not imply affiliation, partnership or endorsement. Residential/traditional architectural identity belongs to a separate architecture project.
- `/` — Public Editorial Landing Page with large-scale development hero, project register, development approach, and Portal Access modal.
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
These six names and categories are the stable public portfolio unless explicitly changed later:
1. **Pacific Nexus Free Zone Campus** (`pacific-nexus-free-zone`)
2. **Summit Point Corporate District** (`summit-point-corporate-district`)
3. **Mar Vista Hospitality District** (`mar-vista-hospitality-district`)
4. **Caribbean AI Compute Campus** (`caribbean-ai-compute-campus`)
5. **Guanacaste Renewable Compute Campus** (`guanacaste-renewable-compute-campus`)
6. **Pacific Regional Medical Campus** (`pacific-regional-medical-campus`)

---

## 7. Project Image System & Migration Status
- **Asset Storage**: Runtime project media lives under `public/projects/<project-slug>/`. Technical/dossier packs use `.webp` files; preferred public landing images use local `.jpg` reference photographs. Source archives are not the runtime asset location.
- **Media Schema**: Standardized media structure (`image` for primary hero, plus `media.aerial`, `media.campusOverview`, `media.masterplan`, `media.sitePlan`, `media.floorPlan`, `media.interior`, `media.conceptBoard`).
- **Landing Media Mapping**: `src/components/gallery/projectMedia.tsx` maps each of the six canonical fictional projects to a local real-world reference photograph. The photographs are used for public scale/context only and do not represent the fictional projects; the existing concept/render packs remain available for technical/private dossier context. Sources and licenses are recorded in `README.md`.
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
  - Fullscreen/lightbox inspection viewer (`rail-fullscreen`) with keyboard controls. Interactive image zoom is not part of the current implementation.
  - Replaced prior Motion and Embla carousel dependencies, reducing bundle size.

### 8.1 Featured landing carousel
- **Implementation**: `src/components/gallery/FeaturedProjectCarousel.tsx`, mounted by `src/components/landing/Hero.tsx`.
- **Behavior**: Uses all six canonical public projects, links each slide to its public dossier, supports previous/next controls, indicators, Arrow/Home/End keyboard navigation, hover/focus pause, restrained autoplay, and `prefers-reduced-motion` autoplay suppression.
- **Fallbacks**: `ProjectImage` renders a neutral ARCH_TECH development placeholder when a preferred local image is unavailable or fails to decode.

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

### Development Workflow Policy
- Single-agent sequential execution is the default.
- `agent/a-main` and `agent/b-main` are optional visual and technical lanes when explicitly requested; lane names do not imply a specific vendor or tool.
- Both branches were initially created from workflow initialization checkpoint `ecc9ff9c29a899cb48f58923c15fb10d9a07faee`; this does not permanently pin future work to that commit.
- Every task must resolve its actual `BASE` from current remote `main` before execution.
- Each parallel task must declare `BASE`, `AGENT`, `BRANCH`, `READ`, `TARGET`, `READ-ONLY`, `FORBIDDEN`, `ACCEPTANCE`, `STOP` and `GIT`.
- `TARGET` is exclusive write ownership. An agent must never modify a file outside `TARGET`.
- If another file becomes necessary, stop and report the dependency before editing.
- Concurrent task scopes must satisfy:
  - `WRITE(A) ∩ WRITE(B) = ∅`
  - `WRITE(A) ∩ READ(B) = ∅`
  - `WRITE(B) ∩ READ(A) = ∅`
- Shared or hot files such as `src/App.tsx`, `src/index.css`, `src/portal/data.ts`, `db.json`, package/config files and canonical docs cannot be assigned to both agents concurrently.
- During parallel work, agents commit and push only to their assigned branch, never directly to `main`.
- Integration to `main` is sequential. The second branch must rebase or update against the newly integrated `main` and reverify before merge.

---

## 11. What Is Finished
- **Phase 6A**: Viewport lifecycle and state reset hardening.
- **Phase 6B.1**: Transactional IFC4 building generation from `GenerationPlan`.
- **Phase 6B.2**: Detached & idempotent real IFC persistence round-trip (UI X->IFC X, UI Y->IFC Z, UI Z->IFC Y coordinate mapping; relative rotation delta composition; delete/restore containment unlinking reconciliation; transactional reload rollback boundary).
- **Public Experience & Portal**: Costa Rica development portfolio, multi-role access (Client/Architect/Admin), demo auth, dark architectural editorial design.
- **SpatialRail Media Carousel**: High-performance scroll-snap media rail & lightbox.
- **Landing Media Carousel**: Six-project featured carousel with local reusable real-world reference photography, public dossier links, indicators, keyboard navigation, autoplay pause behavior and reduced-motion support. Canonical project names/categories are preserved; Garnier & Garnier remains only a conceptual scale reference.
- **Portfolio Asset Pipeline**: Canonical zip image packs integrated & schema v2 migration completed.
- **Portal Reliability Hardening**: Durable-plus-volatile portal persistence recovery, persisted-shape validation, resilient demo auth and theme storage, project-scoped client notifications, current-date updates, and accessible admin project-creation validation.

---

## 12. Current Priorities
- Landing and public portfolio experience.
- Portfolio project presentation and current project assets.
- Client, Architect and Admin portal quality and access integrity.
- Performance and visual experience.
- Landing/portal work must not modify BIM internals unless explicitly requested.

Phase 6B.3 (OpenBIM authoring extensions) is intentionally **FROZEN** until explicitly reactivated. It is not the current next development priority.

---

## 13. Known Issues & Tech Debt
1. **Metadata Extractor Schema Discrepancy**: `IfcOpenHouse_IFC4.ifc` file header specifies `IFC4`, but property extractor metadata reports `IFC2X3` in viewer UI. Do not alter loader/schema code without an explicit directive.
2. **Vite Bundle Size Warning**: Production build emits bundle size warning for `Workspace` (~7 MB) and `worker` (~3.2 MB) due to embedded `web-ifc` WASM binaries and Three.js engine overhead; expected for complex browser CAD.

---

## 14. Future Work
- Reactivate Phase 6B.3 only through an explicit request.
- Consider Phase 6C only after the current landing, portfolio, portal, asset, performance and visual priorities are intentionally complete.

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
- **Lint / Type Check**: **SUCCESS** (`npm run lint`).
- **Vitest Unit/Domain Tests**: **175 / 175 PASSED** across 15 test files.
- **Production Build**: **SUCCESS** (`tsc -b && vite build` clean exit code 0). The existing large-chunk warning remains expected for the BIM workspace and web-ifc worker.
- **Playwright E2E Tests**: **14 / 14 PASSED** (full browser verification suite).
- **Targeted portal/landing suites**: `portalData` **11 / 11**, `demoAuth` **10 / 10**, `landingPage` **36 / 36**, and `spatialRail` **17 / 17** passed.
- **Git Diff**: Verified with `git diff --check` after the landing media/carousel changes.

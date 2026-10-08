# PROJECT_STATE.md — Current Working State & Canonical Handoff

> Purpose: Single authoritative state document for new ChatGPT / Antigravity sessions to resume work without scanning or re-reading the repository.

---

## 1. Project Purpose & Scope
**Verified application checkpoint:**
- Documentation refresh base: `4ee4e0d4` (`docs(contract): swap agent tool assignments`).
- Latest fully verified application implementation: `c6e9c01c` (`merge(portal): integrate durable admin user persistence`). Integrates durable portal user CRUD via JSON Server (`db.json`) as authoritative persistence during local development (`fix/admin-user-db-persistence`).
- Active feature branches: `feature/render-engine-v2` remains an isolated active render branch and was not touched by this integration.
- Current remote `main` must always be resolved live at the start of a new task.

**ARCH_TECH** is a dual-capability architecture & engineering platform with this product hierarchy:
1. **Public Identity**: Large-scale developments and infrastructure: free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and complex sites.
2. **Portal Experience**: Project/client/architect/admin workflows for tracking portfolio progress, milestones, documents, approvals and project activity.
3. **OpenBIM / IFC Capability**: A fundamental technical capability demonstrated inside the platform/workspace, not the dominant public landing identity. The Workspace can load, visualize, inspect, edit, generate and persist authentic ISO STEP-21 `.ifc` files directly in WebGL using That Open Components, Fragments and `web-ifc` WASM.

---

## 2. Technology Stack
- **Core Engine & BIM**: That Open Components (`3.4.8`), Fragments (`3.4.7`), `web-ifc` (`0.0.78`), Three.js (`0.182.0`)
- **Frontend & App Framework**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React icons
- **Routing & Services**: React Router DOM with protected/role/project guards; typed `src/services/` boundary for API, project, user, auth, notification, external context, AI and automation flows
- **State Management**: Lightweight Zustand (`src/stores/bimStore.ts` for BIM state; `src/portal/data.ts` for portal state snapshot)
- **Database & Persistence**: `db.json` (showcase seed), `localStorage` (`arch-tech-portal-state`, schema version 4), native STEP-21 IFC persistence
- **Testing & Tooling**: Vitest 3.x (unit/domain), Playwright (E2E browser workflows)

---

## 3. Product Direction and Application Routing Model

ARCH_TECH's primary public identity is large-scale development and infrastructure. The public experience should communicate campuses, districts, utilities, complex delivery and long-term value; it must not read as a residential architecture or house-design studio. OpenBIM/IFC remains a fundamental technical capability inside the platform and portal, especially for Architect/Admin workflows, but is intentionally secondary to the public landing identity. The desired first impression is: “This organization works on large, complex developments, campuses and infrastructure.” The portal and Workspace then demonstrate the deeper OpenBIM capability.

Garnier & Garnier remains a reference for development scale and enterprise positioning. ARCH_TECH must not copy Garnier's website UI, layouts, branding system, logos or visual identity, and must not imply that ARCH_TECH is an official Garnier product, partnership, endorsement or production system unless explicitly authorized. Garnier project names, factual public project information and official project photography may be used when a current task explicitly authorizes a Garnier presentation/showcase prototype; such usage must remain clearly presented as an ARCH_TECH concept/prototype unless official status is explicitly provided. Garnier assets must not be introduced into unrelated ARCH_TECH work without explicit task authorization. Residential/traditional architectural identity belongs to a separate architecture project.
- `/` — Public Editorial Landing Page with large-scale development hero, project register, development approach, and Portal Access modal.
- `/projects/:id` — Public Project Detail view featuring the SpatialRail media carousel, project specifications, scope statement, and milestone roadmap.
- `/dashboard` — Protected Client Portal Dashboard (project progress, milestone tracking, project updates, document vault, approval actions).
- `/architect` — Protected Architect Portal Dashboard (curated architectural designs, technical specifications, and submission approval queues).
- `/admin` — Protected Admin Portal (full project portfolio register, user role assignments, project creation form, publication toggle).
- `/workspace` — Production OpenBIM Engineering Workspace (portal-authenticated in production; supports dev/test legacy direct entry via `/?view=workspace`, `?app=true`, or `#workspace`). Features `← Landing` return control.

Optional local HTTP persistence is available through `npm run server` (JSON Server on port 3001) and `VITE_API_BASE_URL`. Without that variable, portal services preserve the existing localStorage-backed snapshot behavior.

---

## 4. Multi-Role Portal & User Access Structure
- **Data Source**: `db.json` serves as the initial seed; runtime mutations persist in `localStorage` under `arch-tech-portal-state` (Schema Version 4).
- **Historical Portfolio Analytics (Phase 6)**: Admin Analytics provides historical portfolio and development project progress trends backed by `progressSnapshots` (supported in local persistence and optional JSON Server `/progressSnapshots` endpoint). Historical-to-current progress deltas calculate against comparable project cohorts using each project's earliest valid snapshot baseline, preventing distortion from active projects lacking history. Snapshot dates strictly adhere to canonical `YYYY-MM-DD` format with real calendar date validation. Current project progress remains live data, while historical snapshots represent internal ARCH_TECH concept coordination telemetry. Trend charts are theme-safe across light, dark, and high-contrast modes, distinguishing historical and live checkpoints by shape, line style, and text labels rather than color alone.
- **Deterministic Portfolio Intelligence (Phase 7A)**: Implemented in Admin Assistant (`src/components/portal/admin/PortfolioInsightsPanel.tsx`, `src/services/portfolioInsightsService.ts`, `tests/portfolioInsights.test.tsx`). Current-data deterministic analysis provides active project count, average progress, pending approvals count, current milestones count, upcoming milestones count, and projects requiring attention. Signal classification:
  - **PRIORITY**: Rejected approvals, multiple pending approvals, or low progress (< 25%) with pending approval.
  - **ATTENTION**: Exactly one pending approval, low progress (< 25%), or missing Current milestone.
  - **INFO**: No actionable signal.
  Strictly deterministic current-data analysis; NOT predictive risk scoring. BIM AI behavior remains unchanged.
- **Client Role**: Accesses assigned projects, project status, milestones, documents, updates, and pending approvals.
- **Architect Role**: Accesses architectural drawings, technical specs, and design approval workflows.
- **Admin Role**: Full portal control—publishes projects, creates new development projects, assigns user roles, and modifies project metadata.
- **Portal Auth**: Handled via `src/portal/demoAuth.ts` for the current presentation users, with production registration, manual login, role-scoped routing and development/test-only quick access presets.
- **Admin Operations**: Active projects expose objective KPIs, a responsive progress chart, search/filter/sort, runtime project creation/deletion with canonical showcase protection, user creation, role/status controls and assignments.
- **Site Intelligence / External Context**: Admin external-context views feature full multi-provider Site Intelligence with manual location resolution via OpenStreetMap Nominatim, live weather observation via Open-Meteo using resolved coordinates, and recent 30-day seismic context within 300 km via USGS Earthquake Catalog. Handles partial provider failures gracefully without requiring external API keys.
- **Persistent Preferences**: Portal text scale options (100%, 112.5%, 125%) persist under `arch-tech-portal-text-scale` alongside the existing Light/Dark theme preference.
- **HTTP Mode**: With `VITE_API_BASE_URL`, the service layer treats JSON Server as authoritative, synchronizes the local snapshot cache after reads/writes, and reconciles project relations on deletion. Project updates, milestones, documents and approvals use `projectWorkflowService` for HTTP CRUD with stable relation IDs and the same local fallback. Without the variable, the same UI uses the local fallback.
- **Implemented vs External Setup**: React Router, auth/register, role guards, HTTP relation CRUD, objective metrics, accessibility, Vitest coverage and deterministic AI fallback are implemented in code. Imported/active n8n workflows, webhook URLs, LLM credentials and live remote AI execution remain external setup and were not run here.
- **n8n Status**: Both workflows are importable JSON definitions with validated contracts and no committed credentials. Live LLM/webhook execution requires external n8n configuration and was not run here.

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
The authorized showcase portfolio uses six current projects from Garnier & Garnier's public portfolio:
1. **Zona Franca La Lima** (`zona-franca-la-lima`) — free zone / industrial park.
2. **El Cafetal** (`el-cafetal`) — corporate center / office campus.
3. **Santa Ana Country Club** (`santa-ana-country-club`) — social and sports club.
4. **Waldorf Astoria** (`waldorf-astoria`) — hotel and residences.
5. **Centro Corporativo La Sabana** (`centro-corporativo-sabana`) — corporate office center.
6. **Universidad Latina** (`universidad-latina`) — educational campus.
Project facts and public photography are source-oriented. ARCH_TECH workflow updates, milestones, approvals and access assignments remain concept coordination data.

---

## 7. Project Image System & Migration Status
- **Asset Storage**: Runtime project media lives under `public/projects/<project-slug>/`. Each showcase project has an isolated local set of official portfolio photographs; source archives are not the runtime asset location.
- **Media Schema**: `image` is the primary cover and `media.gallery` holds additional official project views. Missing media remains empty and renders a neutral fallback; projects never borrow another project's image.
- **Landing Media Mapping**: `src/components/gallery/projectMedia.tsx` maps all six showcase projects to local carousel covers and project-scoped portfolio/showcase frames. The featured carousel uses the cover mapping while the large La Lima portfolio feature uses `garnier-01.webp`, avoiding an immediate repeated photograph.
- **Migration Status**: **CLOSED / COMPLETE**. Legacy project IDs and media paths are remapped or sanitized at read time; schema version 3 persists the current project set and preserves safe `/projects/...` paths.

---

## 8. Current SpatialRail / Project Detail State
- **Implementation**: `src/components/gallery/SpatialRail.tsx`
- **Features**:
  - Custom high-performance horizontal image carousel built with native CSS scroll-snap.
  - IntersectionObserver slide tracking with smooth programmatic button scrolling.
  - Aspect ratio handling: consistent `wide` cover frames for available official project photography.
  - Thin editorial progress bar and active slide indicators (`01 / 03`, depending on available local media).
  - Scoped keyboard navigation (Left/Right arrows, Escape key).
  - Fullscreen/lightbox inspection viewer (`rail-fullscreen`) with keyboard controls. Interactive image zoom is not part of the current implementation.
  - Replaced prior Motion and Embla carousel dependencies, reducing bundle size.

### 8.1 Featured landing carousel
- **Implementation**: `src/components/gallery/FeaturedProjectCarousel.tsx`, mounted by `src/components/landing/Hero.tsx`.
- **Behavior**: Uses all six canonical public projects, links each slide to its public dossier, supports previous/next controls, indicators, Arrow/Home/End keyboard navigation, hover/focus pause, restrained 3.2-second autoplay, and `prefers-reduced-motion` autoplay suppression.
- **Media stability**: Every slide uses the same fixed 16:9 media shell with an overflow-hidden object-cover image viewport and a stable content region, so the outer card does not resize between projects.
- **Showcase media**: The six isolated local image sets are official Garnier portfolio photographs selected for campus, district, hospitality and institutional scale. This is an explicitly authorized ARCH_TECH concept/prototype use and does not imply official status or affiliation.
- **Fallbacks**: `ProjectImage` renders a neutral ARCH_TECH development placeholder when a preferred local image is unavailable or fails to decode.

### 8.2 Phase 8 Motion & Interaction System
- **Technical Foundation**: Canonical technical motion layer lives in `src/motion/motionSupport.ts` and `src/motion/useReducedMotion.ts`. Supports system `prefers-reduced-motion`, persisted accessibility reduce-motion setting (`arch-tech-portal-reduced-motion`), motion settling policies, and deterministic intersection helpers. There is only one canonical reduced-motion implementation; all motion components consume this layer.
- **Phase 8A — Public Motion Primitives (`src/components/motion/`)**: Includes `Reveal`, `WireframeToSolid`, `MetricCounter`, `ScrollProgressBar`, `ArchitecturalLine`, `useIntersectionReveal`, and `useScrollProgress`. Powers viewport reveals, staggered entrances, architectural image reveals, navbar scroll response, scroll progress, tactile project card feedback, animated metrics, restrained architectural line motion, and signature Wireframe → Solid treatments. Motion style is architectural, corporate, and restrained with zero heavy third-party animation libraries. Reduced-motion settings bypass or flatten decorative motion.
- **Team Group Photo Fix**: The desktop Garnier leadership group image bug is CLOSED. Canonical `TeamSection.tsx` implementation uses `<Reveal variant="fade-up" delay={150}>` for `/team/garnier-team-group.png`. The previous mask reveal must not be restored as it caused permanent clipping on desktop viewports.
- **Phase 8B — Public Project Route Transitions**: Implemented for `/` ↔ `/projects/:projectId` navigation (`src/components/motion/ProjectRouteTransition.tsx`, `src/router/AppRouter.tsx`). Features an architectural graphite wipe, technical CAD sweep line, and subtle grid texture (~560 ms total duration). Route change and scroll reset (`window.scrollTo(0, 0)`) execute while the viewport is covered. Features rapid double-trigger protection, native browser View Transition API support where available, and immediate fallback. Strictly scoped to public project navigation; completely bypasses login, portal dashboards (`/dashboard`, `/architect`, `/admin`), BIM workspace (`/workspace`), and error routes.

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
- Canonical assignment:
  - `agent/a-main` = Visual / UX / Motion agent, operated by Codex.
  - `agent/b-main` = Technical / Functionality / Data agent, operated by Antigravity.
- At the start of this handoff refresh, both work branches were synchronized with `main` at `4ee4e0d4`. Branch state must be resolved live before every new task.
- Every task must resolve its actual `BASE` from current remote `main` before execution.
- PROMPT_CONTRACT.md remains authoritative for parallel task rules.
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
- **Public Experience & Portal**: Garnier showcase portfolio, multi-role access (Client/Architect/Admin), presentation auth, dark architectural editorial design.
- **SpatialRail Media Carousel**: High-performance scroll-snap media rail & lightbox.
- **Landing Media Carousel**: Six-project featured carousel with locally stored official Garnier portfolio photography for the explicitly authorized presentation/showcase prototype, public dossier links, indicators, keyboard navigation, autoplay pause behavior, reduced-motion support and fixed slide dimensions. ARCH_TECH remains clearly presented as the concept/prototype identity.
- **Landing About + Leadership**: Editorial About section with verified public Garnier company context, one local official About image, and a stable eight-person leadership grid using one-to-one local official portraits and current public titles.
- **Landing Editorial Footer**: Closing ARCH_TECH footer with grouped Explore/Platform/Context directory links, Project Portal access, reduced-motion-aware back-to-top behavior, explicit Garnier showcase wording and a responsive oversized wordmark.
- **ARCH_TECH Brand Mark**: D1 Solid → Wireframe is the selected identity direction. `src/components/brand/ArchTechLogo.tsx` provides a reusable vector mark/full lockup that moves from solid architectural faces into restrained modeling construction lines, expressing physical structure → digital model.
- **Portfolio Asset Pipeline**: Canonical image packs and official Garnier showcase media integrated; schema v3 migration completed.
- **Portal Reliability Hardening**: Durable-plus-volatile portal persistence recovery, persisted-shape validation, resilient presentation auth and theme storage, project-scoped client notifications, current-date updates, and accessible admin project-creation validation.
- **Portal Application Architecture**: React Router migration, reusable protected/role/project guards, typed services with local fallback, JSON Server setup, synchronized project relation CRUD, external context integration, runtime project/user management, objective Admin/Architect metrics, persistent text scaling and n8n AI/automation workflow definitions.
- **Phase 4 Accessibility**: Consolidated accessibility panel featuring a Web Speech API browser narrator with pause/resume/stop and route-change cancellation, color-safe high-contrast mode, reading guide/mask, text spacing, link highlighting, and reduced-motion controls with persistent preferences.
- **Phase 5 Site Intelligence**: Multi-provider environmental and seismic context (OpenStreetMap Nominatim for manual geocoding with caching and rate throttling, Open-Meteo for dynamic coordinates weather, USGS Earthquake Catalog for 30-day seismic context). Includes independent loading/error states, partial failure resilience, stale-state clearing, and explicit data attribution.
- **Portal Phase 6 Historical Portfolio Analytics**: Historical portfolio and project progress analytics implemented in Admin view. Features schema v4 `progressSnapshots` local persistence and JSON Server endpoint support, comparable baseline project cohort delta calculation, strict canonical `YYYY-MM-DD` calendar date validation, theme-safe SVG charts (light, dark, high contrast, color safe) distinguishable by shape (open circle vs solid diamond) and line style, live current project progress retention, and isolated ARCH_TECH concept coordination historical telemetry.
- **Portal Phase 7A Deterministic Portfolio Intelligence**: Implemented in Admin Assistant (`src/components/portal/admin/PortfolioInsightsPanel.tsx`, `src/services/portfolioInsightsService.ts`, `tests/portfolioInsights.test.tsx`). Real-time portfolio KPI calculation (active projects, average progress, pending approvals, current/upcoming milestones) and project signal categorization (Priority / Attention / Info) based on rejected/multiple pending approvals, progress thresholds, and milestone status. Strictly deterministic current-data analysis without predictive claims.
- **Phase 8A Motion & Interaction Foundation**: Integrated architectural motion primitives (`Reveal`, `WireframeToSolid`, `MetricCounter`, `ScrollProgressBar`, `ArchitecturalLine`, `useIntersectionReveal`, `useScrollProgress` in `src/components/motion/`). Unified under canonical `src/motion/` technical layer (`motionSupport.ts`, `useReducedMotion.ts`) with complete system and persistent accessibility reduced-motion compliance. Closed desktop leadership group photo mask issue in `TeamSection.tsx` with stable fade-up reveal.
- **Phase 8B Public Project Route Transitions**: Architectural curtain transition between landing portfolio and `/projects/:projectId` dossier (`ProjectRouteTransition.tsx`, `AppRouter.tsx`) featuring graphite wipe, CAD sweep line, forward/reverse direction awareness, midpoint route switching, covered scroll reset, double-click suppression, and immediate navigation under reduced motion. Bypasses portal, workspace, login, and error routes.

---

## 12. Current Priorities & Product Identity
- Landing and public portfolio experience.
- Portfolio project presentation and current project assets.
- Client, Architect and Admin portal quality and access integrity.
- Performance and visual experience.
- Landing/portal work must not modify BIM internals unless explicitly requested.
- Phase 6B.3 (OpenBIM authoring extensions) is intentionally **FROZEN** until explicitly reactivated. It is not the current next development priority.

### Current Product Identity & Approved Next Direction
- **Current Implemented Product**: The application remains authentically named **ARCH_TECH** across the codebase, portal, workspace, and public landing. The rename has NOT been implemented yet.
- **Approved Next Direction**: Planned public/product name is **GARNIER ARCHITECTURE**.
  - Intended logo direction: Original geometric architectural figure featuring an optical illusion / impossible spatial form usable as an independent icon; corporate architecture identity with subtle technology character; graphite / limestone / sandstone palette; no generic house/roof/skyscraper shapes and no neon/cyberpunk styling.
  - The current `ArchTechLogo.tsx` implementation remains active until the new identity asset is approved and integrated.

---

## 13. Known Issues & Tech Debt
1. **Metadata Extractor Schema Discrepancy**: `IfcOpenHouse_IFC4.ifc` file header specifies `IFC4`, but property extractor metadata reports `IFC2X3` in viewer UI. Do not alter loader/schema code without an explicit directive.
2. **Vite Bundle Size Warning**: Production build emits bundle size warning for `Workspace` (~7 MB) and `worker` (~3.2 MB) due to embedded `web-ifc` WASM binaries and Three.js engine overhead; expected for complex browser CAD.
3. **Optional Integrations**: n8n webhooks require explicit `VITE_N8N_AI_WEBHOOK_URL` / `VITE_N8N_AUTOMATION_WEBHOOK_URL` configuration; unavailable remote AI falls back to the deterministic provider and all write actions still pass through ToolRegistry confirmation.

---

## 14. Next Session / Immediate Plan
### Next Task: Garnier Architecture Brand Migration
The next session should begin by auditing the existing ARCH_TECH identity before changing it.

**Planned Scope:**
1. Audit all user-visible ARCH_TECH references.
2. Define canonical Garnier Architecture naming.
3. Finalize the new optical-illusion logo asset.
4. Replace public identity and logo components.
5. Update landing/public-project labels.
6. Update portal-visible branding where appropriate.
7. Update page metadata/title/favicon/assets.
8. Update route-transition identity text.
9. Update documentation only after implementation is real.
10. Verify desktop/mobile/accessibility after rebrand.

**Important Migration Rules:**
- **DO NOT** blindly rename internal persistence/storage keys:
  - `arch-tech-portal-state`
  - `arch-tech-portal-session`
  - `arch-tech-portal-theme`
  - `arch-tech-portal-text-scale`
  These internal keys currently preserve persisted user/demo state. If ever renamed, implement an explicit backwards-compatible migration first.
- Do not rename the GitHub repository unless explicitly requested.
- Do not imply that Garnier Architecture is an official Garnier & Garnier product, partnership, or endorsed production system. The academic/concept prototype framing remains required.
- **After Rebrand**: Phase 8C advanced public interaction work may continue. Do not begin Phase 8C before the identity migration unless explicitly requested.

---

## 15. Invariants — DO NOT CHANGE ACCIDENTALLY
- **BIM Viewer Isolation**: Never mutate `src/bim/` engine code while making landing/portal UI edits.
- **Coordinate Mapping**: UI X -> IFC X, UI Y (vertical) -> IFC Z, UI Z (depth) -> IFC Y.
- **Detached Persistence**: Always run persistence exports against isolated temporary WebIFC models, keeping active model untouched.
- **Human Confirmation Gate**: All `WRITE` tools (edits, generation commit, persistence save) require explicit human confirmation.
- **Demo Tour Architecture & Portal Guided Tour**: Replaced automated Presentation Mode (SpeechSynthesis narration, chapter timers, auto-advance overlays) with a professional presenter-guided Demo Tour flow (`src/demo/DemoTourContext.tsx`, `src/components/demo/DemoIntroModal.tsx`, `src/components/demo/DemoTourBar.tsx`, `src/components/demo/PortalGuidedTour.tsx`). The flow integrates:
  1. Reusable fullscreen Demo Video Stage serves four normalized H.264/AAC introductions from `public/demo/videos/`, with skip, sound control, play/pause, keyboard controls, autoplay fallback and per-session completion state.
  2. Real Public Landing (`/`) with lightweight floating tour bar and live enterprise showcase.
  3. Video 2 establishes the canonical Mariana Solano demo identity, validates Client role and Zona Franca La Lima access, hydrates remote project data when configured, navigates only after authorization is ready, and starts the real **Portal Guided Tour** (`src/components/demo/PortalGuidedTour.tsx`) only after its first target mounts:
     - Keeps the real portal UI rendered live underneath.
     - 8 distinct tour steps targeting real interactive components via stable `data-tour-id` hooks (`portal-tour-overview`, `portal-tour-progress`, `portal-tour-milestones`, `portal-tour-documents`, `portal-tour-approvals`, `portal-tour-perspectives`, `portal-tour-intelligence`, `portal-tour-model`).
     - SVG mask cutout spotlight with 1.5px `#79B791` border and architectural corner registration marks.
     - Thin architectural connector line with dot terminals.
     - Intelligent non-covering card placement with step index, progress bar, Spanish editorial copy, and accessible controls (Prev, Next, Pause/Resume, Skip, Esc).
     - Auto-advance (~5–7s per step, ~52s total) with temporary auto-pause on live component interaction.
     - Step 08 progressive copy transition leading into the prominent "ENTRAR AL MODELO 3D" action.
  4. Video 3 prepares the real OpenBIM / 3D Engine (`/workspace`), loads the La Lima site and applies Masterplan before reveal while preserving manual presenter control.
  5. Video 4 prepares and reveals the existing NVIDIA / Futuro camera state as the final stage.

---

## 16. Current Verification Status
- **Lint / Type Check**: **SUCCESS** (`npm run lint` / `tsc --noEmit` — 0 errors).
- **i18n Verification**: **SUCCESS** (`npm run i18n:check` — 0 issues, 100% Spanish translation coverage across 970 keys in 9 namespaces).
- **Vitest Unit/Domain Tests**: **458 / 458 PASSED** across 39 test files (`tests/portalGuidedTour.test.tsx`, `tests/demoTour.test.tsx`, etc.).
- **Production Build**: **SUCCESS** (`npm run build` / `tsc -b && vite build` clean exit code 0).
- **Git Diff**: Verified clean with `git diff --check`.

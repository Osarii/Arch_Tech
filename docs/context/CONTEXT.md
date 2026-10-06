# CONTEXT.md — Central Technical Context

This is the only technical context document. Read the named section or current line range needed for a task; resolve line ranges from the current HEAD.

## 1. Context Router

- Always bootstrap with `AGENTS.md` and `PROJECT_STATE.md`.
- Route domain work here by section: engine, AI, editing, persistence, analysis, tree, panels, Zustand state, portal analytics, or motion.
- Keep architectural decisions, tool definitions, and verification commands in `docs/architecture/DECISIONS.md`, `docs/agent-rules/TOOL_INDEX.md`, and `docs/agent-rules/VERIFY_PROFILES.md`; do not duplicate them here.
- The repository uses That Open Components, Fragments, Three.js, WebIFC, and lightweight Zustand state. Current phase and verification status live in `PROJECT_STATE.md`.

## 2. BIM Runtime / Engine

Owns `src/bim/engine/BimEngine.ts`, `src/bim/loaders/ifcLoaderService.ts`, and `src/bim/properties/propertyExtractor.ts`.

- Runtime uses one `OBC.Components` instance with `Worlds`, `SimpleScene`, `OrthoPerspectiveCamera`, and `SimpleRenderer`; initialize with `components.init()`.
- `FragmentsManager` and `IfcLoader` load local WASM from `/`; loaded models live in `fragments.list`.
- `bimEngine` exposes `init`, `loadIfc`, `unloadModel`, `selectElements`, `hideElements`, `isolateElements`, `showAll`, `fitModel`, `setStandardView`, `setCameraMode`, and `getProperties`.
- Highlighter, Hider, Clipper, and LengthMeasurement provide selection, visibility, clipping, and distance tools.
- Keep Three.js objects and engine pointers out of Zustand; keep WASM and workers local/offline-first.

## 3. AI Assistant

Owns `src/bim/ai/AIAgent.ts`, `ToolRegistry.ts`, and `providers/RuleBasedProvider.ts`.

- `bimAgent` supports message sending, proposal confirmation/rejection, and history clearing. `ToolRegistry` registers, inspects, and executes tools; the rule-based provider is deterministic and offline-first.
- `AIAgent` exposes `sendMessage`, `confirmProposal`, `rejectProposal`, and `clearHistory`; `ToolRegistry` exposes `registerTool`, `getTool`, `getAllTools`, `executeTool`, and `isWriteAction`.
- Any WRITE tool or IFC persistence export requires explicit human confirmation.
- Physical-element queries exclude `IFCPROJECT`, `IFCSITE`, `IFCBUILDING`, and `IFCBUILDINGSTOREY`; quantity output uses real analysis metrics, never dummy values or `N/A`.

## 4. Editing

Owns `src/bim/edit/bimEditService.ts` and the `editsGroup` proxy-mesh layer.

- `bimEditService` exposes `transformElement`, `setVisualOverride`, `deleteElement`, `restoreElement`, `resetElement`, `resetAllEdits`, `undo`, `redo`, `getChangeSet`, `getElementState`, `importChangeSet`, and `setSceneBridge`.
- Editing is non-destructive: loaded IFC fragments remain untouched and edits use proxy meshes or visual overrides.
- `move`, `rotate`, and `delete` are IFC-persistable; `color` and `opacity` are viewport-only. Record changes chronologically and synchronize them with `useBimStore`.

## 5. Persistence

Owns `src/bim/persistence/ifcPersistenceService.ts`.

- `IfcPersistenceService` exports/imports JSON Change Sets and exposes real IFC export plus JSON/IFC downloads. Persistence export is detached and idempotent: extracts active baseline bytes via `SaveModel`, applies changes to an isolated temporary WebIFC model only, serializes persisted bytes, reopens for semantic verification, and closes temporary models, leaving the active model and viewport 100% untouched.
- Persistable transforms create authentic placement/direction/point records. Deletions disconnect containment relations before deleting element lines. Reopening verifies placement delta, rotation RefDirection, containment unlinking, and spatial tree validity exactly once.
- Never generate fake IFC strings, corrupt spatial relations, double-apply transforms, or persist without explicit human confirmation.

## 6. Analysis

Owns `src/bim/analysis/bimAnalysisService.ts` and `src/bim/filter/bimFilterService.ts`.

- Traverse WebIFC directly for `IfcElementQuantity`, `IfcQuantityArea`, `IfcQuantityVolume`, and `IfcQuantityLength`; undefined quantities fall back to zero.
- Analysis returns `BimAnalysisData`, storey data, storey-to-element IDs, and materials. Filtering supports type, category, storey, and text criteria.
- `BimAnalysisService.analyzeModel` returns those analysis values; `BimFilterService` exposes `filterElements` and `extractFilterOptions`.
- Preserve storey mappings through `IfcRelContainedInSpatialStructure`, avoid fake values, and do not block the main UI during heavy parsing.

## 7. Spatial Tree

Owns `src/bim/tree/spatialTreeBuilder.ts`.

- Build `IfcProject -> IfcSite -> IfcBuilding -> IfcBuildingStorey -> Categories -> Elements` from `IfcRelAggregates` and `IfcRelContainedInSpatialStructure`.
- Leaves are physical elements with positive express IDs. Separate spatial containers, including `IFCSPACE`, from selectable physical leaves.
- Return the tree, element/storey counts, categories, and storeys; initially expand the project and first storey.

## 8. UI / Panels

Owns panels under `src/components/panels/`: spatial tree, storeys, viewpoints, change set, properties, analysis, filter, edit inspector, and AI assistant.

- Use the technical dark palette (`#0d0f12`, `#12141a`, `#151722`) and semantic `data-testid` values on actionable controls.
- Panels read `useBimStore` and call domain services; they do not hold heavy engine objects or execute AI WRITE tools without confirmation.
- Model reload resets panel model-dependent state and updates metadata.

## 9. Zustand State

Owns `src/stores/bimStore.ts` and shared types in `src/types/bim.ts`.

- `useBimStore` holds tool/camera/view state, model metadata and loading progress, selection, spatial tree and expansion, filters, Change Set/undo flags, and panel tabs/open state, with setters for each slice and `resetModel()`.
- Store only lightweight serializable values and UI flags. `resetModel()` clears model-dependent fields while preserving general viewport preferences.
- Keep business logic, IFC mutations, Three.js objects, engine pointers, binary buffers, and WebGL contexts out of the store.

## 10. BIM Generation

Owns `src/bim/generation/generationService.ts` and `src/bim/generation/ifcAuthoringService.ts`.

- `BimGenerationService` exposes `validateParams`, `generatePlan`, `previewPlan`, `clearPreview`, `hasActivePreview`, `getActivePlan`, and `getPreviewBounds`.
- Computes deterministic parametric plans (`BimGenerationPlan`) for rectangular massings with multi-storey perimeter walls and floor/roof slabs.
- Renders disposable Three.js preview overlays (`BimGenerationPreview` group) in `BimEngine.world.scene.three` with zero IFC or Change Set mutations.
- `IfcAuthoringService` authors authentic IFC4 ISO STEP-21 models directly from `BimGenerationPlan` via native `web-ifc` (`IfcProject`, `IfcSite`, `IfcBuilding`, `IfcBuildingStorey`, `IfcWall`, `IfcSlab`, SI meters/radians, extruded swept solids, local placements, `IfcRelAggregates`, `IfcRelContainedInSpatialStructure`, valid 22-char IFC GUIDs).
- Coordinate remapping: Plan X -> IFC X, Plan Z -> IFC Y, Plan Y/elevation -> IFC Z.
- Pre-load reopening validation: `validateIfc` opens the authored buffer with `web-ifc` to verify spatial hierarchy, entity counts, and geometry mesh streaming before touching the current model or preview. Temporary models are always closed in `finally` to prevent WASM leaks.
- `ToolRegistry` registers `commit_generation` as an explicit confirmation gated `WRITE` tool. Only upon confirmed execution and validated success is the preview cleared and the authored binary loaded via `IfcLoaderService.loadIfc()`. Failure leaves the existing model and preview intact.
- Strict parameter parsing: missing dimensions prompt the user for clarification without silent defaults. All previous implicit move/rotate defaults are removed.

## 11. Testing

- Domain/unit coverage is organized under `tests/`; browser workflows are under `tests/e2e/`.
- Use the applicable profile and command from `docs/agent-rules/VERIFY_PROFILES.md`; do not duplicate that command matrix here.
- Existing domain coverage includes engine properties, editing, persistence, analysis/filtering, spatial tree, AI, and Zustand; E2E covers lifecycle, panels, editing, persistence, and AI flows.

## 12. Performance

- Target MacBook Pro 2019 / Intel UHD Graphics 630: DPR <= 1.25, shadows OFF, bloom/SSAO/postprocessing OFF.
- Prefer direct That Open rendering, local WASM/workers, lightweight state, and non-blocking heavy parsing. Performance takes precedence over decorative graphics.

## 13. Portal Analytics / Intelligence

Owns `src/services/portfolioInsightsService.ts`, `src/services/siteIntelligenceService.ts`, and portal analytics views.

- Historical snapshots persist under schema v4 (`progressSnapshots`) in canonical `YYYY-MM-DD` format with comparable baseline project cohort delta calculations.
- Site Intelligence provides multi-provider external context via OpenStreetMap Nominatim, Open-Meteo, and USGS Earthquake Catalog with graceful fallback.
- Portfolio Intelligence (`calculatePortfolioInsights`) evaluates live data deterministically into summary KPIs and project signals (`priority`, `attention`, `info`) based on rejected approvals, multiple pending approvals, low progress, or missing current milestones.
- Strictly deterministic current-data analysis; does not produce predictive claims or risk scoring.

## 14. Motion / Interaction

Owns `src/motion/` and `src/components/motion/`.

- `src/motion/` is the canonical technical motion layer (`motionSupport.ts`, `useReducedMotion.ts`). All motion components must consume `src/motion/useReducedMotion.ts` for system and persisted accessibility reduced-motion policies.
- `src/components/motion/` provides visual presentation primitives (`Reveal`, `WireframeToSolid`, `MetricCounter`, `ScrollProgressBar`, `ArchitecturalLine`, `ProjectRouteTransition`).
- Decorative motion must never block navigation or content visibility. Reduced motion bypasses or settles motion immediately.
- `ProjectRouteTransition` provides an architectural graphite wipe and CAD sweep line for `/` ↔ `/projects/:projectId` transitions (~560 ms total duration).
- Public route transition boundaries: strictly scoped to public landing/project navigation; completely bypasses login, portal dashboards (`/dashboard`, `/architect`, `/admin`), BIM workspace (`/workspace`), and error routes.
- Zero heavy third-party animation frameworks; implemented via vanilla CSS, React state, and Web APIs.

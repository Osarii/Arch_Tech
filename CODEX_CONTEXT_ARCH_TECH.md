# CODEX_CONTEXT.md — Arch_Tech

> Purpose: give Codex enough project context to work safely **without re-reading the whole repository**.  
> Priority order: **token savings > correctness > minimal diff > speed**.

## 0. TOKEN-SAVING OPERATING RULES — READ FIRST

1. **Do not scan the whole repo.** Start with `git status -s`, `git diff --stat`, then inspect only files directly related to the task.
2. **Do not re-read this context in pieces.** Treat this file as the project baseline.
3. Use targeted search first:
   - `rg -n "term" src tests`
   - narrow `sed -n 'START,ENDp' file`
   - avoid `cat` on large files unless truly necessary.
4. **Minimal patch only.** Do not refactor unrelated code.
5. **Do not duplicate existing rules/docs.** Existing project docs are authoritative when deeper detail is needed.
6. **Do not create new documentation files** unless explicitly requested.
7. During implementation:
   - run the smallest relevant test(s);
   - run full verification only once at the end.
8. Do not repeatedly rerun the same failing test. Make one targeted correction, rerun once, then report the exact blocker.
9. Keep responses compact:
   - files changed
   - behavior changed
   - tests
   - blockers
   - git status
10. **GIT: DIFF ONLY. DO NOT COMMIT OR PUSH unless Bernny explicitly asks.**
11. Never change the BIM engine while working only on landing/UI.
12. Never weaken tests merely to make them pass; remove sample-specific assumptions only when behavior is still validated.
13. Prefer existing dependencies/components. Do not add a package unless the task truly requires it.
14. Preserve current architecture. No framework migrations.

---

## 1. PROJECT

**Name:** Arch_Tech  
**Repo:** `https://github.com/Osarii/Arch_Tech`  
**Local path:** `/Users/osariii/Documents/arch_tech`  
**Owner:** Jared Prendas Ramirez (Osari)
**Machine target:** MacBook Pro 2019, Intel i7, 16 GB RAM, Intel UHD 630 + Radeon 5300M.

### Verified application checkpoint

Documentation refresh base:
```text
4ee4e0d4 docs(contract): swap agent tool assignments
```

Latest fully verified application implementation:
```text
a4a28d37 fix(motion): prevent scroll jumps on project route transitions
```
*(Commits after this verified application checkpoint are documentation-only unless a newer verified implementation checkpoint is explicitly recorded).*

Current remote `main` must always be resolved live at the start of a new task.

Previous checkpoints:
```text
c6b63375 feat(motion): add architectural project route transitions
4ddd7032 fix(team): restore leadership group image on desktop
b568d12a fix(motion): unify visual and accessibility motion systems
00cb49d7 feat(motion): add architectural motion and reduced-motion foundation
f5260b7e feat(portal): add deterministic portfolio insights
```

**Always verify remote main before a new implementation task.**

---

## 2. STACK / ARCHITECTURE

Core stack:
- React 19
- React Router DOM
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Three.js
- `web-ifc`
- `@thatopen/components`
- `@thatopen/components-front`
- `@thatopen/fragments`
- Vitest
- Playwright

Architecture:
- React = UI/state
- React Router = Multi-role routing & public project routes
- That Open + web-ifc = BIM/IFC
- Three.js = rendering
- Motion architecture: `src/motion/` (canonical technical layer & accessibility) + `src/components/motion/` (presentation primitives)
- No custom CAD engine
- No backend required for BIM core
- Existing viewer is the authoritative BIM workspace
- Avoid a second heavy WebGL scene on the landing

Performance baseline:
- Designed for 2019 Intel Mac
- DPR around `<= 1.25`
- shadows/post-processing off in BIM viewer
- prioritize stable viewport over decorative graphics

---

## 3. IMPORTANT PROJECT DOCS

Read only if the current task needs deeper semantics:

```text
AGENTS.md
PROJECT_STATE.md
PROMPT_CONTRACT.md
docs/context/CONTEXT.md
docs/architecture/DECISIONS.md
docs/agent-rules/TOOL_INDEX.md
docs/agent-rules/VERIFY_PROFILES.md
```

Do not rewrite their rules into new files.

---

## 4. CURRENT BIM WORKSPACE STATE

### Main capabilities already implemented

- IFC loading / parsing
- spatial tree
- element selection + IFC attributes / property sets
- visibility / isolate / fit
- 2D floor plans
- sectioning X/Y/Z
- filtering / analysis
- viewpoints
- non-destructive editing
- move / rotate
- temporary delete / restore
- undo / redo
- Change Set tracking
- real IFC persistence
- deterministic building generation
- AI assistant/tool workflow
- transactional model replacement / reload

### Phase 6A
Viewport lifecycle hardened.

### Phase 6B.1 — CLOSED
Real IFC4 authoring from `GenerationPlan`.

Important semantics:
- `storeys: N` => exactly N `IfcBuildingStorey`
- no synthetic roof storey
- roof slab belongs to last storey
- transactional staging / commit / rollback
- old model cleanup occurs only after commit boundary
- WRITE confirmation required for generation commit

### Phase 6B.2 — CLOSED
Detached IFC persistence round-trip hardened.

Important semantics:
- persist against detached temp IFC model, not active baseline
- save -> reopen -> verify -> close temp model
- MOVE mapping:
  - UI X -> IFC X
  - UI Y (vertical) -> IFC Z
  - UI Z (depth) -> IFC Y
- ROTATE = relative delta, not absolute replacement
- DELETE/RESTORE reconciles final intent
- failed Save & Reload preserves active model/edit state
- edit state resets only after successful model commit

### Phase 6B.3 — FROZEN / NOT STARTED
Planned scope later:
- doors
- windows
- openings
- material relations

Do **not** begin 6B.3 unless explicitly requested.

---

## 5. IFC SAMPLE MODELS

### Fast sample
Runtime button(s) must use:

```text
public/ifc_open_house.ifc
display filename: IfcOpenHouse_IFC4.ifc
```

The source file header is:

```text
FILE_SCHEMA(('IFC4'));
```

Approximate viewer content:
- 13 physical elements
- 4 walls
- 1 door
- 5 windows
- 1 storey

Both Fast entry points were fixed:
- top `HeaderBar`
- empty-state button in `BimViewport`

Do not delete `public/small_model.ifc` without checking tests/fixtures first.

### Known metadata discrepancy
Current screenshots show the UI reporting `IFC2X3` for `IfcOpenHouse_IFC4.ifc` even though the actual file header is IFC4.

Treat this as a **known issue to investigate separately**. Do not silently alter loader/schema code unless requested.

### House sample
`public/sample.ifc`
- large Revit-style house
- ~50 MB
- keep untouched unless task explicitly concerns it

---

## 6. LANDING PAGE

At the verified application checkpoint, the public experience carries the ARCH_TECH large-scale real-estate development concept.

ARCH_TECH's public identity is large-scale developments and infrastructure: free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and complex sites. It must not visually read as a residential architecture/house-design studio. OpenBIM/IFC remains a fundamental capability inside the platform/portal, especially for Architect/Admin workflows, but must not dominate the public landing. The portal and Workspace demonstrate that deeper technical capability. Garnier & Garnier is only a conceptual reference for scale and enterprise perception; do not copy its branding, website or assets or imply affiliation. Residential/traditional architectural identity belongs to a separate architecture project.

### Routing
- `/` => landing
- workspace direct entry supports:
  - `/?view=workspace`
  - `?app=true`
  - `#workspace`
- landing CTA => Workspace
- workspace has `← Landing` return control

### Current visual direction
Not generic SaaS.

Design language:
- architecture-studio editorial
- dark / off-white / warm gray
- large typography
- serif + sans pairing
- thin architectural datum/grid lines
- large imagery
- restrained motion
- minimal borders
- no neon
- no glassmorphism-heavy cards
- no fake certification / fake performance claims
- AI is secondary, not the identity of the product

Current hero uses a large-scale development composition with aerial and campus imagery:
```text
ARCH_TECH

Development at a larger scale.
Places in formation, from opportunity and site strategy through delivery and operation.

EXPLORE THE PORTFOLIO →
```

Portal integrity baseline:
- `/workspace` requires a portal session in production builds.
- Legacy workspace query/hash entry is available only in Vite dev/test modes.
- Role navigation maps explicitly to existing dashboard sections.
- Quick demo login reads role users from the current `db.json` + localStorage snapshot.

Current public structure:
1. Fixed landing navigation / Projects / Client Login
2. Hero / Costa Rica development portfolio
3. Selected projects / current development stages
4. Development approach / Position, Shape, Advance
5. Footer / Client Login

Current public routes:
- `/` landing with the login overlay
- `/projects/:projectId` public project detail
- `/dashboard`, `/architect`, `/admin` protected role dashboards
- `/workspace` protected production portal entry, with dev/test legacy query/hash entry

Current portal structure:
- `db.json` is the demo seed; localStorage holds simulated runtime mutations under schema version 4.
- Client, architect and admin roles use the existing session and role guards.
- Dashboard role navigation targets explicit rendered sections.
- Quick demo login resolves users from the current portal snapshot.

### Landing components

```text
src/components/landing/
  LandingNavbar.tsx
  Hero.tsx
  ProjectShowcase.tsx
  DevelopmentFrame.tsx
  TeamSection.tsx
  Footer.tsx
  LandingPage.tsx
```

Relevant application files:
```text
src/App.tsx
src/router/AppRouter.tsx
src/portal/data.ts
src/portal/demoAuth.ts
src/components/portal/PortalPages.tsx
src/components/motion/ProjectRouteTransition.tsx
tests/landingPage.test.tsx
tests/motion.test.tsx
```

Landing assets:
```text
public/projects/<project-slug>/
public/team/
```

The public portfolio features six showcase projects from Garnier & Garnier's public portfolio:

1. Zona Franca La Lima (`zona-franca-la-lima`) — free zone / industrial park
2. El Cafetal (`el-cafetal`) — corporate center / office campus
3. Santa Ana Country Club (`santa-ana-country-club`) — social and sports club
4. Waldorf Astoria (`waldorf-astoria`) — hotel and residences
5. Centro Corporativo La Sabana (`centro-corporativo-sabana`) — corporate office center
6. Universidad Latina (`universidad-latina`) — educational campus

Project facts and public photography are source-oriented; ARCH_TECH updates, milestones, and approvals represent concept coordination data.

### Portal Intelligence & Analytics
- **Phase 5 Site Intelligence**: Multi-provider location & environmental data via OpenStreetMap Nominatim, Open-Meteo, and USGS Earthquake Catalog with graceful fallback.
- **Phase 6 Historical Portfolio Analytics**: Schema v4 `progressSnapshots` in canonical `YYYY-MM-DD` calendar format with comparable project cohort baseline delta calculations.
- **Phase 7A Deterministic Portfolio Intelligence**: Implemented in Admin Assistant (`src/components/portal/admin/PortfolioInsightsPanel.tsx`, `src/services/portfolioInsightsService.ts`). Analyzes live project metrics deterministically for active project counts, progress averages, pending approvals, and current/upcoming milestones. Categorizes project signals into Priority (rejected/multiple pending approvals, low progress + pending), Attention (single pending approval, low progress, missing current milestone), and Info. Strictly deterministic analysis; no predictive claims.

### Motion & Route Transitions
- **Phase 8A Motion System**: Restrained architectural motion primitives in `src/components/motion/` (`Reveal`, `WireframeToSolid`, `MetricCounter`, `ScrollProgressBar`, `ArchitecturalLine`, `useIntersectionReveal`, `useScrollProgress`). All primitives consume canonical `src/motion/useReducedMotion.ts`. Team Section leadership group photo bug is closed using `<Reveal variant="fade-up" delay={150}>`.
- **Phase 8B Project Route Transitions**: Architectural curtain transition (`ProjectRouteTransition.tsx`, `AppRouter.tsx`) between `/` and `/projects/:projectId` featuring graphite wipe, CAD sweep line, ~560 ms duration, covered route change and scroll reset, and immediate navigation under reduced motion. Strictly public; bypasses login, portal dashboards, BIM workspace, and error routes.

---

## 7. CURRENT VISUAL OBSERVATIONS

The public experience currently shows:
- strong dark architecture editorial look
- large `ARCH_TECH` hero typography
- architectural hero photograph
- selected project register sourced from portal data
- development lifecycle framing
- public project detail with market, stage, intent and milestones
- minimal footer and portal access entry

Do not reintroduce:
- symmetric SaaS feature-card grids
- excessive pills/badges
- gradient/neon startup look
- verbose AI marketing
- unsupported “certified”, guaranteed FPS, zero-latency or air-gap claims

The BIM workspace remains separate and authoritative; public landing changes must not create a second viewer or alter BIM internals.

---

## 8. LAST VERIFIED TEST STATE

Latest FULL verification after integrated Phase 8B:

```text
Vitest (Unit/Domain): 307 / 307 PASS across 23 test files
Build:                PASS (tsc -b && vite build clean exit code 0)
Playwright (E2E):     14 / 14 PASS
git diff --check:     PASS
```

---

## 9. TEST / VERIFICATION STRATEGY

During coding:
```bash
npm test -- <targeted test if available>
# or targeted Playwright with -g
```

End of meaningful implementation:
```bash
npm test
npm run build
npx playwright test
git diff --check
git status -s
```

Do not run full Playwright repeatedly during a small edit.

BIM E2E tests should enter workspace directly:
```text
/?view=workspace
```

Landing E2E should validate:
- `/` renders landing
- primary CTA opens workspace
- workspace controls appear
- `← Landing` returns to landing

---

## 10. GIT RULES

Default:
```text
DIFF ONLY — NO COMMIT / NO PUSH
```

Before editing:
```bash
git status -s
git diff --stat
git log -1 --oneline
```

Do not discard current uncommitted landing work.

Never:
- `git reset --hard`
- force push
- broad formatting pass
- dependency upgrade sweep
- unrelated cleanup

unless Bernny explicitly requests it.

---

## 11. FILES MOST LIKELY TO MATTER

App / route switching:
```text
src/App.tsx
src/router/AppRouter.tsx
```

Motion / transitions:
```text
src/motion/motionSupport.ts
src/motion/useReducedMotion.ts
src/components/motion/*
```

Landing:
```text
src/components/landing/*
src/index.css
```

BIM shell:
```text
src/components/layout/HeaderBar.tsx
src/components/layout/Workspace.tsx
src/components/bim/BimViewport.tsx
```

IFC load:
```text
src/bim/loaders/ifcLoaderService.ts
```

Edit/persistence:
```text
src/bim/edit/*
```

Generation:
```text
src/bim/generation/*
```

E2E:
```text
tests/e2e/bimLab.spec.ts
tests/e2e/phase5-ai-assistant.spec.ts
tests/e2e/phase6-generation.spec.ts
```

---

## 12. CODEX TASK PROTOCOL

For every task:

```text
1. Read CODEX_CONTEXT.md once.
2. git status -s
3. Inspect only task-relevant files.
4. State internally the smallest required diff.
5. Implement.
6. Run targeted verification.
7. Run full verification once only if task is meaningful enough.
8. Return concise result.
9. DO NOT commit/push.
```

Preferred final report format:

```text
CHANGED
- file: exact reason

VERIFIED
- targeted test: PASS
- build/full tests only if run

BLOCKERS
- none / exact blocker

GIT
- concise status
```

No long implementation narrative unless requested.

---

## 13. PRODUCT IDENTITY

ARCH_TECH's product hierarchy is:

1. Public identity: large-scale developments and infrastructure.
2. Portal: project/client/architect/admin experience.
3. OpenBIM/IFC: fundamental technical capability demonstrated inside the platform/workspace, not the dominant landing identity.

The landing should communicate:
- free zones, corporate districts, hospitality, healthcare, compute campuses and institutional infrastructure
- large project scale, site context, lifecycle, phasing and operational confidence
- long-term developer-grade stewardship without unsupported claims
- a path into the private portal, where the deeper OpenBIM capability becomes visible

The public experience must not visually read as a residential architecture or house-design studio. The BIM workspace remains authoritative for IFC workflows, but landing/portal work must not modify BIM internals unless explicitly requested.

### Current Implementation vs Next Rebrand
- Currently implemented application name is **ARCH_TECH**. The rebrand has NOT occurred yet.
- Approved next product direction: **GARNIER ARCHITECTURE**.
- Planned logo: original geometric architectural figure featuring an optical illusion / impossible spatial form; usable as independent icon; graphite / limestone / sandstone palette.
- Do NOT rename internal persistence/storage keys (`arch-tech-portal-state`, `arch-tech-portal-session`, `arch-tech-portal-theme`, `arch-tech-portal-text-scale`) without an explicit backwards-compatible migration. Academic/concept prototype framing remains required.

## PARALLEL DEVELOPMENT POLICY

- `agent/a-main` = Visual / UX / Motion agent, operated by Codex.
- `agent/b-main` = Technical / Functionality / Data agent, operated by Antigravity.
- At the start of this handoff refresh, both work branches were synchronized with main at 4ee4e0d4. Branch state must be resolved live before every new task.
- Every task must resolve its actual `BASE` from current remote `main` before execution.
- PROMPT_CONTRACT.md remains authoritative for parallel task rules.
- Each parallel task must declare `BASE`, `AGENT`, `BRANCH`, `READ`, `TARGET`, `READ-ONLY`, `FORBIDDEN`, `ACCEPTANCE`, `STOP` and `GIT`.
- `TARGET` is exclusive write ownership. An agent must never modify a file outside `TARGET`.
- If another file becomes necessary, stop and report the dependency before editing it.
- Concurrent task scopes must satisfy:
  - `WRITE(A) ∩ WRITE(B) = ∅`
  - `WRITE(A) ∩ READ(B) = ∅`
  - `WRITE(B) ∩ READ(A) = ∅`
- Shared or hot files such as `src/App.tsx`, `src/index.css`, `src/portal/data.ts`, `db.json`, package/config files and canonical docs cannot be assigned to both agents concurrently.
- During parallel work, agents commit and push only to their assigned branch, never directly to `main`.
- Integration to `main` is sequential. The second branch must rebase or update against the newly integrated `main` and reverify before merge.

## TOOL POLICY

- Serena: use for targeted symbol/reference navigation. Never scan the whole repo.
- RTK: use to condense large logs, diffs, test/build output.
- Ponytail: YAGNI gate before adding dependencies, abstractions, components or refactors.

Default flow:
Serena → targeted reads → Ponytail → minimal diff → targeted tests → RTK for verbose output → full verification once.

Do not repeat these rules in task prompts.
## FAST TASK MODE

For small UI/portal changes:

- Do not reread tool/skill documentation if already configured globally.
- Do not perform extra "best practices" reviews unless the task requires them.
- Do not narrate intermediate reasoning or command-by-command progress.
- Serena: locate exact symbols/files only.
- RTK: use only for large test/build/diff output, not small file reads.
- Run targeted tests first.
- Run targeted Playwright only for the affected flow.
- Run build + diff check.
- DO NOT run full BIM Playwright/Vitest unless:
  - BIM/core code changed,
  - shared infrastructure changed,
  - routing changes can affect BIM entry,
  - or the user explicitly requests FULL verification.

Return only the final compact report.

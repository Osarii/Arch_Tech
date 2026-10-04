# AGENTS.md — BIM LAB AGENT CONTEXT & RULES

## Core Operating Principle
```text
THE CURRENT PROMPT = current task + scope + acceptance criteria + stop condition
THE REPOSITORY     = persistent rules + architecture + decisions + current state + reusable context
```
Persistent knowledge belongs in small repository files. Current prompts remain short and execution-focused. Apply YAGNI.

## Operating Rules
1. **Diff-First Workflow**: Inspect `git status` and `git diff` before loading files. Do not reread the entire repo.
2. **Context Routing**:
   - Always read `AGENTS.md` + `PROJECT_STATE.md`.
   - Then read the relevant section or current `Lx-Ly` of `docs/context/CONTEXT.md`.
   - Code is read by exact `FILE:Lx-Ly` whenever known.
   - Never hardcode permanent line-number references inside `CONTEXT.md`.
   - Re-resolve code line ranges from latest `main` before each task.
   - Never load all context sections by default.
   - Do not create new documentation files unless explicitly requested. Extend `docs/context/CONTEXT.md` instead.
3. **Scope Control**: Stay strictly within defined SCOPE for each task. Every task uses exact scope. Report bugs as FILE:Lx-Ly — cause — fix scope. Never expand scope silently.
4. **Stop Policy**: Obey the STOP condition of the current task. Do not jump ahead into future phases.
5. **Verification Profiles**:
   - `TARGETED`: specific affected test/type check
   - `DOMAIN`: domain/service logic
   - `UI`: targeted UI/Playwright validation
   - `FULL`: lint + test + build + app verification
6. **Hardware Target**: MacBook Pro 2019 / Intel UHD Graphics 630. DPR <= 1.25, Shadows OFF, bloom/SSAO/postprocessing OFF. Performance over decorative graphics.

## Product Identity Hierarchy
1. **Public identity**: ARCH_TECH presents large-scale developments and infrastructure.
2. **Portal**: Client, Architect and Admin experiences coordinate projects, documents, approvals, milestones and activity.
3. **OpenBIM / IFC**: Fundamental technical capability demonstrated inside the platform/workspace, not the dominant public landing identity.

Public work should emphasize free zones, corporate districts, hospitality, healthcare, compute campuses, institutional projects and infrastructure. ARCH_TECH must not visually read as a residential architecture or house-design studio. Garnier & Garnier is a conceptual reference for scale, positioning and enterprise perception only; do not copy its branding, website design or assets, and do not imply affiliation, partnership or endorsement. Landing/portal work must not modify BIM internals unless explicitly requested.

## Development Workflow Policy
- Single-agent sequential execution is the default.
- `agent/a-main` and `agent/b-main` are optional visual and technical lanes when explicitly requested; lane names do not imply a specific vendor or tool.
- Both branches were initially created from workflow initialization checkpoint `ecc9ff9c29a899cb48f58923c15fb10d9a07faee`; this does not permanently pin future work to that commit.
- Every task must resolve its actual `BASE` from current remote `main` before execution.
- Each task must declare `BASE`, `AGENT`, `BRANCH`, `READ`, `TARGET`, `READ-ONLY`, `FORBIDDEN`, `ACCEPTANCE`, `STOP` and `GIT`.
- `TARGET` is exclusive write ownership. An agent must never modify a file outside `TARGET`.
- If another file becomes necessary, stop and report the dependency before editing.
- Concurrent tasks must satisfy:
  - `WRITE(A) ∩ WRITE(B) = ∅`
  - `WRITE(A) ∩ READ(B) = ∅`
  - `WRITE(B) ∩ READ(A) = ∅`
- Shared or hot files such as `src/App.tsx`, `src/index.css`, `src/portal/data.ts`, `db.json`, package/config files and canonical docs cannot be assigned to both agents concurrently.
- During parallel work, agents commit and push only to their assigned branch, never directly to `main`.
- Integration to `main` is sequential. The second branch must rebase or update against the newly integrated `main` and reverify before merge.

## Project Structure
- `src/bim/`: Engine, loaders, selection, properties, tree, visibility, camera, clipping, measurement, edit, persistence, analysis, ai (AIAgent, ToolRegistry, providers)
- `src/components/`: Viewport, layout, overlays, panels (Tree, Properties, ChangeSet, AI Assistant), diagnostics
- `src/stores/`: Lightweight Zustand state (active tool, selected element ID, visibility, camera view, changeSet, undo/redo state)
- `tests/`: Vitest (unit/domain) and Playwright (`tests/e2e/`)

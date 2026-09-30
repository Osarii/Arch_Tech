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

## Project Structure
- `src/bim/`: Engine, loaders, selection, properties, tree, visibility, camera, clipping, measurement, edit, persistence, analysis, ai (AIAgent, ToolRegistry, providers)
- `src/components/`: Viewport, layout, overlays, panels (Tree, Properties, ChangeSet, AI Assistant), diagnostics
- `src/stores/`: Lightweight Zustand state (active tool, selected element ID, visibility, camera view, changeSet, undo/redo state)
- `tests/`: Vitest (unit/domain) and Playwright (`tests/e2e/`)

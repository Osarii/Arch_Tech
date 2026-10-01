# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6A Complete (Deterministic BIM Generation Plan & Safe 3D Three.js Preview)
Current Work: Hardened Phase 6A viewport & engine lifecycle (reset initPromise safely, share in-flight init promises across concurrent calls, non-destructive container re-binding via rebindContainer without rebuilding engine, DEV/test-only window global exposure, Vitest: 75/75 passed, Playwright: 12/12 passed)
Last Important Change: Hardened BimEngine.init() lifecycle and rebindContainer(), guarded window.bimEngine and window.bimGenerationService in DEV/test only
Next Allowed Task: Phase 6B (IFC Entity Generation & Persistence Sync)
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation during preview, real ISO STEP-21 persistence via web-ifc
Important Paths: src/bim/generation/, src/bim/ai/, src/bim/engine/, src/components/panels/AiAssistantPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 75/75 passed | Build: success | Playwright: 12/12 passed)
```

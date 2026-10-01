# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6A Complete (Deterministic BIM Generation Plan & Safe 3D Three.js Preview)
Current Work: Fixed blank IFC viewport & invisible Phase 6A preview (computed model bounds fallback from currentModel.object, automated camera-fit to BimGenerationPreview bounds on generation, return camera fit to IFC on discard, strict viewport canvas positioning, Vitest: 69/69 passed, Playwright: 13/13 passed)
Last Important Change: BimEngine.fitModel() fallback to currentModel.object bounds, ToolRegistry preview bounds auto-fitting and discard camera reset, generationService getPreviewBounds(), regression test coverage
Next Allowed Task: Phase 6B (IFC Entity Generation & Persistence Sync)
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation during preview, real ISO STEP-21 persistence via web-ifc
Important Paths: src/bim/generation/, src/bim/ai/, src/bim/engine/, src/components/panels/AiAssistantPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 69/69 passed | Build: success | Playwright: 13/13 passed)
```

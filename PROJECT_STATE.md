# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6A Complete (Deterministic BIM Generation Plan & Safe 3D Three.js Preview)
Current Work: Phase 6A Fully Implemented & Verified (Deterministic BimGenerationService, rectangular massing with multi-storey walls & slabs, disposable BimGenerationPreview scene overlay with zero IFC or ChangeSet mutation, ToolRegistry preview_generation and discard_generation_preview READ tools, strict parameter validation with no silent defaults and implicit move/rotate defaults removed, Vitest: 63/63 passed, Playwright: 11/11 passed)
Last Important Change: BimGenerationService implementation, preview_generation & discard_generation_preview tools, strict prompt parameter parsing, generation unit & E2E suites
Next Allowed Task: Phase 6B (IFC Entity Generation & Persistence Sync)
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation during preview, real ISO STEP-21 persistence via web-ifc
Important Paths: src/bim/generation/, src/bim/ai/, src/bim/engine/, src/components/panels/AiAssistantPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 63/63 passed | Build: success | Playwright: 11/11 passed)
```

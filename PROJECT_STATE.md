# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6B.1 Complete (Real IFC4 Authoring from GenerationPlan, Exact Storey Semantics & True Transactional Commit)
Current Work: Implemented native web-ifc IFC4 authoring in IfcAuthoringService.ts from BimGenerationPlan with exact N IfcBuildingStorey semantics and ROOF PredefinedType slabs, pre-load validation, true transactional staging/commit/rollback swap in IfcLoaderService without premature destruction, human-confirmed commit_generation WRITE tool flow, memory leak prevention, and full E2E test coverage.
Last Important Change: Corrected storey semantics (exact N storeys, roof slab in last storey with ROOF type), decoupled reversible commit from post-commit cleanup with explicit transaction boundary in IfcLoaderService, updated regression and E2E tests.
Next Allowed Task: Phase 6B.2 (Doors/Windows/Materials or Persistence Sync)
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation before explicit confirmation, real ISO STEP-21 persistence via web-ifc, zero Python/IfcOpenShell dependencies
Important Paths: src/bim/generation/, src/bim/ai/, src/bim/loaders/, src/components/panels/AiAssistantPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 91/91 passed | Build: success | Playwright: 13/13 passed)
```

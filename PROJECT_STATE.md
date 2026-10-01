# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6B.2 Complete (Safe IFC Persistence Round-Trip & Detached Idempotent Export)
Current Work: Implemented detached, idempotent export in IfcPersistenceService with baseline byte extraction, isolated temporary WebIFC model mutations, persisted byte reopening, comprehensive semantic verification (move placement changed exactly once, rotate RefDirection changed exactly once, delete element absent and removed from containment, spatial tree validity), temporary model lifecycle cleanup without WASM leaks, active model immutability, full unit & regression coverage, and extended double round-trip E2E test.
Last Important Change: Detached export flow in IfcPersistenceService.exportModifiedIfc, added verifySemanticPersistence, updated ChangeSetPanel and ToolRegistry to gate persistence and reload on result.success, added 6 regression tests, updated Playwright E2E.
Next Allowed Task: Phase 6B.3 (Doors/Windows/Materials) or Phase 6C
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation before explicit confirmation, real ISO STEP-21 persistence via web-ifc, zero Python/IfcOpenShell dependencies, detached idempotent persistence exports
Important Paths: src/bim/persistence/, src/bim/generation/, src/bim/loaders/, src/components/panels/ChangeSetPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 97/97 passed | Build: success | Playwright: 13/13 passed)
```

# PROJECT_STATE.md — Current Working State

```text
Current Phase: BIM Lab Phase 4 Complete (Real IFC Persistence & Change Set JSON)
Current Work: Phase 4 Fully Verified (Change Set JSON export/import, native WebIFC persistence for Move, Rotate, Delete, export to new .ifc without mutating original, automatic save & reload into That Open viewer, explicit unsupported operation audit)
Last Important Change: Implemented IfcPersistenceService, ChangeSetPanel persistence UI, unit tests (26/26 passed), Playwright E2E tests (6/6 passed), production build success
Next Allowed Task: Phase 5 (BIM Lab Final Validation / Packaging)
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, never overwrite original IFC, real ISO STEP-21 persistence via web-ifc
Important Paths: src/bim/persistence/, src/bim/edit/, src/components/panels/, src/stores/, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 26/26 passed | Build: success | Playwright: 6/6 passed)
```

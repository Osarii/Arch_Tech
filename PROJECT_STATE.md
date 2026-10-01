# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 6B.2 Hardened (Semantic Persistence, Coordinate Mapping, Relative Rotation, Delete/Restore Reconciliation, Safe Reload)
Current Work: Hardened Phase 6B.2 semantic persistence: corrected UI-to-IFC coordinate mapping (UI X -> IFC X, UI Y -> IFC Z, UI Z -> IFC Y) across persistence and semantic verification, implemented relative rotation delta composition on baseline RefDirection vectors, reconciled delete/restore sequence to honor final intent (reopening verified for element/containment preservation), and established safe save & reload transaction boundary in ChangeSetPanel with post-commit edit cleanup preserving active model and ChangeSet on failure.
Last Important Change: Hardened coordinate mapping, relative rotation, delete/restore intent, and transactional reload error boundary in ifcPersistenceService.ts and ChangeSetPanel.tsx; added 4 targeted regression tests in ifcPersistenceService.test.ts.
Next Allowed Task: Phase 6B.3 (Doors/Windows/Materials) or Phase 6C
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, zero IFC or ChangeSet mutation before explicit confirmation, real ISO STEP-21 persistence via web-ifc, zero Python/IfcOpenShell dependencies, detached idempotent persistence exports, relative rotation composition, coordinate mapping (UI X->IFC X, UI Y->IFC Z, UI Z->IFC Y), safe save & reload rollback preservation
Important Paths: src/bim/persistence/, src/bim/generation/, src/bim/loaders/, src/components/panels/ChangeSetPanel.tsx, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 101/101 passed across 11 test files | Build: success | Playwright: 13/13 passed)
```

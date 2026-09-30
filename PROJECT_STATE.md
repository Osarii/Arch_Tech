# PROJECT_STATE.md — Current Working State

```text
Current Phase: Phase 5 Complete (AI BIM Assistant, Deterministic Tool Calling, Confirmation Guardrails & Semantic Verification)
Current Work: Phase 5 Fully Implemented & Verified (Model-agnostic AI agent, Tool Registry with 18 tools [11 READ tools, 7 WRITE tools], confirmation guardrails for mutations [including undo, redo, and format-dependent IFC persistence export], direct JSON changeset export, spatial container exclusion from physical element queries, real BIM quantity takeoffs formatting, Vitest: 55/55 passed, Playwright: 10/10 passed)
Last Important Change: ToolRegistry undo/redo WRITE categorization, format-dependent IFC export confirmation, spatial container exclusion, real quantity regression tests, Playwright Phase 5 suite
Next Allowed Task: Phase 6
Known Blockers: None
Active Invariants: Intel UHD 630 performance baseline (DPR <= 1.25, Shadows OFF, bloom/postprocessing OFF), YAGNI, That Open + Fragments as BIM engine, never execute write tools without user confirmation, real ISO STEP-21 persistence via web-ifc
Important Paths: src/bim/ai/, src/components/panels/AiAssistantPanel.tsx, src/bim/persistence/, src/stores/, tests/
Current Verification Status: FULL PASSED (Lint: 0 errors | Vitest: 55/55 passed | Build: success | Playwright: 10/10 passed)
```

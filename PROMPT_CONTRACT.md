# PROMPT_CONTRACT.md — Standard Task Contract

## Standard Task Format
```text
TASK:
Concrete objective.

READ:
Minimal sections or current line ranges from `docs/context/CONTEXT.md`.

TARGET:
Exact writable files/ranges (e.g. src/bim/ai/ToolRegistry.ts:L200-L245).

READ-ONLY:
Exact reusable implementation/ranges allowed to be inspected without modification.

ACCEPTANCE:
Verifiable completion criteria.

STOP:
Exact point where work must stop.

GIT:
NONE | STATUS | DIFF | COMMIT
```

## Field Specifications
- **TASK**: Specific, single-responsibility technical objective.
- **READ**: Minimal named section or exact current `docs/context/CONTEXT.md:Lx-Ly`; never load all context by default.
- **TARGET**: Strict writable scope. Modifying files outside this scope without prior authorization violates the contract.
- **READ-ONLY**: Stable code/APIs to read by exact line range without rewriting.
- **ACCEPTANCE**: Bulleted, testable conditions for completion.
- **STOP**: Unambiguous boundary preventing premature progress into subsequent phases.
- **GIT**: Git policy. Default is `DIFF` only (do not commit or push without explicit request).

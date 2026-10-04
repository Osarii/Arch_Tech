# PROMPT_CONTRACT.md — Standard Task Contract

## Standard Task Format
```text
TASK:
Concrete objective.

BASE:
Exact commit SHA the task starts from.

AGENT:
Assigned agent identity, such as agent/a-main visual agent or agent/b-main technical/functionality agent.

BRANCH:
Assigned git branch. During parallel work, commit/push only to this branch and never directly to main.

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
- **BASE**: Required for parallel work. Must match the branch origin or the task must stop for reconciliation.
- **AGENT**: Required for parallel work. `agent/a-main` is visual / Claude / Antigravity; `agent/b-main` is technical/functionality / VS Code.
- **BRANCH**: Required for parallel work. Agents commit and push only to the assigned branch until sequential integration to `main`.
- **READ**: Minimal named section or exact current `docs/context/CONTEXT.md:Lx-Ly`; never load all context by default.
- **TARGET**: Strict writable scope. Modifying files outside this scope without prior authorization violates the contract.
- **READ-ONLY**: Stable code/APIs to read by exact line range without rewriting.
- **ACCEPTANCE**: Bulleted, testable conditions for completion.
- **STOP**: Unambiguous boundary preventing premature progress into subsequent phases.
- **GIT**: Git policy. Default is `DIFF` only (do not commit or push without explicit request).

## Parallel Ownership Rules
- `TARGET` is exclusive write ownership.
- An agent must never modify a file outside `TARGET`.
- If another file becomes necessary, stop and report the dependency.
- Concurrent tasks must satisfy:
  - `WRITE(A) ∩ WRITE(B) = ∅`
  - `WRITE(A) ∩ READ(B) = ∅`
  - `WRITE(B) ∩ READ(A) = ∅`
- Shared/hot files such as `src/App.tsx`, `src/index.css`, `src/portal/data.ts`, `db.json`, package/config files and canonical docs cannot be assigned to both agents concurrently.
- Integration to `main` is sequential. The second branch must rebase or update against the newly integrated `main` and reverify before merge.

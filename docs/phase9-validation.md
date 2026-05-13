# Phase 9 Validation - Real OpenCode Usage (v1.0)

This document tracks end-to-end validation for roadmap `v1.0` Phase 9.

Roadmap reference:
- `docs/roadmap-v1.0.md` -> **Phase 9 - Real OpenCode Validation**

## Objective

Validate that the current `v1.0` runtime behaves correctly in real OpenCode sessions for both:

- full workflow execution (`/workflow`)
- direct subagent paths (`/explorer`, `/planner`, `/implementer`, `/reviewer`, `/tester`)

## Scope

This phase validates real host behavior, not only unit tests.

In scope:

- slash-command routing in OpenCode
- visible workflow phases and trace clarity
- clarification and approval checkpoints
- direct subagent usability
- context persistence usefulness across follow-up runs

Out of scope:

- performance benchmarking at scale
- multi-host compatibility beyond OpenCode
- long-run migration/upgrade strategy

## Preconditions

Before running cases, all must be true:

1. `npm run build` succeeds.
2. `npm run test` succeeds.
3. Adapter installed in target scope (`global` or `project`) with `npm run install:opencode`.
4. OpenCode session is started in a real repository with writable workspace.

## Validation Matrix

Each case should capture evidence for these dimensions:

1. Routing correctness
2. Phase visibility
3. User control (clarify/approve/cancel)
4. Context carry-over quality
5. Output usefulness
6. Failure handling clarity

Use this result scale:

- `pass`: behavior matches expectation and output is practically useful.
- `partial`: behavior works but with notable friction, ambiguity, or weak output quality.
- `fail`: behavior is broken, misleading, or not usable.

## Case Ledger

| Case ID | Path | Status | Result | Notes |
|---|---|---|---|---|
| P9-C1 | `/workflow` clear task | pending | - | - |
| P9-C2 | `/workflow` ambiguous task requiring clarification | pending | - | - |
| P9-C3 | `/workflow` approval denial at checkpoint | pending | - | - |
| P9-C4 | direct subagent `/planner` | pending | - | - |
| P9-C5 | direct subagent `/implementer` with prior context | pending | - | - |
| P9-C6 | direct subagent error-path visibility | pending | - | - |

## Case Definitions

### P9-C1 - Full workflow, clear request

Goal:
- Confirm the workflow completes with visible phase progression and coherent outcome summary.

Expected:
- `run_completed` path.
- Post-run explanation clearly states what happened and why.

### P9-C2 - Full workflow, ambiguous request

Goal:
- Confirm clarification checkpoint behavior is understandable and bounded.

Expected:
- Clarification prompt appears before downstream phases when needed.
- User answer is reflected in later outputs.

### P9-C3 - Full workflow, approval denied

Goal:
- Confirm safe cancel path at checkpoints.

Expected:
- Run ends with `cancelled` outcome.
- Cancellation reason is explicit.

### P9-C4 - Direct `/planner` invocation

Goal:
- Confirm direct subagent path behaves as first-class execution.

Expected:
- Requested role is `planner`.
- Result is focused and does not require full workflow execution.

### P9-C5 - Direct `/implementer` with prior context

Goal:
- Confirm useful context rehydration without transcript bloat.

Expected:
- Prior artifact context improves implementation response quality.
- Rehydration remains compact.

### P9-C6 - Direct subagent failure path

Goal:
- Confirm direct failures are represented as structured failed outcomes.

Expected:
- Outcome status is `failed`.
- Failure reason is explicit and actionable.

## Evidence Template

For each case, record:

- command and input
- observed run flow
- result (`pass` / `partial` / `fail`)
- friction points
- follow-up action

Reference template:
- `docs/templates/workflow-validation-template.md`
- `docs/templates/phase9-case-capture-template.md`

## Completion Criteria

Phase 9 can be marked complete when:

1. All ledger cases are executed in real OpenCode sessions.
2. At least one case covers cancellation and one covers failure path.
3. Friction points are documented with concrete follow-up tasks.
4. A final summary states validated behavior vs unresolved gaps.

## Current Status

Status: `in progress`

Notes:
- Validation protocol and cases are now defined.
- Real-session execution evidence is still pending.

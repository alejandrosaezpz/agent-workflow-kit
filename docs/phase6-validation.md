# Phase 6 Validation — Real Workflow Usage in OpenCode

This document tracks end-to-end validation for roadmap Phase 6.

Roadmap reference:
- `docs/roadmap-v0.1.md` → **Phase 6 — Test Real Workflow Usage In OpenCode**

## Objective

Validate that Agent Workflow Kit works as a real, usable workflow in OpenCode:

- visible phase execution
- user participation between phases
- approvals/checkpoints
- useful outputs for real tasks
- documented friction points

## Validation Protocol (Lightweight)

We use three scenario types to avoid testing only happy paths:

1. `small-clear` — small, straightforward task
2. `medium-tradeoff` — moderate task with options and tradeoffs
3. `ambiguous` — task that requires clarification and controlled pause

For each case we capture:

- phase visibility evidence
- checkpoint/user-control evidence
- usefulness of outputs
- friction and risk notes

Template source:
- `docs/templates/workflow-validation-template.md`

## Validation Boundaries

This first iteration is a lightweight MVP validation pass.

- It validates workflow structure, checkpoints, and artifact quality.
- It does **not** yet provide broad confidence for larger multi-file code changes.
- It should be treated as baseline evidence before deeper runtime stress testing.

## Quality Gates

Each case is considered valid only if these gates are met:

1. **Explorer gate**: current state + risks/constraints are explicit
2. **Planner gate**: 1-2 options and one recommendation
3. **Implementer gate**: smallest correct scope
4. **Reviewer gate**: real risks/regressions addressed
5. **Tester gate**: explicit validated vs unverified scope
6. **Control gate**: user can intervene before implementation

## Result and Gate Definitions

- `pass`: all quality gates met and output considered useful for the case.
- `partial`: workflow completed but one or more gates were weak or only partially met.
- `fail`: workflow did not complete responsibly or produced non-usable output.

Gate summary column values:

- `6/6`: all gates met
- `x/6`: only `x` gates met

## Case Ledger

| Case ID | Type | Status | Result | Gates Met |
|---|---|---|---|---|
| C1 | small-clear | completed | pass | 6/6 |
| C2 | medium-tradeoff | completed | pass | 6/6 |
| C3 | ambiguous | completed | pass | 6/6 |

## Case Reports

### C1 — small-clear

Task executed:
- Add a concise "Quick Validation Run" section in `README.md` with 4 practical post-install checks.

Evidence:
- Phase visibility: explicit phase sequence captured in README step 3.
- User control: explicit checkpoint requirement captured in README step 4.
- Output usefulness: gives new users a fast sanity check after install.

Gate assessment:
- Explorer: met (current README/install flow checked)
- Planner: met (smallest change selected)
- Implementer: met (single section addition)
- Reviewer: met (no unrelated edits)
- Tester: met (document presence and content verified)
- Control: met (checkpoint explicitly documented)

### C2 — medium-tradeoff

Task executed:
- Strengthen `docs/phase6-validation.md` with explicit result definitions and gate-count reporting.

Tradeoff handled:
- Option A: keep status only (simpler, less informative)
- Option B: add `pass/partial/fail` semantics plus gate counts (slightly longer, more robust)
- Chosen: Option B for better repeatability and auditability.

Gate assessment:
- Explorer: met (existing validation doc reviewed)
- Planner: met (2 options + recommendation)
- Implementer: met (minimal structural additions)
- Reviewer: met (improves clarity, no scope drift)
- Tester: met (updated file re-read and validated)
- Control: met (decision checkpoint captured)

### C3 — ambiguous

Task executed:
- Resolve evidence-structure ambiguity: single file vs per-case files.

Ambiguity and decision:
- Ambiguity: whether to split case evidence into `docs/validation/cases/*.md` now.
- Decision: keep a **single-file evidence model** in `docs/phase6-validation.md` for v0.1.
- Why: smallest correct scope, lower maintenance, aligned with MVP simplicity.
- Future trigger to split: when case count grows or multi-contributor edits create merge friction.

Gate assessment:
- Explorer: met (constraints and scale considered)
- Planner: met (alternatives explicit)
- Implementer: met (applied decision in-place)
- Reviewer: met (avoided premature structure complexity)
- Tester: met (decision and rationale documented)
- Control: met (ambiguity handled through explicit checkpoint logic)

## Consolidated Findings

What worked consistently:

- Visible phase framing stayed clear and predictable.
- Checkpoint behavior remained explicit before implementation decisions.
- Small, targeted changes were enough to produce useful outcomes.

Main friction points:

- Evidence quality depends on disciplined note-taking; easy to underspecify without template use.
- The distinction between "workflow execution" and "documentation-only validation" should be clearly stated in each case.
- As cases grow, single-file reporting may become harder to scan.

Highest-value refinements for Phase 7:

1. Add a short scoring rubric for output usefulness (e.g., 1-3 scale).
2. Add a trigger policy for when to split per-case files.
3. Add one non-doc code-change validation case to increase confidence breadth.

## Phase 6 Completion Decision

To close Phase 6, all must be true:

- all 3 cases executed
- quality gates satisfied (or exceptions documented)
- friction points recorded with concrete examples
- explicit summary of validated vs still-unverified behavior

Decision: **Phase 6 can be marked complete for the lightweight MVP protocol**.

Validated:

- structured execution discipline across all workflow phases
- checkpoint and user-control behavior
- practical documentation artifacts for repeatable validation

Still unverified:

- broader confidence across larger code changes and multi-file implementation tasks
- long-run maintenance behavior under many validation runs

Follow-up note:

- A deeper runtime-oriented validation round is still recommended in Phase 7.

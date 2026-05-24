# Post-v1.0 Implementation Ideas

This document captures implementation ideas that are valuable, but intentionally out of scope for the `v1.0.0` release gate.

## Why this exists

`v1.0` should stay focused on:

- independent agents
- adaptive orchestration via `task`
- compact and inspectable context handoffs
- real OpenCode validation
- OSS release readiness

The ideas below are intentionally deferred to avoid scope creep before first public release.

---

## 1) Project Knowledge Promotion Pipeline

### Goal

Promote high-value run outputs into durable project knowledge, instead of keeping only rolling run/summaries history.

### Problem this solves

- recent-run memory is useful but eventually pruned by retention
- important decisions can be lost even when short-term context works correctly
- users need stable project memory for recurring work

### Proposed direction

Add a promotion layer that transforms selected `CrossIterationSummary` entries into curated project knowledge artifacts.

Examples:

- `project-decisions.md`
- `known-constraints.md`
- `testing-playbook.md`
- `open-risks.md`
- `next-steps.md`

### Promotion criteria (initial)

Promote only items that:

- affect architecture or long-lived design
- document recurring constraints or environment limits
- record test strategy changes with practical impact
- capture unresolved blockers likely to reappear

### Non-goals

- storing full transcripts
- autonomous hidden memory growth
- replacing explicit user review with opaque memory updates

### Validation ideas

- follow-up tasks should require fewer clarification turns
- users should find previous decisions quickly
- promoted artifacts should remain compact and readable

---

## 2) Rehydration Priority Policy (Summary + Curated Docs)

### Goal

Load context in this priority order:

1. curated project knowledge artifacts
2. recent cross-iteration summaries
3. artifact fallback when explicitly needed

### Expected benefit

Better signal-to-noise for follow-up runs without losing traceability.

---

## 3) Memory Governance UX

### Goal

Give users explicit controls for retained knowledge quality:

- approve/reject promotion candidates
- pin critical decisions
- expire stale knowledge entries

### Expected benefit

Keeps memory useful and trustworthy while preserving user control.

---

## Suggested phase label (after v1.0)

`Phase 16 - Durable Project Knowledge Layer`

Potential objective:

> Convert high-value workflow outcomes into curated, user-inspectable project memory that persists across long horizons without transcript bloat.

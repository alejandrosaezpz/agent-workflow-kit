# Agent Workflow Kit

> 🚧 **Status:** v1.0 hardening in progress (not yet final `v1.0.0` release)

Agent Workflow Kit is a lightweight workflow layer for **OpenCode**.

It helps you run development tasks with:

- visible multi-phase execution
- direct role-specific subagents
- compact context handoffs
- explicit traceable outcomes

---

## TL;DR

- ✅ Built for **OpenCode**
- ✅ Supports full `/workflow` and direct `/explorer` `/planner` `/implementer` `/reviewer` `/tester`
- ✅ Uses structured handoffs and summary-based cross-iteration memory
- ✅ Keeps checkpoints visible and user-controlled
- ✅ Designed to avoid black-box behavior

Default workflow phases:

1. `explorer`
2. `planner`
3. `implementer`
4. `reviewer`
5. `tester`

---

## What You Get Today

Current implemented capabilities:

- typed workflow runtime contracts
- full workflow and direct subagent execution paths
- clarification and approval checkpoints
- independent role agents for direct subagent commands
- per-phase handoff structure + handoff budgeting
- summary-first rehydration (`summary` vs `artifact` modes)
- bounded retention for runs and summaries
- structured run reports and trace events
- OpenCode installer with idempotency and merge-safety tests
- CI baseline (`build`, `test`)

---

## Quick Start

### 1) Build

```bash
npm run build
```

### 2) Install in OpenCode

Global scope:

```bash
npm run install:opencode
```

Project scope:

```bash
npm run install:opencode -- --scope=project
```

### 3) Restart OpenCode

OpenCode config is loaded at startup. Restart after install or config changes.

---

## Commands

### Full workflow

```text
/workflow <your-task>
```

### Direct subagent paths

```text
/explorer <query>
/planner <query>
/implementer <query>
/reviewer <query>
/tester <query>
```

Use direct commands when one focused role is enough.

---

## 5-Minute Validation

Run this quick check in OpenCode:

1. Confirm `workflow` is available as a primary agent.
2. Run:

```text
/workflow summarize this repository structure
```

3. Confirm visible phase progression:
   `explorer → planner → implementer → reviewer → tester`
4. Confirm at least one checkpoint where you can redirect or approve.
5. Run a direct command:

```text
/planner propose a minimal plan to add a healthcheck endpoint
```

6. Confirm result is planner-focused and does not run full workflow.

For full validation protocol and case ledger:

- `docs/phase9-validation.md`

---

## Workflow Model

### Full workflow mode

- coordinates all five phases
- supports clarification + approval checkpoints
- emits compact traceable outcomes

### Direct subagent mode

- runs one focused role
- keeps execution scoped
- uses the same runtime contracts and context policy

---

## Context & Memory

By default, context is stored per project at:

```text
.agent-workflow-kit/context/
```

Files:

- `runs.json` → compact run history for traceability
- `summaries.json` → compact cross-iteration summaries for fast rehydration

Rehydration mode:

- `summary` (default)
- `artifact` (explicit fallback mode)

Retention is bounded via config (`maxRuns`, `maxSummaries`, etc.) to avoid unbounded growth.

---

## Configuration

Global config:

```text
~/.config/agent-workflow-kit/config.json
```

Local project config:

```text
.agent-workflow-kit.json
```

Resolution order:

1. internal defaults
2. global config
3. local project config

---

## Current Limitations

- Real-session validation evidence (Phase 9) is still pending completion.
- Public release notes and final OSS polish are still in progress.
- OpenCode is the only v1.0 target host.

---

## Roadmap Snapshot

High-level status:

- ✅ completed: phases 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15
- ⏳ pending for v1.0 close:
  - Phase 9 (real OpenCode validation evidence)
  - Phase 12 (final OSS/public release readiness)

References:

- `docs/roadmap-v1.0.md`
- `docs/phase9-validation.md`
- `docs/post-v1.0-implementation-ideas.md`
- `docs/demo-v1.0-quickstart.md`
- `docs/release-notes-v1.0.0-draft.md`

---

## Development & Validation

Build:

```bash
npm run build
```

Test:

```bash
npm run test
```

Install adapter:

```bash
npm run install:opencode
```

Contributing guide:

- `CONTRIBUTING.md`

---

## License

MIT — see `LICENSE`.

## Internal Development

This repository should be developed using the same workflow mindset it promotes.

- internal process: `docs/internal-workflow.md`
- technical shape: `docs/architecture.md`
- product target: `docs/product-requirements.md`
- execution plan: `docs/roadmap-v1.0.md`
- OpenCode compatibility: `docs/opencode-compatibility-v1.md`

Private maintainer notes or local installation artifacts should stay outside the public product surface and remain ignored by git.

## Recommended Direction

Option 1, recommended:

- build `core + skills + opencode adapter`

Option 2:

- build extra tooling before validating the real OpenCode integration

Recommendation:

- use Option 1, because it aligns with how adjacent systems like Agent Teams Lite and its extensions integrate with OpenCode and similar hosts.

## License

MIT

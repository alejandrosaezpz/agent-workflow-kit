# OpenCode Adapter

This document defines the target contract for integrating Agent Workflow Kit into OpenCode.

The goal is not to create a parallel interface. The goal is to install workflow capabilities into OpenCode so `workflow` becomes a native-feeling execution mode.

## Product Position

Agent Workflow Kit should integrate into OpenCode as:

- global by default
- optionally overridable at project level
- non-destructive to existing user config
- transparent in what it injects and manages

## Installation Scopes

Two scopes are supported:

1. Global
2. Project

Recommended default:

1. Global

Paths:

- global root: `~/.config/opencode`
- project root: `./.opencode`

## Integration Contract

The OpenCode adapter should manage three things:

1. config injection
2. workflow instructions
3. reusable skills

### 1. Config Injection

Target file:

- `opencode.json`

Rules:

- preserve existing user configuration
- merge only the Agent Workflow Kit managed section
- avoid replacing the whole file
- keep the managed section clearly identifiable

Recommended managed key:

- `agentWorkflowKit`

Recommended strategy:

- JSON merge for structured config
- marker-based injection for prompt fragments when needed

### 2. Workflow Instructions

OpenCode needs an orchestrator-facing instruction block that tells it:

- when `workflow` should be available
- what phases it should run
- how to hand off between phases
- how to keep the flow visible
- how to stop and ask the user when blocked

This instruction block should be injected as a managed fragment, not handwritten into the user's config manually.

### 3. Skills

The adapter should install reusable skills under a dedicated namespace.

Recommended target:

- `skills/agent-workflow-kit/`

Initial skill family:

- `workflow-explorer`
- `workflow-planner`
- `workflow-implementer`
- `workflow-reviewer`
- `workflow-tester`

## Workflow Exposure

The target user-facing entrypoint is:

- `workflow`

Two options exist:

1. host command
2. slash command

Recommendation:

1. host command

Reason:

- it better matches the intended product shape of a first-class mode like `plan` or `build`

## Phase Contract

The OpenCode workflow should expose these visible phases in order:

1. `explorer`
2. `planner`
3. `implementer`
4. `reviewer`
5. `tester`

These phases should stay visible in output so the user can understand where the workflow is and what happened.

## Managed Files

The adapter should manage files like these:

- `adapters/opencode/assets/opencode.workflow.json`
- `adapters/opencode/assets/workflow-instructions.md`
- `skills/...`
- `adapters/opencode/assets/opencode.example.json`

This does not mean all of them must exist immediately, but it defines the target installation surface.

Current MVP assets now exist in the repository at:

- `adapters/opencode/assets/opencode.workflow.json`
- `adapters/opencode/assets/workflow-instructions.md`
- `adapters/opencode/assets/opencode.example.json`

## Non-Destructive Rules

The adapter must:

- preserve non-Agent Workflow Kit config
- avoid duplicate injection
- support re-running install safely
- support future update and sync paths

The adapter must not:

- overwrite the full `opencode.json`
- assume the user only uses Agent Workflow Kit
- hardcode project-specific values into global config

## MVP Boundary

In the current MVP, the adapter contract is defined but the installation workflow is not implemented yet.

That is intentional.

The current goal is to lock down:

- where the adapter installs
- what it manages
- how it merges
- how `workflow` should appear inside OpenCode

before building the installer itself.

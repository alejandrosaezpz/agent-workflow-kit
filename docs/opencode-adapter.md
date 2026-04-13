# OpenCode Adapter

This document defines the target contract for integrating Agent Workflow Kit into OpenCode.

The goal is not to create a parallel interface. The goal is to install workflow capabilities into OpenCode so `workflow` becomes a native-feeling execution path.

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
- merge only supported OpenCode keys managed by Agent Workflow Kit
- avoid replacing the whole file
- keep injected entries traceable through managed files and instruction paths

Recommended strategy:

- JSON merge for structured config
- copy instruction files and reference them through OpenCode's `instructions` config

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

- `skills/`

In this repository, the source layout keeps them grouped under:

- `skills/agent-workflow-kit/`

During installation, the adapter should copy those skill directories into OpenCode's `skills/` folder so discovery works natively.

Initial skill family:

- `workflow-explorer`
- `workflow-planner`
- `workflow-implementer`
- `workflow-reviewer`
- `workflow-tester`

## Workflow Exposure

The target user-facing workflow entry is:

- a primary agent named `workflow`
- a slash command `/workflow`

Reason for this choice:

- OpenCode documents custom primary agents
- OpenCode documents slash commands
- OpenCode does not document adding a new built-in mode equivalent to `build` or `plan`

Recommendation:

1. use a primary agent as the real entrypoint
2. add `/workflow` as a convenience wrapper

This keeps the experience close to a first-class mode while staying inside documented OpenCode extension points.

## Agent Model

The workflow adapter should install a primary agent called `workflow`.

That agent is responsible for coordinating the visible workflow phases and delegating to subagents or skills when appropriate.

## Command Model

The workflow adapter should also install a custom slash command:

- `/workflow`

This command should route the provided task into the `workflow` primary agent.

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
- `adapters/opencode/assets/workflow-agent.md`
- `adapters/opencode/assets/workflow-command.md`
- `skills/...`
- `adapters/opencode/assets/opencode.example.json`

This does not mean all of them must exist immediately, but it defines the target installation surface.

Current MVP assets now exist in the repository at:

- `adapters/opencode/assets/opencode.workflow.json`
- `adapters/opencode/assets/workflow-instructions.md`
- `adapters/opencode/assets/workflow-agent.md`
- `adapters/opencode/assets/workflow-command.md`
- `adapters/opencode/assets/opencode.example.json`

## Installer MVP

The repository now includes an OpenCode installer MVP.

Current command:

```bash
npm run build
npm run install:opencode
```

Default behavior:

- installs to `~/.config/opencode`
- copies workflow instructions, agent, command, and skills
- merges `opencode.json` non-destructively
- appends the workflow instruction file to the `instructions` array if missing

Optional project scope:

```bash
npm run install:opencode -- --scope=project
```

Project-scope behavior:

- writes `opencode.json` in the project root
- installs agents, commands, skills, and instructions under `.opencode/`

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

The current MVP now includes a working installer path, but it is still intentionally minimal.

What it already does:

- installs workflow assets into OpenCode-supported locations
- merges `opencode.json` non-destructively
- installs a primary agent, slash command, and skills
- supports global and project scope

What it does not yet do:

- validate the full user experience inside a real OpenCode session
- handle complex migration cases
- support advanced sync and update behavior
- provide rollback or backup management

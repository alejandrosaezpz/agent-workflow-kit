# Agent Workflow Kit

Agent Workflow Kit is a lightweight open-source workflow layer for agent hosts like OpenCode.

Its purpose is to help developers move from unstructured chat-based usage to structured development flows built around an orchestrator, specialized phases, reusable skills, and explicit outputs.

## What This Is

Agent Workflow Kit is designed as:

- a workflow layer, not a heavyweight framework
- an integration for agent hosts, not a separate developer app
- a transparent orchestration model, not a black box
- a globally installed system with optional local overrides

## What This Is Not

It is not intended to be:

- a standalone CLI product
- a repo generator
- an autonomous system that acts without control
- a complex framework with hardcoded behavior

## Architecture

The target architecture is:

```text
docs/
  architecture.md
  internal-workflow.md
  opencode-adapter.md
  product-requirements.md
  roadmap-v0.1.md
adapters/
  opencode/
    assets/
      opencode.example.json
      opencode.workflow.json
      workflow-instructions.md
skills/
  README.md
src/
  adapters/
    opencode/
      index.ts
  core/
    config.ts
    orchestrator.ts
    contracts/
      agent.ts
  skills/
    default-agents.ts
  index.ts
```

### Core

The `core` layer contains the runtime-agnostic backbone:

- typed workflow contracts
- config resolution
- orchestrator sequencing

### Skills

The `skills/` directory is the intended product-facing extension surface.

The system should eventually expose reusable workflow skills for hosts like OpenCode.

### Adapters

Adapters connect the core workflow model to a specific host.

Current direction:

- `opencode` is the real product target

The OpenCode integration contract is documented in `docs/opencode-adapter.md`.

## Workflow Model

The default workflow remains intentionally simple:

1. `explorer`
2. `planner`
3. `implementer`
4. `reviewer`
5. `tester`

This workflow is sequential, visible, and designed to stay lightweight.

## Configuration

Global config:

```text
~/.config/agent-workflow-kit/config.json
```

Optional local config:

```text
.agent-workflow-kit.json
```

Resolution order for config:

1. internal defaults
2. global config
3. local project config

## Current MVP

The repository currently includes:

- a core orchestrator prototype
- typed phase contracts
- config loading
- an initial OpenCode adapter contract and assets

The adapter contract now defines:

- supported install scopes
- target OpenCode paths
- config injection rules
- managed files
- the intended `workflow` command shape inside OpenCode

The first OpenCode adapter assets now live in `adapters/opencode/assets/`.

## Internal Development

This repository should be developed using the same workflow mindset it promotes.

- internal process: `docs/internal-workflow.md`
- technical shape: `docs/architecture.md`
- product target: `docs/product-requirements.md`
- execution plan: `docs/roadmap-v0.1.md`

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

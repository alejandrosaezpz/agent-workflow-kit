# Architecture

Agent Workflow Kit should be treated as an integration layer for agent hosts such as OpenCode, not as a standalone CLI product.

## Target Shape

The system is organized around four parts:

1. `core`
2. `skills`
3. `adapters`
4. `docs`

## Core

`src/core/` contains the runtime-agnostic backbone:

- workflow contracts
- config resolution
- orchestrator sequencing

This layer should stay independent from any specific host tool.

## Skills

`skills/` is the product-facing extension surface.

The long-term goal is for workflow phases to be installable as reusable skills that a host agent can load and execute.

## Adapters

`src/adapters/` contains host-specific integration code.

Current targets:

- `opencode/` as the main product adapter

The OpenCode adapter contract is documented in `docs/opencode-adapter.md`.

## OpenCode Direction

The intended OpenCode integration model is:

- install globally
- inject workflow-related configuration into the host
- expose `workflow` as a first-class option or command
- delegate to specialized phases while keeping the flow visible

## Why This Shape

This mirrors how projects like Agent Teams Lite and its extensions structure the system:

- the host remains the execution surface
- the workflow layer supplies orchestration rules and skills
- config is merged into the host instead of replacing it
- artifacts and phase boundaries remain explicit

## MVP Reality

The current repository is intentionally centered on the OpenCode adapter path.

Private maintainer aids may exist locally during development, but they should not shape the public product surface.

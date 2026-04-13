# Product Requirements

This document defines the intended product shape of Agent Workflow Kit.

Its purpose is to keep the project aligned during development and avoid drifting into isolated implementation tasks without a clear product target.

## Product Goal

Agent Workflow Kit should become a native-feeling workflow layer for OpenCode that helps developers move from unstructured chat usage to structured development workflows.

The product should make software work:

- visible
- phased
- controllable
- extensible
- easy to adapt

## Target Outcome

In the intended final experience, a developer can choose `workflow` inside OpenCode and execute a development task through a visible flow of specialized phases instead of a flat chat interaction.

This should feel like a first-class execution mode, similar in status to modes like `plan` or `build`, while preserving explicit user control.

## Core Product Principles

Agent Workflow Kit should remain:

- lightweight before complex
- transparent before automatic
- controllable before autonomous
- reusable before hardcoded
- global before per-repository
- extensible without breaking what already exists

## Product Characteristics

The product is intended to be:

- a workflow layer for OpenCode
- a simple integration kit, not a heavy framework
- a base that developers can adapt to their own needs
- a reference for better AI development practices

The product is not intended to be:

- a standalone CLI as the primary interface
- a repo generator
- an opaque autonomous system
- a marketplace or plugin platform in its first version

## Primary Usage Model

The ideal usage model is:

1. the developer chooses `workflow` inside OpenCode
2. the task is executed through visible phases
3. the developer can inspect outputs between phases
4. the developer can intervene, ask questions, or redirect the process
5. the workflow continues with explicit checkpoints and approvals

The workflow may be adaptive depending on the task, but the process must remain visible.

## User Control Requirements

The user should retain full control over the workflow.

This means:

- no important step should happen without visibility
- the workflow should support approvals/checkpoints
- the user should be able to intervene between phases
- the workflow should pause when ambiguity or disagreement matters

This is especially important around exploration and planning.

## Workflow Requirements

The base workflow is:

1. `explorer`
2. `planner`
3. `implementer`
4. `reviewer`
5. `tester`

These phases are the primary unit of the system in the long term.

Requirements for the workflow:

- the active phase should be visible
- each phase should produce a clear outcome
- the workflow can adapt by compacting or skipping phases when appropriate
- the structure must remain understandable even when adaptive

## Interaction Between Phases

The workflow should not be a single uninterrupted black box.

Between phases, the system should support:

- user approvals
- user questions
- user corrections
- user-proposed changes to the plan
- clarification of doubts about previous outputs

This interaction model is part of the product, not an implementation detail.

## Output Requirements

During execution, the user should be able to see:

- the active phase
- the outputs or artifacts produced by that phase
- checkpoints where approval is expected

The output should stay clear and informative without becoming noisy.

## Artifact Requirements

The product should support artifacts produced by phases.

Examples:

- exploration summary
- plan or decision artifact
- implementation summary
- review findings
- validation result

Artifact persistence should be optional in the MVP.

The product should support:

- outputs in memory only
- optional persistence to disk or another store later

## Integration Requirements

OpenCode is the primary host target.

Requirements:

- global installation by default
- optional local override per project
- non-destructive integration with existing OpenCode config
- no replacement of unrelated user settings
- workflow exposed inside the host rather than through a separate external app

## Extensibility Requirements

The system should be extensible in these ways:

- new phases can be added
- skills can change or enrich a phase
- workflows alternative to the default one can be created
- presets can exist for project types or team preferences

This extensibility should be enabled by architecture, even if not fully implemented in `v0.1`.

## Educational Value

The public repository should also function as a reference for developers learning to work with AI through structured workflows.

It should show:

- how to break work into phases
- how to keep humans in control
- how to build a lightweight workflow system
- how to adapt the base to a team's needs

## Technical Shape Required By The Product

The product should be organized around:

1. `core`
2. `skills`
3. `adapters`
4. `assets`
5. `docs`

### Core

The `core` layer should contain:

- workflow contracts
- orchestration logic
- config resolution
- context resolution
- result modeling

### Skills

The `skills` layer should be the main customization surface for developers.

### Adapters

Adapters should connect the core workflow model to host environments like OpenCode.

### Assets

Assets should provide the configuration fragments, instructions, and examples needed for installation into the host.

### Docs

Documentation should explain both the architecture and the intended product behavior, not only the code structure.

## What Must Stay Out Of v0.1

The following are intentionally out of scope for `v0.1`:

- real multi-host support
- high-autonomy execution
- advanced memory systems
- marketplace or plugin ecosystems
- complex UI layers

## Definition Of Success

Agent Workflow Kit is succeeding when:

- OpenCode users can work through a visible workflow instead of flat chat
- the workflow improves clarity and control
- the product remains simple enough to understand quickly
- the base system can be adapted by developers through skills and workflow changes
- the architecture stays aligned with the product philosophy instead of drifting into complexity

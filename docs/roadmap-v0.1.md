# Roadmap v0.1

This document defines the execution plan for reaching the first meaningful version of Agent Workflow Kit.

The purpose of this roadmap is to avoid working on disconnected tasks and instead move through a deliberate sequence of phases.

## v0.1 Goal

Deliver a first useful OpenCode-focused MVP where:

- the product direction is clear
- the integration point with OpenCode is validated
- the default workflow is visible and structured
- the first skills and adapter surface exist
- installation and usage are realistic enough to test in practice

## What v0.1 Includes

- focus on OpenCode as the primary host
- default workflow with the five base phases
- visible phase-based execution model
- user participation between phases
- checkpoints and approvals
- minimal artifacts per phase
- global installation as the main path
- optional local override
- initial OpenCode adapter MVP
- initial workflow skills MVP

## What v0.1 Does Not Include

- real multi-host support
- high autonomy
- advanced persistence or memory
- plugin marketplace or ecosystem
- complex UI or visualization layers

## Phase 1 — Lock Product Scope

Objective:
Stop ambiguity around what `v0.1` is supposed to deliver.

Tasks:

- write product requirements
- define what is in and out of `v0.1`
- define the intended user experience of `workflow`
- define how user approvals and interventions should work

Completion criteria:

- product requirements are documented
- v0.1 scope is explicit

## Phase 2 — Validate OpenCode Integration Model

Objective:
Confirm how Agent Workflow Kit should actually integrate with OpenCode.

Tasks:

- verify how OpenCode exposes commands or modes
- verify how OpenCode loads skills
- verify where instructions and config should be injected
- decide whether `workflow` is implemented as a host command, slash command, or another supported mechanism

Completion criteria:

- the integration model is validated against OpenCode reality, not only assumptions
- the product entrypoint inside OpenCode is decided

## Phase 3 — Define Runtime UX

Objective:
Specify what happens when a user runs `workflow`.

Tasks:

- define the visible phase lifecycle
- define phase outputs
- define checkpoints and approvals
- define how the user participates between phases
- define minimal artifact shape per phase

Completion criteria:

- the execution experience is clearly specified
- the output model is no longer ambiguous

## Phase 4 — Create Skills MVP

Objective:
Move from placeholder logic toward the actual product surface.

Tasks:

- create `workflow-explorer`
- create `workflow-planner`
- create `workflow-implementer`
- create `workflow-reviewer`
- create `workflow-tester`
- keep the skills minimal and understandable

Completion criteria:

- the repository contains the first real workflow skills
- the skills are installable as part of the OpenCode integration surface

## Phase 5 — Implement OpenCode Adapter MVP

Objective:
Make the product installable into OpenCode in a basic but real way.

Tasks:

- implement installation flow for global scope
- optionally support project scope if cheap and stable enough
- copy or install the workflow skills
- inject workflow instructions
- merge Agent Workflow Kit config into `opencode.json` non-destructively
- avoid duplicate installation on repeated runs

Completion criteria:

- OpenCode can be prepared for Agent Workflow Kit with an MVP installer
- user config is preserved during installation

## Phase 6 — Test Real Workflow Usage In OpenCode

Objective:
Validate that the product works as a real workflow, not just as architecture.

Tasks:

- run realistic development tasks through `workflow`
- verify phase visibility
- verify user intervention between phases
- verify approvals/checkpoints
- verify output usefulness
- record friction and breakdown points

Completion criteria:

- the workflow can be used end to end in real scenarios
- key friction points are known

## Phase 7 — Refine Based On Real Usage

Objective:
Improve only what is justified by actual usage.

Potential tasks:

- improve artifact structure
- add optional persistence
- refine adaptive phase behavior
- improve instructions or skills
- tighten installation behavior

Completion criteria:

- the MVP is more stable without expanding scope unnecessarily

## Phase 8 — Align Public Documentation

Objective:
Ensure the repository explains the product as it actually exists.

Tasks:

- update README with real installation and usage
- document how `workflow` behaves inside OpenCode
- document how to customize skills or workflows
- keep the public story aligned with the real product

Completion criteria:

- docs match implementation reality
- new contributors can understand what the project is and where it is going

## Recommended Working Order

The order should be:

1. lock product scope
2. validate OpenCode integration
3. define runtime UX
4. create skills MVP
5. implement adapter MVP
6. test real usage in OpenCode
7. refine from reality
8. align public documentation

## Working Rules During v0.1

To keep the roadmap disciplined:

- do not add new major fronts before the current one is closed
- prefer real validation over speculative architecture
- prefer the smallest usable implementation over generalized systems
- keep OpenCode as the single real host target during this phase

## Current Status

At the moment, the project already has:

- a documented architecture direction
- a core prototype
- an OpenCode adapter contract
- initial OpenCode assets

Private maintainer helpers may exist locally, but they are intentionally outside the public roadmap and product surface.

The next highest-value step after this roadmap is to validate the real integration model with OpenCode and then create the first workflow skills.

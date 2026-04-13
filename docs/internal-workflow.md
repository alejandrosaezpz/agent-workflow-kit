# Internal Workflow

This document defines the minimum workflow used to develop Agent Workflow Kit itself.

The goal is to build the project with the same structured mindset it promotes, while keeping the process lightweight enough for fast MVP iteration.

## Purpose

This workflow exists to keep development:

- consistent
- visible
- easy to explain
- aligned with the product philosophy

It should help decision-making without turning every change into a heavy process.

## Principles

Apply this workflow with the same project principles:

- lightweight before complex
- transparent before automatic
- controllable before autonomous
- reusable before hardcoded
- global before per-repository
- extensible without breaking what already exists

## Minimum Workflow

Every non-trivial task should follow these five phases:

1. Explorer
2. Planner
3. Implementer
4. Reviewer
5. Tester

The flow is sequential and visible.

## Phase Definitions

### 1. Explorer

Goal:
Understand the current state before proposing changes.

Expected output:

- what already exists
- which files or modules are relevant
- constraints or risks

Rule:
Do not jump straight into implementation without reading the minimum necessary context.

### 2. Planner

Goal:
Choose the smallest correct change.

Expected output:

- what needs to change
- 2 possible approaches at most
- one recommended option
- files likely to be touched

Rule:
Prefer the option with less architectural weight unless there is a clear reason not to.

### 3. Implementer

Goal:
Apply the chosen change with minimal scope.

Expected output:

- concrete code or file changes
- no unnecessary abstractions

Rule:
Do not build future systems early unless they are required by the current problem.

### 4. Reviewer

Goal:
Look for real problems after implementation.

Expected output:

- bugs or regressions
- complexity that should be removed
- missing edge cases
- design mismatches with project principles

Rule:
Prioritize risk and correctness over style.

### 5. Tester

Goal:
Validate the result and make the outcome explicit.

Expected output:

- commands executed
- what passed
- what could not be validated

Rule:
Every task should close with some verification, even if it is minimal.

## Lightweight Execution

For small tasks, the workflow can be compressed:

- Explorer and Planner can be combined
- Reviewer and Tester can be combined

The responsibilities should still exist, even if the output is brief.

## Default Output Shape

When a task is substantial, the work should naturally map to a structure like this:

```md
## Explorer
- State:
- Relevant files:
- Risks:

## Planner
- Goal:
- Option 1:
- Option 2:
- Recommended:

## Implementer
- Changes made:

## Reviewer
- Findings:
- Remaining risks:

## Tester
- Checks run:
- Result:
```

This is a guide, not a rigid template.

## What This Workflow Is Not

This workflow is not meant to:

- force heavy ceremony on trivial tasks
- justify overengineering
- simulate autonomy for its own sake
- hide decisions behind agent language

If the process feels heavier than the change itself, it should be simplified.

## Success Criteria

The workflow is working well when it helps the project:

- make smaller and clearer changes
- keep architecture understandable
- validate ideas through real usage
- evolve the product from practice, not theory alone

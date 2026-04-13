---
name: workflow-explorer
description: Explore the codebase and current state before planning changes
license: MIT
compatibility: opencode
metadata:
  phase: explorer
  audience: developers
---

## Purpose

Use this skill at the start of a workflow to understand the current state before proposing changes.

## What To Do

- identify the parts of the codebase relevant to the task
- summarize what already exists
- identify constraints, dependencies, and likely touch points
- call out risks or ambiguity that should influence planning

## Output

Produce a short exploration artifact that includes:

- current state
- relevant files or modules
- constraints or risks
- open questions if the task is still unclear

## Rules

- do not jump into implementation
- do not invent a solution yet unless exploration makes it obvious
- keep the output concise and decision-oriented
- if the task is ambiguous, make that visible rather than guessing silently

## Checkpoint

Exploration is a checkpoint phase.

Before moving on, the user should be able to:

- confirm the understanding
- correct the interpretation
- add missing context
- ask questions about the explored state

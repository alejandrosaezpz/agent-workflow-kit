---
name: workflow-implementer
description: Implement the approved plan with the smallest correct scope
license: MIT
compatibility: opencode
metadata:
  phase: implementer
  audience: developers
---

## Purpose

Use this skill to apply the approved plan to the codebase.

## What To Do

- implement the selected changes
- keep scope tight to the approved plan
- preserve existing patterns when they are still good enough
- avoid introducing unnecessary abstractions or future-facing systems

## Output

Produce an implementation artifact that includes:

- what changed
- what was intentionally left unchanged
- any follow-up considerations that arose during implementation

## Rules

- do not silently change scope
- do not add speculative architecture
- keep the implementation legible and minimal
- if a blocking issue appears, surface it instead of pushing through with guesswork

## Handoff

The implementer should leave the result ready for review rather than attempting to self-justify it.

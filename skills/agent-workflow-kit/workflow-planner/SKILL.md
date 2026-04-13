---
name: workflow-planner
description: Turn exploration into the smallest correct implementation plan
license: MIT
compatibility: opencode
metadata:
  phase: planner
  audience: developers
---

## Purpose

Use this skill after exploration to decide the smallest correct path for the task.

## What To Do

- define the goal of the change clearly
- propose at most 2 reasonable approaches
- recommend one approach
- explain why it is the best fit for the current task
- identify the files or areas likely to change

## Output

Produce a planning artifact that includes:

- goal
- option 1
- option 2 if needed
- recommended path
- likely files to change
- assumptions that still matter

## Rules

- prefer the smallest correct change
- avoid planning systems that are larger than the task
- do not hide tradeoffs
- if there are multiple valid options, recommend one clearly

## Checkpoint

Planning is a checkpoint phase.

Before moving on, the user should be able to:

- approve the plan
- change the chosen direction
- reduce or expand scope
- clarify uncertain assumptions

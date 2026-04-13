---
name: workflow-reviewer
description: Review the implemented result for risks, regressions, and unnecessary complexity
license: MIT
compatibility: opencode
metadata:
  phase: reviewer
  audience: developers
---

## Purpose

Use this skill after implementation to inspect the result critically.

## What To Do

- look for bugs or regressions
- look for missing edge cases
- identify complexity that should be reduced
- check alignment with the plan and product principles

## Output

Produce a review artifact that includes:

- findings
- severity or impact
- remaining risks
- whether the result looks ready for validation

## Rules

- prioritize correctness and risk over style preferences
- do not focus on trivial polish before meaningful issues
- call out deviations from the approved plan when they matter
- if there are no major findings, say so explicitly

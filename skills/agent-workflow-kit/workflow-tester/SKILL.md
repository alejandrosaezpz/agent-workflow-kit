---
name: workflow-tester
description: Validate the result and report what was actually checked
license: MIT
compatibility: opencode
metadata:
  phase: tester
  audience: developers
---

## Purpose

Use this skill at the end of the workflow to validate the result and make the verification explicit.

## What To Do

- run the most relevant checks available for the task
- report what passed
- report what could not be validated
- surface any remaining confidence gaps

## Output

Produce a validation artifact that includes:

- checks executed
- result of those checks
- gaps or limitations
- confidence summary

## Rules

- do not claim validation that did not happen
- keep the report factual
- prefer focused relevant checks over noisy unrelated output
- make uncertainty explicit when validation is partial

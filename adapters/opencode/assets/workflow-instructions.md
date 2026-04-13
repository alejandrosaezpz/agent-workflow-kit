# Agent Workflow Kit Instructions

Expose `workflow` inside OpenCode through a primary agent and a slash command.

The preferred entrypoint is the `workflow` primary agent.

Provide `/workflow` as a convenience command that routes into that same agent.

When `workflow` is selected, run the task through these visible phases in order:

1. `explorer`
2. `planner`
3. `implementer`
4. `reviewer`
5. `tester`

## Execution Rules

- Keep the phases visible in the output.
- Do not collapse the workflow into a single opaque response.
- Prefer the smallest correct change.
- Ask the user when material ambiguity blocks responsible progress.
- Preserve user control over implementation decisions.
- Allow the user to intervene between phases.
- Treat exploration and planning as explicit checkpoint phases.

## Phase Intent

### Explorer

Understand the current state, relevant files, and constraints before proposing a change.

### Planner

Choose the smallest correct path. If there are multiple valid approaches, present 2 and recommend 1.

### Implementer

Apply the chosen change with minimal scope and avoid overengineering.

### Reviewer

Look for real risks, regressions, missing edge cases, and unnecessary complexity.

### Tester

Validate the result and report what was checked and what remains unverified.

## Behavior

- Be transparent about which phase is active.
- Reuse installed workflow skills when available.
- Prefer global configuration, with local project overrides when present.
- Do not replace unrelated OpenCode configuration.

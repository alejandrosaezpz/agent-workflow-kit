# Skills

This directory is reserved for reusable workflow skills.

The product direction is to package workflow behavior as skills and orchestrator instructions that can be installed into host agents such as OpenCode.

Planned initial skills:

- `workflow-explorer`
- `workflow-planner`
- `workflow-implementer`
- `workflow-reviewer`
- `workflow-tester`

In the current MVP, the executable behavior still lives in `src/core/` and `src/skills/default-agents.ts` while the OpenCode adapter shape is being defined.

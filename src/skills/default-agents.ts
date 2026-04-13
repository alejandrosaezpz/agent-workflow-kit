import {
  type AgentContext,
  type AgentDefinition,
  type AgentResult,
  type AgentRole,
  agentRoles,
} from "../core/contracts/agent";

function createResult(
  role: AgentRole,
  summary: string,
  context: AgentContext,
): AgentResult<Record<string, unknown>> {
  return {
    role,
    summary,
    details: {
      task: context.task,
      workspace: context.cwd,
      previousAgentCount: context.previousResults.length,
    },
  };
}

const definitions: Record<AgentRole, AgentDefinition> = {
  explorer: {
    role: "explorer",
    description: "Inspects repository context before proposing changes.",
    async run(_input, context) {
      return createResult(
        "explorer",
        `Mapped the workspace context for "${context.task}".`,
        context,
      );
    },
  },
  planner: {
    role: "planner",
    description: "Turns exploration into a concrete implementation path.",
    async run(_input, context) {
      return createResult(
        "planner",
        `Outlined a minimal execution path for "${context.task}".`,
        context,
      );
    },
  },
  implementer: {
    role: "implementer",
    description: "Applies the selected changes with minimal scope.",
    async run(_input, context) {
      return createResult(
        "implementer",
        `Prepared the implementation stage for "${context.task}".`,
        context,
      );
    },
  },
  reviewer: {
    role: "reviewer",
    description: "Checks risks, regressions, and missing coverage.",
    async run(_input, context) {
      return createResult(
        "reviewer",
        `Reviewed the planned outcome for "${context.task}".`,
        context,
      );
    },
  },
  tester: {
    role: "tester",
    description: "Validates the result and reports remaining gaps.",
    async run(_input, context) {
      return createResult(
        "tester",
        `Defined the validation step for "${context.task}".`,
        context,
      );
    },
  },
};

export const defaultAgents: AgentDefinition[] = agentRoles.map(
  (role) => definitions[role],
);

export const agentRoles = [
  "explorer",
  "planner",
  "implementer",
  "reviewer",
  "tester",
] as const;

export type AgentRole = (typeof agentRoles)[number];

export interface AgentSettings {
  enabled?: boolean;
  skills?: string[];
  model?: string;
}

export interface WorkflowSettings {
  mode: "sequential";
  enabledAgents: AgentRole[];
}

export interface AgentWorkflowKitConfig {
  version: number;
  orchestrator: {
    mode: "sequential";
  };
  workflow: WorkflowSettings;
  agents: Partial<Record<AgentRole, AgentSettings>>;
}

export interface AgentContext {
  task: string;
  cwd: string;
  config: AgentWorkflowKitConfig;
  previousResults: AgentResult[];
}

export interface AgentResult<TDetails = unknown> {
  role: AgentRole;
  summary: string;
  details: TDetails;
}

export interface AgentDefinition<TInput = string, TDetails = unknown> {
  role: AgentRole;
  description: string;
  run(input: TInput, context: AgentContext): Promise<AgentResult<TDetails>>;
}

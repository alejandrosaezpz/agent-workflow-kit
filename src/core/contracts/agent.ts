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

export interface ContextStoreSettings {
  kind: "file" | "memory";
  filePath?: string;
}

export interface ContextRetentionSettings {
  maxRuns: number;
  maxDurableArtifactsPerRun: number;
  maxEventsPerRun: number;
}

export interface ContextBudgetSettings {
  maxWorkflowTaskChars: number;
  maxSubagentTaskChars: number;
  maxRehydratedContextChars: number;
  maxClarificationChars: number;
  maxEstimatedTrimmedTokensWarning: number;
  perRoleTaskCharLimit: Partial<Record<AgentRole, number>>;
}

export interface ContextSettings {
  enabled: boolean;
  store: ContextStoreSettings;
  rehydrateWorkflowArtifacts: number;
  rehydrateSubagentArtifacts: number;
  retention: ContextRetentionSettings;
  budget: ContextBudgetSettings;
}

export interface AgentWorkflowKitConfig {
  version: number;
  orchestrator: {
    mode: "sequential";
  };
  workflow: WorkflowSettings;
  context: ContextSettings;
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

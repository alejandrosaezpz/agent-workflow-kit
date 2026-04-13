import {
  type AgentDefinition,
  type AgentResult,
  type AgentRole,
} from "./contracts/agent";
import { type ResolvedConfig } from "./config";

export interface WorkflowRunResult {
  task: string;
  cwd: string;
  configSources: string[];
  results: AgentResult[];
}

export class Orchestrator {
  private readonly agentsByRole: Map<AgentRole, AgentDefinition>;

  constructor(agents: AgentDefinition[]) {
    this.agentsByRole = new Map(agents.map((agent) => [agent.role, agent]));
  }

  async run(
    task: string,
    cwd: string,
    resolvedConfig: ResolvedConfig,
  ): Promise<WorkflowRunResult> {
    const results: AgentResult[] = [];

    for (const role of resolvedConfig.config.workflow.enabledAgents) {
      const agentSettings = resolvedConfig.config.agents[role];

      if (agentSettings?.enabled === false) {
        continue;
      }

      const agent = this.agentsByRole.get(role);

      if (!agent) {
        throw new Error(`Agent not registered: ${role}`);
      }

      const result = await agent.run(task, {
        task,
        cwd,
        config: resolvedConfig.config,
        previousResults: results,
      });

      results.push(result);
    }

    return {
      task,
      cwd,
      configSources: resolvedConfig.loadedSources,
      results,
    };
  }
}

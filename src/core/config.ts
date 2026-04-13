import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  type AgentRole,
  type AgentWorkflowKitConfig,
  agentRoles,
} from "./contracts/agent";

export interface ResolvedConfig {
  config: AgentWorkflowKitConfig;
  globalConfigPath: string;
  localConfigPath: string;
  loadedSources: string[];
}

const defaultEnabledAgents: AgentRole[] = [
  "explorer",
  "planner",
  "implementer",
  "reviewer",
  "tester",
];

export const defaultConfig: AgentWorkflowKitConfig = {
  version: 1,
  orchestrator: {
    mode: "sequential",
  },
  workflow: {
    mode: "sequential",
    enabledAgents: defaultEnabledAgents,
  },
  agents: Object.fromEntries(
    agentRoles.map((role) => [role, { enabled: true, skills: [] }]),
  ) as AgentWorkflowKitConfig["agents"],
};

export function getGlobalConfigPath(): string {
  return join(homedir(), ".config", "agent-workflow-kit", "config.json");
}

export function getLocalConfigPath(cwd: string): string {
  return join(cwd, ".agent-workflow-kit.json");
}

export function resolveConfig(cwd: string): ResolvedConfig {
  const globalConfigPath = getGlobalConfigPath();
  const localConfigPath = getLocalConfigPath(cwd);
  const loadedSources: string[] = [];

  let config = cloneConfig(defaultConfig);

  if (existsSync(globalConfigPath)) {
    config = mergeConfig(config, readConfigFile(globalConfigPath));
    loadedSources.push(globalConfigPath);
  }

  if (existsSync(localConfigPath)) {
    config = mergeConfig(config, readConfigFile(localConfigPath));
    loadedSources.push(localConfigPath);
  }

  return {
    config,
    globalConfigPath,
    localConfigPath,
    loadedSources,
  };
}

function readConfigFile(filePath: string): Partial<AgentWorkflowKitConfig> {
  const raw = readFileSync(filePath, "utf8");

  try {
    return JSON.parse(raw) as Partial<AgentWorkflowKitConfig>;
  } catch {
    throw new Error(`Invalid JSON in config file: ${filePath}`);
  }
}

function mergeConfig(
  base: AgentWorkflowKitConfig,
  override: Partial<AgentWorkflowKitConfig>,
): AgentWorkflowKitConfig {
  const mergedAgents = { ...base.agents };

  for (const role of agentRoles) {
    mergedAgents[role] = {
      ...base.agents[role],
      ...override.agents?.[role],
    };
  }

  return {
    version: override.version ?? base.version,
    orchestrator: {
      mode: override.orchestrator?.mode ?? base.orchestrator.mode,
    },
    workflow: {
      mode: override.workflow?.mode ?? base.workflow.mode,
      enabledAgents:
        override.workflow?.enabledAgents ?? base.workflow.enabledAgents,
    },
    agents: mergedAgents,
  };
}

function cloneConfig(config: AgentWorkflowKitConfig): AgentWorkflowKitConfig {
  return {
    version: config.version,
    orchestrator: { ...config.orchestrator },
    workflow: {
      mode: config.workflow.mode,
      enabledAgents: [...config.workflow.enabledAgents],
    },
    agents: Object.fromEntries(
      agentRoles.map((role) => [
        role,
        {
          enabled: config.agents[role]?.enabled,
          model: config.agents[role]?.model,
          skills: [...(config.agents[role]?.skills ?? [])],
        },
      ]),
    ) as AgentWorkflowKitConfig["agents"],
  };
}

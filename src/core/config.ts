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
  context: {
    enabled: true,
    store: {
      kind: "file",
    },
    rehydrateWorkflowArtifacts: 3,
    rehydrateSubagentArtifacts: 2,
    retention: {
      maxRuns: 40,
      maxDurableArtifactsPerRun: 6,
      maxEventsPerRun: 80,
    },
    budget: {
      maxWorkflowTaskChars: 6000,
      maxSubagentTaskChars: 3500,
      maxRehydratedContextChars: 1800,
      maxClarificationChars: 700,
      maxEstimatedTrimmedTokensWarning: 500,
      perRoleTaskCharLimit: {
        explorer: 3200,
        planner: 3200,
        implementer: 2600,
        reviewer: 2200,
        tester: 2200,
      },
    },
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
    context: {
      enabled: override.context?.enabled ?? base.context.enabled,
      store: {
        kind: override.context?.store?.kind ?? base.context.store.kind,
        ...(override.context?.store?.filePath ?? base.context.store.filePath
          ? {
              filePath:
                override.context?.store?.filePath ?? base.context.store.filePath,
            }
          : {}),
      },
      rehydrateWorkflowArtifacts:
        override.context?.rehydrateWorkflowArtifacts ??
        base.context.rehydrateWorkflowArtifacts,
      rehydrateSubagentArtifacts:
        override.context?.rehydrateSubagentArtifacts ??
        base.context.rehydrateSubagentArtifacts,
      retention: {
        maxRuns:
          override.context?.retention?.maxRuns ?? base.context.retention.maxRuns,
        maxDurableArtifactsPerRun:
          override.context?.retention?.maxDurableArtifactsPerRun ??
          base.context.retention.maxDurableArtifactsPerRun,
        maxEventsPerRun:
          override.context?.retention?.maxEventsPerRun ??
          base.context.retention.maxEventsPerRun,
      },
      budget: {
        maxWorkflowTaskChars:
          override.context?.budget?.maxWorkflowTaskChars ??
          base.context.budget.maxWorkflowTaskChars,
        maxSubagentTaskChars:
          override.context?.budget?.maxSubagentTaskChars ??
          base.context.budget.maxSubagentTaskChars,
        maxRehydratedContextChars:
          override.context?.budget?.maxRehydratedContextChars ??
          base.context.budget.maxRehydratedContextChars,
        maxClarificationChars:
          override.context?.budget?.maxClarificationChars ??
          base.context.budget.maxClarificationChars,
        maxEstimatedTrimmedTokensWarning:
          override.context?.budget?.maxEstimatedTrimmedTokensWarning ??
          base.context.budget.maxEstimatedTrimmedTokensWarning,
        perRoleTaskCharLimit: {
          ...base.context.budget.perRoleTaskCharLimit,
          ...override.context?.budget?.perRoleTaskCharLimit,
        },
      },
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
    context: {
      enabled: config.context.enabled,
      store: {
        kind: config.context.store.kind,
        ...(config.context.store.filePath
          ? { filePath: config.context.store.filePath }
          : {}),
      },
      rehydrateWorkflowArtifacts: config.context.rehydrateWorkflowArtifacts,
      rehydrateSubagentArtifacts: config.context.rehydrateSubagentArtifacts,
      retention: {
        maxRuns: config.context.retention.maxRuns,
        maxDurableArtifactsPerRun: config.context.retention.maxDurableArtifactsPerRun,
        maxEventsPerRun: config.context.retention.maxEventsPerRun,
      },
      budget: {
        maxWorkflowTaskChars: config.context.budget.maxWorkflowTaskChars,
        maxSubagentTaskChars: config.context.budget.maxSubagentTaskChars,
        maxRehydratedContextChars: config.context.budget.maxRehydratedContextChars,
        maxClarificationChars: config.context.budget.maxClarificationChars,
        maxEstimatedTrimmedTokensWarning:
          config.context.budget.maxEstimatedTrimmedTokensWarning,
        perRoleTaskCharLimit: {
          ...config.context.budget.perRoleTaskCharLimit,
        },
      },
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

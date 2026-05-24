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
    rehydrationMode: "summary",
    store: {
      kind: "file",
    },
    rehydrateWorkflowArtifacts: 3,
    rehydrateSubagentArtifacts: 2,
    retention: {
      maxRuns: 40,
      maxSummaries: 5,
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
      phaseHandoffCharLimit: {
        explorerToPlanner: 2000,
        plannerToImplementer: 1600,
        implementerToReviewer: 1200,
        reviewerToTester: 1200,
        testerToStorage: 1600,
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

  validateConfig(config);

  return {
    config,
    globalConfigPath,
    localConfigPath,
    loadedSources,
  };
}

function readConfigFile(filePath: string): Partial<AgentWorkflowKitConfig> {
  const raw = readFileSync(filePath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in config file: ${filePath}`);
  }

  validateConfigOverride(parsed, filePath);
  return parsed;
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
      rehydrationMode:
        override.context?.rehydrationMode ?? base.context.rehydrationMode,
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
        maxSummaries:
          override.context?.retention?.maxSummaries ??
          base.context.retention.maxSummaries,
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
        phaseHandoffCharLimit: {
          ...base.context.budget.phaseHandoffCharLimit,
          ...override.context?.budget?.phaseHandoffCharLimit,
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
      rehydrationMode: config.context.rehydrationMode,
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
        maxSummaries: config.context.retention.maxSummaries,
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
        phaseHandoffCharLimit: {
          ...config.context.budget.phaseHandoffCharLimit,
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

function validateConfigOverride(value: unknown, source: string): asserts value is Partial<AgentWorkflowKitConfig> {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid config shape in file: ${source}`);
  }

  if (value.version !== undefined && !isPositiveNumber(value.version)) {
    throw new Error(`Invalid 'version' in config file: ${source}`);
  }

  if (value.workflow !== undefined) {
    if (!isPlainObject(value.workflow)) {
      throw new Error(`Invalid 'workflow' section in config file: ${source}`);
    }

    if (
      value.workflow.enabledAgents !== undefined &&
      (!Array.isArray(value.workflow.enabledAgents) ||
        value.workflow.enabledAgents.some((role) => !isAgentRole(role)))
    ) {
      throw new Error(`Invalid 'workflow.enabledAgents' in config file: ${source}`);
    }
  }

  if (value.context !== undefined) {
    if (!isPlainObject(value.context)) {
      throw new Error(`Invalid 'context' section in config file: ${source}`);
    }

    if (value.context.enabled !== undefined && typeof value.context.enabled !== "boolean") {
      throw new Error(`Invalid 'context.enabled' in config file: ${source}`);
    }

    if (
      value.context.rehydrationMode !== undefined &&
      value.context.rehydrationMode !== "summary" &&
      value.context.rehydrationMode !== "artifact"
    ) {
      throw new Error(`Invalid 'context.rehydrationMode' in config file: ${source}`);
    }

    if (value.context.store !== undefined) {
      if (!isPlainObject(value.context.store)) {
        throw new Error(`Invalid 'context.store' section in config file: ${source}`);
      }

      if (
        value.context.store.kind !== undefined &&
        value.context.store.kind !== "file" &&
        value.context.store.kind !== "memory"
      ) {
        throw new Error(`Invalid 'context.store.kind' in config file: ${source}`);
      }

      if (
        value.context.store.filePath !== undefined &&
        typeof value.context.store.filePath !== "string"
      ) {
        throw new Error(`Invalid 'context.store.filePath' in config file: ${source}`);
      }
    }

    if (
      value.context.rehydrateWorkflowArtifacts !== undefined &&
      !isNonNegativeNumber(value.context.rehydrateWorkflowArtifacts)
    ) {
      throw new Error(`Invalid 'context.rehydrateWorkflowArtifacts' in config file: ${source}`);
    }

    if (
      value.context.rehydrateSubagentArtifacts !== undefined &&
      !isNonNegativeNumber(value.context.rehydrateSubagentArtifacts)
    ) {
      throw new Error(`Invalid 'context.rehydrateSubagentArtifacts' in config file: ${source}`);
    }
  }
}

function validateConfig(config: AgentWorkflowKitConfig): void {
  if (!isPositiveNumber(config.version)) {
    throw new Error("Invalid resolved config: 'version' must be a positive number");
  }

  if (config.orchestrator.mode !== "sequential") {
    throw new Error("Invalid resolved config: unsupported orchestrator mode");
  }

  if (config.workflow.mode !== "sequential") {
    throw new Error("Invalid resolved config: unsupported workflow mode");
  }

  if (
    !Array.isArray(config.workflow.enabledAgents) ||
    config.workflow.enabledAgents.length === 0 ||
    config.workflow.enabledAgents.some((role) => !isAgentRole(role))
  ) {
    throw new Error("Invalid resolved config: 'workflow.enabledAgents' must include valid roles");
  }

  validateContextConfig(config);
  validateAgentsConfig(config);
}

function validateContextConfig(config: AgentWorkflowKitConfig): void {
  const { context } = config;

  if (typeof context.enabled !== "boolean") {
    throw new Error("Invalid resolved config: 'context.enabled' must be a boolean");
  }

  if (context.store.kind !== "file" && context.store.kind !== "memory") {
    throw new Error("Invalid resolved config: unsupported context store kind");
  }

  if (context.rehydrationMode !== "summary" && context.rehydrationMode !== "artifact") {
    throw new Error("Invalid resolved config: unsupported context rehydration mode");
  }

  if (context.store.filePath !== undefined && context.store.filePath.trim().length === 0) {
    throw new Error("Invalid resolved config: 'context.store.filePath' cannot be empty");
  }

  if (!isNonNegativeNumber(context.rehydrateWorkflowArtifacts)) {
    throw new Error("Invalid resolved config: 'context.rehydrateWorkflowArtifacts' must be >= 0");
  }

  if (!isNonNegativeNumber(context.rehydrateSubagentArtifacts)) {
    throw new Error("Invalid resolved config: 'context.rehydrateSubagentArtifacts' must be >= 0");
  }

  if (!isPositiveNumber(context.retention.maxRuns)) {
    throw new Error("Invalid resolved config: 'context.retention.maxRuns' must be > 0");
  }

  if (!isPositiveNumber(context.retention.maxSummaries)) {
    throw new Error("Invalid resolved config: 'context.retention.maxSummaries' must be > 0");
  }

  if (!isNonNegativeNumber(context.retention.maxDurableArtifactsPerRun)) {
    throw new Error(
      "Invalid resolved config: 'context.retention.maxDurableArtifactsPerRun' must be >= 0",
    );
  }

  if (!isNonNegativeNumber(context.retention.maxEventsPerRun)) {
    throw new Error("Invalid resolved config: 'context.retention.maxEventsPerRun' must be >= 0");
  }

  if (!isPositiveNumber(context.budget.maxWorkflowTaskChars)) {
    throw new Error("Invalid resolved config: 'context.budget.maxWorkflowTaskChars' must be > 0");
  }

  if (!isPositiveNumber(context.budget.maxSubagentTaskChars)) {
    throw new Error("Invalid resolved config: 'context.budget.maxSubagentTaskChars' must be > 0");
  }

  if (!isPositiveNumber(context.budget.maxRehydratedContextChars)) {
    throw new Error(
      "Invalid resolved config: 'context.budget.maxRehydratedContextChars' must be > 0",
    );
  }

  if (!isPositiveNumber(context.budget.maxClarificationChars)) {
    throw new Error("Invalid resolved config: 'context.budget.maxClarificationChars' must be > 0");
  }

  if (!isNonNegativeNumber(context.budget.maxEstimatedTrimmedTokensWarning)) {
    throw new Error(
      "Invalid resolved config: 'context.budget.maxEstimatedTrimmedTokensWarning' must be >= 0",
    );
  }

  for (const [role, value] of Object.entries(context.budget.perRoleTaskCharLimit)) {
    if (!isAgentRole(role) || !isPositiveNumber(value)) {
      throw new Error(`Invalid resolved config: invalid per-role budget for '${role}'`);
    }
  }

  for (const [field, value] of Object.entries(context.budget.phaseHandoffCharLimit)) {
    if (!isPositiveNumber(value)) {
      throw new Error(
        `Invalid resolved config: invalid phase handoff budget for '${field}'`,
      );
    }
  }
}

function validateAgentsConfig(config: AgentWorkflowKitConfig): void {
  for (const role of agentRoles) {
    const settings = config.agents[role];

    if (!settings) {
      continue;
    }

    if (settings.enabled !== undefined && typeof settings.enabled !== "boolean") {
      throw new Error(`Invalid resolved config: agents.${role}.enabled must be a boolean`);
    }

    if (settings.model !== undefined && typeof settings.model !== "string") {
      throw new Error(`Invalid resolved config: agents.${role}.model must be a string`);
    }

    if (
      settings.skills !== undefined &&
      (!Array.isArray(settings.skills) || settings.skills.some((skill) => typeof skill !== "string"))
    ) {
      throw new Error(`Invalid resolved config: agents.${role}.skills must be a string array`);
    }
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAgentRole(value: unknown): value is AgentRole {
  return typeof value === "string" && agentRoles.includes(value as AgentRole);
}

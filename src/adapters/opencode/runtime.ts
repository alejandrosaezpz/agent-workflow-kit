import { type ResolvedConfig } from "../../core/config";
import {
  FileWorkflowContextStore,
  InMemoryWorkflowContextStore,
  getDefaultContextStorePath,
} from "../../core/context-store";
import {
  type SubagentRunResult,
  type WorkflowRunOptions,
  type WorkflowRunResult,
  type Orchestrator,
} from "../../core/orchestrator";
import { type AgentRole, agentRoles } from "../../core/contracts/agent";
import { isAbsolute, join } from "node:path";

const inMemoryStores = new Map<string, InMemoryWorkflowContextStore>();

export type OpenCodeSlashInvocation =
  | {
      kind: "workflow";
      query: string;
      rawCommand: string;
    }
  | {
      kind: "subagent";
      role: AgentRole;
      query: string;
      rawCommand: string;
    };

export type OpenCodeSlashExecutionResult = WorkflowRunResult | SubagentRunResult;

export interface OpenCodeSlashExecutionInput {
  command: string;
  cwd: string;
  resolvedConfig: ResolvedConfig;
  orchestrator: Orchestrator;
  workflowOptions?: WorkflowRunOptions;
}

export function parseOpenCodeSlashInvocation(
  command: string,
): OpenCodeSlashInvocation {
  const trimmed = command.trim();
  const match = /^\/([a-z-]+)\s*(.*)$/.exec(trimmed);

  if (!match) {
    throw new Error(`Invalid slash command format: ${command}`);
  }

  const slashName = match[1] ?? "";
  const query = match[2]?.trim() ?? "";

  if (!query) {
    throw new Error(`Slash command requires a query: /${slashName} <query>`);
  }

  if (slashName === "workflow") {
    return {
      kind: "workflow",
      query,
      rawCommand: trimmed,
    };
  }

  if (isAgentRole(slashName)) {
    return {
      kind: "subagent",
      role: slashName,
      query,
      rawCommand: trimmed,
    };
  }

  throw new Error(`Unsupported slash command: /${slashName}`);
}

export async function executeOpenCodeSlashCommand(
  input: OpenCodeSlashExecutionInput,
): Promise<OpenCodeSlashExecutionResult> {
  const invocation = parseOpenCodeSlashInvocation(input.command);
  const resolvedWorkflowOptions = resolveWorkflowOptions(
    input.resolvedConfig,
    input.cwd,
    input.workflowOptions,
  );

  if (invocation.kind === "workflow") {
    return input.orchestrator.runWorkflow(
      invocation.query,
      input.cwd,
      input.resolvedConfig,
      resolvedWorkflowOptions,
    );
  }

  const subagentOptions = resolvedWorkflowOptions?.context
    ? {
        context: {
          ...resolvedWorkflowOptions.context,
          maxHydratedArtifacts:
            input.resolvedConfig.config.context.rehydrateSubagentArtifacts,
        },
      }
    : undefined;

  return input.orchestrator.runSubagent(
    invocation.role,
    invocation.query,
    input.cwd,
    input.resolvedConfig,
    subagentOptions,
  );
}

function isAgentRole(value: string): value is AgentRole {
  return agentRoles.includes(value as AgentRole);
}

function resolveWorkflowOptions(
  resolvedConfig: ResolvedConfig,
  cwd: string,
  workflowOptions?: WorkflowRunOptions,
): WorkflowRunOptions | undefined {
  if (workflowOptions?.context) {
    return workflowOptions;
  }

  const contextSettings = resolvedConfig.config.context;

  if (!contextSettings.enabled) {
    return workflowOptions;
  }

  const contextStore =
    contextSettings.store.kind === "memory"
      ? getOrCreateInMemoryStore(cwd, contextSettings.retention)
      : new FileWorkflowContextStore(
          resolveStorePath(cwd, contextSettings.store.filePath),
          contextSettings.retention,
        );

  const contextOptions: NonNullable<WorkflowRunOptions["context"]> = {
    store: contextStore,
    maxHydratedArtifacts: contextSettings.rehydrateWorkflowArtifacts,
  };

  return {
    ...workflowOptions,
    context: contextOptions,
  };
}

function resolveStorePath(cwd: string, configuredPath?: string): string {
  if (!configuredPath) {
    return getDefaultContextStorePath(cwd);
  }

  if (isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return join(cwd, configuredPath);
}

function getOrCreateInMemoryStore(
  cwd: string,
  retention: ResolvedConfig["config"]["context"]["retention"],
): InMemoryWorkflowContextStore {
  const existing = inMemoryStores.get(cwd);

  if (existing) {
    return existing;
  }

  const store = new InMemoryWorkflowContextStore(retention);
  inMemoryStores.set(cwd, store);
  return store;
}

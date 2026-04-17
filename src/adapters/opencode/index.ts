import { type AgentRole, agentRoles } from "../../core/contracts/agent";

export type OpenCodeInstallScope = "global" | "project";

export type OpenCodeManagedFileType =
  | "config-fragment"
  | "skill"
  | "prompt-fragment"
  | "agent"
  | "command"
  | "example-config";

export interface OpenCodeManagedFile {
  type: OpenCodeManagedFileType;
  source: string;
  target: string;
  mergeStrategy: "copy" | "json-merge";
  required: boolean;
}

export interface OpenCodeWorkflowCommandContract {
  name: "/workflow";
  kind: "slash-command";
  description: string;
}

export interface OpenCodeSubagentCommandContract {
  name: `/${AgentRole}`;
  kind: "slash-command";
  role: AgentRole;
  description: string;
}

export interface OpenCodeSubagentCapability {
  role: AgentRole;
  directlyCallable: true;
  canAskUserQuestions: boolean;
  canProduceDurableArtifacts: boolean;
  canTriggerWriteOrientedWork: boolean;
  defaultContextBudget: "small" | "medium" | "large";
  expectedOutputShape: string;
}

export interface OpenCodeWorkflowAgentContract {
  name: "workflow";
  mode: "primary";
  description: string;
  visiblePhases: readonly [
    "explorer",
    "planner",
    "implementer",
    "reviewer",
    "tester",
  ];
}

export interface OpenCodeConfigInjectionContract {
  targetFile: string;
  mergeMode: "json-merge";
  preserveUserConfig: true;
}

export interface OpenCodeWorkflowAdapterContract {
  host: "opencode";
  status: "planned";
  installation: {
    supportedScopes: OpenCodeInstallScope[];
    defaultScope: "global";
    globalRoot: "~/.config/opencode";
    projectRoot: "./.opencode";
  };
  agent: OpenCodeWorkflowAgentContract;
  command: OpenCodeWorkflowCommandContract;
  directSubagentCommands: OpenCodeSubagentCommandContract[];
  directSubagentCapabilities: OpenCodeSubagentCapability[];
  configInjection: OpenCodeConfigInjectionContract;
  managedFiles: OpenCodeManagedFile[];
}

export const opencodeWorkflowAdapter: OpenCodeWorkflowAdapterContract = {
  host: "opencode",
  status: "planned",
  installation: {
    supportedScopes: ["global", "project"],
    defaultScope: "global",
    globalRoot: "~/.config/opencode",
    projectRoot: "./.opencode",
  },
  agent: {
    name: "workflow",
    mode: "primary",
    description:
      "Primary workflow agent that coordinates explorer, planner, implementer, reviewer, and tester.",
    visiblePhases: [
      "explorer",
      "planner",
      "implementer",
      "reviewer",
      "tester",
    ],
  },
  command: {
    name: "/workflow",
    kind: "slash-command",
    description:
      "Slash command that invokes the workflow agent with the current task or provided arguments.",
  },
  directSubagentCommands: agentRoles.map((role) => ({
    name: `/${role}`,
    kind: "slash-command",
    role,
    description: `Directly invokes the ${role} subagent with a focused query.`,
  })),
  directSubagentCapabilities: [
    {
      role: "explorer",
      directlyCallable: true,
      canAskUserQuestions: true,
      canProduceDurableArtifacts: true,
      canTriggerWriteOrientedWork: false,
      defaultContextBudget: "medium",
      expectedOutputShape: "exploration summary + discovered constraints",
    },
    {
      role: "planner",
      directlyCallable: true,
      canAskUserQuestions: true,
      canProduceDurableArtifacts: true,
      canTriggerWriteOrientedWork: false,
      defaultContextBudget: "medium",
      expectedOutputShape: "plan steps + tradeoffs + recommended path",
    },
    {
      role: "implementer",
      directlyCallable: true,
      canAskUserQuestions: false,
      canProduceDurableArtifacts: true,
      canTriggerWriteOrientedWork: true,
      defaultContextBudget: "small",
      expectedOutputShape: "implementation summary + touched areas",
    },
    {
      role: "reviewer",
      directlyCallable: true,
      canAskUserQuestions: false,
      canProduceDurableArtifacts: true,
      canTriggerWriteOrientedWork: false,
      defaultContextBudget: "small",
      expectedOutputShape: "review findings + risk assessment",
    },
    {
      role: "tester",
      directlyCallable: true,
      canAskUserQuestions: false,
      canProduceDurableArtifacts: true,
      canTriggerWriteOrientedWork: false,
      defaultContextBudget: "small",
      expectedOutputShape: "validation result + remaining gaps",
    },
  ],
  configInjection: {
    targetFile: "opencode.json",
    mergeMode: "json-merge",
    preserveUserConfig: true,
  },
  managedFiles: [
    {
      type: "config-fragment",
      source: "adapters/opencode/assets/opencode.workflow.json",
      target: "opencode.json",
      mergeStrategy: "json-merge",
      required: true,
    },
    {
      type: "prompt-fragment",
      source: "adapters/opencode/assets/workflow-instructions.md",
      target: "agent-workflow-kit/workflow-instructions.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "agent",
      source: "adapters/opencode/assets/workflow-agent.md",
      target: "agents/workflow.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/workflow-command.md",
      target: "commands/workflow.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/explorer-command.md",
      target: "commands/explorer.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/planner-command.md",
      target: "commands/planner.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/implementer-command.md",
      target: "commands/implementer.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/reviewer-command.md",
      target: "commands/reviewer.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "command",
      source: "adapters/opencode/assets/tester-command.md",
      target: "commands/tester.md",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "skill",
      source: "skills/agent-workflow-kit/",
      target: "skills/",
      mergeStrategy: "copy",
      required: true,
    },
    {
      type: "example-config",
      source: "adapters/opencode/assets/opencode.example.json",
      target: "opencode.example.json",
      mergeStrategy: "copy",
      required: false,
    },
  ],
};

export * from "./runtime";

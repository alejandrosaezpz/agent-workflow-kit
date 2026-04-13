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

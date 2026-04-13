export type OpenCodeInstallScope = "global" | "project";

export type OpenCodeManagedFileType =
  | "config-fragment"
  | "skill"
  | "prompt-fragment"
  | "example-config";

export interface OpenCodeManagedFile {
  type: OpenCodeManagedFileType;
  source: string;
  target: string;
  mergeStrategy: "copy" | "marker-injection" | "json-merge";
  required: boolean;
}

export interface OpenCodeWorkflowCommandContract {
  name: "workflow";
  kind: "host-command" | "slash-command";
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
  managedSectionKey: "agentWorkflowKit";
  markers: {
    start: string;
    end: string;
  };
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
  command: {
    name: "workflow",
    kind: "host-command",
    description:
      "Runs the visible agent workflow through explorer, planner, implementer, reviewer, and tester.",
    visiblePhases: [
      "explorer",
      "planner",
      "implementer",
      "reviewer",
      "tester",
    ],
  },
  configInjection: {
    targetFile: "opencode.json",
    mergeMode: "json-merge",
    preserveUserConfig: true,
    managedSectionKey: "agentWorkflowKit",
    markers: {
      start: "AGENT WORKFLOW KIT START",
      end: "AGENT WORKFLOW KIT END",
    },
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
      target: "opencode.json",
      mergeStrategy: "marker-injection",
      required: true,
    },
    {
      type: "skill",
      source: "skills/",
      target: "skills/agent-workflow-kit/",
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

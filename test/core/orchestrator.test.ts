import test from "node:test";
import assert from "node:assert/strict";

import { Orchestrator } from "../../src/core/orchestrator";
import { InMemoryWorkflowContextStore } from "../../src/core/context-store";
import { defaultAgents } from "../../src/skills/default-agents";
import { defaultConfig, type ResolvedConfig } from "../../src/core/config";
import { type AgentDefinition } from "../../src/core/contracts/agent";

function makeResolvedConfig(
  budgetOverrides?: Partial<ResolvedConfig["config"]["context"]["budget"]>,
): ResolvedConfig {
  const config = JSON.parse(JSON.stringify(defaultConfig)) as ResolvedConfig["config"];

  if (budgetOverrides) {
    config.context.budget = {
      ...config.context.budget,
      ...budgetOverrides,
    };
  }

  return {
    config,
    globalConfigPath: "/tmp/global-config.json",
    localConfigPath: "/tmp/local-config.json",
    loadedSources: ["/tmp/global-config.json"],
  };
}

test("runWorkflow emits clarification and approval events", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "add repository summary",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestClarification(request) {
          return `clarification for ${request.role}`;
        },
        async requestApproval() {
          return true;
        },
      },
    },
  );

  assert.equal(result.outcome.status, "completed");
  assert.equal(result.results.length, 5);

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("question_asked"));
  assert.ok(eventTypes.includes("approval_requested"));
  assert.ok(eventTypes.includes("approval_received"));
  assert.ok(eventTypes.includes("run_completed"));
});

test("runWorkflow cancels when checkpoint approval is denied", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "do risky action",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return false;
        },
      },
    },
  );

  assert.equal(result.outcome.status, "cancelled");
  assert.equal(result.workflowRun.status, "cancelled");

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("run_cancelled"));
});

test("runSubagent executes a focused role", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runSubagent(
    "planner",
    "plan migration",
    "/tmp/workspace",
    makeResolvedConfig(),
  );

  assert.equal(result.requestedRole, "planner");
  assert.equal(result.workflowRun.kind, "subagent");
  assert.equal(result.workflowRun.routing?.selectedRoles[0], "planner");
  assert.equal(result.outcome.status, "completed");
});

test("runWorkflow cancels when critical collaboration requires explicit override", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "ship with force-push",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestCriticalReview() {
          return {
            concern: "Requested path can break shared history.",
            recommendation: "Use a non-destructive path.",
            action: "require_override",
          };
        },
      },
    },
  );

  assert.equal(result.outcome.status, "cancelled");

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("approval_requested"));
  assert.ok(eventTypes.includes("run_cancelled"));
});

test("runWorkflow continues when explicit override is granted", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "ship with force-push",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestCriticalReview() {
          return {
            concern: "Requested path can break shared history.",
            recommendation: "Use a non-destructive path.",
            action: "require_override",
          };
        },
        async requestCriticalOverrideApproval() {
          return { approved: true, note: "User explicitly accepts the risk." };
        },
        async requestApproval() {
          return true;
        },
      },
    },
  );

  assert.equal(result.outcome.status, "completed");

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("approval_requested"));
  assert.ok(eventTypes.includes("approval_received"));
  assert.ok(eventTypes.includes("run_completed"));
});

test("runWorkflow rehydrates context from persisted durable artifacts", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const contextStore = new InMemoryWorkflowContextStore();

  await orchestrator.runSubagent(
    "explorer",
    "map initial structure",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      context: {
        store: contextStore,
      },
    },
  );

  const result = await orchestrator.runWorkflow(
    "plan follow-up change",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      context: {
        store: contextStore,
        maxHydratedArtifacts: 2,
      },
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("context_rehydrated"));
});

test("runWorkflow prefers summary-based context rehydration", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const contextStore = new InMemoryWorkflowContextStore();

  await orchestrator.runWorkflow(
    "initial run for summaries",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
      context: {
        store: contextStore,
      },
    },
  );

  const result = await orchestrator.runWorkflow(
    "follow-up run",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
      context: {
        store: contextStore,
      },
    },
  );

  const summaryRehydrateEvent = result.workflowRun.events.find(
    (event) =>
      event.type === "context_rehydrated" &&
      event.reason === "loaded cross-iteration summaries from prior runs",
  );

  assert.ok(Boolean(summaryRehydrateEvent));
});

test("runWorkflow can force artifact-based rehydration mode", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const contextStore = new InMemoryWorkflowContextStore();

  await orchestrator.runSubagent(
    "explorer",
    "seed artifact context",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      context: {
        store: contextStore,
      },
    },
  );

  const config = makeResolvedConfig();
  config.config.context.rehydrationMode = "artifact";

  const result = await orchestrator.runWorkflow(
    "follow-up using artifact mode",
    "/tmp/workspace",
    config,
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
      context: {
        store: contextStore,
      },
    },
  );

  const artifactRehydrateEvent = result.workflowRun.events.find(
    (event) =>
      event.type === "context_rehydrated" &&
      event.reason === "loaded durable artifacts from prior runs",
  );

  assert.ok(Boolean(artifactRehydrateEvent));
});

test("runWorkflow applies text budgets and emits budget events", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "x".repeat(300),
    "/tmp/workspace",
    makeResolvedConfig({
      maxWorkflowTaskChars: 120,
      maxClarificationChars: 40,
      maxRehydratedContextChars: 60,
      maxSubagentTaskChars: 100,
    }),
    {
      interaction: {
        async requestClarification() {
          return "y".repeat(140);
        },
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("context_budget_applied"));
  assert.ok(result.outcome.report.budgetApplications >= 1);
  assert.ok(result.outcome.report.estimatedTrimmedTokens >= 1);

  const firstTask = (result.results[0]?.details as { task?: string }).task ?? "";
  assert.ok(firstTask.includes("[truncated by budget]"));
});

test("runWorkflow emits budget warning when trimmed estimate exceeds threshold", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "a".repeat(420),
    "/tmp/workspace",
    makeResolvedConfig({
      maxWorkflowTaskChars: 80,
      maxClarificationChars: 30,
      maxRehydratedContextChars: 40,
      maxSubagentTaskChars: 80,
      maxEstimatedTrimmedTokensWarning: 5,
    }),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("context_budget_warning"));
  assert.ok(result.outcome.report.budgetWarnings >= 1);
});

test("runWorkflow includes post-run report with decision metrics", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "summarize status",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  assert.ok(Array.isArray(result.outcome.report.selectedRoles));
  assert.ok(typeof result.outcome.report.approvalsRequested === "number");
  assert.ok(result.outcome.report.estimatedFinalTaskTokens >= 1);
  assert.ok(result.outcome.explanation.includes("Selected roles:"));
  assert.ok(result.outcome.explanation.includes("Estimated final task tokens:"));
});

test("runWorkflow creates phase handoff artifacts and events", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "prepare a scoped refactor plan",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const handoffEvents = result.workflowRun.events.filter(
    (event) => event.type === "phase_handoff_created",
  );
  assert.equal(handoffEvents.length, 4);

  const handoffArtifacts = result.workflowRun.artifacts.filter((artifact) =>
    artifact.kind.includes("-handoff"),
  );
  assert.equal(handoffArtifacts.length, 4);
  assert.ok(handoffArtifacts.every((artifact) => artifact.durability === "ephemeral"));

  const handoffKinds = handoffArtifacts.map((artifact) => artifact.kind);
  assert.ok(handoffKinds.includes("explorer-to-planner-handoff"));
  assert.ok(handoffKinds.includes("planner-to-implementer-handoff"));
  assert.ok(handoffKinds.includes("implementer-to-reviewer-handoff"));
  assert.ok(handoffKinds.includes("reviewer-to-tester-handoff"));
});

test("runWorkflow applies budget to oversized phase handoff", async () => {
  const oversizedExplorerAgents: AgentDefinition[] = defaultAgents.map((agent) => {
    if (agent.role !== "explorer") {
      return agent;
    }

    return {
      ...agent,
      async run(_input, context) {
        return {
          role: "explorer" as const,
          summary: `oversized-${"x".repeat(6000)}`,
          details: {
            task: context.task,
          },
        };
      },
    };
  });
  const orchestrator = new Orchestrator(oversizedExplorerAgents);

  const result = await orchestrator.runWorkflow(
    "run oversized handoff path",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const handoffBudgetEvent = result.workflowRun.events.find(
    (event) =>
      event.type === "context_budget_applied" &&
      (event.payload as { field?: string }).field === "phase_handoff",
  );
  assert.ok(Boolean(handoffBudgetEvent));
  assert.ok(result.outcome.report.handoffBudgetApplications >= 1);
});

test("runWorkflow emits required handoff shape with degraded defaults", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runWorkflow(
    "validate handoff fallback shape",
    "/tmp/workspace",
    makeResolvedConfig(),
    {
      interaction: {
        async requestApproval() {
          return true;
        },
      },
    },
  );

  const explorerToPlanner = result.workflowRun.artifacts.find(
    (artifact) => artifact.kind === "explorer-to-planner-handoff",
  );
  assert.ok(explorerToPlanner);
  const payload = (explorerToPlanner?.data as { handoff?: string }).handoff;
  assert.ok(typeof payload === "string");

  const parsed = JSON.parse(payload ?? "{}") as {
    summary?: string;
    findings?: string[];
    constraints?: string[];
    relevantFiles?: string[];
    openQuestions?: string[];
  };

  assert.ok(typeof parsed.summary === "string");
  assert.ok(Array.isArray(parsed.findings));
  assert.ok(Array.isArray(parsed.constraints));
  assert.ok(Array.isArray(parsed.relevantFiles));
  assert.ok(Array.isArray(parsed.openQuestions));
});

test("runSubagent applies subagent task budget", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runSubagent(
    "reviewer",
    "z".repeat(220),
    "/tmp/workspace",
    makeResolvedConfig({
      maxSubagentTaskChars: 90,
      maxWorkflowTaskChars: 200,
      maxRehydratedContextChars: 70,
      maxClarificationChars: 30,
    }),
  );

  const taskText = (result.result.details as { task?: string }).task ?? "";
  assert.ok(taskText.includes("[truncated by budget]"));

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("context_budget_applied"));
});

test("runSubagent applies per-role task budget override", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const result = await orchestrator.runSubagent(
    "reviewer",
    "r".repeat(220),
    "/tmp/workspace",
    makeResolvedConfig({
      maxSubagentTaskChars: 300,
      perRoleTaskCharLimit: {
        reviewer: 70,
      },
    }),
  );

  const taskText = (result.result.details as { task?: string }).task ?? "";
  assert.ok(taskText.includes("[truncated by budget]"));

  const roleBudgetEvent = result.workflowRun.events.find(
    (event) =>
      event.type === "context_budget_applied" &&
      (event.payload as { field?: string }).field === "role_task",
  );
  assert.ok(Boolean(roleBudgetEvent));
});

test("runWorkflow returns failed outcome when a subagent throws", async () => {
  const failingAgents: AgentDefinition[] = defaultAgents.map((agent) => {
    if (agent.role !== "planner") {
      return agent;
    }

    return {
      ...agent,
      async run() {
        throw new Error("planner explosion");
      },
    };
  });
  const orchestrator = new Orchestrator(failingAgents);

  const result = await orchestrator.runWorkflow(
    "trigger planner failure",
    "/tmp/workspace",
    makeResolvedConfig(),
  );

  assert.equal(result.outcome.status, "failed");
  assert.equal(result.workflowRun.status, "failed");
  assert.ok(
    result.workflowRun.events.some(
      (event) =>
        event.type === "run_failed" &&
        (event.payload as { message?: string }).message === "planner explosion",
    ),
  );
});

test("runSubagent returns failed outcome when the subagent throws", async () => {
  const failingAgents: AgentDefinition[] = defaultAgents.map((agent) => {
    if (agent.role !== "reviewer") {
      return agent;
    }

    return {
      ...agent,
      async run() {
        throw new Error("reviewer failed hard");
      },
    };
  });
  const orchestrator = new Orchestrator(failingAgents);

  const result = await orchestrator.runSubagent(
    "reviewer",
    "trigger reviewer failure",
    "/tmp/workspace",
    makeResolvedConfig(),
  );

  assert.equal(result.outcome.status, "failed");
  assert.equal(result.workflowRun.status, "failed");
  assert.equal(result.result.role, "reviewer");
  assert.ok(
    result.workflowRun.events.some(
      (event) =>
        event.type === "run_failed" &&
        (event.payload as { message?: string }).message === "reviewer failed hard",
    ),
  );
});

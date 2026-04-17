import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  executeOpenCodeSlashCommand,
  parseOpenCodeSlashInvocation,
} from "../../../src/adapters/opencode/runtime";
import { Orchestrator } from "../../../src/core/orchestrator";
import { defaultAgents } from "../../../src/skills/default-agents";
import { defaultConfig, type ResolvedConfig } from "../../../src/core/config";

function makeResolvedConfig(): ResolvedConfig {
  return {
    config: defaultConfig,
    globalConfigPath: "/tmp/global-config.json",
    localConfigPath: "/tmp/local-config.json",
    loadedSources: ["/tmp/global-config.json"],
  };
}

function makeTempCwd(): string {
  return mkdtempSync(join(tmpdir(), "awk-runtime-test-"));
}

test("parseOpenCodeSlashInvocation parses workflow command", () => {
  const invocation = parseOpenCodeSlashInvocation("/workflow summarize repo");

  assert.equal(invocation.kind, "workflow");
  assert.equal(invocation.query, "summarize repo");
});

test("parseOpenCodeSlashInvocation parses subagent command", () => {
  const invocation = parseOpenCodeSlashInvocation("/planner prepare release plan");

  assert.equal(invocation.kind, "subagent");
  if (invocation.kind === "subagent") {
    assert.equal(invocation.role, "planner");
    assert.equal(invocation.query, "prepare release plan");
  }
});

test("parseOpenCodeSlashInvocation fails without query", () => {
  assert.throws(
    () => parseOpenCodeSlashInvocation("/explorer"),
    /requires a query/,
  );
});

test("executeOpenCodeSlashCommand routes to direct subagent execution", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const cwd = makeTempCwd();
  const result = await executeOpenCodeSlashCommand({
    command: "/reviewer check architecture risks",
    cwd,
    resolvedConfig: makeResolvedConfig(),
    orchestrator,
  });

  assert.equal(result.workflowRun.kind, "subagent");
  assert.equal(result.workflowRun.requestedRole, "reviewer");
});

test("executeOpenCodeSlashCommand forwards workflow options for critical override", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const cwd = makeTempCwd();
  const result = await executeOpenCodeSlashCommand({
    command: "/workflow deploy with risky path",
    cwd,
    resolvedConfig: makeResolvedConfig(),
    orchestrator,
    workflowOptions: {
      interaction: {
        async requestCriticalReview() {
          return {
            concern: "Requested deployment path is high risk.",
            action: "require_override",
          };
        },
      },
    },
  });

  assert.equal(result.workflowRun.kind, "workflow");
  assert.equal(result.outcome.status, "cancelled");
});

test("executeOpenCodeSlashCommand auto-applies config context rehydration", async () => {
  const orchestrator = new Orchestrator(defaultAgents);
  const cwd = makeTempCwd();

  await executeOpenCodeSlashCommand({
    command: "/explorer map repository first",
    cwd,
    resolvedConfig: makeResolvedConfig(),
    orchestrator,
  });

  const result = await executeOpenCodeSlashCommand({
    command: "/workflow prepare second pass",
    cwd,
    resolvedConfig: makeResolvedConfig(),
    orchestrator,
  });

  const eventTypes = result.workflowRun.events.map((event) => event.type);
  assert.ok(eventTypes.includes("context_rehydrated"));
});

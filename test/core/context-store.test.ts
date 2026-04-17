import test from "node:test";
import assert from "node:assert/strict";

import { InMemoryWorkflowContextStore } from "../../src/core/context-store";
import { type WorkflowRun } from "../../src/core/contracts/workflow";

function makeRun(runId: string, cwd: string, artifactCount: number): WorkflowRun {
  return {
    id: runId,
    kind: "workflow",
    task: "sample task",
    cwd,
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    artifacts: Array.from({ length: artifactCount }, (_, index) => ({
      id: `${runId}-artifact-${index}`,
      kind: "explorer-result",
      producerRole: "explorer",
      summary: `artifact ${index}`,
      createdAt: new Date().toISOString(),
      durability: "durable",
      data: { index },
    })),
    events: [],
  };
}

test("InMemoryWorkflowContextStore returns bounded recent artifacts", () => {
  const store = new InMemoryWorkflowContextStore({
    maxRuns: 10,
    maxDurableArtifactsPerRun: 3,
  });

  store.saveRun(makeRun("run-1", "/tmp/workspace", 2));
  store.saveRun(makeRun("run-2", "/tmp/workspace", 4));

  const artifacts = store.loadRecentArtifacts({
    cwd: "/tmp/workspace",
    task: "follow-up",
    maxArtifacts: 3,
  });

  assert.equal(artifacts.length, 3);
  assert.equal(artifacts[0]?.id.startsWith("run-2"), true);
});

test("InMemoryWorkflowContextStore prunes old runs by policy", () => {
  const store = new InMemoryWorkflowContextStore({
    maxRuns: 1,
    maxDurableArtifactsPerRun: 2,
  });

  store.saveRun(makeRun("run-1", "/tmp/workspace", 2));
  store.saveRun(makeRun("run-2", "/tmp/workspace", 2));

  const artifacts = store.loadRecentArtifacts({
    cwd: "/tmp/workspace",
    task: "follow-up",
    maxArtifacts: 10,
  });

  assert.ok(artifacts.every((artifact) => artifact.id.startsWith("run-2")));
});

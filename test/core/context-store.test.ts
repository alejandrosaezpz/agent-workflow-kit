import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FileWorkflowContextStore,
  getDefaultContextStorePath,
  InMemoryWorkflowContextStore,
} from "../../src/core/context-store";
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

function withTempDir(run: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), "awk-context-store-test-"));

  try {
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("FileWorkflowContextStore persists and rehydrates artifacts", () => {
  withTempDir((cwd) => {
    const filePath = join(cwd, ".agent-workflow-kit", "context", "runs.json");
    const store = new FileWorkflowContextStore(filePath, {
      maxRuns: 5,
      maxDurableArtifactsPerRun: 2,
      maxEventsPerRun: 3,
    });

    store.saveRun(makeRun("run-1", cwd, 3));
    store.saveRun(makeRun("run-2", cwd, 4));

    assert.equal(existsSync(filePath), true);

    const artifacts = store.loadRecentArtifacts({
      cwd,
      task: "follow-up",
      maxArtifacts: 3,
    });

    assert.equal(artifacts.length, 3);
    assert.ok(artifacts[0]?.id.startsWith("run-2"));
    assert.equal(artifacts.every((artifact) => artifact.data === undefined), true);
  });
});

test("FileWorkflowContextStore prunes old runs by policy", () => {
  withTempDir((cwd) => {
    const filePath = join(cwd, ".agent-workflow-kit", "context", "runs.json");
    const store = new FileWorkflowContextStore(filePath, {
      maxRuns: 1,
      maxDurableArtifactsPerRun: 2,
      maxEventsPerRun: 2,
    });

    store.saveRun(makeRun("run-1", cwd, 2));
    store.saveRun(makeRun("run-2", cwd, 2));

    const artifacts = store.loadRecentArtifacts({
      cwd,
      task: "follow-up",
      maxArtifacts: 10,
    });

    assert.ok(artifacts.every((artifact) => artifact.id.startsWith("run-2")));
  });
});

test("FileWorkflowContextStore throws on invalid JSON file", () => {
  withTempDir((cwd) => {
    const filePath = join(cwd, ".agent-workflow-kit", "context", "runs.json");
    const parentDir = join(cwd, ".agent-workflow-kit", "context");
    mkdirSync(parentDir, { recursive: true });
    writeFileSync(filePath, "{broken", "utf8");

    const store = new FileWorkflowContextStore(filePath);

    assert.throws(
      () =>
        store.loadRecentArtifacts({
          cwd,
          task: "follow-up",
          maxArtifacts: 2,
        }),
      /Invalid workflow context store file/,
    );
  });
});

test("getDefaultContextStorePath resolves under .agent-workflow-kit", () => {
  const cwd = "/tmp/workspace";
  const resolved = getDefaultContextStorePath(cwd);
  assert.equal(resolved, join(cwd, ".agent-workflow-kit", "context", "runs.json"));
});

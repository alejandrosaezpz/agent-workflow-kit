import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveConfig } from "../../src/core/config";

function withTempDir(run: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), "awk-config-test-"));

  try {
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("resolveConfig rejects invalid JSON in local config", () => {
  withTempDir((cwd) => {
    writeFileSync(join(cwd, ".agent-workflow-kit.json"), "{invalid", "utf8");

    assert.throws(() => resolveConfig(cwd), /Invalid JSON in config file/);
  });
});

test("resolveConfig rejects invalid workflow roles in local config", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, ".agent-workflow-kit.json"),
      JSON.stringify({
        workflow: {
          enabledAgents: ["explorer", "invalid-role"],
        },
      }),
      "utf8",
    );

    assert.throws(
      () => resolveConfig(cwd),
      /Invalid 'workflow.enabledAgents' in config file/,
    );
  });
});

test("resolveConfig rejects invalid budget values in local config", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, ".agent-workflow-kit.json"),
      JSON.stringify({
        context: {
          budget: {
            maxWorkflowTaskChars: -10,
          },
        },
      }),
      "utf8",
    );

    assert.throws(
      () => resolveConfig(cwd),
      /Invalid resolved config: 'context.budget.maxWorkflowTaskChars' must be > 0/,
    );
  });
});

test("resolveConfig rejects invalid phase handoff budget values", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, ".agent-workflow-kit.json"),
      JSON.stringify({
        context: {
          budget: {
            phaseHandoffCharLimit: {
              explorerToPlanner: 0,
            },
          },
        },
      }),
      "utf8",
    );

    assert.throws(
      () => resolveConfig(cwd),
      /Invalid resolved config: invalid phase handoff budget for 'explorerToPlanner'/,
    );
  });
});

test("resolveConfig rejects invalid maxSummaries retention value", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, ".agent-workflow-kit.json"),
      JSON.stringify({
        context: {
          retention: {
            maxSummaries: 0,
          },
        },
      }),
      "utf8",
    );

    assert.throws(
      () => resolveConfig(cwd),
      /Invalid resolved config: 'context.retention.maxSummaries' must be > 0/,
    );
  });
});

test("resolveConfig rejects invalid rehydration mode", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, ".agent-workflow-kit.json"),
      JSON.stringify({
        context: {
          rehydrationMode: "unknown-mode",
        },
      }),
      "utf8",
    );

    assert.throws(
      () => resolveConfig(cwd),
      /Invalid 'context.rehydrationMode' in config file/,
    );
  });
});

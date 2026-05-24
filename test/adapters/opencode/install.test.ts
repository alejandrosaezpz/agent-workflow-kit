import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installOpenCodeAdapter } from "../../../src/adapters/opencode/install";

function withTempDir(run: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), "awk-install-test-"));

  try {
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

test("installOpenCodeAdapter installs assets and merges project config", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, "opencode.json"),
      JSON.stringify({ custom: { keep: true } }, null, 2),
      "utf8",
    );

    const result = installOpenCodeAdapter({
      scope: "project",
      cwd,
      packageRoot: process.cwd(),
    });

    const instructionsPath = join(
      cwd,
      ".opencode",
      "agent-workflow-kit",
      "workflow-instructions.md",
    );
    const workflowAgentPath = join(cwd, ".opencode", "agents", "workflow.md");
    const explorerAgentPath = join(cwd, ".opencode", "agents", "explorer.md");
    const plannerAgentPath = join(cwd, ".opencode", "agents", "planner.md");
    const implementerAgentPath = join(cwd, ".opencode", "agents", "implementer.md");
    const reviewerAgentPath = join(cwd, ".opencode", "agents", "reviewer.md");
    const testerAgentPath = join(cwd, ".opencode", "agents", "tester.md");

    assert.equal(result.scope, "project");
    assert.equal(result.configPath, join(cwd, "opencode.json"));
    assert.ok(existsSync(instructionsPath));
    assert.ok(existsSync(workflowAgentPath));
    assert.ok(existsSync(explorerAgentPath));
    assert.ok(existsSync(plannerAgentPath));
    assert.ok(existsSync(implementerAgentPath));
    assert.ok(existsSync(reviewerAgentPath));
    assert.ok(existsSync(testerAgentPath));

    const merged = readJson(result.configPath);
    assert.deepEqual(merged.custom, { keep: true });
    assert.ok((merged.agent as { workflow?: unknown }).workflow);
    assert.ok((merged.agent as { explorer?: unknown }).explorer);
    assert.ok((merged.agent as { planner?: unknown }).planner);
    assert.ok((merged.agent as { implementer?: unknown }).implementer);
    assert.ok((merged.agent as { reviewer?: unknown }).reviewer);
    assert.ok((merged.agent as { tester?: unknown }).tester);
    assert.ok((merged.command as { workflow?: unknown }).workflow);

    const command = merged.command as Record<string, { agent?: string }>;
    assert.equal(command.explorer?.agent, "explorer");
    assert.equal(command.planner?.agent, "planner");
    assert.equal(command.implementer?.agent, "implementer");
    assert.equal(command.reviewer?.agent, "reviewer");
    assert.equal(command.tester?.agent, "tester");

    const instructions = merged.instructions as unknown[];
    assert.ok(Array.isArray(instructions));
    assert.ok(instructions.includes(".opencode/agent-workflow-kit/workflow-instructions.md"));
  });
});

test("installOpenCodeAdapter is idempotent and does not duplicate instructions", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, "opencode.json"),
      JSON.stringify(
        {
          custom: { keep: true },
          instructions: [".opencode/agent-workflow-kit/workflow-instructions.md"],
          agentWorkflowKit: { legacy: true },
        },
        null,
        2,
      ),
      "utf8",
    );

    installOpenCodeAdapter({
      scope: "project",
      cwd,
      packageRoot: process.cwd(),
    });
    installOpenCodeAdapter({
      scope: "project",
      cwd,
      packageRoot: process.cwd(),
    });

    const merged = readJson(join(cwd, "opencode.json"));
    const instructions = merged.instructions as string[];

    assert.equal(
      instructions.filter(
        (entry) => entry === ".opencode/agent-workflow-kit/workflow-instructions.md",
      ).length,
      1,
    );
    assert.equal("agentWorkflowKit" in merged, false);
    assert.deepEqual(merged.custom, { keep: true });
  });
});

test("installOpenCodeAdapter rejects invalid instructions type", () => {
  withTempDir((cwd) => {
    writeFileSync(
      join(cwd, "opencode.json"),
      JSON.stringify({ instructions: ["ok", 123] }, null, 2),
      "utf8",
    );

    assert.throws(
      () =>
        installOpenCodeAdapter({
          scope: "project",
          cwd,
          packageRoot: process.cwd(),
        }),
      /Invalid 'instructions' value: expected an array of strings/,
    );
  });
});

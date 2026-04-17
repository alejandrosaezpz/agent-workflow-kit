import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { type WorkflowArtifact, type WorkflowRun } from "./contracts/workflow";

export interface ContextLoadQuery {
  cwd: string;
  task: string;
  maxArtifacts: number;
}

export interface WorkflowContextStore {
  loadRecentArtifacts(query: ContextLoadQuery): Promise<WorkflowArtifact[]> | WorkflowArtifact[];
  saveRun(run: WorkflowRun): Promise<void> | void;
}

export interface ContextStorePolicy {
  maxRuns: number;
  maxDurableArtifactsPerRun: number;
  maxEventsPerRun: number;
}

const defaultContextStorePolicy: ContextStorePolicy = {
  maxRuns: 40,
  maxDurableArtifactsPerRun: 6,
  maxEventsPerRun: 80,
};

export class InMemoryWorkflowContextStore implements WorkflowContextStore {
  private readonly runs: WorkflowRun[] = [];
  private readonly policy: ContextStorePolicy;

  constructor(policy?: Partial<ContextStorePolicy>) {
    this.policy = {
      ...defaultContextStorePolicy,
      ...policy,
    };
  }

  loadRecentArtifacts(query: ContextLoadQuery): WorkflowArtifact[] {
    const artifacts: WorkflowArtifact[] = [];

    for (const run of [...this.runs].reverse()) {
      if (run.cwd !== query.cwd) {
        continue;
      }

      for (const artifact of [...run.artifacts].reverse()) {
        if (artifact.durability !== "durable") {
          continue;
        }

        artifacts.push(artifact);

        if (artifacts.length >= query.maxArtifacts) {
          return artifacts;
        }
      }
    }

    return artifacts;
  }

  saveRun(run: WorkflowRun): void {
    this.runs.push(compactRunForPersistence(run, this.policy));
    pruneRunList(this.runs, this.policy.maxRuns);
  }
}

export class FileWorkflowContextStore implements WorkflowContextStore {
  private readonly filePath: string;
  private readonly policy: ContextStorePolicy;

  constructor(filePath: string, policy?: Partial<ContextStorePolicy>) {
    this.filePath = filePath;
    this.policy = {
      ...defaultContextStorePolicy,
      ...policy,
    };
  }

  loadRecentArtifacts(query: ContextLoadQuery): WorkflowArtifact[] {
    const runs = this.readRuns();
    const artifacts: WorkflowArtifact[] = [];

    for (const run of [...runs].reverse()) {
      if (run.cwd !== query.cwd) {
        continue;
      }

      for (const artifact of [...run.artifacts].reverse()) {
        if (artifact.durability !== "durable") {
          continue;
        }

        artifacts.push(artifact);

        if (artifacts.length >= query.maxArtifacts) {
          return artifacts;
        }
      }
    }

    return artifacts;
  }

  saveRun(run: WorkflowRun): void {
    const runs = this.readRuns();
    runs.push(compactRunForPersistence(run, this.policy));
    pruneRunList(runs, this.policy.maxRuns);
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(runs, null, 2) + "\n", "utf8");
  }

  private readRuns(): WorkflowRun[] {
    if (!existsSync(this.filePath)) {
      return [];
    }

    try {
      return JSON.parse(readFileSync(this.filePath, "utf8")) as WorkflowRun[];
    } catch {
      throw new Error(`Invalid workflow context store file: ${this.filePath}`);
    }
  }
}

export function getDefaultContextStorePath(cwd: string): string {
  return join(cwd, ".agent-workflow-kit", "context", "runs.json");
}

function compactRunForPersistence(
  run: WorkflowRun,
  policy: ContextStorePolicy,
): WorkflowRun {
  const durableArtifacts = run.artifacts
    .filter((artifact) => artifact.durability === "durable")
    .slice(-policy.maxDurableArtifactsPerRun)
    .map((artifact) => ({
      ...artifact,
      data: undefined,
    }));

  const compactEvents = run.events.slice(-policy.maxEventsPerRun);

  return {
    ...run,
    artifacts: durableArtifacts,
    events: compactEvents,
  };
}

function pruneRunList(runs: WorkflowRun[], maxRuns: number): void {
  if (runs.length <= maxRuns) {
    return;
  }

  const overflow = runs.length - maxRuns;
  runs.splice(0, overflow);
}

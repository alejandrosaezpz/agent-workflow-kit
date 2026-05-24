import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  type CrossIterationSummary,
  type WorkflowArtifact,
  type WorkflowRun,
} from "./contracts/workflow";

export interface ContextLoadQuery {
  cwd: string;
  task: string;
  maxArtifacts: number;
}

export interface ContextSummaryQuery {
  cwd: string;
  task: string;
  maxSummaries: number;
}

export interface WorkflowContextStore {
  loadRecentArtifacts(query: ContextLoadQuery): Promise<WorkflowArtifact[]> | WorkflowArtifact[];
  loadRecentSummaries(
    query: ContextSummaryQuery,
  ): Promise<CrossIterationSummary[]> | CrossIterationSummary[];
  saveRun(run: WorkflowRun): Promise<void> | void;
}

export interface ContextStorePolicy {
  maxRuns: number;
  maxSummaries: number;
  maxDurableArtifactsPerRun: number;
  maxEventsPerRun: number;
}

const defaultContextStorePolicy: ContextStorePolicy = {
  maxRuns: 40,
  maxSummaries: 5,
  maxDurableArtifactsPerRun: 6,
  maxEventsPerRun: 80,
};

export class InMemoryWorkflowContextStore implements WorkflowContextStore {
  private readonly runs: WorkflowRun[] = [];
  private readonly summaries: CrossIterationSummary[] = [];
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

  loadRecentSummaries(query: ContextSummaryQuery): CrossIterationSummary[] {
    const summaries: CrossIterationSummary[] = [];

    for (const summary of [...this.summaries].reverse()) {
      const run = this.runs.find((candidate) => candidate.id === summary.runId);

      if (!run || run.cwd !== query.cwd) {
        continue;
      }

      summaries.push(summary);

      if (summaries.length >= query.maxSummaries) {
        return summaries;
      }
    }

    return summaries;
  }

  saveRun(run: WorkflowRun): void {
    const compactRun = compactRunForPersistence(run, this.policy);
    this.runs.push(compactRun);
    this.summaries.push(buildCrossIterationSummary(compactRun));
    pruneRunList(this.runs, this.policy.maxRuns);
    pruneSummaryList(this.summaries, this.policy.maxSummaries);
  }
}

export class FileWorkflowContextStore implements WorkflowContextStore {
  private readonly filePath: string;
  private readonly summaryFilePath: string;
  private readonly policy: ContextStorePolicy;

  constructor(filePath: string, policy?: Partial<ContextStorePolicy>) {
    this.filePath = filePath;
    this.summaryFilePath = join(dirname(filePath), "summaries.json");
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

  loadRecentSummaries(query: ContextSummaryQuery): CrossIterationSummary[] {
    const runs = this.readRuns();
    const persistedSummaries = this.readSummaries();
    const summaries: CrossIterationSummary[] = [];

    for (const summary of [...persistedSummaries].reverse()) {
      const run = runs.find((candidate) => candidate.id === summary.runId);

      if (!run || run.cwd !== query.cwd) {
        continue;
      }

      summaries.push(summary);

      if (summaries.length >= query.maxSummaries) {
        return summaries;
      }
    }

    return summaries;
  }

  saveRun(run: WorkflowRun): void {
    const runs = this.readRuns();
    const summaries = this.readSummaries();
    const compactRun = compactRunForPersistence(run, this.policy);
    runs.push(compactRun);
    summaries.push(buildCrossIterationSummary(compactRun));
    pruneRunList(runs, this.policy.maxRuns);
    pruneSummaryList(summaries, this.policy.maxSummaries);
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(runs, null, 2) + "\n", "utf8");
    writeFileSync(this.summaryFilePath, JSON.stringify(summaries, null, 2) + "\n", "utf8");
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

  private readSummaries(): CrossIterationSummary[] {
    if (!existsSync(this.summaryFilePath)) {
      return [];
    }

    try {
      return JSON.parse(readFileSync(this.summaryFilePath, "utf8")) as CrossIterationSummary[];
    } catch {
      throw new Error(`Invalid workflow context summary file: ${this.summaryFilePath}`);
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

function pruneSummaryList(summaries: CrossIterationSummary[], maxSummaries: number): void {
  if (summaries.length <= maxSummaries) {
    return;
  }

  const overflow = summaries.length - maxSummaries;
  summaries.splice(0, overflow);
}

function buildCrossIterationSummary(run: WorkflowRun): CrossIterationSummary {
  const phasesCompleted = run.events
    .filter((event) => event.type === "subagent_completed")
    .map((event) => (event.payload as { role?: string }).role)
    .filter((role): role is CrossIterationSummary["phasesCompleted"][number] =>
      role === "explorer" ||
      role === "planner" ||
      role === "implementer" ||
      role === "reviewer" ||
      role === "tester",
    );

  const keyFindings = run.artifacts
    .filter((artifact) => artifact.durability === "durable")
    .slice(-3)
    .map((artifact) => artifact.summary);

  const artifactsProduced = run.artifacts.map((artifact) => artifact.id).slice(-6);

  const finalTaskChars = (() => {
    const runCompletedEvent = [...run.events]
      .reverse()
      .find((event) => event.type === "run_completed");
    const chars = (runCompletedEvent?.payload as { finalTaskChars?: number } | undefined)
      ?.finalTaskChars;
    return typeof chars === "number" ? chars : run.task.length;
  })();

  const estimatedTrimmedTokens = run.events
    .filter((event) => event.type === "context_budget_applied")
    .reduce((count, event) => {
      const payload = event.payload as { originalChars?: number; keptChars?: number };
      const original = payload.originalChars ?? 0;
      const kept = payload.keptChars ?? 0;
      const trimmedChars = Math.max(0, original - kept);
      return count + estimateTokens(trimmedChars);
    }, 0);

  const blockerEvent = run.events.find((event) => event.type === "run_failed");
  const blockersOrGaps = blockerEvent?.reason ? [blockerEvent.reason] : [];

  return {
    runId: run.id,
    task: run.task,
    timestamp: run.updatedAt,
    phasesCompleted,
    outcome: run.status as CrossIterationSummary["outcome"],
    keyFindings,
    artifactsProduced,
    decisionsMade: [
      {
        what: "workflow_status",
        why: run.status,
      },
    ],
    blockersOrGaps,
    tokenUsage: {
      estimatedFinalTaskTokens: estimateTokens(finalTaskChars),
      estimatedTrimmedTokens,
    },
  };
}

function estimateTokens(chars: number): number {
  return Math.max(1, Math.ceil(chars / 4));
}

import {
  type AgentDefinition,
  type AgentResult,
  type AgentRole,
} from "./contracts/agent";
import { type ResolvedConfig } from "./config";
import { type WorkflowContextStore } from "./context-store";
import {
  type RunReport,
  type RoutingDecision,
  type RunOutcome,
  type WorkflowArtifact,
  type WorkflowEvent,
  type WorkflowRun,
} from "./contracts/workflow";

export interface WorkflowRunResult {
  runId: string;
  task: string;
  cwd: string;
  configSources: string[];
  results: AgentResult[];
  workflowRun: WorkflowRun;
  outcome: RunOutcome;
}

export interface SubagentRunResult {
  runId: string;
  task: string;
  cwd: string;
  requestedRole: AgentRole;
  configSources: string[];
  result: AgentResult;
  workflowRun: WorkflowRun;
  outcome: RunOutcome;
}

export interface ClarificationRequest {
  role: AgentRole;
  task: string;
  cwd: string;
  previousResults: AgentResult[];
}

export interface ApprovalRequest {
  role: AgentRole;
  task: string;
  cwd: string;
  lastResult: AgentResult;
  reason: string;
}

export interface CriticalReviewRequest {
  task: string;
  selectedRoles: AgentRole[];
  skippedRoles: AgentRole[];
}

export interface CriticalReviewResult {
  concern: string;
  recommendation?: string;
  action?: "continue" | "redirect" | "require_override" | "cancel";
  redirectedTask?: string;
}

export interface CriticalOverrideApprovalRequest {
  task: string;
  cwd: string;
  concern: string;
  recommendation?: string;
}

export interface WorkflowInteractionHandlers {
  requestClarification?: (
    request: ClarificationRequest,
  ) => Promise<string | undefined>;
  requestApproval?: (
    request: ApprovalRequest,
  ) => Promise<boolean | { approved: boolean; note?: string }>;
  requestCriticalReview?: (
    request: CriticalReviewRequest,
  ) => Promise<CriticalReviewResult | undefined>;
  requestCriticalOverrideApproval?: (
    request: CriticalOverrideApprovalRequest,
  ) => Promise<boolean | { approved: boolean; note?: string }>;
}

export interface WorkflowRunOptions {
  checkpointRoles?: AgentRole[];
  clarificationRoles?: AgentRole[];
  interaction?: WorkflowInteractionHandlers;
  context?: {
    store: WorkflowContextStore;
    maxHydratedArtifacts?: number;
  };
}

export interface SubagentRunOptions {
  context?: {
    store: WorkflowContextStore;
    maxHydratedArtifacts?: number;
  };
}

interface BudgetWarningState {
  raised: boolean;
  threshold: number;
}

export class Orchestrator {
  private readonly agentsByRole: Map<AgentRole, AgentDefinition>;

  constructor(agents: AgentDefinition[]) {
    this.agentsByRole = new Map(agents.map((agent) => [agent.role, agent]));
  }

  async run(
    task: string,
    cwd: string,
    resolvedConfig: ResolvedConfig,
  ): Promise<WorkflowRunResult> {
    return this.runWorkflow(task, cwd, resolvedConfig);
  }

  async runWorkflow(
    task: string,
    cwd: string,
    resolvedConfig: ResolvedConfig,
    options: WorkflowRunOptions = {},
  ): Promise<WorkflowRunResult> {
    const results: AgentResult[] = [];
    const runId = this.createId("run");
    const startedAt = this.nowIso();
    const events: WorkflowEvent[] = [];
    const artifacts: WorkflowArtifact[] = [];
    const checkpointRoles = options.checkpointRoles ?? ["explorer", "planner"];
    const clarificationRoles = options.clarificationRoles ?? [
      "explorer",
      "planner",
    ];
    const contextStore = options.context?.store;
    const maxHydratedArtifacts = options.context?.maxHydratedArtifacts ?? 3;
    const budget = resolvedConfig.config.context.budget;
    const budgetWarningState: BudgetWarningState = {
      raised: false,
      threshold: budget.maxEstimatedTrimmedTokensWarning,
    };
    let activeStatus: WorkflowRun["status"] = "routing";
    let effectiveTask = this.applyTextBudget({
      runId,
      events,
      field: "workflow_task",
      maxChars: budget.maxWorkflowTaskChars,
      value: task,
      warningState: budgetWarningState,
    });

    if (contextStore) {
      const hydratedArtifacts = await contextStore.loadRecentArtifacts({
        cwd,
        task,
        maxArtifacts: maxHydratedArtifacts,
      });

      if (hydratedArtifacts.length > 0) {
        this.pushEvent(events, {
          runId,
          type: "context_rehydrated",
          reason: "loaded durable artifacts from prior runs",
          contextRef: {
            artifactIds: hydratedArtifacts.map((artifact) => artifact.id),
          },
          payload: {
            artifactCount: hydratedArtifacts.length,
          },
        });

        const rehydratedSummaries = hydratedArtifacts
          .map((artifact) => `- [${artifact.producerRole}] ${artifact.summary}`)
          .join("\n");

        const boundedSummaries = this.applyTextBudget({
          runId,
          events,
          field: "rehydrated_context",
          maxChars: budget.maxRehydratedContextChars,
          value: rehydratedSummaries,
          warningState: budgetWarningState,
        });

        effectiveTask = `${effectiveTask}\n\nRelevant prior context:\n${boundedSummaries}`;
        effectiveTask = this.applyTextBudget({
          runId,
          events,
          field: "workflow_task",
          maxChars: budget.maxWorkflowTaskChars,
          value: effectiveTask,
          warningState: budgetWarningState,
        });
      }
    }

    const selectedRoles = resolvedConfig.config.workflow.enabledAgents.filter(
      (role) => resolvedConfig.config.agents[role]?.enabled !== false,
    );
    const skippedRoles = resolvedConfig.config.workflow.enabledAgents.filter(
      (role) => resolvedConfig.config.agents[role]?.enabled === false,
    );

    const routing: RoutingDecision = {
      selectedRoles,
      skippedRoles,
      rationale:
        "Selected enabled workflow agents according to resolved config order.",
    };

    this.pushEvent(events, {
      runId,
      type: "run_created",
      reason: "workflow run initialized",
      payload: {
        kind: "workflow",
        task,
      },
    });
    this.pushEvent(events, {
      runId,
      type: "routing_decided",
      reason: routing.rationale,
      payload: {
        selectedRoles: routing.selectedRoles,
        skippedRoles: routing.skippedRoles,
      },
    });

    if (options.interaction?.requestCriticalReview) {
      const criticalReview = await options.interaction.requestCriticalReview({
        task,
        selectedRoles,
        skippedRoles,
      });

      if (criticalReview) {
        const action = criticalReview.action ?? "continue";
        this.pushEvent(events, {
          runId,
          type: "question_asked",
          reason: "critical collaboration concern raised",
          payload: {
            concern: criticalReview.concern,
            recommendation: criticalReview.recommendation,
            action,
          },
        });

        if (action === "redirect") {
          if (criticalReview.redirectedTask?.trim()) {
            effectiveTask = this.applyTextBudget({
              runId,
              events,
              field: "workflow_task",
              maxChars: budget.maxWorkflowTaskChars,
              value: criticalReview.redirectedTask.trim(),
              warningState: budgetWarningState,
            });
          } else if (criticalReview.recommendation?.trim()) {
            const boundedRecommendation = this.applyTextBudget({
              runId,
              events,
              field: "clarification",
              maxChars: budget.maxClarificationChars,
              value: criticalReview.recommendation.trim(),
              warningState: budgetWarningState,
            });
            effectiveTask = `${effectiveTask}\n\nOrchestrator recommendation: ${boundedRecommendation}`;
            effectiveTask = this.applyTextBudget({
              runId,
              events,
              field: "workflow_task",
              maxChars: budget.maxWorkflowTaskChars,
              value: effectiveTask,
              warningState: budgetWarningState,
            });
          }
        }

        if (action === "cancel") {
          activeStatus = "cancelled";
          this.pushEvent(events, {
            runId,
            type: "run_cancelled",
            reason: "workflow cancelled by critical collaboration guardrail",
            payload: {
              concern: criticalReview.concern,
              recommendation: criticalReview.recommendation,
            },
          });

          return this.finalizeWorkflowRunResult(
            this.buildWorkflowRunResult({
              runId,
              task,
              cwd,
              configSources: resolvedConfig.loadedSources,
              status: activeStatus,
              startedAt,
              routing,
              artifacts,
              events,
              results,
              summary: "Workflow cancelled by critical collaboration guardrail.",
              explanation:
                "The orchestrator detected a weak or risky path and cancelled execution according to the critical-collaboration policy.",
            }),
            contextStore,
          );
        }

        if (action === "require_override") {
          activeStatus = "needs_approval";
          this.pushEvent(events, {
            runId,
            type: "approval_requested",
            reason: "explicit override required by critical collaboration policy",
            payload: {
              concern: criticalReview.concern,
              recommendation: criticalReview.recommendation,
            },
          });

          const approval = options.interaction.requestCriticalOverrideApproval
            ? await options.interaction.requestCriticalOverrideApproval({
                task: effectiveTask,
                cwd,
                concern: criticalReview.concern,
                ...(criticalReview.recommendation
                  ? { recommendation: criticalReview.recommendation }
                  : {}),
              })
            : false;

          const approved =
            typeof approval === "boolean" ? approval : approval.approved;
          const note =
            typeof approval === "boolean"
              ? "no explicit user override provided"
              : approval.note;

          if (!approved) {
            activeStatus = "cancelled";
            this.pushEvent(events, {
              runId,
              type: "run_cancelled",
              reason:
                "workflow cancelled because explicit override was not granted",
              payload: {
                concern: criticalReview.concern,
                recommendation: criticalReview.recommendation,
                note,
              },
            });

            return this.finalizeWorkflowRunResult(
              this.buildWorkflowRunResult({
                runId,
                task,
                cwd,
                configSources: resolvedConfig.loadedSources,
                status: activeStatus,
                startedAt,
                routing,
                artifacts,
                events,
                results,
                summary:
                  "Workflow cancelled because explicit override was not granted.",
                explanation:
                  "The orchestrator challenged the requested direction and required an explicit override, which was not provided.",
              }),
              contextStore,
            );
          }

          this.pushEvent(events, {
            runId,
            type: "approval_received",
            reason: "explicit override granted for challenged path",
            payload: {
              concern: criticalReview.concern,
              recommendation: criticalReview.recommendation,
              note,
            },
          });
          activeStatus = "running";
        }
      }
    }

    activeStatus = "running";

    for (const role of selectedRoles) {
      const agent = this.agentsByRole.get(role);

      if (!agent) {
        const error = new Error(`Agent not registered: ${role}`);
        activeStatus = "failed";
        this.pushEvent(events, {
          runId,
          type: "run_failed",
          reason: error.message,
          payload: { role },
        });
        throw error;
      }

      if (
        clarificationRoles.includes(role) &&
        options.interaction?.requestClarification
      ) {
        activeStatus = "waiting_user";
        this.pushEvent(events, {
          runId,
          type: "question_asked",
          reason: `${role} requested clarification before execution`,
          payload: {
            role,
            prompt:
              "Please clarify constraints, preferences, or success criteria before continuing.",
          },
        });

        const clarification = await options.interaction.requestClarification({
          role,
          task: effectiveTask,
          cwd,
          previousResults: results,
        });

        activeStatus = "running";
        this.pushEvent(events, {
          runId,
          type: "user_answer_received",
          reason: `${role} clarification response received`,
          payload: {
            role,
            received: Boolean(clarification?.trim()),
          },
        });

        if (clarification?.trim()) {
          const boundedClarification = this.applyTextBudget({
            runId,
            events,
            field: "clarification",
            maxChars: budget.maxClarificationChars,
            value: clarification.trim(),
            warningState: budgetWarningState,
          });
          effectiveTask = `${effectiveTask}\n\nClarification (${role}): ${boundedClarification}`;
          effectiveTask = this.applyTextBudget({
            runId,
            events,
            field: "workflow_task",
            maxChars: budget.maxWorkflowTaskChars,
            value: effectiveTask,
            warningState: budgetWarningState,
          });
        }
      }

      this.pushEvent(events, {
        runId,
        type: "subagent_started",
        reason: `running ${role}`,
        payload: { role },
      });

      const roleBudget = this.getRoleTaskBudget(role, budget.maxWorkflowTaskChars, budget);
      const taskForRole = this.applyTextBudget({
        runId,
        events,
        field: "role_task",
        maxChars: roleBudget,
        value: effectiveTask,
        warningState: budgetWarningState,
      });

      const result = await agent.run(taskForRole, {
        task: taskForRole,
        cwd,
        config: resolvedConfig.config,
        previousResults: results,
      });

      results.push(result);

      const artifact = this.createArtifact(result.role, result.summary, result.details);
      artifacts.push(artifact);

      this.pushEvent(events, {
        runId,
        type: "subagent_completed",
        reason: `${role} completed`,
        contextRef: {
          artifactIds: [artifact.id],
        },
        payload: {
          role,
          summary: result.summary,
        },
      });
      this.pushEvent(events, {
        runId,
        type: "artifact_persisted",
        reason: `${role} output captured as artifact`,
        contextRef: {
          artifactIds: [artifact.id],
        },
        payload: {
          role,
          artifactId: artifact.id,
          durability: artifact.durability,
        },
      });

      if (checkpointRoles.includes(role)) {
        activeStatus = "needs_approval";
        this.pushEvent(events, {
          runId,
          type: "approval_requested",
          reason: `checkpoint after ${role}`,
          contextRef: {
            artifactIds: [artifact.id],
          },
          payload: {
            role,
            summary: result.summary,
          },
        });

        const approval = options.interaction?.requestApproval
          ? await options.interaction.requestApproval({
              role,
              task: effectiveTask,
              cwd,
              lastResult: result,
              reason: `checkpoint after ${role}`,
            })
          : true;

        const approved =
          typeof approval === "boolean" ? approval : approval.approved;
        const note =
          typeof approval === "boolean"
            ? "auto-approved by default policy"
            : approval.note;

        if (!approved) {
          activeStatus = "cancelled";
          this.pushEvent(events, {
            runId,
            type: "run_cancelled",
            reason: `workflow cancelled at ${role} checkpoint`,
            contextRef: {
              artifactIds: artifacts.map((item) => item.id),
            },
            payload: {
              role,
              note,
            },
          });

          return this.finalizeWorkflowRunResult(
            this.buildWorkflowRunResult({
              runId,
              task,
              cwd,
              configSources: resolvedConfig.loadedSources,
              status: activeStatus,
              startedAt,
              routing,
              artifacts,
              events,
              results,
              summary: `Workflow cancelled at ${role} checkpoint.`,
              explanation:
                "Execution paused at a mandatory checkpoint and was cancelled because approval was not granted.",
            }),
            contextStore,
          );
        }

        this.pushEvent(events, {
          runId,
          type: "approval_received",
          reason: `checkpoint approved after ${role}`,
          contextRef: {
            artifactIds: [artifact.id],
          },
          payload: {
            role,
            note,
          },
        });
        activeStatus = "running";
      }
    }

    activeStatus = "completed";
    this.pushEvent(events, {
      runId,
      type: "run_completed",
      reason: "workflow run completed",
      contextRef: {
        artifactIds: artifacts.map((artifact) => artifact.id),
      },
      payload: {
        resultCount: results.length,
        finalTaskChars: effectiveTask.length,
      },
    });

    return this.finalizeWorkflowRunResult(
      this.buildWorkflowRunResult({
        runId,
        task,
        cwd,
        configSources: resolvedConfig.loadedSources,
        status: activeStatus,
        startedAt,
        routing,
        artifacts,
        events,
        results,
        summary: `Workflow completed using ${results.length} subagent step(s).`,
        explanation:
          "The orchestrator selected enabled workflow agents from resolved config, executed them in order, and stored each output as a compact artifact for traceability.",
      }),
      contextStore,
    );
  }

  async runSubagent(
    role: AgentRole,
    task: string,
    cwd: string,
    resolvedConfig: ResolvedConfig,
    options: SubagentRunOptions = {},
  ): Promise<SubagentRunResult> {
    const agentSettings = resolvedConfig.config.agents[role];

    if (agentSettings?.enabled === false) {
      throw new Error(`Agent is disabled by config: ${role}`);
    }

    const agent = this.agentsByRole.get(role);

    if (!agent) {
      throw new Error(`Agent not registered: ${role}`);
    }

    const runId = this.createId("run");
    const startedAt = this.nowIso();
    const events: WorkflowEvent[] = [];
    const contextStore = options.context?.store;
    const maxHydratedArtifacts = options.context?.maxHydratedArtifacts ?? 2;
    const budget = resolvedConfig.config.context.budget;
    const budgetWarningState: BudgetWarningState = {
      raised: false,
      threshold: budget.maxEstimatedTrimmedTokensWarning,
    };
    let effectiveTask = this.applyTextBudget({
      runId,
      events,
      field: "subagent_task",
      maxChars: budget.maxSubagentTaskChars,
      value: task,
      warningState: budgetWarningState,
    });

    if (contextStore) {
      const hydratedArtifacts = await contextStore.loadRecentArtifacts({
        cwd,
        task,
        maxArtifacts: maxHydratedArtifacts,
      });

      if (hydratedArtifacts.length > 0) {
        this.pushEvent(events, {
          runId,
          type: "context_rehydrated",
          reason: "loaded durable artifacts for direct subagent run",
          contextRef: {
            artifactIds: hydratedArtifacts.map((artifact) => artifact.id),
          },
          payload: {
            artifactCount: hydratedArtifacts.length,
          },
        });

        const rehydratedSummaries = hydratedArtifacts
          .map((artifact) => `- [${artifact.producerRole}] ${artifact.summary}`)
          .join("\n");

        const boundedSummaries = this.applyTextBudget({
          runId,
          events,
          field: "rehydrated_context",
          maxChars: budget.maxRehydratedContextChars,
          value: rehydratedSummaries,
          warningState: budgetWarningState,
        });

        effectiveTask = `${effectiveTask}\n\nRelevant prior context:\n${boundedSummaries}`;
        effectiveTask = this.applyTextBudget({
          runId,
          events,
          field: "subagent_task",
          maxChars: budget.maxSubagentTaskChars,
          value: effectiveTask,
          warningState: budgetWarningState,
        });
      }
    }

    effectiveTask = this.applyTextBudget({
      runId,
      events,
      field: "role_task",
      maxChars: this.getRoleTaskBudget(role, budget.maxSubagentTaskChars, budget),
      value: effectiveTask,
      warningState: budgetWarningState,
    });

    const routing: RoutingDecision = {
      selectedRoles: [role],
      skippedRoles: [],
      rationale: `Direct subagent invocation requested for role: ${role}.`,
    };

    this.pushEvent(events, {
      runId,
      type: "run_created",
      reason: "direct subagent run initialized",
      payload: {
        kind: "subagent",
        task,
        requestedRole: role,
      },
    });
    this.pushEvent(events, {
      runId,
      type: "routing_decided",
      reason: routing.rationale,
      payload: {
        selectedRoles: routing.selectedRoles,
        skippedRoles: routing.skippedRoles,
      },
    });
    this.pushEvent(events, {
      runId,
      type: "subagent_started",
      reason: `running ${role}`,
      payload: {
        role,
        mode: "direct",
      },
    });

    const result = await agent.run(effectiveTask, {
      task: effectiveTask,
      cwd,
      config: resolvedConfig.config,
      previousResults: [],
    });

    const artifact = this.createArtifact(result.role, result.summary, result.details);

    this.pushEvent(events, {
      runId,
      type: "subagent_completed",
      reason: `${role} completed`,
      contextRef: {
        artifactIds: [artifact.id],
      },
      payload: {
        role,
        summary: result.summary,
      },
    });
    this.pushEvent(events, {
      runId,
      type: "artifact_persisted",
      reason: `${role} output captured as artifact`,
      contextRef: {
        artifactIds: [artifact.id],
      },
      payload: {
        role,
        artifactId: artifact.id,
        durability: artifact.durability,
      },
    });
    this.pushEvent(events, {
      runId,
      type: "run_completed",
      reason: "direct subagent run completed",
      contextRef: {
        artifactIds: [artifact.id],
      },
      payload: {
        role,
        finalTaskChars: effectiveTask.length,
      },
    });

    const finishedAt = this.nowIso();
    const workflowRun: WorkflowRun = {
      id: runId,
      kind: "subagent",
      task,
      requestedRole: role,
      cwd,
      status: "completed",
      createdAt: startedAt,
      updatedAt: finishedAt,
      routing,
      artifacts: [artifact],
      events,
    };

    const outcome: RunOutcome = {
      runId,
      status: "completed",
      summary: `Direct subagent run completed for ${role}.`,
      explanation: this.buildOutcomeExplanation(this.buildRunReport(workflowRun)),
      artifactIds: [artifact.id],
      report: this.buildRunReport(workflowRun),
    };

    const subagentResult: SubagentRunResult = {
      runId,
      task,
      cwd,
      requestedRole: role,
      configSources: resolvedConfig.loadedSources,
      result,
      workflowRun,
      outcome,
    };

    if (contextStore) {
      await contextStore.saveRun(workflowRun);
    }

    return subagentResult;
  }

  private createArtifact(
    role: AgentRole,
    summary: string,
    data: unknown,
  ): WorkflowArtifact {
    return {
      id: this.createId("artifact"),
      kind: `${role}-result`,
      producerRole: role,
      summary,
      createdAt: this.nowIso(),
      durability: "durable",
      data,
    };
  }

  private pushEvent(
    events: WorkflowEvent[],
    event: Omit<WorkflowEvent, "id" | "timestamp">,
  ): void {
    events.push({
      id: this.createId("event"),
      timestamp: this.nowIso(),
      ...event,
    });
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  private applyTextBudget(input: {
    runId: string;
    events: WorkflowEvent[];
    field:
      | "workflow_task"
      | "subagent_task"
      | "rehydrated_context"
      | "clarification"
      | "role_task";
    maxChars: number;
    value: string;
    warningState?: BudgetWarningState;
  }): string {
    if (input.value.length <= input.maxChars) {
      return input.value;
    }

    const marker = " ...[truncated by budget]";
    const keepChars = Math.max(0, input.maxChars - marker.length);
    const bounded = `${input.value.slice(0, keepChars)}${marker}`;

    this.pushEvent(input.events, {
      runId: input.runId,
      type: "context_budget_applied",
      reason: `budget applied for ${input.field}`,
      payload: {
        field: input.field,
        maxChars: input.maxChars,
        originalChars: input.value.length,
        keptChars: bounded.length,
      },
    });

    if (input.warningState && !input.warningState.raised) {
      const estimatedTrimmedTokens = this.estimateTrimmedTokensFromEvents(
        input.events,
      );

      if (estimatedTrimmedTokens > input.warningState.threshold) {
        input.warningState.raised = true;
        this.pushEvent(input.events, {
          runId: input.runId,
          type: "context_budget_warning",
          reason: "estimated trimmed tokens exceeded warning threshold",
          payload: {
            threshold: input.warningState.threshold,
            estimatedTrimmedTokens,
          },
        });
      }
    }

    return bounded;
  }

  private async finalizeWorkflowRunResult(
    result: WorkflowRunResult,
    contextStore?: WorkflowContextStore,
  ): Promise<WorkflowRunResult> {
    if (contextStore) {
      await contextStore.saveRun(result.workflowRun);
    }

    return result;
  }

  private buildWorkflowRunResult(input: {
    runId: string;
    task: string;
    cwd: string;
    configSources: string[];
    status: Extract<WorkflowRun["status"], "completed" | "failed" | "cancelled">;
    startedAt: string;
    routing: RoutingDecision;
    artifacts: WorkflowArtifact[];
    events: WorkflowEvent[];
    results: AgentResult[];
    summary: string;
    explanation: string;
  }): WorkflowRunResult {
    const finishedAt = this.nowIso();
    const workflowRun: WorkflowRun = {
      id: input.runId,
      kind: "workflow",
      task: input.task,
      cwd: input.cwd,
      status: input.status,
      createdAt: input.startedAt,
      updatedAt: finishedAt,
      routing: input.routing,
      artifacts: input.artifacts,
      events: input.events,
    };

    const outcome: RunOutcome = {
      runId: input.runId,
      status: input.status,
      summary: input.summary,
      explanation: `${input.explanation} ${this.buildOutcomeExplanation(
        this.buildRunReport(workflowRun),
      )}`.trim(),
      artifactIds: input.artifacts.map((artifact) => artifact.id),
      report: this.buildRunReport(workflowRun),
    };

    return {
      runId: input.runId,
      task: input.task,
      cwd: input.cwd,
      configSources: input.configSources,
      results: input.results,
      workflowRun,
      outcome,
    };
  }

  private buildRunReport(run: WorkflowRun): RunReport {
    const approvalsRequested = run.events.filter(
      (event) => event.type === "approval_requested",
    ).length;
    const approvalsReceived = run.events.filter(
      (event) => event.type === "approval_received",
    ).length;
    const clarificationQuestions = run.events.filter(
      (event) =>
        event.type === "question_asked" &&
        event.reason?.includes("clarification") === true,
    ).length;
    const criticalConcernsRaised = run.events.filter(
      (event) =>
        event.type === "question_asked" &&
        event.reason?.includes("critical collaboration") === true,
    ).length;
    const budgetApplications = run.events.filter(
      (event) => event.type === "context_budget_applied",
    ).length;
    const estimatedTrimmedTokens = run.events
      .filter((event) => event.type === "context_budget_applied")
      .reduce((count, event) => {
        const payload = event.payload as {
          originalChars?: number;
          keptChars?: number;
        };
        const originalChars = payload.originalChars ?? 0;
        const keptChars = payload.keptChars ?? 0;
        const trimmedChars = Math.max(0, originalChars - keptChars);
        return count + this.estimateTokens(trimmedChars);
      }, 0);
    const budgetWarnings = run.events.filter(
      (event) => event.type === "context_budget_warning",
    ).length;
    const rehydratedArtifacts = run.events
      .filter((event) => event.type === "context_rehydrated")
      .reduce((count, event) => {
        const artifactCount = (event.payload as { artifactCount?: number })
          .artifactCount;
        return count + (typeof artifactCount === "number" ? artifactCount : 0);
      }, 0);
    const finalTaskChars = this.getFinalTaskChars(run);
    const estimatedFinalTaskTokens = this.estimateTokens(finalTaskChars);

    return {
      selectedRoles: run.routing?.selectedRoles ?? [],
      skippedRoles: run.routing?.skippedRoles ?? [],
      approvalsRequested,
      approvalsReceived,
      clarificationQuestions,
      criticalConcernsRaised,
      budgetApplications,
      rehydratedArtifacts,
      finalTaskChars,
      estimatedFinalTaskTokens,
      estimatedTrimmedTokens,
      budgetWarnings,
    };
  }

  private buildOutcomeExplanation(report: RunReport): string {
    return [
      `Selected roles: ${report.selectedRoles.join(", ") || "none"}.`,
      `Skipped roles: ${report.skippedRoles.join(", ") || "none"}.`,
      `Approvals requested/received: ${report.approvalsRequested}/${report.approvalsReceived}.`,
      `Clarification questions: ${report.clarificationQuestions}.`,
      `Critical concerns: ${report.criticalConcernsRaised}.`,
      `Budget trims: ${report.budgetApplications}.`,
      `Rehydrated artifacts: ${report.rehydratedArtifacts}.`,
      `Estimated final task tokens: ${report.estimatedFinalTaskTokens}.`,
      `Estimated trimmed tokens: ${report.estimatedTrimmedTokens}.`,
      `Budget warnings: ${report.budgetWarnings}.`,
    ].join(" ");
  }

  private getFinalTaskChars(run: WorkflowRun): number {
    const completedEvent = [...run.events]
      .reverse()
      .find((event) => event.type === "run_completed");

    const finalTaskChars = (completedEvent?.payload as { finalTaskChars?: number })
      ?.finalTaskChars;

    return typeof finalTaskChars === "number" ? finalTaskChars : run.task.length;
  }

  private estimateTokens(charCount: number): number {
    return Math.ceil(Math.max(0, charCount) / 4);
  }

  private estimateTrimmedTokensFromEvents(events: WorkflowEvent[]): number {
    return events
      .filter((event) => event.type === "context_budget_applied")
      .reduce((count, event) => {
        const payload = event.payload as {
          originalChars?: number;
          keptChars?: number;
        };
        const originalChars = payload.originalChars ?? 0;
        const keptChars = payload.keptChars ?? 0;
        const trimmedChars = Math.max(0, originalChars - keptChars);
        return count + this.estimateTokens(trimmedChars);
      }, 0);
  }

  private getRoleTaskBudget(
    role: AgentRole,
    fallback: number,
    budget: ResolvedConfig["config"]["context"]["budget"],
  ): number {
    return budget.perRoleTaskCharLimit[role] ?? fallback;
  }
}

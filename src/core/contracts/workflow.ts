import { type AgentRole } from "./agent";

export type RunKind = "workflow" | "subagent";

export type RunStatus =
  | "created"
  | "routing"
  | "running"
  | "waiting_user"
  | "needs_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type ArtifactDurability = "ephemeral" | "durable";

export type WorkflowEventType =
  | "run_created"
  | "routing_decided"
  | "subagent_started"
  | "subagent_completed"
  | "phase_handoff_created"
  | "question_asked"
  | "user_answer_received"
  | "approval_requested"
  | "approval_received"
  | "context_rehydrated"
  | "context_budget_applied"
  | "context_budget_warning"
  | "artifact_persisted"
  | "run_completed"
  | "run_failed"
  | "run_cancelled";

export interface WorkflowArtifact<TData = unknown> {
  id: string;
  kind: string;
  producerRole: AgentRole | "orchestrator";
  summary: string;
  createdAt: string;
  durability: ArtifactDurability;
  data: TData;
}

export interface RoutingDecision {
  selectedRoles: AgentRole[];
  skippedRoles: AgentRole[];
  rationale: string;
}

export interface ContextReference {
  artifactIds: string[];
  note?: string;
}

export interface ExplorerHandoffData {
  summary: string;
  findings: string[];
  constraints: string[];
  relevantFiles: string[];
  openQuestions: string[];
}

export interface PlannerHandoffData {
  approvedPlan: string;
  requirements: string[];
  architectureDecisions: string[];
  tradeoffs: string[];
}

export interface ImplementerHandoffData {
  changesMade: string[];
  filesTouched: string[];
  diffSummary: string;
  warnings: string[];
}

export interface ReviewerHandoffData {
  reviewFindings: string[];
  risks: string[];
  regressionsFound: string[];
  missingCoverage: string[];
}

export interface TesterHandoffData {
  validationResult: "pass" | "partial" | "fail";
  checksExecuted: string[];
  gaps: string[];
  coverageReport: string;
}

export interface PhaseHandoffBudgetTargets {
  explorerToPlanner: number;
  plannerToImplementer: number;
  implementerToReviewer: number;
  reviewerToTester: number;
  testerToStorage: number;
}

export interface CrossIterationSummary {
  runId: string;
  task: string;
  timestamp: string;
  phasesCompleted: AgentRole[];
  outcome: "completed" | "failed" | "cancelled";
  keyFindings: string[];
  artifactsProduced: string[];
  decisionsMade: Array<{ what: string; why: string }>;
  blockersOrGaps: string[];
  tokenUsage: {
    estimatedFinalTaskTokens: number;
    estimatedTrimmedTokens: number;
  };
}

export interface WorkflowEvent<TPayload = Record<string, unknown>> {
  id: string;
  runId: string;
  timestamp: string;
  type: WorkflowEventType;
  reason?: string;
  contextRef?: ContextReference;
  payload: TPayload;
}

export interface WorkflowRun {
  id: string;
  kind: RunKind;
  task: string;
  requestedRole?: AgentRole;
  cwd: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  routing?: RoutingDecision;
  artifacts: WorkflowArtifact[];
  events: WorkflowEvent[];
}

export interface RunReport {
  selectedRoles: AgentRole[];
  skippedRoles: AgentRole[];
  approvalsRequested: number;
  approvalsReceived: number;
  clarificationQuestions: number;
  criticalConcernsRaised: number;
  budgetApplications: number;
  rehydratedArtifacts: number;
  finalTaskChars: number;
  estimatedFinalTaskTokens: number;
  estimatedTrimmedTokens: number;
  budgetWarnings: number;
  handoffsCreated: number;
  handoffBudgetApplications: number;
}

export interface RunOutcome {
  runId: string;
  status: Extract<RunStatus, "completed" | "failed" | "cancelled">;
  summary: string;
  explanation: string;
  artifactIds: string[];
  report: RunReport;
}

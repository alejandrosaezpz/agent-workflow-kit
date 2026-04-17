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
}

export interface RunOutcome {
  runId: string;
  status: Extract<RunStatus, "completed" | "failed" | "cancelled">;
  summary: string;
  explanation: string;
  artifactIds: string[];
  report: RunReport;
}

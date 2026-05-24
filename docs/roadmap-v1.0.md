# Roadmap v1.0

This document defines the path from the current OpenCode-focused MVP to a first public version of Agent Workflow Kit that is both useful in practice and credible as an open-source project.

The goal of `v1.0` is not to expand the system in every direction. The goal is to make the core workflow genuinely usable, adaptive, inspectable, and publishable.

## v1.0 Goal

Deliver a first public version where:

- the orchestrator can choose which agents to invoke based on the task
- core workflow agents can interact with the user when clarification matters
- users can invoke either the full workflow or any directly callable subagent
- agent context can persist across runs without turning the active chat into a noisy memory dump
- the workflow uses as few tokens as possible without materially hurting answer quality
- the orchestrator stays well informed without depending on repeated full-context compression
- the OpenCode integration is validated in real usage
- the repository is ready to be presented as a useful open-source project

## v1.0 Product Outcome

In the intended `v1.0` experience, a developer should be able to:

1. run `workflow` for an end-to-end task
2. see the orchestrator decide which phases are needed
3. answer clarifying questions from `explorer` or `planner` when needed
4. run `/agent-name <query>` directly for focused work when a specific subagent is enough
5. keep useful context from prior workflow activity without bloating the active conversation

## ⚠️ Global Architectural Status

The current codebase (`v0.1`) implements a **single-process sequential orchestrator** in TypeScript where all "subagents" are stub functions called in the same process. The `defaultAgents` in `src/skills/default-agents.ts` return placeholder results — they do not execute real exploration, planning, or implementation work.

This roadmap was originally written for that architecture. However, the **target architecture** for `v1.0` has been refined: the system should use **truly independent agents** (each with its own OpenCode agent definition, context, and lifecycle), coordinated by an orchestrator that delegates via `task` and passes **optimized/compressed context** between phases.

The phases below have been updated to reflect this target. Each phase now clearly marks what has been implemented under the old architecture versus what remains to be built under the new one.

## Implementation Progress

Current execution log for this roadmap:

- phase status:
  - completed: Phase 1 (Lock v1.0 Scope)
  - completed: Phase 2 (Runtime Model And Contracts)
  - completed: Phase 3 (Adaptive Orchestrator)
  - completed: Phase 4 (Interactive Explorer And Planner)
  - completed: Phase 5 (Direct Subagent Entry Points)
  - completed: Phase 6 (Context Persistence Without Context Bloat)
  - completed: Phase 7 (Token Efficiency And Context Budgeting)
  - completed: Phase 8 (Observability And Workflow Traceability)
  - not_started: Phase 9 (Real OpenCode Validation)
  - completed: Phase 10 (Stabilization, CI And Test Coverage)
  - completed: Phase 11 (OpenCode Compatibility And Adapter Stability)
  - completed: Phase 12 (OSS And Public Release Readiness)
  - completed: Phase 13 (Independent Agent Definitions)
  - completed: Phase 14 (Context Optimization Pipeline)
  - completed: Phase 15 (Cross-Iteration Context Efficiency)

- completed: `docs/runtime-model-v1.md` created with `v1.0` runtime contracts and lifecycle model
- completed: base workflow runtime contracts added in `src/core/contracts/workflow.ts`
- completed: orchestrator now emits run metadata, routing, events, artifacts, and outcome for workflow runs
- completed: direct subagent run path added in core via `runSubagent(role, task, cwd, resolvedConfig)`
- completed: adapter runtime now parses and routes slash commands to core execution via `executeOpenCodeSlashCommand(...)`
- completed: direct command assets and config entries added for `/explorer`, `/planner`, `/implementer`, `/reviewer`, and `/tester`
- completed: workflow runtime now supports clarification and approval interaction hooks with checkpoint events (`question_asked`, `approval_requested`, `approval_received`, `run_cancelled`)
- completed: default checkpoints after `explorer` and `planner` are now represented in orchestrator behavior
- completed: automated test baseline added for routing/events/cancel paths and direct slash command execution (`test/core/orchestrator.test.ts`, `test/adapters/opencode/runtime.test.ts`)
- completed: critical-collaboration guardrail now supports `require_override`, `redirect`, and `cancel` actions in orchestrator runtime
- completed: host adapter runtime can pass workflow interaction options into slash-command workflow execution
- completed: tests now cover explicit-override cancellation and approved-override continuation scenarios
- completed: base context store support added (`InMemoryWorkflowContextStore`, `FileWorkflowContextStore`) in `src/core/context-store.ts`
- completed: orchestrator now supports context rehydration and emits `context_rehydrated` events for workflow and direct subagent runs
- completed: runtime context persistence baseline tested (`test/core/orchestrator.test.ts`)
- completed: direct subagent capability matrix is now explicit in adapter contract (`src/adapters/opencode/index.ts`)
- completed: context store now applies bounded-retention policy for runs, artifacts, and events (`src/core/context-store.ts`)
- completed: context-store policy behavior now has dedicated tests (`test/core/context-store.test.ts`)
- completed: context retention and rehydration settings are now exposed through config (`src/core/contracts/agent.ts`, `src/core/config.ts`)
- completed: OpenCode slash runtime now auto-initializes context stores from resolved config and applies workflow/subagent rehydration limits (`src/adapters/opencode/runtime.ts`)
- completed: adapter runtime tests now cover config-driven context rehydration (`test/adapters/opencode/runtime.test.ts`)
- completed: context budget settings are now configurable (`maxWorkflowTaskChars`, `maxSubagentTaskChars`, `maxRehydratedContextChars`, `maxClarificationChars`) via config
- completed: orchestrator now enforces text budgets and emits `context_budget_applied` events when trimming occurs
- completed: tests now cover budget trimming behavior for workflow and direct subagent runs (`test/core/orchestrator.test.ts`)
- completed: workflow and subagent outcomes now include structured post-run reports (routing, approvals, clarifications, critical concerns, budget usage, rehydration)
- completed: post-run explanation now summarizes what happened and why in a compact form for learning and traceability
- completed: tests now cover post-run report shape and explanation presence (`test/core/orchestrator.test.ts`)
- completed: run reports now include token-estimation metrics (`estimatedFinalTaskTokens`, `estimatedTrimmedTokens`) derived from bounded context flow
- completed: post-run explanations now include token-estimation summaries for visibility and tuning
- completed: configurable budget-warning thresholds now trigger `context_budget_warning` events when estimated trimmed tokens exceed limits
- completed: tests now cover budget-warning threshold behavior (`test/core/orchestrator.test.ts`)
- completed: per-role task budget presets are now configurable (`perRoleTaskCharLimit`) and enforced in workflow/subagent execution
- completed: tests now cover per-role budget enforcement and `role_task` budget events (`test/core/orchestrator.test.ts`)
- completed: workflow and direct subagent failure paths now return structured `failed` outcomes with `run_failed` events (`src/core/orchestrator.ts`)
- completed: runtime config now validates override shape and resolved constraints for roles, context, retention, and budget settings (`src/core/config.ts`, `test/core/config.test.ts`)
- completed: OpenCode installer now has idempotency and merge-safety tests, including invalid `instructions` guardrails (`test/adapters/opencode/install.test.ts`)
- completed: file-backed context store now has persistence, pruning, and invalid-JSON coverage (`test/core/context-store.test.ts`)
- completed: CI baseline now runs build, typecheck, and tests on push and pull_request (`.github/workflows/ci.yml`)
- completed: Phase 9 validation protocol and case matrix are now documented for real OpenCode sessions (`docs/phase9-validation.md`)
- completed: OpenCode compatibility boundaries, stability levels, and release validation requirements are now documented (`docs/opencode-compatibility-v1.md`)
- completed: README now reflects implemented behavior, current limits, and `v1.0` execution references (`README.md`)
- completed: Phase 8 observability criteria are covered through structured events, compact trace reports, and post-run explanations (`src/core/orchestrator.ts`, `src/core/contracts/workflow.ts`, `test/core/orchestrator.test.ts`)
- completed: Phase 10 stabilization criteria are covered with expanded automated tests plus CI quality gates (`test/**/*.test.ts`, `.github/workflows/ci.yml`)
- completed: Phase 11 compatibility criteria are covered with explicit adapter boundary, stability levels, and fallback/release validation guidance (`docs/opencode-adapter.md`, `docs/opencode-compatibility-v1.md`)
- next: update TypeScript contracts and installer to reflect the new multi-agent architecture
- next: execute Phase 9 validation cases in real OpenCode sessions and attach evidence

- completed: independent subagent definitions added for explorer/planner/implementer/reviewer/tester (`adapters/opencode/assets/*-agent.md`)
- completed: OpenCode command routing now points direct slash commands to role-specific subagents instead of `workflow` (`adapters/opencode/assets/opencode.workflow.json`)
- completed: adapter managed files now deploy independent role agents (`src/adapters/opencode/index.ts`)
- completed: phase-handoff schemas and target budgets documented for workflow coordination (`adapters/opencode/assets/workflow-agent.md`, `adapters/opencode/assets/workflow-instructions.md`, `docs/runtime-model-v1.md`, `src/core/contracts/workflow.ts`)
- completed: runtime now creates structured per-phase handoff artifacts, enforces configurable handoff budgets, and emits handoff trace events (`src/core/orchestrator.ts`, `src/core/config.ts`, `src/core/contracts/agent.ts`, `src/core/contracts/workflow.ts`)
- completed: tests now cover handoff transitions, handoff budget trimming, degraded handoff shape fallback, and config validation (`test/core/orchestrator.test.ts`, `test/core/config.test.ts`)
- completed: cross-iteration summaries are now persisted and used as default rehydration path with configurable summary retention (`src/core/context-store.ts`, `src/core/orchestrator.ts`, `src/core/config.ts`)
- completed: context rehydration mode now supports explicit summary-first vs artifact mode (`src/core/contracts/agent.ts`, `src/core/config.ts`, `src/core/orchestrator.ts`)
- completed: workflow delegation skeleton now defined so full workflow runs coordinate phases via `task` to independent role agents (`adapters/opencode/assets/workflow-agent.md`, `adapters/opencode/assets/workflow-instructions.md`)
- completed: workflow delegation hardening now defines per-phase trace blocks, clarification turn limits, assumption fallback, and structured failure reporting (`adapters/opencode/assets/workflow-agent.md`, `adapters/opencode/assets/workflow-instructions.md`)
- completed: contributor documentation added for setup, validation, and PR expectations (`CONTRIBUTING.md`)
- completed: reproducible public demo flow documented for workflow and direct subagent paths (`docs/demo-v1.0-quickstart.md`)
- completed: draft release notes prepared with guarantees, limits, and pre-publish checks (`docs/release-notes-v1.0.0-draft.md`)

This section should be updated as each roadmap phase lands so contributors can see what is done and what comes next.

The system must remain:

- visible
- controllable
- lightweight
- host-native
- understandable by contributors
- token-efficient
- educational for the user operating it

## Learning And Explainability Principle

`v1.0` should help the user learn while the workflow runs.

This means the system should not only produce outputs, but also make it clear:

- what was done
- why it was done
- what decision led to the next step
- what information was considered important enough to preserve

The intended experience is that after a workflow run, the user can understand the reasoning and execution path well enough to learn from it rather than treating the system as a black box.

## Critical Collaboration Principle

`v1.0` should collaborate critically with the user instead of following instructions mechanically.

This means the system should:

- question decisions that appear weak, risky, inefficient, or misaligned with good practice
- point out when a requested path differs from the user's own established patterns when that signal is available
- recommend a better path when there is a strong reason to do so
- avoid blocking unnecessarily when multiple reasonable options exist
- proceed with the user's explicit preference once the user makes their intention clear

The intended experience is not blind obedience.
The intended experience is an informed collaborator that can challenge a direction when that challenge is useful, then align once the user's will is explicit.

## Strategic Priorities

`v1.0` should focus on seven strategic fronts:

1. adaptive orchestration
2. runtime model and workflow contracts
3. interactive exploration and planning
4. direct subagent invocation
5. clear context persistence
6. token efficiency and bounded context flow
7. real-world validation and OSS readiness

## Token And Context Principles

`v1.0` should optimize for response quality per token, not for maximum context accumulation.

This means:

- agents should receive only the context they need for the current step
- the orchestrator should prefer structured artifacts and summaries over raw transcript replay
- preserved context should be layered so the most important decisions survive while low-value chatter expires
- compression should be an exception path, not the normal operating mode of the orchestrator
- context transfer between agents should be explicit and inspectable

The intended direction is not to make the orchestrator remember everything.
The intended direction is to make it remember the right things in a compact, reliable form.

## Phase 1 - Lock v1.0 Scope

Objective:
Translate the current product direction into an explicit `v1.0` contract so implementation does not drift.

Tasks:

- define the exact decision surface of the orchestrator
- define when an agent may ask the user a question
- define which subagents can be invoked directly in `v1.0`
- define what context must persist between agent runs
- define what remains out of scope for `v1.0`
- define when the system should challenge a user decision versus when it should proceed directly

Completion criteria:

- `v1.0` behavior is described in concrete terms
- the team can distinguish implemented behavior from planned behavior

## Phase 2 - Runtime Model And Contracts

Objective:
Define the execution model that all later `v1.0` work will rely on so orchestration, direct subagent invocation, pause-and-resume, and persistence all fit together.

Tasks:

- define what a workflow run is
- define what a direct subagent run is
- define the lifecycle of a subagent instance from creation to completion
- define the state machine for workflow execution, including pause and resume paths
- define the artifact schema used between orchestrator and subagents
- define the event model for outcomes such as `completed`, `asked_user`, `waiting_user`, `needs_approval`, and `failed`
- define what data belongs to active context, persisted context, and durable artifacts
- define what the orchestrator may read directly versus what it should receive through normalized artifacts

Completion criteria:

- the runtime model is explicit enough to guide implementation across phases
- the orchestrator, subagents, and persistence layer share the same contracts
- pause, resume, and handoff behavior are no longer ambiguous

## Phase 3 - Adaptive Orchestrator

Objective:
Move from a fixed sequential flow to a task-aware orchestrator that decides which agents to run, in what order, and delegates execution to **truly independent agents** via the `task` tool instead of calling stub functions in-process.

### Current Implementation (old architecture — completed)

The TypeScript `Orchestrator` in `src/core/orchestrator.ts` runs agents sequentially in-process:
- `for each role: agent.run(task, context)` — same session, same process
- Supports checkpoints, clarifications, critical reviews, budgets, and post-run reports
- `runSubagent()` path exists for direct invocations
- All "agents" are stub functions in `src/skills/default-agents.ts`

**This implementation is a proof of concept.** It demonstrates the contracts, event model, and workflow lifecycle, but it does NOT implement the true multi-agent architecture.

### Pending Work (new architecture)

Tasks:

- **Redefine the orchestrator model**: the `workflow` agent (in OpenCode) becomes a **coordinator** that delegates each phase to an independent agent via the `task` tool, not a direct function call
- Define a routing model for deciding between full workflow and partial workflow paths
- Support selecting only the agents needed for a given task
- Keep the chosen phase path visible to the user
- Ensure the orchestrator can stop when clarification or approval is required
- Preserve a predictable execution model even when the workflow adapts
- **Define what minimal context each routed agent actually needs** — each agent receives only the compressed output of the previous phase, not the full conversation history
- **Define the handoff contract**: what does the orchestrator send to each agent? What does it receive back?
- Define what reasons for agent selection must be exposed in the execution trace
- Define what explanation of routing decisions must be shown to the user after execution
- Define when the orchestrator should recommend a different path than the one initially requested

Completion criteria:

- the orchestrator can choose an agent path based on task shape
- skipped phases are intentional and visible, not implicit
- **the orchestrator delegates to independent agents via `task` — not by calling functions in-process**
- **each agent receives only the compressed context it needs, not the full chat history**
- the workflow remains understandable to the user
- routing decisions can be inspected after the fact
- users can understand why the orchestrator chose that path
- the orchestrator can challenge weak paths without becoming obstructive

## Phase 4 - Interactive Explorer And Planner

Objective:
Allow `explorer` and `planner` to ask the user clarifying questions so early workflow output becomes materially better.

Tasks:

- define the interaction contract for clarification questions
- define when an agent should ask instead of guessing
- support pausing the workflow while waiting for the user
- ensure answers from the user are captured as structured workflow context
- keep the interaction concise so the workflow does not become chat-heavy
- avoid repeated restatement of already accepted context
- define the maximum number of clarification turns expected before escalation or fallback
- define how `explorer` and `planner` should challenge risky or low-quality directions constructively

Completion criteria:

- `explorer` can ask clarifying questions before exploration is finalized
- `planner` can ask clarifying questions before the plan is finalized
- user answers improve downstream phases in a visible way
- clarification loops remain bounded and understandable
- early-phase agents can challenge poor directions with concrete reasons and alternatives

## Phase 5 - Direct Subagent Entry Points

Objective:
Expose focused agent entry points so users can invoke a specific subagent without running the entire workflow.

### Current Implementation (old architecture — partial)

- ✅ Commands `/explorer`, `/planner`, `/implementer`, `/reviewer`, `/tester` exist in `opencode.json`
- ✅ The `src/adapters/opencode/runtime.ts` parses and routes these commands via `parseOpenCodeSlashInvocation()`
- ✅ The support matrix is defined in `src/adapters/opencode/index.ts`
- ✅ The `Orchestrator.runSubagent()` method executes a focused role
- ⚠️ **BUT: all commands point to the same `workflow` agent** — there are no independent agent definitions per role
- ⚠️ **BUT: the `defaultAgents` in TypeScript are stubs** — they return placeholder results, not real work
- ⚠️ **BUT: `Orchestrator.runSubagent()` calls a function in-process**, it does NOT launch a separate agent

### Pending Work (new architecture)

Tasks:

- **Redefine what "direct subagent" means**: a truly independent OpenCode agent with its own:
  - `agent.md` definition file with focused instructions
  - Dedicated system prompt optimized for its role
  - Its own context window (not sharing the orchestrator's context)
  - Its own command entry that launches it as a separate agent
- define a `v1.0` support matrix for directly callable subagents
- ensure a direct command creates a fresh subagent execution rather than relying on a long-lived hidden session
- ensure direct subagent runs still use the same core contracts and context model
- document the difference between `workflow` and direct subagent commands
- define per-subagent capabilities, including whether it can ask user questions, produce durable artifacts, or trigger implementation work
- define safe defaults for how much prior workflow state a direct subagent run receives

Completion criteria:

- users can invoke each supported subagent directly with `/agent-name <query>`
- **each subagent is a truly independent agent, not the same `workflow` agent pretending to be a different role**
- direct subagent runs feel like first-class paths, not internal hacks
- the adapter surface remains coherent
- supported subagents and their capabilities are explicit rather than implied

### Direct Subagent Support Matrix (Target)

`v1.0` defines this support matrix through `src/adapters/opencode/index.ts`:

- `explorer` - directly callable: yes - asks user questions: yes - durable artifacts: yes - write-oriented work: no - default context: medium - output: exploration summary and discovered constraints
- `planner` - directly callable: yes - asks user questions: yes - durable artifacts: yes - write-oriented work: no - default context: medium - output: plan steps, tradeoffs, and recommendation
- `implementer` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: yes - default context: small - output: implementation summary and touched areas
- `reviewer` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: no - default context: small - output: review findings and risk assessment
- `tester` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: no - default context: small - output: validation result and remaining gaps

## Phase 6 - Context Persistence Without Context Bloat

Objective:
Keep workflow context across agent lifecycles in a clear, bounded way that does not degrade chat performance.

### Current Implementation (old architecture — partial)

- ✅ `InMemoryWorkflowContextStore` and `FileWorkflowContextStore` exist in `src/core/context-store.ts`
- ✅ Runs, artifacts, and events are persisted with bounded retention policies
- ✅ Context rehydration from previous runs works (emits `context_rehydrated` events)
- ✅ Config-driven retention settings (`maxRuns`, `maxDurableArtifactsPerRun`, `maxEventsPerRun`)
- ⚠️ **BUT: all context persistence is between runs** (run N → run N+1)
- ⚠️ **BUT: there is NO cross-phase context compression within a single run** — each phase receives the full accumulated task text
- ⚠️ **BUT: the default agents are stubs** so the handoff mechanism has never been tested with real context

### Pending Work (new architecture)

Tasks:

- **Define cross-phase context compression**: within a single workflow run, each phase must produce a compressed summary for the next phase instead of passing the full accumulated context
- Define a minimal context model for preserved workflow state
- Separate active conversation context from persisted workflow artifacts
- **Define the handoff format per phase**:
  - Explorer → Planner: `{ findings, constraints, relevant_files, open_questions }`
  - Planner → Implementer: `{ approved_plan, requirements, architecture_decisions }`
  - Implementer → Reviewer: `{ changes_made, files_touched, diff_summary }`
  - Reviewer → Tester: `{ review_findings, risks, regressions_found }`
  - Tester → Orchestrator(for storage): `{ validation_result, gaps, coverage_report }`
- Define how a new agent instance rehydrates only the context it actually needs
- Define visibility rules so the user can inspect what was preserved and why
- Avoid hidden long-term memory behavior in `v1.0`
- Ensure the orchestrator consumes compact state artifacts instead of requiring raw transcript replay
- Define short-lived versus durable context explicitly
- Define an explicit rule that raw transcript replay is exceptional, not the default handoff path

Completion criteria:

- agents can be recreated without losing essential workflow state
- preserved context is intentionally compact
- **within a single run, each phase receives only the compressed output of the previous phase — not the full accumulated conversation**
- the active chat does not accumulate full raw history unnecessarily
- the persistence model is transparent to the user
- the orchestrator can continue operating without routine context-window compression
- transcript replay is limited to clearly defined fallback cases

## Phase 7 - Token Efficiency And Context Budgeting

Objective:
Make token usage a first-class design constraint without degrading the usefulness of the workflow.

### Current Implementation (old architecture — partial)

- ✅ Text budgets are configurable (`maxWorkflowTaskChars`, `maxSubagentTaskChars`, etc.) in config
- ✅ Orchestrator enforces budgets and emits `context_budget_applied` events
- ✅ Budget warnings trigger when estimated trimmed tokens exceed threshold
- ✅ Per-role task budget presets are configurable (`perRoleTaskCharLimit`)
- ✅ Tests cover budget trimming for workflow and direct subagent runs
- ⚠️ **BUT: budgets apply to the accumulated task string, not to individual handoffs between phases**
- ⚠️ **BUT: there are no target sizes for compressed handoffs (Explorer→Planner, Planner→Implementer, etc.)**
- ⚠️ **BUT: there is no mechanism for each agent to produce a compressed summary as its output**

### Pending Work (new architecture)

Tasks:

- **Define per-handoff token budgets** for the compressed context passed between phases:
  - Explorer → Planner: target ~500 tokens
  - Planner → Implementer: target ~400 tokens
  - Implementer → Reviewer: target ~300 tokens
  - Reviewer → Tester: target ~300 tokens
  - Tester → Orchestrator (for storage): target ~400 tokens
- Define token-budget expectations for orchestrator and subagent paths
- Identify which context is required, optional, or wasteful per phase
- **Replace accumulated-text handoff with structured compressed summaries**
- Define how much prior state a direct subagent invocation should receive by default
- Evaluate when smaller targeted prompts outperform broader shared context
- Define failure signals for when token-saving starts harming result quality
- Define a target size budget for durable artifacts and per-step summaries
- Define a default maximum context budget for the orchestrator
- Define default context budgets for each directly callable subagent category
- Define when compaction is allowed and what information must never be lost during compaction

Completion criteria:

- token usage is intentionally bounded in the main workflow paths
- the orchestrator is informed by compact artifacts rather than oversized chat history
- efficiency tradeoffs are explicit instead of accidental
- budgets exist for orchestrator context, subagent context, artifact size, **and per-phase handoffs**

### Metrics To Establish In This Phase

The implementation should leave behind measurable operational targets such as:

- target maximum orchestrator working context size
- target artifact size per phase
- target summary size for pause-and-resume handoff
- per-subagent default context budget
- **target handoff size per phase transition (Explorer→Planner, Planner→Implementer, etc.)**
- thresholds that indicate quality is degrading because context was trimmed too aggressively

## Phase 8 - Observability And Workflow Traceability

Objective:
Make adaptive workflow behavior inspectable so users and contributors can understand why the system made a decision and what information moved between steps.

Tasks:

- define an execution trace model for workflow and direct subagent runs
- record why a subagent was selected or skipped
- record what artifact or state was handed to each subagent
- record why the workflow paused, resumed, or asked for approval
- define how much of that trace is user-facing versus debug-facing
- ensure observability data stays compact and does not become a second transcript
- define the minimum post-run explanation the user should always receive
- record when the system recommended against a user-requested path and why

Completion criteria:

- adaptive behavior can be inspected after a run
- debugging a bad routing or handoff decision is practical
- execution traces stay compact and readable
- users can review what happened and why without reading raw internal state
- users can understand where the system challenged a decision and why

## Phase 9 - Real OpenCode Validation

Objective:
Validate the adaptive workflow and direct subagent paths in real OpenCode usage.

Tasks:

- run end-to-end tasks through `workflow`
- run focused tasks through direct subagent commands
- verify pauses, questions, and resumptions work clearly
- verify persisted context improves follow-up interactions
- record confusion, noisy outputs, and context-handling failures

Completion criteria:

- the core `v1.0` experience works in realistic tasks
- the main UX friction points are known and prioritized

## Phase 10 - Stabilization, CI And Test Coverage

Objective:
Turn the validated behavior into a maintainable release candidate.

Tasks:

- add tests for orchestrator routing behavior
- add tests for interactive pause-and-resume flows
- add tests for config merge and installer idempotency
- add tests for direct subagent invocation paths
- add tests for context rehydration and artifact handoff behavior
- add tests for token-budget-related routing assumptions where practical
- add tests for execution trace and observability behavior where practical
- add CI to run build, typecheck, and automated tests on every change
- add at least one reproducible smoke test for the install path
- verify build and typecheck remain clean

Completion criteria:

- core behavior is covered by automated tests
- regressions in installation and routing are easier to catch
- CI verifies the minimum quality bar continuously

## Phase 11 - OpenCode Compatibility And Adapter Stability

Objective:
Make the adapter boundary explicit enough that users understand what OpenCode behavior the project depends on and how stable that integration currently is.

Tasks:

- document the supported OpenCode version or compatibility range for `v1.0`
- document which OpenCode extension points the project depends on
- document which adapter behaviors are considered stable versus experimental
- define what should happen when host assumptions are no longer valid
- define how adapter compatibility should be validated before release

Completion criteria:

- the adapter boundary is understandable to users and contributors
- compatibility claims are explicit rather than implied
- host integration risks are documented

## Phase 12 - OSS And Public Release Readiness

Objective:
Prepare the repository to be published and explained as a serious open-source project.

Tasks:

- align README with the real implemented behavior
- explicitly separate current capabilities from future ideas
- add contributor-facing documentation for local development and validation
- document supported OpenCode usage paths and current limitations
- prepare a simple public demo flow for `workflow` and direct subagent commands
- add a clear CI badge or equivalent release-quality signal once available
- prepare release notes for `v1.0.0`
- cut a `v1.0.0` release only after implementation and docs match reality

Completion criteria:

- a new contributor can understand the project quickly
- a user can install and try the main paths with low friction
- public messaging is backed by real product behavior
- the product clearly communicates what it did and why it did it

### Open Source Release Checklist

`v1.0.0` should not be published until the repository has at least:

- a README aligned with implemented behavior
- a documented installation path that works end to end
- a small reproducible demo scenario
- contributor documentation for local development and validation
- CI running build, typecheck, and automated tests
- a minimal automated test suite for routing, install, and context handoff
- documented known limitations and experimental areas
- release notes that explain what `v1.0` does and does not guarantee

## Phase 13 - Independent Agent Definitions (NEW — not started)

Objective:
Create truly independent OpenCode agents for each workflow role (explorer, planner, implementer, reviewer, tester), each with its own agent definition, system prompt, and context lifecycle.

Rationale:
The current implementation uses a single `workflow` agent that runs phases in-process. The target architecture requires separate agents that can be invoked independently, each with focused instructions and an isolated context window. This is the foundation for the entire multi-agent architecture.

Tasks:

- **Create `.opencode/agents/explorer.md`** with:
  - Focused instructions: "Explore the codebase, understand current state, identify constraints"
  - Permission to ask clarifying questions
  - Output format: structured exploration summary
  - Context budget: medium (~3200 chars)
  - No write permissions (read-only analysis)
- **Create `.opencode/agents/planner.md`** with:
  - Focused instructions: "Turn exploration into the smallest correct implementation plan"
  - Permission to ask clarifying questions
  - Output format: plan steps + tradeoffs + recommended path
  - Context budget: medium (~3200 chars)
  - No write permissions (planning only)
- **Create `.opencode/agents/implementer.md`** with:
  - Focused instructions: "Apply the chosen change with minimal scope"
  - No user questions (execution mode)
  - Output format: implementation summary + touched areas
  - Context budget: small (~2600 chars)
  - Write permissions: yes
- **Create `.opencode/agents/reviewer.md`** with:
  - Focused instructions: "Check risks, regressions, missing edge cases, unnecessary complexity"
  - No user questions
  - Output format: review findings + risk assessment
  - Context budget: small (~2200 chars)
  - No write permissions
- **Create `.opencode/agents/tester.md`** with:
  - Focused instructions: "Validate the result and report what was checked and what remains unverified"
  - No user questions
  - Output format: validation result + remaining gaps
  - Context budget: small (~2200 chars)
  - No write permissions
- **Register all agents in `opencode.json`** with their own `mode`, `description`, and command entries
- **Update the installer** (`src/adapters/opencode/install.ts`) to deploy these agent definitions
- **Ensure each agent can be invoked directly** via `/explorer <query>`, `/planner <query>`, etc.
- **Ensure each agent starts with a fresh context** — it does not inherit the orchestrator's conversation history

Completion criteria:

- `/explorer "analyze this module"` launches a truly independent agent with exploration-focused instructions
- Each agent has its own agent definition file in `.opencode/agents/`
- Each agent can be invoked directly without going through the `workflow` agent
- Each agent receives only the context it needs (not accumulated history from other phases)
- The installer deploys all agent definitions idempotently

Dependencies:

- Requires OpenCode to support multiple registered subagents with independent contexts
- Requires the installer to handle agent files (already supported via `OpenCodeManagedFile` with type `"agent"`)

## Phase 14 - Context Optimization Pipeline (NEW — completed)

Objective:
Design and implement the pipeline that compresses and passes context between phases within a single workflow run, ensuring each agent receives only what it needs and the active chat does not bloat.

Rationale:
In the current implementation, context accumulates across phases — each agent receives the full task text plus all previous results. In the target architecture, each agent must receive a compressed, structured summary of the previous phase's output, not the raw transcript.

Tasks:

- **Define the handoff schema** for each phase transition:
  - `ExplorerOutput`: `{ summary, findings[], constraints[], relevantFiles[], openQuestions[] }`
  - `PlannerOutput`: `{ plan, tradeoffs[], recommendation, architectureDecisions[] }`
  - `ImplementerOutput`: `{ changes[], filesTouched[], diffSummary, warnings[] }`
  - `ReviewerOutput`: `{ risks[], regressionsFound[], missingCoverage[], qualityScore }`
  - `TesterOutput`: `{ passed[], failed[], gaps[], coverageReport }`
- **Define the orchestrator's handoff logic** (in the `workflow` agent instructions):
  1. Launch Explorer via `task` with the original user query
  2. Receive Explorer's compressed output
  3. Launch Planner via `task` passing: `{ originalQuery, explorationSummary }`
  4. Receive Planner's compressed output
  5. Launch Implementer via `task` passing: `{ originalQuery, explorationSummary, planSummary }`
  6. Continue similarly for Reviewer and Tester
  7. After Tester completes, produce a **final compressed summary** for storage
- **Implement validation**: if any handoff exceeds its token budget, truncate with a clear warning
- **Ensure inspectability**: the orchestrator logs what context was passed to each agent
- **Define the "no-bloat" rule**: the orchestrator's own context should contain only:
  - The original user query
  - The compressed output of each completed phase (not the full agent conversation)
  - The final summary for persistence

Completion criteria:

- Each phase receives only the compressed output of the previous phase(s), not the full chat history
- The orchestrator's context stays bounded and predictable regardless of run complexity
- Handoff format is explicit and inspectable
- Token budgets per handoff are enforced
- The chat does not accumulate raw agent conversations

Metrics:

- Explorer→Planner handoff: target ≤500 tokens
- Planner→Implementer handoff: target ≤400 tokens
- Implementer→Reviewer handoff: target ≤300 tokens
- Reviewer→Tester handoff: target ≤300 tokens
- Tester→Orchestrator handoff: target ≤400 tokens
- Orchestrator's total context after full run: target ≤2500 tokens (excluding persistent storage)

## Phase 15 - Cross-Iteration Context Efficiency (NEW — completed)

Objective:
Ensure that after a workflow run completes, the orchestrator retains an optimized, minimal context for future iterations — without carrying over the full history of every phase.

Rationale:
Today, context persistence stores entire `WorkflowRun` objects including all events and artifacts. In the target architecture, the orchestrator should store only a compact summary that captures what happened and why, so future runs can benefit from prior work without context bloat.

Tasks:

- **Define the cross-iteration summary format**:
  ```typescript
  interface CrossIterationSummary {
    task: string;
    timestamp: string;
    phasesCompleted: AgentRole[];
    outcome: "completed" | "failed" | "cancelled";
    keyFindings: string[];        // compact list of what was learned
    artifactsProduced: string[];   // references to durable artifacts
    decisionsMade: { what: string; why: string }[];
    blockersOrGaps: string[];
    tokenUsage: { total: number; byPhase: Record<string, number> };
  }
  ```
- **Replace full `WorkflowRun` persistence with summary-based persistence** in the orchestrator's default path:
  - The full run data can still be stored for debugging, but the **default rehydration path** uses only the summary
  - The summary is stored in the existing `context-store` (`FileWorkflowContextStore` or `InMemoryWorkflowContextStore`)
- **On subsequent runs**, the orchestrator rehydrates only the summaries from previous runs (not full artifacts)
- **Define retention policy**: keep last N summaries (default: 5), purge older ones
- **Ensure the user can inspect what was retained** and why
- **Define when full artifact rehydration is needed** vs when summary is sufficient

Completion criteria:

- A workflow run produces a compact summary (≤500 tokens) for cross-iteration reuse
- The orchestrator on a new run loads only summaries (not full runs) by default
- The user can opt into full artifact rehydration when needed
- Cross-iteration context does not bloat the active chat
- Retention policy prevents unbounded accumulation

Metrics:

- Cross-iteration summary size: target ≤500 tokens
- Number of summaries retained: default 5, configurable
- Rehydration overhead: ≤1 round-trip to load summaries

---

> **Note on the TypeScript library**: The existing `src/core/` TypeScript code (`Orchestrator`, `context-store`, `config`, `contracts`) was built as a proof of concept for the old single-process architecture. It demonstrates the contracts, event model, and workflow lifecycle. Under the new architecture, the **real orchestration moves to the OpenCode agent level** (the `workflow` agent delegating via `task`). The TypeScript library may continue to serve as:
> - A **type reference** for the contracts and data structures
> - A **local validation tool** for config and context-store operations
> - But it will no longer be the runtime execution engine
>
> This migration should be done incrementally and clearly documented so future contributors understand which parts are active and which are legacy references.

## What Must Stay Out Of v1.0

The following should remain out of scope unless they become necessary to support the core goals:

- multi-host support beyond OpenCode
- complex memory systems or opaque long-term memory
- autonomous background execution without clear checkpoints
- large plugin ecosystems or marketplaces
- advanced visualization layers
- generalized agent infrastructure beyond what the workflow actually needs

## Recommended Working Order

### Phase 1 (Legacy — Old Architecture)

The following phases were completed under the old single-process architecture and serve as the contract foundation:

1. ✅ lock `v1.0` scope
2. ✅ define runtime model and contracts
3. ✅ implement interactive explorer and planner behavior (partial — needs real agents)
4. ✅ add direct subagent entry points (partial — agents are not independent)
5. ✅ implement bounded context persistence (partial — missing cross-phase compression)
6. ✅ implement token efficiency and context budgeting rules (partial — missing handoff budgets)
7. ✅ add observability and workflow traceability
8. ✅ stabilize with CI and tests
9. ✅ lock adapter compatibility expectations
10. ✅ align docs and release publicly (partial)

### Phase 2 (Target — New Multi-Agent Architecture)

The following phases are **pending** and represent the actual target architecture:

11. **⬜ Phase 13 — Independent Agent Definitions**
    - Create `explorer.md`, `planner.md`, `implementer.md`, `reviewer.md`, `tester.md`
    - Register them as separate agents in `opencode.json`
    - Update the installer to deploy them
    - **This is the foundation. Do Phase 13 first.**

12. **⬜ Phase 14 — Context Optimization Pipeline**
    - Define handoff schemas per phase transition
    - Implement compression logic in the orchestrator (`workflow` agent)
    - Set and enforce token budgets per handoff
    - **This depends on Phase 13 (agents must exist first).**

13. **⬜ Phase 15 — Cross-Iteration Context Efficiency**
    - Define summary format for cross-iteration persistence
    - Replace full-run persistence with summary-based persistence
    - Implement retention policy
    - **This depends on Phase 14 (compression must work first).**

14. **🔄 Phase 3 — Adaptive Orchestrator (Refactor)**
    - Rewrite the `workflow` agent to be a coordinator that delegates via `task`
    - Remove the old in-process sequential execution
    - **This is the final integration step. Do this last.**

15. **⬜ Phase 9 — Real OpenCode Validation**
    - Validate the complete multi-agent workflow in real OpenCode sessions
    - Test direct subagent invocations with truly independent agents
    - Measure context efficiency gains
    - **Do this after all architecture changes are complete.**

## Release Gate For v1.0

`v1.0` should not be considered complete until all of the following are true:

### Previous Architecture (Legacy — already met)
- adaptive routing works in real tasks
- the runtime model for workflow runs, direct subagent runs, pause, and resume is implemented consistently
- `explorer` and `planner` can ask the user clarifying questions
- supported subagents can be invoked with `/agent-name <query>`
- preserved context is compact, inspectable, and useful
- token usage is intentionally bounded in the core paths
- execution traces explain why routing and handoff decisions happened
- the user receives a clear post-run explanation of what was done and why
- the system can challenge poor or inefficient directions, then proceed once the user's intent is explicit
- installation and core behavior are tested
- CI is active for the core quality checks
- OpenCode compatibility and known limits are documented
- documentation matches the implemented product

### Multi-Agent Architecture (Target — not yet met)
- **each workflow role (explorer, planner, implementer, reviewer, tester) is a truly independent OpenCode agent** with its own agent definition, system prompt, and context lifecycle
- **the `workflow` orchestrator delegates to independent agents via `task`** — it does not run phases in-process
- **each phase receives only the compressed output of the previous phase**, not the full accumulated conversation
- **handoff token budgets are defined and enforced** per phase transition (Explorer→Planner ≤500 tokens, etc.)
- **cross-iteration persistence uses compact summaries** (≤500 tokens) instead of full run data
- **the orchestrator's own context stays bounded** regardless of run complexity (target ≤2500 tokens for a full run)
- the user can inspect exactly what context was passed between agents
- the installer deploys all independent agent definitions idempotently

## Definition Of Success

Agent Workflow Kit is succeeding at `v1.0` when:

### Core Workflow Quality
- the workflow is no longer just sequential by default but task-aware
- user interaction improves exploration and planning quality
- focused direct subagent usage is practical
- context survives agent lifecycles without polluting the active chat
- token efficiency improves cost and responsiveness without obvious quality loss
- users can learn from the workflow because decisions and actions are clearly explained
- the system behaves like a critical collaborator instead of a passive executor

### Multi-Agent Architecture (Target)
- **each workflow phase runs as an independent agent** with its own context window
- **the orchestrator delegates work** via `task` instead of calling functions in-process
- **context is compressed between phases** — no agent sees the full transcript of previous agents
- **cross-iteration memory is a compact summary** (≤500 tokens) rather than full run replay
- **the active chat stays lean** — the orchestrator's context grows predictably regardless of how many phases run

### Project Readiness
- the project can be shown publicly as a real, usable workflow layer rather than only a concept
- the multi-agent architecture is demonstrable in real OpenCode sessions
- the installer deploys all independent agents correctly
- documentation matches the implemented architecture

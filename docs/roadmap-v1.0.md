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

## Implementation Progress

Current execution log for this roadmap:

- phase status:
  - completed: Phase 1 (Lock v1.0 Scope)
  - completed: Phase 2 (Runtime Model And Contracts)
  - partial: Phase 3 (Adaptive Orchestrator)
  - partial: Phase 4 (Interactive Explorer And Planner)
  - completed: Phase 5 (Direct Subagent Entry Points)
  - completed: Phase 6 (Context Persistence Without Context Bloat)
  - partial: Phase 7 (Token Efficiency And Context Budgeting)
  - partial: Phase 8 (Observability And Workflow Traceability)
  - pending: Phase 9 (Real OpenCode Validation)
  - partial: Phase 10 (Stabilization, CI And Test Coverage)
  - pending: Phase 11 (OpenCode Compatibility And Adapter Stability)
  - pending: Phase 12 (OSS And Public Release Readiness)

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
- next: add quality-signals to compare routing outcomes under budget pressure (Phase 7)
- next: document context inspection and retention-tuning examples in public docs (Phase 12)

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
Move from a fixed sequential flow to a task-aware orchestrator that decides which agents to run and in what order.

Tasks:

- define a routing model for deciding between full workflow and partial workflow paths
- support selecting only the agents needed for a given task
- keep the chosen phase path visible to the user
- ensure the orchestrator can stop when clarification or approval is required
- preserve a predictable execution model even when the workflow adapts
- define what minimal context each routed agent actually needs
- define what reasons for agent selection must be exposed in the execution trace
- define what explanation of routing decisions must be shown to the user after execution
- define when the orchestrator should recommend a different path than the one initially requested

Completion criteria:

- the orchestrator can choose an agent path based on task shape
- skipped phases are intentional and visible, not implicit
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

Tasks:

- define a `v1.0` support matrix for directly callable subagents
- support slash entry points in the form `/agent-name <query>`
- ensure the orchestrator forwards that query into the requested subagent run
- ensure a direct command creates a fresh subagent execution rather than relying on a long-lived hidden session
- ensure direct subagent runs still use the same core contracts and context model
- document the difference between `workflow` and direct subagent commands
- define per-subagent capabilities, including whether it can ask user questions, produce durable artifacts, or trigger implementation work
- define safe defaults for how much prior workflow state a direct subagent run receives

Completion criteria:

- users can invoke each supported subagent directly with `/agent-name <query>`
- direct subagent runs feel like first-class paths, not internal hacks
- the adapter surface remains coherent
- supported subagents and their capabilities are explicit rather than implied

### Direct Subagent Support Matrix

`v1.0` now defines this support matrix through `src/adapters/opencode/index.ts`:

- `explorer` - directly callable: yes - asks user questions: yes - durable artifacts: yes - write-oriented work: no - default context: medium - output: exploration summary and discovered constraints
- `planner` - directly callable: yes - asks user questions: yes - durable artifacts: yes - write-oriented work: no - default context: medium - output: plan steps, tradeoffs, and recommendation
- `implementer` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: yes - default context: small - output: implementation summary and touched areas
- `reviewer` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: no - default context: small - output: review findings and risk assessment
- `tester` - directly callable: yes - asks user questions: no - durable artifacts: yes - write-oriented work: no - default context: small - output: validation result and remaining gaps

## Phase 6 - Context Persistence Without Context Bloat

Objective:
Keep workflow context across agent lifecycles in a clear, bounded way that does not degrade chat performance.

Tasks:

- define a minimal context model for preserved workflow state
- separate active conversation context from persisted workflow artifacts
- evaluate lightweight persistence options such as structured summaries or per-run artifacts
- define how a new agent instance rehydrates only the context it actually needs
- define visibility rules so the user can inspect what was preserved and why
- avoid hidden long-term memory behavior in `v1.0`
- ensure the orchestrator consumes compact state artifacts instead of requiring raw transcript replay
- define short-lived versus durable context explicitly
- define an explicit rule that raw transcript replay is exceptional, not the default handoff path

Completion criteria:

- agents can be recreated without losing essential workflow state
- preserved context is intentionally compact
- the active chat does not accumulate full raw history unnecessarily
- the persistence model is transparent to the user
- the orchestrator can continue operating without routine context-window compression
- transcript replay is limited to clearly defined fallback cases

## Phase 7 - Token Efficiency And Context Budgeting

Objective:
Make token usage a first-class design constraint without degrading the usefulness of the workflow.

Tasks:

- define token-budget expectations for orchestrator and subagent paths
- identify which context is required, optional, or wasteful per phase
- prefer artifact handoff over transcript handoff where possible
- define how much prior state a direct subagent invocation should receive by default
- evaluate when smaller targeted prompts outperform broader shared context
- define failure signals for when token-saving starts harming result quality
- define a target size budget for durable artifacts and per-step summaries
- define a default maximum context budget for the orchestrator
- define default context budgets for each directly callable subagent category
- define when compaction is allowed and what information must never be lost during compaction

Completion criteria:

- token usage is intentionally bounded in the main workflow paths
- the orchestrator is informed by compact artifacts rather than oversized chat history
- efficiency tradeoffs are explicit instead of accidental
- budgets exist for orchestrator context, subagent context, and artifact size

### Metrics To Establish In This Phase

The implementation should leave behind measurable operational targets such as:

- target maximum orchestrator working context size
- target artifact size per phase
- target summary size for pause-and-resume handoff
- per-subagent default context budget
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

## What Must Stay Out Of v1.0

The following should remain out of scope unless they become necessary to support the core goals:

- multi-host support beyond OpenCode
- complex memory systems or opaque long-term memory
- autonomous background execution without clear checkpoints
- large plugin ecosystems or marketplaces
- advanced visualization layers
- generalized agent infrastructure beyond what the workflow actually needs

## Recommended Working Order

The order should be:

1. lock `v1.0` scope
2. define runtime model and contracts
3. implement adaptive orchestration
4. implement interactive explorer and planner behavior
5. add direct subagent entry points
6. implement bounded context persistence
7. implement token efficiency and context budgeting rules
8. add observability and workflow traceability
9. validate real OpenCode usage
10. stabilize with CI and tests
11. lock adapter compatibility expectations
12. align docs and release publicly

## Release Gate For v1.0

`v1.0` should not be considered complete until all of the following are true:

- adaptive routing works in real tasks
- the runtime model for workflow runs, direct subagent runs, pause, and resume is implemented consistently
- `explorer` and `planner` can ask the user clarifying questions
- supported subagents can be invoked with `/agent-name <query>`
- preserved context is compact, inspectable, and useful
- the orchestrator stays informed without depending on routine context compression
- token usage is intentionally bounded in the core paths
- execution traces explain why routing and handoff decisions happened
- the user receives a clear post-run explanation of what was done and why
- the system can challenge poor or inefficient directions, then proceed once the user's intent is explicit
- installation and core behavior are tested
- CI is active for the core quality checks
- OpenCode compatibility and known limits are documented
- documentation matches the implemented product

## Definition Of Success

Agent Workflow Kit is succeeding at `v1.0` when:

- the workflow is no longer just sequential by default but task-aware
- user interaction improves exploration and planning quality
- focused direct subagent usage is practical
- context survives agent lifecycles without polluting the active chat
- token efficiency improves cost and responsiveness without obvious quality loss
- users can learn from the workflow because decisions and actions are clearly explained
- the system behaves like a critical collaborator instead of a passive executor
- the project can be shown publicly as a real, usable workflow layer rather than only a concept

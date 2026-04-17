# Runtime Model v1

This document defines the first concrete runtime model for `v1.0`.

Its goal is to ensure that workflow orchestration, direct subagent invocation, pause-and-resume, and context persistence share the same contracts.

## Design Goals

- keep execution visible and explainable
- keep context compact and intentional
- support adaptive routing without hidden behavior
- support direct subagent runs using the same core model
- preserve enough state to resume without replaying full transcripts

## Run Types

`v1.0` supports two run kinds:

1. `workflow`
2. `subagent`

### `workflow` run

- entrypoint: `workflow`
- orchestrator selects a sequence of subagents
- may pause for user clarification or approval
- produces per-step artifacts and a final run summary

### `subagent` run

- entrypoint: `/agent-name <query>`
- orchestrator creates a focused run for one target subagent
- receives bounded context according to policy
- produces a subagent result and optional durable artifacts

## Lifecycle States

Execution state machine:

1. `created`
2. `routing`
3. `running`
4. `waiting_user`
5. `needs_approval`
6. `completed`
7. `failed`
8. `cancelled`

Notes:

- `waiting_user` is for missing information
- `needs_approval` is for explicit user-governed checkpoints
- `completed`, `failed`, and `cancelled` are terminal states

## Event Model

Each run appends compact structured events.

Core event types:

- `run_created`
- `routing_decided`
- `subagent_started`
- `subagent_completed`
- `question_asked`
- `user_answer_received`
- `approval_requested`
- `approval_received`
- `artifact_persisted`
- `run_completed`
- `run_failed`
- `run_cancelled`

Event payloads should include:

- timestamp
- run id
- event type
- minimal reason metadata
- references to produced artifacts when relevant

## Artifact Model

Artifacts are explicit handoff units between orchestrator and subagents.

Artifact properties:

- `id`
- `kind`
- `producerRole`
- `summary`
- `createdAt`
- `durability`
- `data`

Durability levels:

- `ephemeral` for run-local short-lived state
- `durable` for reusable outputs kept beyond current run

The orchestrator should prefer passing artifact references and compact summaries over raw transcript replay.

## Context Layers

`v1.0` context is layered:

1. `active` context for the current step
2. `preserved` context for resumable run state
3. `durable` artifacts for reusable long-lived outputs

Rules:

- subagents receive only required context by default
- transcript replay is fallback, not primary handoff strategy
- context passed into each step should be inspectable

## Explainability And Critical Collaboration

Each run should end with a compact explanation that covers:

- what was done
- why key decisions were made
- where the system challenged an initial direction
- what the user overrode explicitly
- what state was preserved for future steps

This is mandatory for `v1.0` learning value and non-black-box behavior.

## v1.0 Contract Output

The implementation should expose typed contracts for:

- run metadata
- run status
- routing decisions
- workflow events
- artifacts and durability
- context references for handoff

These contracts should remain host-agnostic in `src/core/contracts`.

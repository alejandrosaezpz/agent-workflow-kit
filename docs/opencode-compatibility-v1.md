# OpenCode Compatibility v1

This document defines current compatibility expectations for Agent Workflow Kit `v1.0` work.

## Compatibility Position

Current position: `bounded compatibility`.

The project integrates with documented OpenCode extension surfaces and avoids assumptions about undocumented host internals.

## Supported Integration Surface

Agent Workflow Kit currently depends on:

- custom primary agent registration (`workflow`)
- custom slash commands (`/workflow`, `/explorer`, `/planner`, `/implementer`, `/reviewer`, `/tester`)
- OpenCode config merge through `opencode.json`
- instruction file references through `instructions`
- local `skills/` discovery path

## Compatibility Level By Area

`stable`:

- config-fragment merge into `opencode.json`
- managed file installation for agents, commands, instructions, and skills
- workflow and direct-subagent command routing contract

`experimental`:

- quality behavior under heavy context-budget pressure
- large multi-file implementation sessions with repeated long runs
- operator-facing troubleshooting guidance for host-level edge cases

## Known Limits

- No rollback/backup automation during install.
- No automated host-version probe in installer.
- Real-session validation evidence is still in progress (`docs/phase9-validation.md`).

## Fallback Behavior

When compatibility assumptions fail, expected behavior is:

1. fail clearly with actionable errors (invalid config, invalid context file, invalid command shape)
2. keep user config non-destructively merged rather than replaced
3. preserve direct command and workflow entrypoints where possible
4. avoid hidden silent downgrade paths

## Validation Requirements Before v1.0.0

Before release, maintainers should confirm:

1. install path succeeds for both `global` and `project` scopes
2. `/workflow` path works in a real OpenCode session
3. at least one direct subagent command works in a real OpenCode session
4. known limitations are documented in public docs

## Release Signal

Compatibility for `v1.0.0` should be considered ready only when:

- Phase 9 ledger cases are completed with evidence
- this compatibility document and `docs/opencode-adapter.md` stay aligned
- README public guidance reflects current stable/experimental boundaries

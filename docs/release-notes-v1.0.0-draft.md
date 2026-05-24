# Release Notes (Draft): v1.0.0

> Draft only. Do not publish until Phase 9 real-session validation is completed and evidence is attached.

## What v1.0.0 Adds

- visible workflow phases (`explorer`, `planner`, `implementer`, `reviewer`, `tester`)
- direct subagent commands (`/explorer`, `/planner`, `/implementer`, `/reviewer`, `/tester`)
- structured checkpoints for clarification and approval
- compact phase handoffs with configurable budgets
- summary-based cross-iteration rehydration with bounded retention
- structured run reporting and trace events
- OpenCode installer with idempotency and merge-safety checks

## Compatibility

- target host: OpenCode
- adapter scope: global and project installs supported
- see compatibility boundary docs:
  - `docs/opencode-adapter.md`
  - `docs/opencode-compatibility-v1.md`

## Known Limitations

- real-session evidence in `docs/phase9-validation.md` must be completed before final release sign-off
- multi-host support is out of scope for v1.0
- long-run memory systems beyond bounded summaries are out of scope for v1.0

## Validation Requirements Before Publish

1. Build and tests pass in CI.
2. Phase 9 case ledger completed with evidence.
3. README and roadmap aligned with observed behavior.

## Upgrade/Install Notes

Install:

```bash
npm run build
npm run install:opencode
```

Restart OpenCode after install/config changes.

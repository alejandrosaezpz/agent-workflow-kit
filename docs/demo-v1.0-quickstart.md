# Demo: v1.0 Quickstart Flow

This is a small reproducible demo to show the main user paths.

## Preconditions

1. Build succeeds:

```bash
npm run build
```

2. Tests succeed:

```bash
npm run test
```

3. Install adapter:

```bash
npm run install:opencode -- --scope=project
```

4. Restart OpenCode.

## Demo Scenario

Repository context: run from any writable project repository.

### Step 1 — Full workflow

Run:

```text
/workflow summarize this repository structure and propose one safe improvement
```

Expected:

- visible phase progression (`explorer -> planner -> implementer -> reviewer -> tester`)
- at least one checkpoint after exploration/planning
- structured final explanation

### Step 2 — Direct subagent

Run:

```text
/planner propose a minimal plan to add a healthcheck endpoint
```

Expected:

- planner-focused output
- no forced full-workflow execution

### Step 3 — Context follow-up

Run:

```text
/implementer implement only step 1 from the approved healthcheck plan
```

Expected:

- compact follow-up context (summary-first rehydration)
- implementation-focused response with constrained scope

## Evidence Capture (optional but recommended)

Use `docs/templates/phase9-case-capture-template.md` to capture:

- command and prompt
- observed flow
- result (`pass` / `partial` / `fail`)
- friction points

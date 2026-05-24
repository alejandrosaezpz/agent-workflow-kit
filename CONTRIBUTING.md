# Contributing to Agent Workflow Kit

Thanks for contributing.

This project focuses on a visible, user-controlled workflow model for OpenCode.

## Prerequisites

- Node.js 20+
- npm
- OpenCode installed (for real-session validation)

## Local Setup

```bash
npm install
npm run build
npm run test
```

## Install the OpenCode Adapter Locally

Global scope:

```bash
npm run install:opencode
```

Project scope:

```bash
npm run install:opencode -- --scope=project
```

After installation, restart OpenCode.

## Validation Commands

Before opening a PR, run:

```bash
npm run build
npm run test
```

## Real OpenCode Validation (Phase 9)

Use:

- `docs/phase9-validation.md`
- `docs/templates/phase9-case-capture-template.md`
- `docs/templates/workflow-validation-template.md`

Record evidence with `pass` / `partial` / `fail` and friction notes.

## Contribution Guidelines

- Prefer the smallest correct change.
- Keep workflow phases visible and user-controllable.
- Do not silently expand scope.
- Keep docs aligned with implemented behavior.

## Pull Request Checklist

- [ ] Build passes
- [ ] Tests pass
- [ ] README/roadmap/docs updated when behavior changes
- [ ] Validation notes added when relevant

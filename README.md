# Agent Workflow Kit

Agent Workflow Kit is a lightweight, open-source system that transforms how developers use AI in software development — from unstructured chat interactions to structured, agent-based workflows.

---

## Problem

Today, most developers use AI as a chat:

- Analysis, implementation, and validation are mixed together
- Context is easily lost
- Outputs are inconsistent and hard to reproduce
- There is no clear workflow

The issue is not the AI itself, but how it is used.

---

## Solution

Agent Workflow Kit introduces a structured workflow based on specialized agents coordinated by a central orchestrator.

Instead of asking everything in a single conversation, tasks are executed through a clear, step-by-step process.

---

## How it works

When using the workflow:

1. The user defines a task
2. The system executes a structured flow:

   - Explorer analyzes the codebase
   - Planner defines a solution
   - Implementer proposes or applies changes
   - Reviewer evaluates quality and risks
   - Tester validates the result

3. The process is visible, repeatable, and controllable

---

## Core Concepts

### Orchestrator
Coordinates the workflow and decides which agents should act.

### Agents
Specialized roles with a single responsibility:

- Explorer → understands the codebase
- Planner → defines the approach
- Implementer → performs changes
- Reviewer → checks quality
- Tester → validates results

### Skills
Reusable capabilities that agents can use:
- repository analysis
- change planning
- impact evaluation
- code review

---

## Key Principles

- Lightweight: no unnecessary complexity
- Transparent: the process is not a black box
- Customizable: adaptable to any project
- Educational: teaches structured AI usage
- Non-intrusive: does not force changes in your codebase

---

## Installation

Coming soon.

Agent Workflow Kit will be installable globally and integrated into OpenCode as a new workflow mode.

---

## Roadmap

### v0.1
- Global installer
- Orchestrator
- Explorer, Planner, Reviewer agents
- Basic skills
- Initial workflow

### v0.2
- Implementer agent
- Improved decision logic
- Custom project configuration

### v0.3
- Tester agent
- Advanced workflows
- Presets for different project types

---

## Project Structure
agent-workflow-kit/
├─ src/
├─ templates/
├─ docs/
└─ examples/

---

## Contributing

This project is in early stage.

Contributions, ideas, and feedback are welcome.

---

## License

MIT
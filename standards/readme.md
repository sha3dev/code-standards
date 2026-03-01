# README Guide

## Goal

Every repository README MUST be clear, actionable, and visually structured.
For libraries, README MUST be complete integration documentation because other LLMs will use it as source-of-truth.

## Mandatory Sections

- Title and one-line value proposition.
- TL;DR or Quick Start with copy/paste commands.
- What it does and why it exists.
- Setup and usage examples.
- Installation requirements and exact install command.
- Public API reference (exports, expected inputs/outputs, and behavior notes).
- Integration guide (how to consume the library from another project).
- Configuration reference (`src/config.ts` constants and impact).
- Compatibility and constraints (runtime, module format, TypeScript expectations).
- AI workflow section when the repository uses AI coding contracts.
- Troubleshooting or FAQ.

## Writing Rules

- Use concrete commands and expected execution order.
- Avoid vague claims without implementation detail.
- Keep headings and lists scannable.
- Update README with every behavior or command change.

## Quality Bar

A top-tier README lets a new engineer understand and run the project in under 5 minutes without asking additional questions.
For libraries, a top-tier README also lets another LLM integrate the library in a different codebase without opening source files.

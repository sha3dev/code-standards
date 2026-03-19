# README Guide

## Goal

Every repository README MUST be clear, actionable, and visually structured.
For libraries, README MUST be complete integration documentation because other LLMs will use it as source-of-truth.
README MUST read like documentation written by the package maintainer for another engineer.
Do not write README like a generated scaffold summary, code dump, or file inventory.

## Mandatory Sections

- Title and one-line value proposition.
- TL;DR or Quick Start with copy/paste commands.
- Why or motivation section that explains the concrete problem the package solves.
- Main capabilities section that explains the primary things the package lets a consumer do.
- Setup and usage examples.
- Installation requirements and exact install command.
- Public API reference (exports, parameters, return values, and behavior notes).
- Examples section with runnable copy/paste examples.
- Configuration reference (`src/config.ts` constants and impact).
- Compatibility and constraints (runtime, module format, TypeScript expectations).
- AI workflow section when the repository uses AI coding contracts.
- Troubleshooting or FAQ.

## Writing Rules

- Start from the consumer perspective: why this package exists, when to use it, and what stable surface it offers.
- README content MUST be written in English.
- Write like the package maintainer talking to another engineer, not like a scaffold narrator.
- Use concrete commands and expected execution order.
- Avoid vague claims without implementation detail.
- Keep headings and lists scannable.
- Document every public export from `src/index.ts`.
- If a public export is a class, document each public method with purpose, parameters, return value, and behavior notes.
- Document configuration keys as user-facing controls, not just constant names.
- Do not enumerate private methods, internal helpers, or implementation-only files unless they are necessary for consumers to operate the package.
- Do not describe the project as "scaffolded", "generated", or "template" documentation in the README itself.
- Do not describe the README itself, the scaffold, or the generation process outside the `AI Workflow` section.
- Put practical examples before the exhaustive API reference where possible.
- Use a structure inspired by high-quality package READMEs such as `ky`: fast value proposition, examples first, then detailed API reference.
- Update README with every behavior or command change.

## Verification Rubric

- README MUST contain runnable `bash` or `ts` examples that match the actual public surface.
- README MUST document every exported type/function/class and every public class method.
- README MUST cover each top-level `config` key with user-facing impact.
- README MUST avoid placeholder language, TODOs, and abstract filler.
- A good README may use different wording than the template as long as it meets the same coverage and quality bar.

## Quality Bar

A top-tier README lets a new engineer understand and run the project in under 5 minutes without asking additional questions.
For libraries, a top-tier README also lets another LLM integrate the library in a different codebase without opening source files or guessing public method behavior.
A weak README sounds like a machine summarized the codebase.
A strong README sounds like the author is explaining the package on purpose.

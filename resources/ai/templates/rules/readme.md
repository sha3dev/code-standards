### README Quality Standard (MUST)

When creating or updating `README.md`, output MUST be top-tier and production-quality.

Mandatory requirements:

- README MUST clearly explain: what the project does, why it exists, and how to use it in under 60 seconds.
- README MUST include practical copy/paste examples that are runnable.
- README MUST include a fast path (`TL;DR` or `Quick Start`) and an in-depth reference section.
- For libraries, README MUST be complete integration documentation for external teams and LLM agents.
- README MUST include a public API reference section with exported members and behavior expectations.
- README MUST include a dedicated integration section that shows how to install/import/use from another project.
- README MUST include a configuration reference section (`src/config.ts`) with meaning of each constant.
- README MUST include compatibility constraints (runtime, ESM/CJS expectations, TypeScript assumptions).
- README MUST include a section for AI usage (how to instruct assistants to follow local standards).
- README MUST avoid vague marketing language and focus on actionable guidance.
- README MUST be visually structured with clean headings, concise lists, and code blocks.
- README MUST be updated whenever behavior, commands, or setup steps change.

Good example characteristics:

- Starts with immediate value and one-command quick start.
- Shows exact commands and expected flow.
- Includes public API and integration contract without forcing reader to inspect source files.
- Includes troubleshooting or FAQ for common confusion points.

Bad example characteristics:

- Only describes high-level ideas.
- Missing runnable commands.
- Forces reader to guess execution order.

Read `AGENTS.md`, `ai/contract.json`, and the assistant-specific adapter in `ai/` before making any code changes.

Follow the project conventions from `@sha3/code-standards` strictly:

- obey blocking deterministic rules from `ai/contract.json`
- treat simplicity as mandatory: choose the smallest correct solution and avoid speculative abstractions or gratuitous indirection
- do not use simplicity as a reason to remove valid responsibility boundaries
- keep declarations, expressions, calls, and object literals on one line whenever they fit within the line limit
- keep managed files read-only unless this task is explicitly a standards update
- preserve the scaffold structure and naming conventions
- add or update tests for behavior changes
- rewrite `README.md` as package-quality integration documentation once the real implementation exists
- document every public export from `src/index.ts` in `README.md`
- for every exported class, document each public method with purpose, inputs, return value, and behavior notes
- use a structure inspired by high-quality package READMEs such as `ky`: short value proposition, practical examples first, exhaustive API reference after
- do not leave scaffold-placeholder API descriptions in `README.md` once behavior is implemented
- execute `npm run check` yourself before finishing
- if `npm run check` fails, fix the issues and rerun it until it passes

When you respond after implementation, include:

- changed files
- a short compliance checklist
- proof that `npm run check` passed

## Package Specification

- Goal:
- Public API:
- Runtime constraints:
- Required dependencies:
- Feature requirements:

# Agent Entry Point

This repository is AI-first. Always consume standards in this order:

1. `standards/manifest.json` (source of truth)
2. `standards/*.md` guides
3. `profiles/default.profile.json`
4. `resources/ai/templates/*` templates
5. `ai/constitution.md`
6. Assistant-specific adapter in `ai/adapters/`

## Mandatory Rules

- Follow `npm run check` before considering work complete.
- Follow `profiles/schema.json` when updating style profiles.
- Keep generated projects aligned with `@sha3/code-standards` exports.
- Use `code-standards profile` to maintain the default AI style profile.
- Treat generated project-level `AGENTS.md` as blocking policy.
- Follow `standards/readme.md` when creating or updating README files.
- Treat simplicity as a mandatory rule: no speculative abstractions, no gratuitous indirection, no extra files/layers/wrappers unless they solve a real current problem.
- Simplicity does not justify removing valid boundaries; keep distinct current responsibilities separated when they serve a real purpose.
- Let Biome decide the final line wrapping and formatting shape.
- Keep code compact when writing or refactoring, but do not fight Biome by forcing single-line objects, callbacks, or other constructs that the formatter intentionally keeps multiline.

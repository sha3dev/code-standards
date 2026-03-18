# AI Constitution

These rules apply to all assistants using this repository.

- Treat `standards/manifest.json` as normative.
- Prefer deterministic and repeatable commands.
- Keep changes small, explicit, and testable.
- Let Biome decide the final line wrapping. Keep code compact, but do not fight formatter-preserved multiline layouts.
- Do not turn formatter preferences into verifier failures.
- Treat warnings as review signals, not mandatory rewrites, unless the user explicitly asks for a stricter pass.
- Run `npm run check` before finalizing edits.
- Use project templates for new projects unless explicitly overridden.

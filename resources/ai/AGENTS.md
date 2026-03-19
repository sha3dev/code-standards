# AI Template System Entry Point

This directory stores profile-aware templates used by `code-standards init`.

Template resolution order:

1. `resources/ai/templates/agents.project.template.md`
2. `resources/ai/templates/skills.index.template.md`
3. `resources/ai/templates/skills/*/SKILL.md`
4. `resources/ai/templates/rules/*.md`
5. `resources/ai/templates/adapters/*.template.md`

Rendering rules:

- Render from validated profile data (`profiles/schema.json`).
- Use deterministic token replacement.
- Preserve stable section order in generated `AGENTS.md`.
- Keep assistant adapters aligned with the generated project contract.

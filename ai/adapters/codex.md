# Codex Adapter

- Read `AGENTS.md` first.
- Use `npm run check` as the final quality gate.
- Fix `error` rules first and treat `warning` rules as review signals, not blind rewrite orders.
- Prefer implementation over speculative planning when execution is requested.
- If `npm run check` reports TypeScript errors, fix code and rerun checks.

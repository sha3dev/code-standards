# GitHub Copilot Adapter

- Keep generated snippets aligned with `@sha3/code-standards` tooling exports.
- Use ESM imports/exports by default.
- Include tests under `test/` for new behavior.
- Do not overcorrect warnings into more complex code when a simpler implementation already satisfies the contract.
- If TypeScript fails in `npm run check`, update code and rerun checks.

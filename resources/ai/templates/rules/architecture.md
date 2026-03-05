### Feature-Folder Architecture (MUST)

- Code MUST be organized by feature (for example: `src/user`, `src/billing`, `src/invoice`).
- Feature folder names MUST be singular.
- Each feature MUST keep its own domain model, application services, and infrastructure adapters grouped by feature.
- Cross-feature imports MUST happen through explicit public entry points.
- `src/` MUST keep explicit composition boundaries: `src/index.ts`, `src/app/`, `src/shared/`, and `src/<feature>/`.
- Project layout MUST include `src/`, `test/`, `scripts/`, `docs/`, and `ai/` at minimum.
- For `node-service`, HTTP transport concerns SHOULD live in `src/http/` (`routes`, `controllers`, `middleware`).
- For `node-lib`, API boundary separation MAY use `src/public/` and `src/internal/`.
- Feature files SHOULD use explicit role suffixes (`*.service.ts`, `*.repository.ts`, `*.types.ts`, `*.schema.ts`, `*.mapper.ts`).
- Feature file domain base names SHOULD be singular (for example: `invoice.service.ts`).
- Ambiguous filenames (`utils.ts`, `helpers.ts`, `common.ts`) are forbidden for new feature code.
- Hardcoded, non-parameterized configuration MUST be centralized in `src/config.ts` (for example, external service URLs).
- `src/config.ts` MUST export a single default object and it MUST always be imported as `import CONFIG from ".../config.ts"`.

Good example:

- `ai/examples/demo/src/config.ts`
- `ai/examples/demo/src/invoice/invoice.service.ts`
- `ai/examples/demo/src/invoice/invoice.errors.ts`
- `ai/examples/demo/src/invoice/invoice.types.ts`
- `ai/examples/demo/src/billing/billing.service.ts`

Bad example:

- `ai/examples/rules/class-first-bad.ts` (mixes concerns and does not keep feature boundaries)

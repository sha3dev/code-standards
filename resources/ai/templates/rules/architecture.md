### Feature-Folder Architecture (MUST)

- Code MUST be organized by feature (for example: `src/user`, `src/billing`, `src/invoice`).
- Feature folder names MUST be singular.
- Each feature MUST keep its own domain model, application services, and infrastructure adapters grouped by feature.
- Cross-feature imports MUST happen through explicit public entry points.
- `src/` MUST stay feature-first with `src/index.ts` and `src/<feature>/`.
- `src/app/` MUST exist only when the project has explicit composition/wiring that justifies it.
- `src/shared/` MUST exist only when cross-feature modules actually exist.
- Project layout MUST include `src/`, `test/`, `scripts/`, `docs/`, and `ai/` at minimum.
- For `node-service`, HTTP transport concerns SHOULD live in `src/http/` (`routes`, `controllers`, `middleware`).
- If a service needs to expose an HTTP API, it MUST use the latest published `hono` release line as the HTTP framework.
- For `node-lib`, API boundary separation MAY use `src/public/` and `src/internal/`.
- Feature files SHOULD use explicit role suffixes (`*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.mapper.ts`).
- Use `*.types.ts` only when shared feature types are substantial enough to justify a dedicated file.
- Inside `src/<feature>/`, files MUST expose exactly one public class unless the file is `*.types.ts`.
- Feature file domain base names SHOULD be singular (for example: `invoice.service.ts`).
- Ambiguous filenames (`utils.ts`, `helpers.ts`, `common.ts`) are forbidden for new feature code.
- Hardcoded, non-parameterized configuration MUST be centralized in `src/config.ts` (for example, external service URLs).
- `src/config.ts` MUST export a single default object named `config` and it MUST always be imported as `import config from ".../config.ts"`.
- Architecture decisions MUST default to the simplest structure that satisfies current requirements.
- New files, modules, or layers MUST be introduced only when they solve present complexity, not anticipated future needs.
- Simplicity is mandatory: if a design can be smaller, flatter, and more direct while staying correct, that simpler design MUST be chosen.
- Speculative abstractions, placeholder extension points, and gratuitous indirection are forbidden.
- Simplicity MUST NOT be interpreted as permission to remove valid architectural boundaries.
- Distinct responsibilities that are already justified SHOULD remain separated.

Good example:

- `ai/examples/demo/src/config.ts`
- `ai/examples/demo/src/invoice/invoice.service.ts`
- `ai/examples/demo/src/invoice/invoice.errors.ts`
- `ai/examples/demo/src/invoice/invoice.types.ts`
- `ai/examples/demo/src/billing/billing.service.ts`

Bad example:

- `ai/examples/rules/class-first-bad.ts` (mixes concerns and does not keep feature boundaries)

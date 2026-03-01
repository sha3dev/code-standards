### Feature-Folder Architecture (MUST)

- Code MUST be organized by feature (for example: `src/users`, `src/billing`, `src/invoices`).
- Each feature MUST keep its own domain model, application services, and infrastructure adapters grouped by feature.
- Cross-feature imports MUST happen through explicit public entry points.
- Hardcoded, non-parameterized configuration MUST be centralized in `src/config.ts` (for example, external service URLs).

Good example:

- `ai/examples/demo/src/config.ts`
- `ai/examples/demo/src/invoices/invoice-service.ts`
- `ai/examples/demo/src/invoices/invoice-errors.ts`
- `ai/examples/demo/src/invoices/invoice-types.ts`
- `ai/examples/demo/src/billing/billing-service.ts`

Bad example:

- `ai/examples/rules/class-first-bad.ts` (mixes concerns and does not keep feature boundaries)

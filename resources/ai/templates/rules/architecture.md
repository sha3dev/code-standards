### Feature-Folder Architecture (MUST)

- Code MUST be organized by feature (for example: `src/users`, `src/billing`, `src/invoices`).
- Each feature MUST keep its own domain model, application services, and infrastructure adapters grouped by feature.
- Cross-feature imports MUST happen through explicit public entry points.

Good example:

```text
src/
  invoices/
    invoice-service.ts
    invoice-repository.ts
    invoice-types.ts
  billing/
    billing-service.ts
```

Bad example:

```text
src/
  services/
  repositories/
  models/
```

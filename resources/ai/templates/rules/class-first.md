### Class-First Design (MUST)

- New business/domain logic MUST be modeled with classes by default.
- Each class MUST use constructor injection for dependencies.
- A source file MUST expose one public class.
- Mutable shared state MUST be avoided; prefer `readonly` fields and deterministic methods.
- Class-oriented files MUST always include all section comment blocks using this exact format:
  - `/** @section imports:externals */`
  - `/** @section imports:internals */`
  - `/** @section consts */`
  - `/** @section types */`
  - `/** @section private:attributes */`
  - `/** @section private:properties */`
  - `/** @section public:properties */`
  - `/** @section constructor */`
  - `/** @section static:properties */`
  - `/** @section factory */`
  - `/** @section private:methods */`
  - `/** @section public:methods */`
  - `/** @section static:methods */`
- All section blocks MUST exist even when empty, using `// empty` after the section marker.
- `factory` MUST only contain methods that create and return instances of the same class.

Good example:

```ts
/** @section imports:externals */
import { randomUUID } from "node:crypto";

/** @section imports:internals */
import type { InvoiceRepository } from "./invoice-repository.js";
import type { CreateInvoiceCommand, Invoice } from "./invoice-types.js";

/** @section consts */
const SERVICE_NAME = "invoice-service";

/** @section types */
type InvoiceDraft = { customerId: string; amount: number };

export class InvoiceService {
  /** @section private:attributes */
  private readonly requestId: string;

  /** @section private:properties */
  private readonly repository: InvoiceRepository;

  /** @section public:properties */
  public readonly serviceName: string;

  /** @section constructor */
  public constructor(repository: InvoiceRepository) {
    this.repository = repository;
    this.requestId = randomUUID();
    this.serviceName = SERVICE_NAME;
  }

  /** @section static:properties */
  // empty

  /** @section factory */
  public static create(repository: InvoiceRepository): InvoiceService {
    const service = new InvoiceService(repository);
    return service;
  }

  /** @section private:methods */
  private toInvoiceDraft(command: CreateInvoiceCommand): InvoiceDraft {
    const draft: InvoiceDraft = { customerId: command.customerId, amount: command.amount };
    return draft;
  }

  /** @section public:methods */
  public async create(command: CreateInvoiceCommand): Promise<Invoice> {
    const draft: InvoiceDraft = this.toInvoiceDraft(command);
    const invoice: Invoice = await this.repository.save(draft);
    return invoice;
  }

  /** @section static:methods */
  // empty
}
```

Bad example:

```ts
import { randomUUID } from "node:crypto";

export class InvoiceService {
  public async create(command: CreateInvoiceCommand): Promise<Invoice> {
    const repository = new InvoiceRepository();
    if (!command.customerId) return Promise.reject(new Error("invalid"));
    return repository.save(command as any);
  }
}
```

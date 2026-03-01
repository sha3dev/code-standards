### Error Handling (MUST)

- Domain/application errors MUST use explicit typed error classes.
- Errors MUST be thrown and handled at clear application boundaries.
- Error messages MUST include actionable context.

Good example:

```ts
export class InvoiceNotFoundError extends Error {
  public constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`);
    this.name = "InvoiceNotFoundError";
  }
}
```

Bad example:

```ts
throw new Error("Oops");
```

### Async Policy (MUST)

- Asynchronous code MUST use `async/await`.
- `.then()`/`.catch()` chains are not allowed for new code.
- Every async call chain MUST have explicit error handling at the boundary.

Good example:

```ts
public async execute(command: SyncInvoicesCommand): Promise<SyncResult> {
  const invoices: Invoice[] = await this.source.fetch(command.accountId);
  const result: SyncResult = await this.writer.persist(invoices);
  return result;
}
```

Bad example:

```ts
public execute(command: SyncInvoicesCommand): Promise<SyncResult> {
  return this.source.fetch(command.accountId).then((invoices) => this.writer.persist(invoices));
}
```

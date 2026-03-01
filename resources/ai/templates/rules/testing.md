### Testing and Comments (MUST)

- Any behavior change MUST include or update tests.
- Tests MUST validate behavior, not implementation details.
- Comments MUST be explicit and extensive when logic is non-trivial.
- Async workflows MUST use `async/await` style only.

Good example:

```ts
// Business rule: invoices older than 30 days are escalated for manual review.
public evaluateEscalation(invoice: Invoice, now: Date): EscalationDecision {
  const ageInDays: number = daysBetween(invoice.issuedAt, now);
  const decision: EscalationDecision =
    ageInDays > 30 ? "manual-review" : "no-escalation";
  return decision;
}
```

Bad example:

```ts
public evaluateEscalation(invoice: any, now: Date): any {
  return Promise.resolve(invoice).then((it) => (Date.now() - it.issuedAt > 0 ? "x" : "y"));
}
```

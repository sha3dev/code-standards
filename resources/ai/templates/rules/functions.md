### Function Structure (MUST)

- Functions and methods SHOULD stay under 30 lines.
- Functions MUST implement one responsibility.
- Long functions MUST be split into private helper methods.
- Types MUST be preferred over interfaces for local modeling unless a public contract requires an interface.

Good example:

```ts
private normalize(input: PaymentInput): PaymentDraft {
  const amount: number = normalizeAmount(input.amount);
  const currency: CurrencyCode = normalizeCurrency(input.currency);
  const metadata: PaymentMetadata = sanitizeMetadata(input.metadata);
  return { amount, currency, metadata };
}
```

Bad example:

```ts
private normalize(input: any): any {
  // huge branchy function with parsing, IO, validation and persistence mixed together
  // ... 80+ lines omitted
  return input;
}
```

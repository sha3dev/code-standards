### Return Policy (MUST)

- Every function or method MUST have a single `return` statement.
- Early returns are not allowed.
- Conditional paths MUST assign to a local result variable and return once.

Good example:

```ts
public toStatusLabel(status: InvoiceStatus): string {
  let label: string;

  if (status === "paid") {
    label = "Paid";
  } else if (status === "void") {
    label = "Void";
  } else {
    label = "Pending";
  }

  return label;
}
```

Bad example:

```ts
public toStatusLabel(status: InvoiceStatus): string {
  if (status === "paid") return "Paid";
  if (status === "void") return "Void";
  return "Pending";
}
```

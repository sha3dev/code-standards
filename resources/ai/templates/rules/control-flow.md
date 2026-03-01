### Control Flow Braces (MUST)

- `if`, `else if`, `else`, `for`, `while`, and `do` blocks MUST always use braces.
- Single-line `if` statements without braces are forbidden.
- This rule applies even when the body has one statement.

Good example:

```ts
if (isEnabled) {
  executeTask();
}
```

Bad example:

```ts
if (isEnabled) executeTask();
```

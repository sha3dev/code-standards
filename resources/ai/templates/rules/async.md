### Async Policy (MUST)

- Asynchronous code MUST use `async/await`.
- `.then()`/`.catch()` chains are not allowed for new code.
- Every async call chain MUST have explicit error handling at the boundary.

Good example:

- `ai/examples/rules/async-good.ts`

Bad example:

- `ai/examples/rules/async-bad.ts`

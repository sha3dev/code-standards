### Class-First Design (MUST)

- New business/domain logic MUST be modeled with classes by default.
- In `src/`, module-level exported functions SHOULD be avoided for business/domain logic.
- Exceptions for exported functions are limited to minimal entrypoint/bootstrap wrappers.
- Each class MUST use constructor injection for dependencies.
- A source file MUST expose one public class.
- Mutable shared state MUST be avoided; prefer `readonly` fields and deterministic methods.
- Class-oriented files MUST always include all section comment blocks using this exact 3-line format:
  - `/**`
  - ` * @section <block-name>`
  - ` */`
- Required section block names (in order):
  - `imports:externals`
  - `imports:internals`
  - `consts`
  - `types`
  - `private:attributes`
  - `protected:attributes`
  - `private:properties`
  - `public:properties`
  - `constructor`
  - `static:properties`
  - `factory`
  - `private:methods`
  - `protected:methods`
  - `public:methods`
  - `static:methods`
- Section blocks without class members SHOULD be omitted.
- `factory` MUST only contain methods that create and return instances of the same class.

Good example:

- `ai/examples/rules/class-first-good.ts`
- `ai/examples/rules/constructor-good.ts`
- `ai/examples/demo/src/invoice/invoice.service.ts`

Bad example:

- `ai/examples/rules/class-first-bad.ts`
- `ai/examples/rules/constructor-bad.ts`

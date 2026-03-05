### Class-First Design (MUST)

- New business/domain logic MUST be modeled with classes by default.
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
- All section blocks MUST exist even when empty, using `// empty` after the section marker.
- `factory` MUST only contain methods that create and return instances of the same class.

Good example:

- `ai/examples/rules/class-first-good.ts`
- `ai/examples/rules/constructor-good.ts`
- `ai/examples/demo/src/invoice/invoice.service.ts`

Bad example:

- `ai/examples/rules/class-first-bad.ts`
- `ai/examples/rules/constructor-bad.ts`

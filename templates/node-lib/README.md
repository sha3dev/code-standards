# 📚 {{packageName}}

Libreria TypeScript lista para publicar y reutilizar.

## TL;DR

```bash
npm install
npm run check
npm run build
```

## Uso

```ts
import { greet } from "./dist/index.js";

console.log(greet("world"));
```

## Scripts

- `npm run check`: lint + format check + typecheck + tests
- `npm run fix`: aplica autofix de lint y prettier
- `npm run build`: compila a `dist/`
- `npm run test`: ejecuta tests con Node test runner

## Estructura

- `src/`: implementacion
- `src/config.ts`: configuracion hardcodeada centralizada
- `test/`: pruebas
- `dist/`: salida de build

## AI Workflow

Si trabajas con asistentes, usa `AGENTS.md` y `ai/*.md` como reglas bloqueantes.

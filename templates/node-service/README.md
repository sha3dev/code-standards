# 🚀 {{packageName}}

Servicio TypeScript listo para ejecutar en local y evolucionar por features.

## TL;DR

```bash
npm install
npm run check
npm run start
```

## Ejecucion

```bash
npm run start
```

El servicio arranca por defecto en `http://localhost:3000`.

## Scripts

- `npm run start`: inicia el servicio con `tsx`
- `npm run check`: lint + format check + typecheck + tests
- `npm run fix`: aplica autofix de lint y prettier
- `npm run test`: ejecuta tests con Node test runner

## Estructura

- `src/`: implementacion
- `src/config.ts`: configuracion hardcodeada centralizada
- `test/`: pruebas

## AI Workflow

Si trabajas con asistentes, usa `AGENTS.md` y `ai/*.md` como reglas bloqueantes.

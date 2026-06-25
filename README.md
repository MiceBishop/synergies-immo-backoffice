# Synergies Immo — Back-office

Back-office web app for the Synergies Immo property management platform.

Companion backend: [synergies-immo-services](https://github.com/MiceBishop/synergies-immo-services).

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS 4 + shadcn/ui (new-york)
- TanStack Router + TanStack Query
- React Hook Form + Zod
- Supabase JS client
- `date-fns`, Sonner, Recharts

## Requirements

- Node.js 22+
- The `synergies-immo-services` repo cloned as a sibling directory (used for `npm run gen:types`)

## Quick start

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Scripts

| Script              | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server                                          |
| `npm run build`     | Type-check then build production bundle                            |
| `npm run lint`      | Run Oxlint                                                         |
| `npm run preview`   | Serve the production build locally                                 |
| `npm run gen:types` | Regenerate `src/lib/database.types.ts` from the services repo      |

## Conventions

See `CLAUDE.md` for the full convention guide. Short version: **code in English, UI in French**.

## Adding shadcn components

```bash
npx shadcn@latest add button input dialog
```

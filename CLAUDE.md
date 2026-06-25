# Synergies Immo Backoffice — Claude Code Context

## What this is

Back-office web app for the Synergies Immo property management platform.
Single-tenant admin panel — buildings, units, tenants, leases, payments, reporting.

Companion backend repo: [synergies-immo-services](https://github.com/MiceBishop/synergies-immo-services).

## Stack

- React 19, Vite, TypeScript (strict)
- Supabase (Postgres, Auth, Storage, Edge Functions) — service repo is separate
- shadcn/ui (new-york style) + Tailwind CSS 4 (default tokens — do not customize yet)
- TanStack Router (file-based) + TanStack Query
- React Hook Form + Zod
- Zustand for UI/auth state only
- `date-fns` for all date handling — never raw `Date` arithmetic
- Sonner for toasts
- Recharts for dashboards
- SheetJS (`xlsx`) for Excel export

## Language convention

- ALL CODE IN ENGLISH: variable names, function names, types, interfaces, comments, file names, route paths
- ALL USER-FACING TEXT IN FRENCH: labels, placeholders, toast messages, error messages, button text, page titles
- Example: `const handleCreateLease = () => { toast.success("Bail créé avec succès"); }`
- Example: `<Button>Ajouter un locataire</Button>` but `export function TenantForm() {}`

## Conventions

- Each feature has a colocated hook: `use-{feature}.ts` in `src/hooks`
- Zod schemas in `src/schemas` — reuse for form validation
- Use `src/lib/database.types.ts` (auto-generated from synergies-immo-services) for all Supabase queries
- Prefer server-side filtering/pagination via Supabase `.range()` + `.order()`
- No `any` types. No `// @ts-ignore`.
- Components: one component per file, named export, PascalCase filename
- Format amounts via `formatAmount(value)` in `src/lib/format.ts` — reads currency/locale from cached settings. Default: `Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })`
- Never use the legacy `anon` / `service_role` Supabase keys — use the new publishable / secret keys

## File patterns

- Route: `src/routes/{feature}/index.tsx` (list), `$id.tsx` (detail)
- Component: `src/components/{feature}/{component-name}.tsx`
- Hook: `src/hooks/use-{feature}.ts`
- Schema: `src/schemas/{feature}.schema.ts`

## Data fetching

- All queries go through TanStack Query hooks in `src/hooks`
- Mutations use `useMutation` with `onSuccess` invalidation
- Optimistic updates for status changes (payment, lease)

## Forms

- React Hook Form + `zodResolver`
- Submit handler calls Supabase client directly (no API layer for MVP)
- Show toast on success/error via Sonner

## Adding shadcn components

```bash
npx shadcn@latest add button input dialog
```

Components land in `src/components/ui/`. Do not modify generated component files except to fix bugs.

## Testing

- Vitest for critical calculations only: VAT math, rent due generation logic, payment status derivation, `formatAmount()`
- No E2E tests for now

## See also

- `../synergies-immo/IMPLEMENTATION_PLAN.md` — full plan
- `../synergies-immo/RULES.md` — project rules
- `../synergies-immo/MEMORY.md` — project memory

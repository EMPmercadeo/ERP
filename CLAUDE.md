# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js Turbopack)
npm run build        # prisma generate + next build
npm run lint         # ESLint across src/
npm run lint:colors  # Custom script: flags hardcoded color values
npm run db:seed      # Seed the database via prisma/seed.ts
```

To run a single file with TypeScript:
```bash
npx tsx scripts/<file>.ts
```

TypeScript check (no emit):
```bash
npx tsc --noEmit
```

## Architecture

### Auth Flow (two-layer)
Firebase handles client-side identity → on login, sets a `session_email` cookie → every Server Component/Action calls `getTenantContext()` (`src/lib/auth/context.ts`) which reads that cookie, queries Postgres for the `Usuario` record, and returns `{ userId, empresaId, role, isImpersonating }`. This context object is the entry point for all data access.

Auto-provisioning: if a Firebase user has no Postgres record, `getTenantContext()` creates a new `Empresa` + `Usuario` on first call.

### Multi-tenancy
Every database query **must** be scoped by `empresaId`. Two ways to enforce this:

1. **`prismaApp`** (`src/lib/db/app.ts`) — tenant-aware wrapper that injects `empresaId` automatically. Use this when possible.
2. **Direct `prisma.*`** — used in most server actions. Must manually pass `empresaId` from `getTenantContext()` in every `where` clause. Never skip this.

Super admins can impersonate other companies via an `x-impersonation` cookie. `getTenantContext()` handles the switch transparently.

### Route Groups
```
src/app/
  (auth)/       → Login, Register, Forgot Password — no sidebar
  (dashboard)/  → All main app pages — Sidebar + Content + BottomNavigation layout
  admin/        → Super-admin only panel (role check via getTenantContext)
  api/          → REST endpoints; rate-limited + CORS by middleware
  api/v1/       → External-facing API (invoices, certificates, issuers, webhooks)
```

### Server Actions
Located in two places:
- `src/lib/actions/*.ts` — shared domain actions (invoices, clients, products, suppliers, billing, POS, etc.)
- `src/app/(dashboard)/<module>/actions.ts` — page-specific actions (import flows for clients, invoices, quotes)

All are `'use server'` files. Call `getTenantContext()` at the top of every exported function.

### Validation
Zod schemas live in `src/lib/validations/index.ts`: `ClientSchema`, `ProductSchema`, `InvoiceSchema`, `SupplierSchema`, `PurchaseSchema`, `DeliveryNoteSchema`, and their item sub-schemas. Use these in server actions — do not re-define validation inline.

### Billing / Plans
Plans: `free` → `emprendedor` → `negocio` → `pro` → `empresa`. Stored as `Empresa.planType`. PayPal subscriptions managed via webhooks at `api/v1/providers/webhooks/paypal`. Check `canCreateInvoice()` from `src/lib/actions/billing.ts` before creating fiscal documents.

### DGI (Panama Tax Authority) Integration
- `Empresa.ambienteDgi`: `"1"` = test/sandbox, `"2"` = production
- `Empresa.fiscalEnabled`: must be `true` to issue real fiscal documents
- `Empresa.certificadoDgi`: base64 `.p12` certificate; `usuarioPac` / `passwordPac` for PAC credentials
- ITBMS (VAT) codes: `"00"` = exempt, `"01"` = 7%, `"02"` = 10%, `"03"` = 15%
- Document sequence managed via `Secuencia` model (atomic transaction in `getNextSequence`)

### Key Invariants
- **Never query without `empresaId`** — data leaks between tenants
- **`design-review-package/`** — frozen UI snapshot, never edit
- `src/middleware.ts` handles CORS + rate limiting (120 req/min) for all `/api/*` routes
- Monetary values in Prisma are `Decimal` — call `.toNumber()` before sending to client components
- `DgiStatus` union type lives in `src/components/ui/status-badge.tsx` — import from there, don't redefine

### Front-end Patterns
- `cn()` from `src/lib/utils.ts` — Tailwind class merging (used everywhere)
- `useAuth()` from `src/lib/firebase/auth.tsx` — client-side user + role
- Zustand store at `src/lib/store.ts` — lightweight global UI state
- TanStack Table used in all list views; columns defined inline per component
- `Prisma.XxxWhereInput` types for dynamic filter objects — never use `any` for where clauses

### Deploy y migraciones (IMPORTANTE)
- `package.json#build` = `prisma generate && prisma migrate deploy && next build` — **cada push a `main` que dispare un build de Vercel corre migraciones pendientes contra producción automáticamente**, sin paso manual de aprobación.
- El usuario trabaja este mismo repo en paralelo con otra sesión (Gemini/Antigravity). Puede haber pushes a `main` que no vienen de esta sesión — revisar `git log`/`git status` antes de asumir que el working tree solo tiene tus propios cambios; un `git add -A` de otra sesión puede arrastrar archivos tuyos sin commitear.
- Para marcar una migración como aplicada contra producción con `prisma migrate resolve`, hay que sobreescribir tanto `DATABASE_URL` como `DIRECT_URL` en `.env` (Prisma CLI usa `directUrl` para comandos de migración) — cambiar solo `DATABASE_URL` no tiene efecto. El `.env` de este proyecto tiene BOM al inicio, así que un `sed`/`awk` anclado con `^DATABASE_URL` no hace match; usar `s#DATABASE_URL=".*"#...#` sin ancla.

### Design Context
- **`PRODUCT.md`** — registro (brand), usuarios, propósito, personalidad de marca y principios de diseño.
- **`DESIGN.md`** — sistema visual: paleta (azul `#073674`), tipografía Geist, componentes (botones, cards, status badges).
- **`.impeccable/design.json`** — sidecar con snippets HTML/CSS de componentes para el panel de `/impeccable live`.
- **`.impeccable/live/config.json`** — config de `/impeccable live` (inyecta en `src/app/layout.tsx`); CSP en `next.config.ts` ya tiene el allowance dev-only para `localhost:8400`.

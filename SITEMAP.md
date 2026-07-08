# Sitemap — ERP Panamá

Generado a partir de la estructura real de `src/app/` (Next.js App Router). Referencia rápida de rutas para no tener que re-explorar la carpeta cada vez.

## Públicas (sin sidebar)

- `/` — Página de inicio (marketing, `src/app/page.tsx`)
- `/login`, `/register`, `/forgot-password` — grupo `(auth)`
- `/terms`, `/privacy`, `/cookies`
- `/offline` — fallback PWA sin conexión

## Dashboard (autenticado, con Sidebar + Content) — grupo `(dashboard)`

| Módulo | Rutas |
|---|---|
| Home | `/dashboard` |
| Clientes | `/clients`, `/clients/new`, `/clients/[id]`, `/clients/[id]/edit` |
| Proveedores | `/suppliers`, `/suppliers/[id]` |
| Productos | `/products`, `/products/new`, `/products/[id]`, `/products/expiring` |
| Facturas | `/invoices`, `/invoices/new`, `/invoices/[id]` |
| Cotizaciones | `/quotes`, `/quotes/new`, `/quotes/[id]` |
| Notas de crédito | `/credit-notes`, `/credit-notes/new` |
| Notas de entrega | `/delivery-notes`, `/delivery-notes/new`, `/delivery-notes/[id]` |
| Pedidos | `/orders` |
| Compras | `/purchases`, `/purchases/new` |
| POS | `/pos` |
| Cuentas por cobrar | `/receivables` |
| Inventario/bodegas | `/warehouses` |
| Bancos | `/bank-accounts`, `/bank-accounts/[id]`, `/bank-accounts/[id]/reconcile` |
| Contabilidad | `/accounting/journal`, `/accounting/ledger`, `/accounting/trial-balance`, `/accounting/income-statement`, `/accounting/balance-sheet` |
| Reportes | `/reports`, `/reports/cash-flow` |
| Config/cuenta | `/settings`, `/profile`, `/help` |
| Otros | `/research-hub`, `/admin/support` (soporte super-admin, vive dentro del layout de dashboard) |

## Panel super-admin (layout propio, fuera de `(dashboard)`)

- `/admin` — home del panel
- `/admin/audit`
- `/admin/billing`
- `/admin/empresas`, `/admin/empresas/[id]`
- `/admin/users`

## API interna (uso desde el propio front, no expuesta como producto)

- `GET/POST /api/quotes`
- `GET /api/customers/search`
- `GET /api/products/search`

## API pública v1 (facturación electrónica DGI — ver CLAUDE.md para el detalle de los dos sistemas DGI paralelos)

- `GET/POST /api/v1/invoices`
- `GET /api/v1/invoices/[id]`
- `POST /api/v1/invoices/[id]/authorize|cancel|sign|validate`
- `GET /api/v1/audit/invoices/[id]`
- `GET /api/v1/certificates`
- `GET /api/v1/issuers`
- `GET /api/v1/reconciliation/jobs` (confirmado muerto/sin cron — solo invocable a mano)
- `POST /api/v1/providers/webhooks/[provider]`
- `POST /api/v1/providers/webhooks/paypal`
- `POST /api/v1/seed-demo-suppliers`

---
*Regenerar corriendo `Glob src/app/**/page.tsx` y `Glob src/app/api/**/route.ts` si se agregan rutas nuevas — esto es un snapshot, no se actualiza solo.*

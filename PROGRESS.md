# Registro de Progreso — FASE 1d — ERP Panamá

Este archivo registra el avance detallado de las tareas de la FASE 1d (Reportes contables) siguiendo las reglas del proyecto.

---

## [2026-07-03 22:50] Tarea 1d.1: Libro Diario
Estado: OK
Archivos modificados:
- [JournalList.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/accounting/JournalList.tsx)
- [page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/journal/page.tsx)
Resultado de npm run build:
```
✓ Compiled successfully in 6.0s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 574.5ms
```
Resultado de prueba de verificación:
```
{"_sum":{"totalDebe":"1506113.8699999999979","totalHaber":"1506113.8699999999978"}}
```

---

## [2026-07-03 22:51] Tarea 1d.2: Libro Mayor por cuenta
Estado: OK
Archivos modificados:
- [LedgerView.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/accounting/LedgerView.tsx)
- [page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/ledger/page.tsx)
Resultado de npm run build:
```
✓ Compiled successfully in 6.3s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 569.0ms
```
Resultado de prueba de verificación:
```
{"cta":"Clientes Nacionales","codigo":"1.1.02.01","naturaleza":"DEUDORA","debe":828366.05,"haber":338256.8,"saldoFinal":490109.25000000006}
```

---

## [2026-07-03 22:52] Tarea 1d.3: Balance de Comprobación
Estado: OK
Archivos modificados:
- [TrialBalanceView.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/accounting/TrialBalanceView.tsx)
- [page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/trial-balance/page.tsx)
Resultado de npm run build:
```
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 561.3ms
```
Resultado de prueba de verificación:
```
{"totalDeudor":950222.17,"totalAcreedor":950222.1699999999,"diff":1.1641532182693481e-10}
```

---

## [2026-07-03 22:53] Tarea 1d.4: Estado de Resultados
Estado: OK
Archivos modificados:
- [IncomeStatementView.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/accounting/IncomeStatementView.tsx)
- [page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/income-statement/page.tsx)
Resultado de npm run build:
```
✓ Compiled successfully in 6.1s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 554.3ms
```
Resultado de prueba de verificación:
```
{"totalIngresos":783617.22,"totalCostos":0,"utilidadBruta":783617.22,"totalGastos":0,"utilidadNeta":783617.22,"isNetCorrect":true}
```

---

## [2026-07-03 22:54] Tarea 1d.5: Balance General
Estado: OK
Archivos modificados:
- [BalanceSheetView.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/accounting/BalanceSheetView.tsx)
- [page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/balance-sheet/page.tsx)
Resultado de npm run build:
```
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 555.6ms
```
Resultado de prueba de verificación:
```
{"totalActivos":948041.17,"totalPasivos":164423.95,"totalPatrimonioSinUtilidad":0,"utilidadEjercicio":783617.22,"totalPatrimonioTotal":783617.22,"totalPasivoPatrimonio":948041.1699999999,"diff":1.1641532182693481e-10,"isBalanced":true}
```

---

## [2026-07-03 22:55] Tarea 1d.6: facturas de contado
Estado: OK
Archivos modificados:
- [invoices.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/invoices.ts)
Resultado de npm run build:
```
✓ Compiled successfully in 6.5s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (0/17) ...
✓ Generating static pages using 23 workers (17/17) in 538.4ms
```
Resultado de prueba de verificación:
```
Factura creada: FE-001-001-01-00009999
Pago creado: cmr5tx94s000bqgzgdj3sdfsh (Monto: 107, Método: yappy)

Asiento FACTURA [FACTURA]: #351 | Concepto: Venta según factura FE-001-001-01-00009999
Total Debe: 107 | Total Haber: 107
  [1.1.02.01] Clientes Nacionales | Debe: 107 | Haber: 0
  [4.1.01] Ventas de Mercancías | Debe: 0 | Haber: 100
  [2.1.02.01] ITBMS Débito Fiscal | Debe: 0 | Haber: 7

Asiento COBRO [COBRO]: #352 | Concepto: Cobro factura FE-001-001-01-00009999 (yappy)
Total Debe: 107 | Total Haber: 107
  [1.1.01.02] Bancos - Cuenta Corriente | Debe: 107 | Haber: 0
  [1.1.02.01] Clientes Nacionales | Debe: 0 | Haber: 107

🎉 PRUEBA DE INTEGRACIÓN DE FACTURA DE CONTADO COMPLETADA CON ÉXITO.
```

---

## [2026-07-03 23:28] Tarea 1d.7: Costo de venta en createInvoice
Estado: OK
Alcance: exclusivamente `createInvoice` (formulario web `/invoices/new`). `createInvoicePOS` (`/pos`) no fue tocado — hoy no genera ningún asiento contable (ni FACTURA, ni COBRO, ni COSTO_VENTA) y queda pendiente para una tarea futura.
Archivos modificados:
- [asientos.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/contabilidad/asientos.ts) — `generarAsientoCostoVenta` ya existía, no se duplicó.
- [invoices.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/invoices.ts) — import de `generarAsientoCostoVenta`; cálculo de `mapaCosto`/`costoVentaTotal`; `costoUnitario` real en `FacturaItem` (antes hardcodeado en 0); llamada a `generarAsientoCostoVenta` tras `generarAsientoFactura`; decremento de `stockActual` para ítems no-servicio (createInvoice no tenía ningún descuento de inventario previo).
Resultado de npm run build:
```
✓ Compiled successfully in 5.4s
  Running TypeScript ...
  Collecting page data using 23 workers ...
✓ Generating static pages using 23 workers (17/17) in 573.0ms
```
Resultado de prueba de verificación (producto mercancía, costoUnitario=15, cantidad=3, stock inicial=100):
```
costoVentaTotal calculado = 45 (esperado: 45)
Factura creada: REC-00000001
PASS: AsientoContable COSTO_VENTA existe y está balanceado (Debe=45, Haber=45).
PASS: FacturaItem.costoUnitario = 15 (esperado 15).
PASS: stockActual = 97 (esperado 100 - 3 = 97, sin doble descuento).
PASS: totalCostos (cuenta 5.1) = 45 (ya no es 0).
🎉 TODAS LAS PRUEBAS DE COSTO DE VENTA PASARON CORRECTAMENTE.
```
Registros de prueba eliminados al finalizar.

---

## [2026-07-03 23:41] Tarea 1d.8: conectar contabilidad a createInvoicePOS
Estado: OK
Alcance: exclusivamente `createInvoicePOS` (módulo POS, `/pos`). `createInvoice` no fue tocado.
Archivos modificados:
- [invoices.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/invoices.ts) — validación de productos ahora trae `unidadMedida`/`costoUnitario` (`findMany` en vez de `count`); cálculo de `ventasMercancias`/`ventasServicios`/`costoVentaTotal`; `costoUnitario` real en `FacturaItem` (antes hardcodeado en 0); llamadas a `generarAsientoFactura` y `generarAsientoCostoVenta` tras crear la factura; llamada a `generarAsientoCobro` cuando `condicionPago === 'contado'` (antes el pago se registraba sin generar ningún asiento). El bloque existente de decremento de stock ("Update stock") no se tocó ni se duplicó.
Resultado de npm run build:
```
✓ Compiled successfully in 5.5s
```
Resultado de prueba de verificación (producto mercancía, costoUnitario=8, cantidad=4, condicionPago=contado, stock inicial=50):
```
costoVentaTotal calculado = 32 (esperado: 32 = 8*4)
Factura POS creada: REC-00000001
PASS a) AsientoContable FACTURA balanceado (Debe=85.6, Haber=85.6).
PASS b) AsientoContable COSTO_VENTA balanceado (Debe=32, Haber=32).
PASS c) AsientoContable COBRO balanceado (Debe=85.6, Haber=85.6).
PASS d) FacturaItem.costoUnitario = 8 (esperado 8).
PASS e) stockActual = 46 (esperado 50 - 4 = 46, sin doble descuento).
🎉 TODAS LAS PRUEBAS DE 1d.8 PASARON CORRECTAMENTE.
```
Registros de prueba eliminados al finalizar.

---

## [2026-07-03 23:52] Fase 0: limpieza de 5 errores de lint menores
Estado: OK
Alcance: `scripts/check-products.ts`, `scripts/enable-rls.ts`, `src/app/(dashboard)/accounting/ledger/page.tsx`, `src/lib/contabilidad/planCuentasDefault.ts`. Los 5 errores eran todos `@typescript-eslint/no-explicit-any` (no había `prefer-const`, `react/no-unescaped-entities` ni `@next/next/no-html-link-for-pages` en estos archivos).
Archivos modificados:
- [check-products.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/scripts/check-products.ts) — `catch (err: any)` → `catch (err: unknown)` en dos bloques, acceso a `.message` protegido con `err instanceof Error`.
- [enable-rls.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/scripts/enable-rls.ts) — `catch (error: any)` → `catch (error: unknown)`, acceso a `.message` protegido con `error instanceof Error`.
- [ledger/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/accounting/ledger/page.tsx) — `let movements: any[]` → `let movements: LedgerMovementView[]`, reutilizando el tipo ya exportado por `LedgerView.tsx` (coincide exactamente con la forma del objeto construido en el `.map()`).
- [planCuentasDefault.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/contabilidad/planCuentasDefault.ts) — `crearPlanCuentasParaEmpresa(tx: any, ...)` → `crearPlanCuentasParaEmpresa(tx: Prisma.TransactionClient, ...)`, consistente con el tipo usado en `asientos.ts` para el mismo patrón.
Resultado de npm run build:
```
✓ Compiled successfully in 5.7s
```
Resultado de verificación (`npx eslint` sobre los 4 archivos):
```
(sin salida — 0 errores, 0 warnings)
```

---

## Resumen de Cambios (git diff --stat)
```
 src/lib/actions/invoices.ts          | 26 ++++++++++++++
 src/lib/actions/purchases.ts         | 27 ++++++++++++++-
 src/lib/actions/supplier-payments.ts | 13 ++++++-
 src/lib/contabilidad/asientos.ts     | 67 ++++++++++++++++++++++++++++++++++++
 4 files changed, 131 insertions(+), 2 deletions(-)
```

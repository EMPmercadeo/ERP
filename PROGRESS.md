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

# FASE 2 — Bancos y Conciliación

## [2026-07-04 05:09] Tarea 2.1: Modelo CuentaBancaria + MovimientoBancario
Estado: OK
Archivos modificados:
- [schema.prisma](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/prisma/schema.prisma) — modelos nuevos `CuentaBancaria` y `MovimientoBancario`; relaciones inversas agregadas en `Empresa` (`cuentasBancarias`, `movimientosBancarios`), `PlanCuentas` (`cuentasBancarias`) y `AsientoContable` (`movimientosBancarios`).
- Migración `prisma/migrations/20260704050607_add_bancos/migration.sql` (generada con `prisma migrate dev --create-only`, aplicada con `prisma migrate deploy`).
- Migración adicional `prisma/migrations/20260704050915_add_deny_all_policies_bancos/migration.sql` — decisión confirmada con el usuario: las tablas nuevas no tenían la política RLS "deny all" que sí tiene el resto de tablas del proyecto (patrón de `20260630230000_add_deny_all_policies` + `enable-rls.ts`). Se agregó `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY "Deny client access" ... USING (false)` para ambas tablas nuevas.
SQL de la migración add_bancos (100% aditivo, revisado antes de aplicar):
```sql
CREATE TABLE "CuentaBancaria" ( ... );
CREATE TABLE "MovimientoBancario" ( ... );
CREATE INDEX "CuentaBancaria_empresaId_idx" ON "CuentaBancaria"("empresaId");
CREATE INDEX "CuentaBancaria_cuentaContableId_idx" ON "CuentaBancaria"("cuentaContableId");
CREATE INDEX "MovimientoBancario_empresaId_idx" ON "MovimientoBancario"("empresaId");
CREATE INDEX "MovimientoBancario_cuentaBancariaId_idx" ON "MovimientoBancario"("cuentaBancariaId");
CREATE INDEX "MovimientoBancario_asientoContableId_idx" ON "MovimientoBancario"("asientoContableId");
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_cuentaContableId_fkey" FOREIGN KEY ("cuentaContableId") REFERENCES "PlanCuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_asientoContableId_fkey" FOREIGN KEY ("asientoContableId") REFERENCES "AsientoContable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```
Resultado de `npx prisma migrate deploy` (add_bancos):
```
Applying migration `20260704050607_add_bancos`
All migrations have been successfully applied.
```
Resultado de `npx prisma migrate deploy` (add_deny_all_policies_bancos):
```
Applying migration `20260704050915_add_deny_all_policies_bancos`
All migrations have been successfully applied.
```
Resultado de npm run build (después de ambas migraciones):
```
✓ Compiled successfully in 5.9s
```

---

## [2026-07-04 05:35] Tarea 2.2: CRUD de cuentas bancarias en /bank-accounts
Estado: OK
Archivos modificados/creados:
- [validations/index.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/validations/index.ts) — agregado `CuentaBancariaSchema`.
- [bank-accounts.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/bank-accounts.ts) (nuevo) — `createBankAccount`, `updateBankAccount`, `toggleBankAccountStatus`, `deleteBankAccount` (desactiva si tiene movimientos, elimina si no), `getBankAccounts`, `getCuentasContablesBanco`.
- [bank-accounts/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/bank-accounts/page.tsx) (nuevo) — Server Component, patrón idéntico a `suppliers/page.tsx`.
- [BankAccountList.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/BankAccountList.tsx), [NewBankAccountModal.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/NewBankAccountModal.tsx), [EditBankAccountModal.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/EditBankAccountModal.tsx) (nuevos) — patrón calcado de `SupplierList.tsx` / `NewSupplierModal.tsx` / `EditSupplierModal.tsx`. El selector de cuenta contable filtra por `codigo: { startsWith: '1.1.01' }` y `aceptaMovimiento: true`.
- [Sidebar.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/layout/Sidebar.tsx) — agregado enlace "Bancos" → `/bank-accounts` (necesario para que la pantalla sea alcanzable desde la navegación, mismo patrón que el resto de módulos).
Resultado de npm run build:
```
✓ Compiled successfully in 7.1s
```
Resultado de prueba de verificación (crear, actualizar, eliminar una CuentaBancaria de prueba vinculada a la cuenta 1.1.01.01):
```
Cuenta contable encontrada: 1.1.01.01 - Caja General
CuentaBancaria creada: cmr5wsedw003iqgr824ia9e1h
PASS: CuentaBancaria guardada correctamente, vinculada a cuenta contable 1.1.01.01.
PASS: Actualización de CuentaBancaria funcionó correctamente.
PASS: CuentaBancaria eliminada correctamente (sin movimientos asociados).
🎉 TODAS LAS PRUEBAS DE 2.2 PASARON CORRECTAMENTE.
```
Registro de prueba eliminado al finalizar.

---

## [2026-07-04 05:52] Tarea 2.3: Importación de estado de cuenta (CSV/Excel)
Estado: OK
Archivos modificados/creados:
- [bank-accounts.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/bank-accounts.ts) — agregado `importMovimientosBancarios(cuentaBancariaId, fileName, rows)` (mismo patrón de `importProducts` en `src/app/(dashboard)/products/actions.ts`: recibe filas ya parseadas, valida fila por fila, acumula errores sin abortar el resto) y `getBankAccountDetail(id)`.
- [ImportMovimientosDialog.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/ImportMovimientosDialog.tsx) (nuevo) — calcado de `ImportProductsDialog.tsx`: parseo de CSV manual (split por línea/coma) o `.xlsx` con `exceljs` (`workbook.xlsx.load` + `worksheet.eachRow`), enviando solo los datos ya parseados al server action (el archivo nunca se sube directamente).
- [bank-accounts/[id]/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/bank-accounts/[id]/page.tsx) (nuevo) — página de detalle, Server Component.
- [BankAccountDetailClient.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/BankAccountDetailClient.tsx) (nuevo) — resumen de cuenta + tabla de movimientos + botón "Importar movimientos" + enlace a "Conciliar" (ruta usada por la Tarea 2.4).
Lógica de clasificación: `tipo = monto > 0 ? 'DEPOSITO' : 'RETIRO'`, `monto` se guarda siempre en valor absoluto, `conciliado: false`, `origenImportacion: file.name`.
Resultado de npm run build:
```
✓ Compiled successfully in 6.1s
```
Resultado de prueba de verificación (CSV real de 5 filas, `scripts/_test_movimientos_2d3.csv`, leído y parseado con la misma lógica del diálogo, luego insertado con la misma lógica del server action):
```
CSV leído: 5 filas de datos (excluyendo encabezado).
Movimientos creados: 5, errores: 0
PASS: se crearon los 5 MovimientoBancario esperados.
PASS: "Deposito cliente ABC" → tipo=DEPOSITO, monto=1500 (correcto).
PASS: "Pago de servicios" (monto -250.50) → tipo=RETIRO, monto=250.5 (correcto, sin signo negativo).
PASS: todos los movimientos tienen conciliado=false y origenImportacion="_test_movimientos_2d3.csv".
PASS: 3 depósitos y 2 retiros clasificados correctamente por signo.
🎉 TODAS LAS PRUEBAS DE 2.3 PASARON CORRECTAMENTE.
```
Registros y archivo CSV de prueba eliminados al finalizar.

---

## [2026-07-04 06:10] Tarea 2.4: Conciliación manual /bank-accounts/[id]/reconcile
Estado: OK
Archivos modificados/creados:
- [bank-accounts.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/bank-accounts.ts) — agregado `getReconciliationData(cuentaBancariaId)` y `reconciliarMovimiento(cuentaBancariaId, movimientoBancarioId, asientoContableId)`.
- [bank-accounts/[id]/reconcile/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/bank-accounts/[id]/reconcile/page.tsx) (nuevo) — Server Component.
- [ReconcileClient.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/bank-accounts/ReconcileClient.tsx) (nuevo) — dos columnas: movimientos bancarios sin conciliar (izquierda) y líneas de asiento elegibles (derecha), selección por click y botón "Conciliar Selección".
Lógica de elegibilidad (ambos lados, page.tsx y getReconciliationData): `AsientoContableLinea` filtradas por `cuentaId = cuentaBancaria.cuentaContableId` cuyo `AsientoContable` padre cumple `movimientosBancarios: { none: { conciliado: true } }` (relación agregada en la Tarea 2.1) — así un asiento ya conciliado no vuelve a aparecer como candidato.
`reconciliarMovimiento` valida: la cuenta bancaria pertenece a la empresa, el movimiento no está ya conciliado, el asiento tiene al menos una línea en la cuenta contable vinculada, y el asiento no tiene ya un movimiento conciliado apuntándole (previene doble conciliación) — solo entonces actualiza `conciliado: true, asientoContableId`.
Resultado de npm run build:
```
✓ Compiled successfully in 6.4s
```
Resultado de prueba de verificación (asiento de prueba #1 por $500, movimiento bancario de depósito por $500):
```
AsientoContable de prueba creado: #1 (cmr5x16us003mqg5cm5r9zigr)
MovimientoBancario de prueba creado: cmr5x16v2003rqg5carxcb4e0
PASS: el asiento aparece en la lista de líneas pendientes de conciliar (antes de conciliar).
Resultado de la conciliación: {"success":true,"message":"Movimiento conciliado correctamente."}
PASS: la conciliación se ejecutó exitosamente.
PASS: MovimientoBancario.conciliado=true y asientoContableId=cmr5x16us003mqg5cm5r9zigr guardados correctamente.
PASS: el asiento ya NO aparece como pendiente de conciliar (evita doble conciliación).
PASS: se rechazó correctamente la doble conciliación del mismo asiento.
🎉 TODAS LAS PRUEBAS DE 2.4 PASARON CORRECTAMENTE.
```
Registros de prueba eliminados al finalizar.

---

## [2026-07-04 06:28] Tarea 2.5: Flujo de caja proyectado /reports/cash-flow
Estado: OK
Verificación previa (requerida por el enunciado): `Factura.fechaVencimiento` **sí existe** en `prisma/schema.prisma` (línea 220), pero es opcional (`DateTime?`, puede ser `null`). `Compra.fechaVencimiento` es obligatorio (`DateTime`, confirmado, línea 502). Por lo tanto se usa `fechaVencimiento` de Factura cuando está presente, y solo se estima `fechaEmision + 30 días` para las filas donde sea `null` (no para todas las facturas).
Archivos creados:
- [reports/cash-flow/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/reports/cash-flow/page.tsx) — Server Component. Ingresos = `Factura.saldoPendiente` (excluye `estadoDgi: 'anulada'`) agrupado por vencimiento efectivo. Egresos = `Compra.saldoPendiente` (excluye `estadoPago` en `['pagada','anulada']`) agrupado por `fechaVencimiento`.
- [CashFlowView.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/reports/CashFlowView.tsx) — tabla con ingresos/egresos/neto por período + tarjetas de totales + aviso cuando hubo facturas sin fecha de vencimiento estimadas.
Decisión de diseño (dentro del alcance, no requiere confirmación de negocio): además de los 3 bloques pedidos (0-30/31-60/61-90 días), se agregaron 2 buckets adicionales — "Vencido" (ya vencido, antes de hoy) y "Más de 90 días" — para que ningún saldo pendiente desaparezca silenciosamente del reporte; los 3 bloques centrales corresponden exactamente a lo solicitado.
No se agregó enlace de navegación nuevo (mismo criterio que los reportes de la Fase 1d: se accede por URL directa `/reports/cash-flow`, sin entradas de sidebar por sub-reporte).
Resultado de npm run build:
```
✓ Compiled successfully in 5.9s
```
Resultado de prueba de verificación (5 facturas de prueba —incluyendo 1 sin fechaVencimiento y 1 anulada—, 3 compras de prueba —incluyendo 1 pagada—):
```
Vencido: ingresos=50, egresos=0, neto=50
0-30 días: ingresos=400, egresos=80, neto=320
31-60 días: ingresos=200, egresos=0, neto=200
61-90 días: ingresos=0, egresos=40, neto=-40
Más de 90 días: ingresos=0, egresos=0, neto=0
Facturas sin fecha de vencimiento (estimadas): 1
PASS: bucket Vencido = 50 ingresos (Factura 4), 0 egresos.
PASS: bucket 0-30 días = 400 ingresos (100+300 estimada), 80 egresos (Compra 1).
PASS: bucket 31-60 días = 200 ingresos (Factura 2), 0 egresos.
PASS: bucket 61-90 días = 0 ingresos, 40 egresos (Compra 2).
PASS: se detectó y estimó correctamente 1 factura sin fechaVencimiento (fallback emision+30).
PASS: totales correctos (ingresos=650 excluyendo factura anulada de 9999, egresos=120 excluyendo compra pagada de 500).
🎉 TODAS LAS PRUEBAS DE 2.5 PASARON CORRECTAMENTE.
```
Registros de prueba eliminados al finalizar.

---

# FIN FASE 2 — Bancos y Conciliación (5/5 tareas completadas)

Todas las tareas 2.1–2.5 quedaron en estado OK con build limpio y evidencia real de verificación. Por regla del roadmap, NO se avanza a la Fase 3 sin confirmación explícita del usuario.

---

## Resumen de Cambios (git diff --stat)
```
 src/lib/actions/invoices.ts          | 26 ++++++++++++++
 src/lib/actions/purchases.ts         | 27 ++++++++++++++-
 src/lib/actions/supplier-payments.ts | 13 ++++++-
 src/lib/contabilidad/asientos.ts     | 67 ++++++++++++++++++++++++++++++++++++
 4 files changed, 131 insertions(+), 2 deletions(-)
```

---

## [2026-07-04 20:00] Tarea 3.0: Completar auto-aprovisionamiento con Sucursal/Caja por defecto + backfill
Estado: OK
Archivos modificados/creados:
- [context.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/auth/context.ts) — se agregó la creación de una Sucursal ("Casa Matriz", código '001') y una Caja ("Caja Principal", código '001') por defecto en la transacción del auto-aprovisionamiento para nuevos usuarios.
- [backfill-sucursal-caja.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/scripts/backfill-sucursal-caja.ts) (nuevo) — script manual de backfill para regularizar las empresas en la base de datos local que carecen de Sucursal y Caja, agrupando los inserts en transacciones atómicas de Prisma.
Resultado de npm run build:
```
✓ Compiled successfully in 7.9s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (17/17) in 767.5ms
```
Resultado de la prueba de verificación:
```
--- INICIANDO PRUEBA DE INTEGRACIÓN ---
1. Ejecutando transacción de auto-aprovisionamiento para email: test-provision-1783213030510@example.com...
✓ Transacción completada con éxito. Empresa ID: cmr72zwci0000qgq8k0vnz23a, Usuario ID: cmr72zwff003mqgq8gttrku1x
2. Simulando llamada a getDefaults() para comprobar si lanza el error...
✓ Empresa encontrada: TEST COMPANY S.A.
✓ Cantidad de Sucursales: 1
  - Primera Sucursal: Casa Matriz (Código: 001)
  - Cantidad de Cajas en la sucursal: 1
    - Primera Caja: Caja Principal (Código: 001)
✓ VERIFICACIÓN EXITOSA: getDefaults() ya NO arrojará error de configuración incompleta.
3. Limpiando datos de prueba...
✓ Limpieza completada.
--- FIN DE LA PRUEBA ---
```

---

## [2026-07-04 20:50] Tarea 3.1: Cimientos de inventario por bodega
Estado: OK
Archivos modificados/creados:
- [schema.prisma](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/prisma/schema.prisma) — agregado el modelo `Bodega` e `InventarioBodega`, así como sus relaciones inversas en `Empresa`, `Sucursal` y `Producto`.
- [context.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/auth/context.ts) — agregada la creación de la Bodega Principal en el auto-aprovisionamiento.
- [route.ts (issuers)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/api/v1/issuers/route.ts) — agregada la creación de la Caja Principal y Bodega Principal si no existen para la sucursal.
- [backfill-bodegas.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/scripts/backfill-bodegas.ts) (nuevo) — script para regularizar las sucursales que no tienen ninguna bodega.
- [backfill-inventario-bodega.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/scripts/backfill-inventario-bodega.ts) (nuevo) — script para inicializar `InventarioBodega` con las cantidades actuales de `Producto.stockActual`.
Resultado de npm run build:
```
✓ Compiled successfully in 7.9s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (17/17) in 786.5ms
```
Resultado de prueba de verificación:
```
--- INICIANDO PRUEBA DE INTEGRACIÓN DE INVENTARIO BODEGA ---
1. Creando Empresa, Sucursal y Bodega de prueba...
2. Creando 2 Productos con stockActual conocido...
✓ Creados Producto A (ID: cmr74qzzk0006qgrsu1hrm856, stockActual: 15) y Producto B (ID: cmr74qzzq0008qgrsx4c0fszd, stockActual: 30)
3. Ejecutando lógica de backfill de InventarioBodega para esta empresa...
4. Consultando y validando cantidades de InventarioBodega...
  - InventarioBodega Producto A: cantidad = 15 (Esperado: 15)
  - InventarioBodega Producto B: cantidad = 30 (Esperado: 30)
✓ VERIFICACIÓN EXITOSA: Las cantidades coinciden exactamente con stockActual.
5. Limpiando datos de prueba...
✓ Limpieza completada.
--- FIN DE LA PRUEBA ---
```
Salida de la ejecución de backfill en base de datos local:
- `backfill-bodegas.ts`:
  ```
  Iniciando script de backfill para Bodega...
  Encontradas 150 sucursales sin bodega.
  ...
  ================ RESUMEN DEL BACKFILL DE BODEGAS ================
  Total de sucursales corregidas: 150
  ==================================================================
  ```
- `backfill-inventario-bodega.ts`:
  ```
  Iniciando script de backfill para InventarioBodega...
  Encontradas 1 empresas para procesar.

  ================ PROCESANDO INVENTARIOS POR EMPRESA ================
  Empresa: "ERP Panamá Solutions S.A." (ID: cmr5sltb00004qgwc0vxf1xps)
    Target Bodega: "Bodega Principal" (Código: 001, ID: cmr74r6g9000jqgc8getxhtcm)
    ✓ Productos procesados: 150 (actualizados o creados)
  =====================================================================
  ```

---

## [2026-07-04 21:05] Tarea 3.2: Conectar InventarioBodega a compras, facturas y POS (backend)
Estado: OK
Archivos modificados/creados:
- [bodegas.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/bodegas.ts) (nuevo) — contiene las funciones de backend `getBodegas`, `resolverBodegaId` y `moverInventarioBodega` para gestionar stock a nivel transaccional.
- [index.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/validations/index.ts) — se agregaron las propiedades `bodegaId` como opcionales y nulas en `PurchaseSchema` e `InvoiceSchema`.
- [purchases.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/purchases.ts) — en `createPurchase`, se llama a `resolverBodegaId` y se incrementa el inventario de la bodega correspondiente usando `moverInventarioBodega`.
- [invoices.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/invoices.ts) — en `createInvoice` y `createInvoicePOS`, se llama a `resolverBodegaId` y se decrementa el inventario de la bodega correspondiente usando `moverInventarioBodega`.
Resultado de npm run build:
```
✓ Compiled successfully in 7.4s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (17/17) in 750.3ms
```
Resultado de prueba de verificación:
```
--- INICIANDO PRUEBA DE TRANSACCIONES DE BODEGA ---
1. Creando Empresa...
   Generando plan de cuentas...
2. Creando Usuario...
3. Creando Sucursal, Caja y Bodega...
   Configurando secuencia inicial en: 446054
4. Creando Cliente y Proveedor...
5. Creando Producto con stock inicial...
--- COMPRA DE 5 UNIDADES (sin bodegaId) ---
   Producto stockActual: 15 (Esperado: 15)
   InventarioBodega cantidad: 15 (Esperado: 15)
--- VENTA POS DE 3 UNIDADES (sin bodegaId) ---
   Producto stockActual: 12 (Esperado: 12)
   InventarioBodega cantidad: 12 (Esperado: 12)
--- VENTA FACTURA DE 2 UNIDADES (con bodegaId explícito) ---
   Redirect capturado correctamente (proceso exitoso).
   Producto stockActual: 10 (Esperado: 10)
   InventarioBodega cantidad: 10 (Esperado: 10)
✓ VERIFICACIÓN DE TRANSACCIONES EXITOSA: Todos los movimientos afectaron correctamente a InventarioBodega.
```

---

## [2026-07-04 21:10] Tarea 3.3: Selector visible de bodega (solo si hay 2+)
Estado: OK
Archivos modificados/creados:
- [page.tsx (invoices/new)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/invoices/new/page.tsx) — se realiza el fetch de bodegas mediante `getBodegas()` y se le pasa como prop al formulario.
- [InvoiceForm.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/invoices/InvoiceForm.tsx) — se recibe la prop `bodegas` y se expone el dropdown `Bodega de Despacho` en la tarjeta lateral de condiciones únicamente si hay 2 o más bodegas. Se vincula al envío mediante un hidden input.
- [page.tsx (purchases/new)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/purchases/new/page.tsx) — se realiza el fetch de bodegas y se le pasa como prop a `NewPurchaseForm`.
- [NewPurchaseForm.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/purchases/NewPurchaseForm.tsx) — se recibe la prop `bodegas` y se expone el selector `Bodega de Entrada` en el formulario principal si hay 2 o más bodegas. Se agrega a `formData` en el submit si está visible.
- [page.tsx (pos)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/pos/page.tsx) — se realiza el fetch de bodegas y se le pasa como prop a `QuickSalePOS`.
- [QuickSalePOS.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/pos/QuickSalePOS.tsx) — se recibe la prop `bodegas` y se expone el selector de bodega en la barra superior al lado del buscador de productos si hay 2 o más bodegas. Se envía `bodegaId` en el payload de `createInvoicePOS`.
Resultado de npm run build:
```
✓ Compiled successfully in 7.7s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (17/17) in 773.4ms
```
Resultado de prueba de verificación:
```
--- INICIANDO PRUEBA DE VISIBILIDAD DE SELECTORES (UI) ---
1. Creando Empresa 1 (1 sola bodega)...
2. Creando Empresa 2 (2 bodegas)...
3. Evaluando getBodegas() para Empresa 1...
   Empresa 1 - Cantidad de bodegas: 1 (Esperado: 1)
4. Evaluando getBodegas() para Empresa 2...
   Empresa 2 - Cantidad de bodegas: 2 (Esperado: 2)
5. Validando archivos de código fuente de UI...
   InvoiceForm check (bodegas.length >= 2): PASSED
   NewPurchaseForm check (bodegas.length >= 2): PASSED
   QuickSalePOS check (bodegas.length >= 2): PASSED
✓ VERIFICACIÓN DE SELECTORES DE UI EXITOSA: El backend provee correctamente la cantidad de bodegas y la UI aplica la visibilidad condicional (solo si hay 2+).
```

---

## [2026-07-04 21:24] Tarea 3.0: Gestión de Bodegas
Estado: OK
Archivos modificados/creados:
- [index.ts (validations)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/validations/index.ts) — se agregó `WarehouseSchema`.
- [bodegas.ts (actions)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/bodegas.ts) — se implementaron las Server Actions `createBodega`, `updateBodega` y `deleteBodega`.
- [NewWarehouseModal.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/warehouses/NewWarehouseModal.tsx) (nuevo) — componente modal para registrar bodegas.
- [EditWarehouseModal.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/warehouses/EditWarehouseModal.tsx) (nuevo) — componente modal para editar bodegas.
- [WarehouseList.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/warehouses/WarehouseList.tsx) (nuevo) — componente de lista de bodegas.
- [page.tsx (warehouses)](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(dashboard)/warehouses/page.tsx) (nuevo) — página de visualización de bodegas.
- [Sidebar.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/layout/Sidebar.tsx) — enlace agregado a la barra de navegación lateral.
Resultado de npm run build:
```
✓ Compiled successfully in 7.9s
  Running TypeScript ...
  Collecting page data using 23 workers ...
  Generating static pages using 23 workers (17/17) in 715.4ms
```
Resultado de prueba de verificación:
```
--- INICIANDO PRUEBA DE GESTIÓN DE BODEGAS (TAREA 3.0) ---
1. Creando Empresa...
2. Creando Sucursal...
3. Creando Bodega con createBodega...
   Bodega creada con ID: cmr7647r60004qg1wjak9wt7j, Nombre: Bodega de Prueba
4. Editando Bodega con updateBodega...
   Bodega editada correctamente. Nuevo nombre: Bodega de Prueba Editada
5. Eliminando Bodega con deleteBodega...
   Bodega eliminada correctamente de la base de datos.
✓ VERIFICACIÓN DE GESTIÓN DE BODEGAS EXITOSA: Crear, editar y eliminar funcionan a nivel de base de datos y Server Actions.
```

### Planeación de Tarea 3.4: Lotes con vencimiento
- **Archivos a modificar**:
  - `prisma/schema.prisma` — Agregar campo `controlaLotes` al modelo `Producto` (línea 197 aprox.) y definir el nuevo modelo `LoteProducto`.
  - `src/lib/validations/index.ts` — Agregar los campos opcionales `numeroLote` y `fechaVencimiento` a `PurchaseItemSchema`.
  - `src/lib/actions/purchases.ts` — Modificar `createPurchase` (procesamiento de ítems en el bucle de la línea 151) para registrar el `LoteProducto` en la base de datos si el producto tiene `controlaLotes === true`.
  - `src/lib/actions/invoices.ts` — Modificar `createInvoice` (línea 267) y `createInvoicePOS` (línea 614) para deducir stock en orden FEFO (fecha de vencimiento ascendente) de la tabla `LoteProducto` cuando el producto vendido tiene `controlaLotes === true`.
  - `src/app/(dashboard)/products/expiring/page.tsx` (nuevo) — Crear una página de consulta para ver los lotes próximos a vencer.
---

### Ejecución de Tarea 3.4: Lotes con vencimiento
- **Cambios realizados**:
  - `prisma/schema.prisma` — Agregado `controlaLotes` a `Producto` y creado modelo `LoteProducto`.
  - `src/lib/validations/index.ts` — Agregado `numeroLote` y `fechaVencimiento` a `PurchaseItemSchema`.
  - `src/lib/actions/purchases.ts` — Modificado `createPurchase` para guardar `LoteProducto` cuando se compran productos con control de lotes.
  - `src/lib/actions/invoices.ts` — Modificados `createInvoice` y `createInvoicePOS` para descontar existencias por lotes bajo criterio FEFO.
  - `src/app/(dashboard)/products/expiring/page.tsx` — Nueva página para listar lotes activos ordenados por vencimiento.
- **Resultado del Build**: Exitoso (Next.js compiló correctamente).
- **Evidencia de Prueba de Integración**:
```
--- INICIANDO PRUEBA DE CONTROL DE LOTES Y DEDUCCIÓN FEFO ---
1. Creando Empresa...
   Generando plan de cuentas...
2. Creando Usuario...
3. Creando Sucursal, Caja y Bodega...
4. Creando Cliente y Proveedor...
5. Creando Producto con controlaLotes = true...
6. Registrando Compra de Lote A (Vence antes)...
   Registrando Compra de Lote B (Vence después)...
   Lote A - Disponible: 5 (Esperado: 5)
   Lote B - Disponible: 10 (Esperado: 10)
7. Registrando Venta de 3 unidades (debería descontar solo de Lote A)...
   Lote A - Disponible: 2 (Esperado: 2)
   Lote B - Disponible: 10 (Esperado: 10)
8. Registrando Venta de 4 unidades (debería agotar Lote A y restar 2 de Lote B)...
   Lote A - Disponible: 0 (Esperado: 0)
   Lote B - Disponible: 8 (Esperado: 8)
✓ VERIFICACIÓN DE CONTROL DE LOTES Y DEDUCCIÓN FEFO EXITOSA.
Limpiando datos de la prueba...
✓ Limpieza completada.
--- FIN DE LA PRUEBA ---
```
---

### Ejecución de Tarea 3.5: Código de barras
- **Cambios realizados**:
  - `prisma/schema.prisma` — Cambiado `codigoBarras` en `Producto` para que sea `@unique`. Creada la migración manual correspondiente para evitar problemas interactivos de TTY.
  - `src/app/api/products/search/route.ts` — Agregada búsqueda por código de barras (`codigoBarras` contains `query`) en la API de productos.
  - `src/app/(dashboard)/pos/page.tsx` — Agregado el campo `codigoBarras` al select y mapeo de productos cargados en el POS.
  - `src/components/pos/QuickSalePOS.tsx` — Agregado `codigoBarras` al filtrado en memoria y añadido `useEffect` que añade el producto al carrito de forma inmediata si se detecta un escaneo con coincidencia exacta de código de barras.
- **Resultado del Build**: Exitoso (Next.js compiló correctamente).
- **Evidencia de Prueba de Integración**:
```
--- INICIANDO PRUEBA DE BÚSQUEDA POR CÓDIGO DE BARRAS ---
1. Creando Empresa...
2. Creando Producto con código de barras: BARCODE-1783218675304...
3. Llamando al API Route /api/products/search con el código de barras...
   Respuesta recibida: [
  {
    id: 'cmr76cvwf0002qgg0unyepgzy',
    descripcion: 'Producto con código de barras de prueba',
    codigoInterno: 'INT-1783218675304',
    stockActual: 10
  }
]
   Producto encontrado correctamente: Producto con código de barras de prueba (INT-1783218675304)
✓ VERIFICACIÓN DE BÚSQUEDA POR CÓDIGO DE BARRAS EXITOSA.
Limpiando datos de la prueba...
✓ Limpieza completada.
--- FIN DE LA PRUEBA ---
```

### Planeación de Tarea 3.6: Kits / productos compuestos (RIESGO ALTO)
- **Archivos a modificar**:
  - `prisma/schema.prisma` — Agregar campo `esKit` al modelo `Producto` (línea 197 aprox.) y definir los modelos `ProductoKit` y `ProductoKitComponente` con sus relaciones correspondientes.
  - `src/lib/actions/invoices.ts` — Modificar `createInvoice` (cálculo de costos y descuento de inventario en bucle de ítems) y `createInvoicePOS` (mismas secciones) para que si un producto es un kit, se calcule el costo contable y se descuenten las existencias sobre cada uno de sus componentes recursivamente (multiplicando la cantidad vendida del kit por la cantidad del componente).

### Ejecución de Tarea 3.6: Kits / productos compuestos
- **Estado real encontrado al retomar** (verificado leyendo código, no PROGRESS.md): schema y `createInvoice` ya tenían la lógica de kits implementada en una sesión anterior interrumpida, pero **`createInvoicePOS` nunca fue tocado** (confirmado por este mismo archivo, que dejaba la tarea en fase de "Planeación" sin sección de "Ejecución"). Tampoco existía el campo `activo` en `ProductoKit` pese a estar en la especificación original.
- **Cambios realizados**:
  - `prisma/schema.prisma` — Agregado `activo Boolean @default(true)` a `ProductoKit` (faltaba respecto a la especificación).
  - `prisma/migrations/20260705120000_add_kit_activo/migration.sql` (nuevo) — migración aditiva para la columna anterior.
  - `src/lib/actions/invoices.ts`:
    - `createInvoice`: se agregó la verificación `kitInfo.activo` (antes solo chequeaba `esKit && kitInfo`) tanto en `getProductoCosto` como en `descontarStock`, para no tratar como kit uno desactivado.
    - `createInvoicePOS`: se replicó el mismo patrón que ya tenía `createInvoice` — la consulta de productos ahora incluye `kitInfo.componentes.productoComponente`; se agregó `getProductoCosto` (costo recursivo por componentes) y se reemplazó el bucle plano de descuento de stock por la función recursiva `descontarStock` (si es kit activo, descuenta cada componente recursivamente incluyendo su propia lógica de lotes FEFO; si no, aplica el mismo comportamiento de antes).
- **Resultado de npm run build**: Exitoso, sin errores de TypeScript, migración aplicada sin pendientes.
- **Evidencia de prueba de integración** (kit con Componente A costo=10 cantidad=2 y Componente B costo=20 cantidad=3, vendido 1 kit vía `createInvoicePOS`):
```
Resultado de createInvoicePOS: {"success":true,"invoice":{"numeroCompleto":"FE-001-001-01-00000002","totalNeto":100}}
Componente A stockActual: 98 (Esperado: 98)
Componente B stockActual: 97 (Esperado: 97)
Kit stockActual: 0 (Esperado: 0, sin cambios)
FacturaItem.costoUnitario (costo del kit vendido): 80 (Esperado: 80 = 2*10 + 3*20)
AsientoContable COSTO_VENTA: Debe=80 Haber=80 (Esperado: 80/80)
🎉 TODAS LAS PRUEBAS DE TAREA 3.6 (KITS EN POS) PASARON CORRECTAMENTE.
```
Registros y scripts de prueba eliminados al finalizar.
- **Limitación conocida, fuera de alcance de esta tarea**: no existe ninguna UI ni Server Action para crear/editar un `ProductoKit` y sus componentes desde la aplicación (ni para activar `controlaLotes` desde el formulario de producto) — hoy solo son configurables directamente en base de datos. La especificación de esta fase no pidió esa UI (solo modelos + lógica de venta), así que no se construyó, pero se deja anotado como riesgo de usabilidad para una fase futura.
- **Hallazgo adicional (fuera de alcance)**: las tablas nuevas de Fase 3 (`Bodega`, `InventarioBodega`, `LoteProducto`, `ProductoKit`, `ProductoKitComponente`) no tienen las políticas RLS "Deny client access" que sí tiene el resto de tablas del proyecto (patrón de `20260630230000_add_deny_all_policies`). No se corrigió por no ser parte de las 4 tareas solicitadas ni de los flujos de venta/costo — requiere confirmación explícita antes de tocar (mismo criterio que el resto de decisiones de esta fase).

---

# UI para activar lotes y gestionar kits

## PASO 0: Investigación previa (antes de tocar código)

**No existe un `ProductForm.tsx` compartido.** Hay dos formularios independientes, cada uno inline en su propia página (sin componente de formulario reutilizado entre ambos):
- `src/app/(dashboard)/products/new/page.tsx` — componente `NewProductPage`. Formulario plano (sin tabs). Llama a `createProduct(prevState, formData)` vía `useActionState` (import de `@/lib/actions/products`).
- `src/app/(dashboard)/products/[id]/page.tsx` — componente `EditProductPage` → `EditProductForm`. Ya usa `Tabs`/`TabsList`/`TabsContent` de `@/components/ui/tabs` con pestañas existentes: **General, Precios, Inventario, Multimedia, Historial**. Llama a `updateProduct(product.id, prevState, formData)` vía `useActionState`.

**Nombres exactos de los Server Actions confirmados**: `createProduct` y `updateProduct`, ambos en `src/lib/actions/products.ts`. Ninguno de los dos lee ni guarda `controlaLotes` hoy (confirmado por grep: `controlaLotes` no aparece en `products.ts`).

**`ProductSchema`** (`src/lib/validations/index.ts`) **no tiene el campo `controlaLotes`** actualmente — confirmado leyendo el archivo completo.

**Patrón de booleanos ya establecido en este mismo archivo** (`[id]/page.tsx`, campo `activo` — línea ~411): no existe un componente `Checkbox`/`Switch` en `src/components/ui/`, así que el toggle "Activo/Inactivo" se resuelve con `<Select name="activo" value={activo} onValueChange={setActivo}>` (Radix `Select.Root` soporta `name` y renderiza un `<select>` nativo oculto para participar en el `FormData` del `<form action={formAction}>`). Se reutilizará el mismo patrón (`Select` con Sí/No) para `controlaLotes`, en vez de introducir un primitivo nuevo, para mantener consistencia visual y de submit.

**Patrón de búsqueda de productos en `InvoiceForm.tsx`** (`src/components/invoices/InvoiceForm.tsx`, línea ~384): NO llama a `/api/products/search` por cada tecla — recibe la lista completa de productos de la empresa como prop desde el Server Component padre, y filtra en memoria (`filteredProducts`) sobre un `<Input>` de búsqueda con un dropdown de resultados clickeables. Se replicará este mismo patrón (fetch único + filtro en memoria) para el buscador de componentes del kit, en vez de pegarle a la API en cada tecla.

Con esto, se procede a TAREA A y TAREA B tal como fueron especificadas.

## [2026-07-05] Tarea A: Activar lotes desde el formulario de producto
Estado: OK
Archivos modificados:
- `src/lib/validations/index.ts` — agregado `controlaLotes: z.boolean().optional()` a `ProductSchema`.
- `src/lib/actions/products.ts` — `createProduct` y `updateProduct` ahora leen `formData.get('controlaLotes') === 'true'`, lo validan vía `ProductSchema` y lo persisten en el `data: {...}` de cada Server Action.
- `src/app/(dashboard)/products/new/page.tsx` — agregado selector "Control de Lotes y Vencimientos" (Sí/No) en la tarjeta de Inventario Inicial, mismo patrón `Select` con `name` que ya usa el resto del formulario para booleanos.
- `src/app/(dashboard)/products/[id]/page.tsx` — mismo selector agregado en la pestaña "Inventario", junto a Stock Actual/Stock Mínimo, con estado inicial tomado de `product.controlaLotes`.
Resultado de npm run build:
```
✓ Compiled successfully in 9.4s
```

## [2026-07-05] Tarea B: Gestión de Kits (UI + Server Actions)
Estado: OK
Archivos creados/modificados:
- `src/lib/actions/product-kits.ts` (nuevo):
  - `getKitDeProducto(productoId)` — retorna el `ProductoKit` (con `activo` y componentes, incluyendo descripción/costoUnitario del producto componente) o `null` si no existe/no pertenece a la empresa.
  - `getProductosParaKit(excluirProductoId)` — helper adicional (no pedido explícitamente pero necesario para el buscador): lista productos activos, `esKit: false` y distintos del producto actual, para poblar el buscador de componentes sin permitir seleccionar kits ni el propio producto.
  - `crearOActualizarKit(productoId, componentes)` — en una transacción: marca `Producto.esKit = true`, hace `upsert` del `ProductoKit` (`activo: true`), y reemplaza sus `ProductoKitComponente` (borra los que ya no están, actualiza cantidad de los que siguen, crea los nuevos). Valida antes de tocar la BD: al menos 1 componente, cantidades > 0, sin duplicados, componentes pertenecientes a la empresa, sin auto-referencia, y sin kits anidados (rechaza si algún componente tiene `esKit: true`).
  - `desactivarKit(productoId)` — pone `activo: false` en el `ProductoKit` sin borrarlo (preserva el vínculo histórico de `FacturaItem`/`AsientoContable` con ventas ya realizadas).
- `src/app/(dashboard)/products/[id]/page.tsx` — nueva pestaña "Kit" (`TabsTrigger`/`TabsContent value="kit"`, entre "Inventario" y "Multimedia") con el componente `KitTab`: toggle "¿Este producto es un kit?" (mismo patrón `Select` Sí/No), buscador de componentes calcado del patrón de `InvoiceForm.tsx` (lista completa vía `getProductosParaKit` + filtro en memoria, sin golpear ninguna API por cada tecla), tabla editable de componentes con cantidad y costo total del kit calculado en vivo (`Σ costoUnitario × cantidad`), y un único botón "Guardar Kit" (`type="button"`, fuera del `<form>` principal de `updateProduct` para no interferir con él) que llama a `crearOActualizarKit` si el toggle está en "Sí", o a `desactivarKit` si estaba activo y se apagó el toggle.

**Decisión de diseño tomada sin pausar** (no ambigua, consecuencia directa de la lógica de venta ya construida en la Tarea 3.6): `crearOActualizarKit` setea `Producto.esKit = true` porque `createInvoice`/`createInvoicePOS` usan exactamente ese flag (`prod.esKit && prod.kitInfo && prod.kitInfo.activo`) para decidir si tratar la venta como kit. Sin este flag, guardar un `ProductoKit` desde la UI no tendría ningún efecto en la venta. `desactivarKit` deliberadamente NO revierte `esKit` a `false`: como la lógica de venta ya revisa `kitInfo.activo`, un kit desactivado se vende como producto normal sin necesidad de tocar `esKit`, y mantenerlo en `true` también sigue bloqueando que ese mismo producto se use como componente de otro kit más adelante (protección extra contra anidados, consistente con la regla de negocio ya definida).

Resultado de npm run build:
```
✓ Compiled successfully in 5.7s
```

## PASO FINAL: Prueba de integración conjunta (Tarea A + Tarea B)
Script temporal `scripts/_test_lotes_kits_ui.ts` (mismo mecanismo de mock de `next/headers`/`@/lib/firebase/admin` ya usado en la verificación de la Tarea 3.6, para poder invocar los Server Actions reales fuera de una request de Next.js), contra la empresa de desarrollo local. Eliminado al finalizar.
```
--- INICIANDO PRUEBA DE UI: LOTES + KITS ---
Usando empresa de desarrollo: cmr5sltb00004qgwc0vxf1xps
Resultado de updateProduct (activar controlaLotes): {"message":"Producto actualizado correctamente","success":true}
Producto.controlaLotes tras updateProduct: true (Esperado: true)
Resultado de crearOActualizarKit: {"success":true,"message":"Kit guardado correctamente."}
Kit guardado (getKitDeProducto): {"id":"cmr78psbp000bqgjkof28tct3","activo":true,"componentes":[{"productoComponenteId":"cmr78psbb0005qgjka0h13ta5","cantidad":2,"codigoInterno":"TESTUI-...-COMPA","descripcion":"Componente A (UI)","costoUnitario":3},{"productoComponenteId":"cmr78psbe0007qgjk9so71q9y","cantidad":1,"codigoInterno":"TESTUI-...-COMPB","descripcion":"Componente B (UI)","costoUnitario":7}]}
Producto.esKit tras crearOActualizarKit: true (Esperado: true)
Resultado de intentar auto-referencia: {"success":false,"error":"Un producto no puede ser componente de sí mismo."}
Resultado de intentar kit anidado: {"success":false,"error":"\"Kit de prueba (UI)\" ya es un kit y no puede usarse como componente de otro kit (no se permiten kits anidados)."}
🎉 TODAS LAS PRUEBAS DE UI (LOTES + KITS) PASARON CORRECTAMENTE.
```
Registros y script de prueba eliminados al finalizar. Build final verificado limpio nuevamente después de borrar el script temporal.

**Nota pendiente (no bloqueante, no tocada)**: sigue sin resolverse el hallazgo de Fase 3 sobre políticas RLS faltantes en las tablas nuevas (`Bodega`, `InventarioBodega`, `LoteProducto`, `ProductoKit`, `ProductoKitComponente`) — no era parte del alcance de esta tarea (UI de lotes/kits) y requiere confirmación explícita antes de tocar migraciones de seguridad.

---

## [2026-07-06] Sesión de Estabilización — Fix 1: gating de webhook/whatsapp

**Discovery:** `src/lib/integrations/webhooks.ts#dispatchWebhookEvent` y `src/lib/integrations/whatsapp.ts#enviarWhatsAppFactura` ya consultan `Empresa.webhookUrl` y `Empresa.whatsappPhone/whatsappToken` respectivamente ANTES de intentar cualquier llamada de red, devolviendo `{success: false, message: '...no configurado...'}` de inmediato si faltan. No existe una tabla de configuración separada (a diferencia de `ConfiguracionFacturacionElectronica` para DGI) — los campos viven directo en `Empresa`. Confirmado: 0 empresas (local y producción) tienen estos campos configurados hoy.

**Fix:** Ninguno necesario en código — el guard ya existe y es correcto (falla silenciosa, cero intentos de red). Se verificó con un test real (`global.fetch` parcheado para detectar cualquier llamada): 0 llamadas a `fetch()` al invocar ambas funciones contra una empresa sin configurar. Script de prueba eliminado tras confirmar.

Estado: OK (sin cambios de código, solo verificación)

## [2026-07-06] Sesión de Estabilización — Fix 2: extraer `crearFacturaCompleta()` compartida

**Discovery:** `createInvoice` y `createInvoicePOS` (`src/lib/actions/invoices.ts`) tenían ~300 líneas de lógica prácticamente duplicada (numeración vía `Secuencia`, cálculo de totales/ITBMS con descuento, costo de kits, `generarAsientoFactura`/`generarAsientoCostoVenta`/`generarAsientoCobro`, descuento de stock con soporte de kits/lotes, `incrementDocumentUsage`). Mientras tanto, `POST /api/v1/invoices` (API externa, activa y documentada desde 2026-06-22) tenía una implementación paralela y mucho más pobre: `numeroCompleto = 'TEMP-' + Date.now()` en vez de `Secuencia`, sin llamar a `generarAsientoFactura`/`generarAsientoCostoVenta`, sin descontar stock, y con un chequeo de límite de plan hardcodeado (100/100/500 por `planType`) que duplicaba —de forma distinta e incorrecta— la lógica real de `canCreateInvoice`/`DocumentUsage`.

**Fix:** Se extrajo toda la lógica común a `src/lib/services/invoiceCreation.ts#crearFacturaCompleta()` (incluye validación de cliente/productos por tenant, `canCreateInvoice`, numeración, cálculo de totales, asientos contables, descuento de stock con kits/lotes, pago+asiento de cobro si es contado, e `incrementDocumentUsage`). Los tres call sites ahora llaman a la misma función:
- `createInvoice`/`createInvoicePOS`: conservan su propio parsing (FormData+Zod vs objeto plano) y su propio post-procesamiento (timbrado DGI/webhook/WhatsApp vía `after()`, redirect vs JSON), pero delegan la creación completa de la factura al servicio.
- `POST /api/v1/invoices/route.ts`: ahora genera numeración fiscal real, asientos contables reales y descuenta stock real (incluyendo kits/lotes, que antes ni siquiera contemplaba) — exactamente igual que si la factura viniera de la UI. Se agregó además un registro de `Auditoria` específico de este endpoint (`source: 'api-externa'`) para trazabilidad de integradores externos, ya que los flujos internos no lo tenían pero la API pública sí lo hacía antes y se conservó.

Archivos modificados/creados:
- `src/lib/services/invoiceCreation.ts` (nuevo)
- `src/lib/actions/invoices.ts` (createInvoice/createInvoicePOS refactorizados para usar el servicio)
- `src/app/api/v1/invoices/route.ts` (reescrito para usar el servicio en vez del bypass)

Resultado de `npx tsc --noEmit`: limpio.
Resultado de `npm run build`: limpio.

Resultado de prueba de integración (`crearFacturaCompleta` con datos reales, empresa/producto/cliente temporales, limpiados al finalizar):
```
1. numeroCompleto=FE-001-001-01-00000001 (formato fiscal real, no TEMP-) ✅
2. Stock: 20 → 17 tras vender 3 unidades ✅
3. Asientos generados: FACTURA, COSTO_VENTA, COBRO (3, como se espera para venta de contado) ✅
4. Balance de Comprobación: Total Debe=822.00, Total Haber=822.00 (cuadra) ✅
   totalNeto=321 (300 subtotal + 21 ITBMS 7%) ✅
```

**Limitación de la prueba (transparente):** no se pudo probar el endpoint HTTP `POST /api/v1/invoices` de punta a punta (con una request real) porque no hay `NEXT_PUBLIC_FIREBASE_API_KEY` (u otra credencial web de Firebase) configurada localmente para mintear una cookie de sesión real — el mismo tipo de limitación de entorno ya documentada en sesiones anteriores. En su lugar se probó `crearFacturaCompleta()` directamente, que es literalmente la misma función que la ruta ahora invoca (la ruta es un wrapper delgado de parseo de JSON + esta función), por lo que la cobertura de la lógica de negocio es equivalente.

Estado: OK

### Pendientes futuros / fuera de alcance (no implementados en esta sesión, solo anotados)
- El endpoint externo `POST /api/v1/invoices` no dispara `dispatchWebhookEvent`/`enviarWhatsAppFactura`/timbrado DGI tras crear la factura (a diferencia de `createInvoice`/`createInvoicePOS`) — no se pidió explícitamente y se dejó fuera para no expandir el alcance de este fix.
- El campo `observaciones` que el endpoint externo recibe en el body nunca se persiste en ningún lado (tampoco lo hacía antes) — no es una regresión de este fix, pero quedó como comportamiento preexistente sin resolver.
- Prueba end-to-end real vía HTTP del endpoint externo (con cookie de sesión real) sigue bloqueada por falta de credenciales web de Firebase en el entorno local — si se necesita en el futuro, requeriría configurar `NEXT_PUBLIC_FIREBASE_API_KEY` (u otra) localmente para mintear un ID token real.
- Los sistemas DGI duplicados y el kill-switch `PAC_INTEGRATION_ENABLED` quedaron explícitamente fuera de alcance de esta sesión (congelados por decisión previa), no se tocaron.


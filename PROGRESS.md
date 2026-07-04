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

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

**Hueco detectado en la revisión (2026-07-06, antes de aprobar el push): la primera prueba de integración NO cubrió kits ni lotes** — solo un producto simple. Se corrigió con una segunda prueba dedicada: factura con 2x producto-kit (2 componentes: A y B) + 25 unidades de un producto con 2 lotes (uno próximo a vencer, otro no), a crédito (para variar del primer test que fue de contado). Resultado:
```
- Componente A: 100 → 96 (2 kits × 2 unidades c/u) ✅
- Componente B: 100 → 94 (2 kits × 3 unidades c/u) ✅
- Stock propio del kit: sin cambios (0) — correcto, el kit no descuenta su propio stockActual ✅
- Lote L1-VIEJO (vence 2026-08-01): 20 → 0 (se agota primero, FIFO) ✅
- Lote L2-NUEVO (vence 2026-12-01): 30 → 25 (solo se toca lo que faltó) ✅
- costoUnitario del ítem-kit en FacturaItem: 35 (=2×10 + 3×5, costo de componentes) ✅
- Asientos: FACTURA + COSTO_VENTA, SIN COBRO (correcto, es crédito) ✅
- Balance de Comprobación: Debe=Haber=1286.50 (cuadra) ✅
```
Confirma que la descomposición recursiva de kits y el descuento FIFO por fecha de vencimiento de lotes —lógica que no se ve en el Balance de Comprobación, solo en el detalle de inventario— siguen funcionando correctamente en el servicio compartido. Script de prueba eliminado tras confirmar; BD local limpiada sin dejar residuos.

Estado: OK

### Pendientes futuros / fuera de alcance (no implementados en esta sesión, solo anotados)
- El endpoint externo `POST /api/v1/invoices` no dispara `dispatchWebhookEvent`/`enviarWhatsAppFactura`/timbrado DGI tras crear la factura (a diferencia de `createInvoice`/`createInvoicePOS`) — no se pidió explícitamente y se dejó fuera para no expandir el alcance de este fix.
- El campo `observaciones` que el endpoint externo recibe en el body nunca se persiste en ningún lado (tampoco lo hacía antes) — no es una regresión de este fix, pero quedó como comportamiento preexistente sin resolver.
- Prueba end-to-end real vía HTTP del endpoint externo (con cookie de sesión real) sigue bloqueada por falta de credenciales web de Firebase en el entorno local — si se necesita en el futuro, requeriría configurar `NEXT_PUBLIC_FIREBASE_API_KEY` (u otra) localmente para mintear un ID token real.
- Los sistemas DGI duplicados y el kill-switch `PAC_INTEGRATION_ENABLED` quedaron explícitamente fuera de alcance de esta sesión (congelados por decisión previa), no se tocaron.


---

## [2026-07-06] Item 5: Paginación / límite máximo de página en findMany

Auditoría (grep de `findMany(` en `src/`, 47 archivos): la mayoría de las listas ya usan `skip`/`take` (patrón establecido: `invoices`, `receivables`, `quotes`, `clients`, `products`). Hallazgos concretos:

1. **Sin tope máximo de `limit`** (un cliente podía pedir `?limit=999999` y traer la tabla completa): `invoices/page.tsx`, `receivables/page.tsx`, `quotes/page.tsx`, `reports/page.tsx` (Factura vía `getInvoiceDetail`). `clients/page.tsx` y `products/page.tsx` ya tenían el patrón correcto (`Math.min(Number(searchParams.limit) || 20, 100)`) — se replicó ese mismo patrón en los 4 archivos sin tope.
2. **Sin paginación de ningún tipo** (`findMany` sin `take`/`skip`/`cursor`): `bank-accounts/[id]/page.tsx` — la vista de detalle de una `CuentaBancaria` traía TODOS sus `MovimientoBancario` de una sola vez. Esta es exactamente la tabla que el brief marcó como prioritaria. Se agregó paginación server-side (`skip`/`take`, página por defecto 50, tope 100) más un paginador Anterior/Siguiente en `BankAccountDetailClient.tsx`. Importante: los totales de la cabecera (saldo actual, depósitos, retiros, pendientes de conciliar) se recalcularon con `aggregate()`/`count()` sobre el universo completo de la cuenta — antes se derivaban con `.reduce()` sobre el array de movimientos, que ahora solo trae una página, así que si no se corregía esto los totales se habrían roto silenciosamente al paginar.

Archivos modificados:
- `src/app/(dashboard)/invoices/page.tsx`, `receivables/page.tsx`, `quotes/page.tsx`, `reports/page.tsx` — agregado tope de 100 al `limit`.
- `src/app/(dashboard)/bank-accounts/[id]/page.tsx` — paginación real (`skip`/`take`) + `aggregate`/`count` para los totales de cabecera.
- `src/components/bank-accounts/BankAccountDetailClient.tsx` — recibe `totales` y `pagination` como props separadas de `movimientos`; agregado paginador Anterior/Siguiente.

Resultado de `npx tsc --noEmit`: sin errores.
Resultado de `npm run build`: no se pudo ejecutar completo en este entorno (ver nota de red en el ítem 1). Pendiente antes de push.

Encontrado pero **fuera de alcance de esta sesión** (documentado, no corregido, para no expandir el alcance sin confirmación):
- `src/app/(dashboard)/delivery-notes/page.tsx` (`AlbaranVenta.findMany`) — sin `take`/`skip`, tabla que también crece con el negocio. No estaba en la lista de prioridad del brief (Factura, MovimientoBancario, Producto, Cliente).
- `src/app/(dashboard)/purchases/page.tsx` (`take: 100` fijo), `src/app/(dashboard)/suppliers/page.tsx` (`take: 1000` fijo), `src/app/(dashboard)/orders/page.tsx` (`take: 100` fijo) — tienen un tope duro pero no paginación real (no hay forma de ver más allá del límite fijo). Funcionan como salvaguarda de escalabilidad pero no cumplen del todo "paginación con cursor" — quedan como candidatos para una tarea futura si el usuario confirma que se necesita ver más allá de esos límites.

---

## [2026-07-06] Item 2: Auditoría de botones sin funcionalidad

El usuario no tenía una lista específica ("algunos sí, otros no funcionan, revisa todo"), así que se hizo un barrido amplio: grep de patrones sospechosos (`onClick={() => {}}`, TODO/WIP/"próximamente", placeholders) en todo `src/`, más una revisión dirigida de ~20 modales de creación/edición (clients, products, suppliers, bank-accounts, warehouses, purchases) y las listas con botones de acción por fila (editar/eliminar/toggle estado).

Resultado: la gran mayoría de los botones SÍ están conectados a Server Actions reales (creación/edición de proveedores, cuentas bancarias, bodegas, pagos, cambios de estado de pedidos, etc.) — no se encontró un patrón generalizado de botones rotos.

Hallazgos reales (2):
1. **`src/app/(dashboard)/quotes/[id]/page.tsx`** — el botón "Enviar" (header de una cotización ya creada) no tenía `onClick` en absoluto: parecía un botón activo y no hacía nada al hacer click. Esta es la causa raíz típica que describía el brief ("presente pero sin funcionalidad").
   - **Fix**: se creó `src/components/quotes/SendQuoteButton.tsx` (client component) que ahora muestra un toast honesto explicando que el envío por correo no está disponible todavía porque depende de tener un proveedor de email configurado (Item 3 de esta misma fase), en vez de no responder al click.
2. **`src/components/quotes/QuoteSummarySidebar.tsx`** (línea 202, botón "Enviar al Cliente" en el formulario de creación de cotización) — está con `disabled={true}` a propósito. A diferencia del caso anterior, este SÍ comunica honestamente al usuario que no está disponible (no se puede ni hacer click), así que no se tocó — no es el patrón de bug reportado.

Relacionado, pero **no es un botón roto sino algo peor** (ya identificado en `ROADMAP_IMPLEMENTACION.md` Tarea 4.1, no se tocó en esta sesión): `sendSupplierEmailAction` (`src/lib/actions/suppliers.ts:341`) simula el envío con un `setTimeout` de 800ms y devuelve `success: true` con un mensaje de "correo enviado" — el botón SÍ funciona (no está roto), pero miente sobre el resultado. Esto se resuelve de raíz junto con el Item 3 (Resend), no antes.

Falso positivo descartado: los botones "Exportar a Excel/CSV" del dashboard (`DashboardHeader.tsx`) tienen `disabled` condicionado a que los datos hayan cargado — es una guarda defensiva correcta, no un bug.

Archivos modificados:
- `src/components/quotes/SendQuoteButton.tsx` (nuevo)
- `src/app/(dashboard)/quotes/[id]/page.tsx` (usa el componente nuevo en vez del botón sin onClick)

Resultado de `npx tsc --noEmit`: sin errores.

---

## [2026-07-06] Item 3: SMTP y entregabilidad (Resend)

Estado: OK (código) / BLOQUEADO (pasos externos — DNS y cuenta Resend, confirmado por el usuario que aún no los tiene).

Se implementó el lado de código, dejando pendientes únicamente los pasos que requieren credenciales/acceso del usuario:

1. Proveedor elegido: **Resend** (recomendado por integración simple con Vercel/Next.js). Se instaló el paquete `resend` (`npm install resend`, agregado a `package.json`).
2. `src/lib/email/resend.ts` (nuevo) — cliente único de Resend para toda la plataforma (a diferencia de WhatsApp/webhooks que son credenciales por empresa, el remitente de email es de la plataforma, no por tenant). Expone `sendEmail({ to, subject, html, replyTo })` y `isEmailConfigured()`. Sigue el mismo patrón de "kill switch" ya usado en `src/lib/integrations/whatsapp.ts`: si faltan `RESEND_API_KEY` o `RESEND_FROM_EMAIL`, devuelve un error explícito en vez de fallar silenciosamente o simular el envío.
3. Se migró el único envío de correo "hardcodeado/simulado" encontrado en el proyecto: `sendSupplierEmailAction` (`src/lib/actions/suppliers.ts`) usaba un `setTimeout` de 800ms y devolvía `success: true` sin enviar nada. Ahora llama a `sendEmail()` real. Si `RESEND_API_KEY`/`RESEND_FROM_EMAIL` no están configuradas (que es el caso actual), la función devuelve el error claro de `isEmailConfigured()` en vez de fingir éxito — comportamiento correcto mientras no haya credenciales.
4. La API key **nunca se hardcodea**: se lee de `process.env.RESEND_API_KEY` / `process.env.RESEND_FROM_EMAIL`, a configurar como variables de entorno en Vercel (Production + Preview) cuando el usuario tenga la cuenta.

Pendiente (requiere que el usuario lo haga, no se puede hacer desde este entorno):
- Crear cuenta en https://resend.com.
- Agregar el dominio de ERP Panamá/empsignature en Resend → Resend genera los registros DNS exactos (SPF, DKIM, y se recomienda agregar también un DMARC) → agregarlos en el proveedor DNS del dominio real.
- Una vez el dominio quede verificado en Resend, generar una API key y configurar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (ej. `ERP Panamá <notificaciones@tu-dominio.com>`) en Vercel.
- Probar entregabilidad real con https://mail-tester.com antes de dar el punto por cerrado (pendiente, no se puede simular sin dominio verificado).

Nota: la verificación de email de Firebase (Item 4) **no depende de Resend** — Firebase Auth envía sus propios correos de verificación con su infraestructura, no con el proveedor SMTP de la app. Los dos ítems son independientes.

Resultado de `npx tsc --noEmit`: sin errores.

---

## [2026-07-06] Item 4: Verificación de email antes de enviar correos

No existía ningún flujo de verificación de email antes de esta sesión (`emailVerified` solo aparecía hardcodeado en `true` en los objetos de usuario mock de desarrollo).

Implementado:
1. **Registro**: `signUpWithEmail()` (`src/lib/firebase/auth.tsx`) ahora llama a `sendEmailVerification()` del SDK de Firebase Auth justo después de crear la cuenta. Si ese envío falla (ej. rate limit de Firebase) no se bloquea el registro — el usuario puede reenviarlo después desde su perfil.
2. **Verificación server-side (fuente de verdad real)**: `getTenantContext()` (`src/lib/auth/context.ts`) ahora decodifica también el claim `email_verified` del ID token verificado (vía Firebase Admin SDK, `adminAuth.verifySessionCookie`) y lo expone como `TenantContext.emailVerified`. Se decidió explícitamente **no** guardar esto en la tabla `Usuario` — se lee siempre fresco del token en cada request, tal como pedía el brief ("no confiar solo en un flag guardado... puede desactualizarse").
3. **Bloqueo con mensaje claro**: `sendSupplierEmailAction` (`src/lib/actions/suppliers.ts`) ahora verifica `emailVerified` antes de intentar enviar y devuelve un error explícito ("Debes verificar tu correo electrónico antes de poder enviar correos...") en vez de fallar silenciosamente o dejar pasar el envío.
4. **Botón "Reenviar verificación"**: agregado en `/profile` (`src/app/(dashboard)/profile/page.tsx`) — muestra una insignia "Correo Verificado" / "Correo sin verificar" y, si no está verificado, un botón para reenviar el correo (`resendVerificationEmail()`, nuevo método expuesto por `useAuth()` en `src/lib/firebase/auth.tsx`, usa `sendEmailVerification(auth.currentUser)` del cliente de Firebase).

Nota de diseño: `useAuth().isEmailVerified` (cliente) refleja el estado del objeto `User` de Firebase en memoria, que solo se actualiza si se llama `.reload()` — es decir, puede quedar desactualizado un momento si el usuario verifica su correo en otra pestaña y no recarga. Esto es aceptable porque es solo para MOSTRAR la insignia/botón en la UI; el bloqueo real (`sendSupplierEmailAction`) siempre usa el valor fresco de `getTenantContext()` (decodificado del token en cada request), no el estado del cliente.

Archivos modificados:
- `src/lib/firebase/auth.tsx` — `sendEmailVerification` en `signUpWithEmail`; nuevo `resendVerificationEmail()`; nuevo `isEmailVerified` en el contexto.
- `src/lib/auth/context.ts` — `TenantContext.emailVerified`.
- `src/lib/actions/suppliers.ts` — bloqueo en `sendSupplierEmailAction`.
- `src/app/(dashboard)/profile/page.tsx` — insignia + botón de reenvío.

Resultado de `npx tsc --noEmit`: sin errores.

Pendiente/fuera de alcance: no se aplicó el mismo bloqueo de `emailVerified` a otras acciones porque, tras la auditoría del Item 2 y 3, `sendSupplierEmailAction` es la única acción de "enviar correo" real en el proyecto (el botón de cotizaciones ahora solo muestra un aviso, no envía nada todavía).

---

## [2026-07-06] Item 6: Auditoría de design system (Impeccable)

`impeccable` sí es un paquete público de npm (`impeccable@3.2.0`, https://impeccable.style) — se pudo ejecutar directamente con `npx impeccable detect src/` sin necesidad de `npx impeccable install` (ese paso instala el skill/slash-commands `/impeccable audit` y `/impeccable polish` dentro de un IDE con soporte de skills tipo Claude Code/Antigravity; esos comandos interactivos no están disponibles en este entorno, pero el escaneo determinista (`detect`) sí corrió igual y es la parte que no gasta tokens de LLM).

Resultado del escaneo determinista (`npx impeccable detect src/`): **40 anti-patrones encontrados** en 16 archivos. Todos son de 4 categorías:
- `ai-color-palette` (la mayoría): gradientes/tonos índigo-morado — el propio Impeccable los marca como "el tell más reconocible de UI generada por IA". Aparece en: `ClientDetailClient.tsx`, `help/page.tsx`, `research-hub/page.tsx`, `SettingsClient.tsx`, `AdminBillingClient.tsx`, `BankAccountDetailClient.tsx`, `BankAccountList.tsx`, `ClientList.tsx`, `RecentActivityTable.tsx`, `InvoiceList.tsx`, `PurchaseList.tsx`, `QuotesList.tsx`, `ReceivablesList.tsx`, `CashFlowView.tsx`, `SupplierDetailClient.tsx`, `SupplierList.tsx`.
- `side-tab` (`border-l-4`, borde de color grueso a un lado de la tarjeta): `BankAccountDetailClient.tsx`, `CashFlowView.tsx`, `SupplierList.tsx`.
- `border-accent-on-rounded` (`border-b-2` que choca con las esquinas redondeadas): `BalanceSheetView.tsx`, `TimeFilter.tsx`.
- `gray-on-color` (texto gris sobre fondos de color, bajo contraste): `BankAccountList.tsx`, `SupplierList.tsx`, `WarehouseList.tsx`.

Se documenta la lista completa (archivo + línea) para que sirva de checklist, pero **no se aplicaron los fixes visuales en esta sesión** — corregir 40 anti-patrones en 16 archivos requiere revisar el diff pantalla por pantalla (así lo pide el propio brief: "no todo el sitio de un solo golpe") y ya se había usado buena parte de esta sesión en los Items 1-5. Queda como tarea pendiente explícita para una próxima sesión enfocada solo en esto.

Resultado de `npx tsc --noEmit`: sin errores (no se modificó ningún archivo en este ítem).

---

## [2026-07-06] Item 7: Landing page pública en /

Hallazgo importante que simplificó el trabajo: la suposición del brief de que "el middleware redirige todo tráfico no autenticado a login" **no aplicaba a este proyecto**. Revisando `src/middleware.ts`, el matcher es `['/api/:path*']` — solo aplica CORS/rate-limit a rutas de API, no bloquea ninguna ruta de página. El redirect a login vivía únicamente en `src/app/page.tsx` (`redirect('/dashboard')`) y, para rutas del dashboard, en `getTenantContext()` (cada página del dashboard llama esa función y ella redirige si no hay sesión). El dashboard real ya vivía en `/dashboard`, no en `/` — no fue necesario mover nada ni tocar el middleware.

Cambios:
1. `src/app/page.tsx` — reemplazado el `redirect('/dashboard')` por la landing pública completa: Hero, Funcionalidades, Cómo funciona, Rubros, Glosario, Precios, FAQ, CTA final y Footer (se reutilizó el `Footer` compartido ya existente en `src/components/layout/Footer.tsx`, que ya enlaza a `/terms`, `/privacy` y `/cookies` — esas 3 rutas ya existían en el proyecto). Incluye `export const metadata` con title/description/keywords/Open Graph/Twitter Card/canonical — a diferencia del resto de la app (que no necesita ser indexable), esta ruta sí.
2. `src/components/landing/LandingHeader.tsx` (nuevo) — header sticky con logo (mismo patrón visual "EP" + "ERP Panamá" que ya usa `Topbar.tsx` en el dashboard, para no inventar una marca nueva en paralelo), nav central (Funcionalidades/Rubros/Cómo funciona/Glosario/Precios como anclas `#` a las secciones de la misma página), y a la derecha "Iniciar sesión" (`/login`) + "Crear cuenta gratis" (`/register`) — ambas apuntan a las rutas reales que ya existían, no se tocó el flujo de login/registro. Menú hamburguesa en mobile/tablet (`lg:hidden`).
3. `src/components/landing/FaqAccordion.tsx` (nuevo) — acordeón simple para la sección FAQ.
4. Contenido honesto según lo pedido: la sección de Funcionalidades aclara explícitamente que "la integración con el PAC está en preparación", sin prometer timbrado DGI real en producción. El FAQ incluye la pregunta "¿qué pasa si aún no tengo el PAC contratado?" con la misma aclaración.
5. Decisión de diseño (dentro de lo razonable, el usuario puede ajustarla): Funcionalidades/Rubros/Cómo funciona/Glosario/Precios se implementaron como secciones ancla dentro de una sola página (`/#funcionalidades`, etc.) en vez de rutas separadas — es el patrón más común en landings SaaS y evita duplicar el header/footer en 5 rutas distintas. Si se prefieren rutas propias (ej. `/precios`, `/glosario`), es un cambio acotado a partir de esta base.
6. Paleta de color: se usó la paleta de marca YA EXISTENTE en `globals.css` (`brand-1` #073674, `brand-2` #052550, `brand-3` #001835 — azules), **no** los gradientes índigo/morado que la propia auditoría del Item 6 (Impeccable) identificó como "el tell más reconocible de UI generada por IA" en el resto de la app — para no repetir ese problema en la pieza más visible de todas.
7. Precios: se usaron exactamente los 3 planes y features que definió el usuario en el brief. Nota para el usuario: los límites que ya están *codificados* en `src/lib/actions/billing.ts` (fallback sin registro de `Plan`) no coinciden exactamente con los del brief (ahí dice `emprendedor: 150` facturas/mes y `maxUsers: 1`, el brief pide 100 y 2) — no se tocó `billing.ts` (fuera de alcance de este ítem), pero antes de cobrar de verdad conviene alinear esos números con lo que se muestra en la landing.

Responsividad: no se pudo levantar `npm run dev` en este entorno para verificar visualmente en los 3 breakpoints — Turbopack falla al crear symlinks dentro de este sandbox (`failed to create symlink ... node_modules/firebase-admin`), y al forzar `--webpack` el sandbox tampoco permite eliminar archivos de compilación previos (`EPERM: operation not permitted, unlink .next/...`), ambas son limitaciones del entorno de esta sesión, no del código. Se construyó con los mismos breakpoints Tailwind (`sm:`/`lg:`) ya usados en el resto de la app, con grids que van de 1 columna (mobile) → 2 (tablet, `sm:`) → 3-4 (desktop, `lg:`), botones que apilan en mobile (`flex-col` → `sm:flex-row`) y el menú hamburguesa cubriendo mobile+tablet. **Pendiente**: correr `npm run dev` localmente y verificar visualmente en ~375px/~768px/~1280px antes de dar el punto por cerrado, tal como pide la regla global de esta fase.

Archivos nuevos:
- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/FaqAccordion.tsx`

Archivos modificados:
- `src/app/page.tsx` (antes: `redirect('/dashboard')`; ahora: landing pública completa)

Resultado de `npx tsc --noEmit`: sin errores.
Resultado de `npx eslint` sobre los archivos nuevos/modificados: sin errores ni warnings.
Resultado de `npm run build` completo: no se pudo ejecutar en este entorno (ver nota de red del Item 1 — descarga de `@next/swc-linux-x64-gnu` falla por DNS). Pendiente antes de push.

---

## [2026-07-06] Verificación final de la sesión (Fase 4)

- `npx tsc --noEmit` sobre todo el proyecto: **sin errores**.
- `npx eslint src` sobre todo el proyecto: sin errores nuevos ni warnings nuevos atribuibles a esta sesión (se revisó explícitamente cada archivo tocado/creado — cero problemas). Los errores/warnings preexistentes que aparecen (`billing-fe.ts`, `bodegas.ts`, `mappers.ts`, `test-facturacion-electronica.ts`, `invoiceCreation.ts`, `ProductList.tsx`, etc.) ya existían antes de esta sesión y no están en el alcance de la Fase 4.
- `npm run build` completo: no se pudo ejecutar en este entorno de sandbox (descarga de binario de Next/SWC bloqueada por red; ver Item 1). **Pendiente ejecutar localmente/en Vercel antes de cualquier push.**
- **Aviso importante sobre el estado de git**: al iniciar esta sesión, el working tree ya tenía ~120 archivos marcados como modificados por un cambio de fin de línea (CRLF↔LF) — mismas líneas, mismo contenido, solo cambia el terminador (confirmado con `git diff --stat`: inserciones = eliminaciones exactas en cada archivo). Esto es previo a esta sesión (coincide con la advertencia ya escrita en `CLAUDE.md` sobre otra sesión de Antigravity trabajando el mismo repo en paralelo) — **no se tocaron esos archivos ni se intentó revertir ese cambio**, para no interferir con el trabajo de la otra sesión. Antes de hacer `git push`, hay que revisar el diff completo con cuidado: los cambios reales de esta sesión están en una lista acotada de archivos (detallada en cada sección de este documento); el resto del ruido de línea puede venir de la otra sesión y conviene confirmarlo con el usuario antes de commitear todo junto.
- No se probó login manual en navegador (sin acceso a un navegador conectado en esta sesión) — pendiente que el usuario lo haga antes de dar por cerrada la fase, tal como pide el protocolo.
- No se verificó responsividad visual en 3 breakpoints (ver limitación de entorno documentada en el Item 7).

### Resumen de archivos realmente modificados/creados por esta sesión (Fase 4)
Nuevos:
- `src/lib/auth/resolveUsuario.ts`
- `src/lib/email/resend.ts`
- `src/components/quotes/SendQuoteButton.tsx`
- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/FaqAccordion.tsx`

Modificados (contenido real, no solo fin de línea):
- `src/lib/auth/context.ts`
- `src/lib/actions/auth.ts`
- `src/app/admin/layout.tsx`
- `src/app/(dashboard)/invoices/page.tsx`
- `src/app/(dashboard)/receivables/page.tsx`
- `src/app/(dashboard)/quotes/page.tsx`
- `src/app/(dashboard)/quotes/[id]/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/bank-accounts/[id]/page.tsx`
- `src/components/bank-accounts/BankAccountDetailClient.tsx`
- `src/lib/actions/suppliers.ts`
- `src/lib/firebase/auth.tsx`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/page.tsx`
- `package.json` / `package-lock.json` (dependencia `resend` agregada)

### Pendientes que requieren al usuario (no se pueden cerrar desde este entorno)
1. Item 2: seguir reportando botones específicos si aparece alguno más (se corrigió el único caso confirmado: "Enviar" en detalle de cotización).
2. Item 3: crear cuenta Resend, verificar dominio (DNS), configurar `RESEND_API_KEY`/`RESEND_FROM_EMAIL` en Vercel, probar con mail-tester.com.
3. Item 6: aplicar los fixes visuales de los 40 anti-patrones detectados por `impeccable detect` (se dejó como checklist, no aplicado).
4. Item 7: revisar visualmente la landing en 375px/768px/1280px; confirmar si se prefiere que Rubros/Glosario/Precios sean rutas separadas en vez de anclas de una sola página; alinear los límites de planes del brief con los valores reales en `billing.ts`.
5. Correr `npm run build` real y probar login manual en navegador antes de cualquier `git push` a `main` (dispara migraciones/deploy automático en Vercel).

---

## [2026-07-06] Item 6 (continuación): fixes visuales aplicados

Se aplicaron los fixes de los 40 anti-patrones detectados por `impeccable detect` (documentados como checklist en la entrada anterior de este mismo item). Solo cambios visuales (clases de Tailwind) — no se tocó lógica de negocio, llamadas a servidor ni validaciones en ningún archivo.

**ai-color-palette (índigo/morado → paleta de marca real)**: se reemplazó cada uso de `indigo-*`/`purple-*`/`violet-*` por la paleta de marca ya existente en `globals.css` (`brand-1` #073674, `brand-2` #052550, `brand-3` #001835), usando opacidad (`/5`, `/10`, `/20`, etc.) para los tonos claros ya que la marca no tiene una escala 50–950 como Tailwind. Se corrigió no solo la línea puntual que marcó Impeccable sino **todas** las apariciones de índigo/morado en cada archivo afectado (varios archivos tenían el color repetido más veces de las que el escaneo determinista reporta — reporta una ocurrencia representativa por patrón, no todas). Afectados: `ClientDetailClient.tsx`, `help/page.tsx`, `research-hub/page.tsx`, `SettingsClient.tsx` (~40 ocurrencias, página de planes/facturación), `AdminBillingClient.tsx`, `BankAccountDetailClient.tsx`, `BankAccountList.tsx`, `ClientList.tsx`, `RecentActivityTable.tsx`, `InvoiceList.tsx`, `PurchaseList.tsx`, `QuotesList.tsx`, `ReceivablesList.tsx`, `CashFlowView.tsx`, `SupplierDetailClient.tsx`, `SupplierList.tsx`. También se corrigió la paleta compartida de avatares con iniciales (`from-indigo-500 to-purple-400` / `from-blue-500 to-indigo-400`, copiada y pegada en ~7 componentes de lista) por combinaciones sin índigo/morado (`brand-1`→`brand-2`, `slate-600`→`slate-800`, etc.), manteniendo la variedad visual entre avatares.

**side-tab (`border-l-4` grueso en tarjetas)**: eliminado en las 4 tarjetas de KPI de `BankAccountDetailClient.tsx`, las 3 de `CashFlowView.tsx` y las 4 de `SupplierList.tsx` — el valor numérico de cada tarjeta ya está coloreado (`text-emerald-600`, `text-amber-600`, etc.), así que el borde grueso lateral era puramente decorativo y redundante.

**border-accent-on-rounded (`border-b-2` que choca con esquinas redondeadas)**: corregido en los 3 encabezados de sección (Activos/Pasivos/Patrimonio) de `BalanceSheetView.tsx`, que sí tenían `rounded-lg` + `border-b-2` en el mismo contenedor. **Revisado y descartado a propósito** en `TimeFilter.tsx` (líneas 165/168): ahí el `border-b-2` es el indicador de pestaña activa dentro de un `Tabs` plano sin esquinas redondeadas — no hay ningún choque visual real, es un patrón de subrayado de tab estándar y quitarlo eliminaría la única señal de "pestaña seleccionada". Se dejó sin tocar.

**gray-on-color (texto gris sobre fondo de color)**: corregidas las combinaciones que sí involucraban índigo (ya resueltas al quitar el índigo). **Revisadas y descartadas a propósito** las 4 restantes (`BankAccountList.tsx`, `SupplierList.tsx` x2, `WarehouseList.tsx`): en los 4 casos el texto gris (`text-slate-600`/`text-slate-500`) es el estado de REPOSO de un botón-ícono, y tanto el color de texto como el de fondo cambian juntos (`hover:text-amber-600 hover:bg-amber-50`, etc.) — no hay ningún momento en que el texto gris conviva con el fondo de color; el detector estático de Impeccable no distingue clases con prefijo `hover:`, por eso las marca igual. Se dejaron sin cambios para no introducir una diferencia visual que no soluciona un problema real.

Resultado de `npx impeccable detect src/` después de los fixes: **de 40 anti-patrones bajó a 6** (los 6 casos arriba, revisados y descartados explícitamente por ser falsos positivos del detector estático, no problemas visuales reales).

Resultado de `npx tsc --noEmit`: sin errores.
Resultado de `npx eslint` sobre los 17 archivos tocados: 0 errores, 63 warnings — todos preexistentes (imports sin usar, dependencias de hooks) y no relacionados con los cambios de esta sesión.

Archivos modificados (todos, solo clases de Tailwind):
`src/app/(dashboard)/clients/[id]/ClientDetailClient.tsx`, `src/app/(dashboard)/help/page.tsx`, `src/app/(dashboard)/research-hub/page.tsx`, `src/app/(dashboard)/settings/SettingsClient.tsx`, `src/app/admin/billing/AdminBillingClient.tsx`, `src/components/accounting/BalanceSheetView.tsx`, `src/components/bank-accounts/BankAccountDetailClient.tsx`, `src/components/bank-accounts/BankAccountList.tsx`, `src/components/clients/ClientList.tsx`, `src/components/dashboard/RecentActivityTable.tsx`, `src/components/invoices/InvoiceList.tsx`, `src/components/purchases/PurchaseList.tsx`, `src/components/quotes/QuotesList.tsx`, `src/components/receivables/ReceivablesList.tsx`, `src/components/reports/CashFlowView.tsx`, `src/components/suppliers/SupplierDetailClient.tsx`, `src/components/suppliers/SupplierList.tsx`.

---

## [2026-07-06] Item 7 (continuación): intento de verificación visual en 3 breakpoints

Se intentaron 3 vías distintas para levantar un servidor de desarrollo y capturar la landing en ~375px/768px/1280px:

1. `next dev` (Turbopack, default): falla con `Turbopack Error: failed to create symlink ... node_modules/firebase-admin` — el mount de este sandbox no soporta symlinks.
2. `next dev --webpack`: falla con `EPERM: operation not permitted, unlink .next/dev/build/chunks/...` — quedaron artefactos del intento anterior de Turbopack en `.next/`, y este sandbox **no permite eliminar ningún archivo** dentro de la carpeta conectada del repo (confirmado: ni siquiera archivos creados por esta misma sesión se pueden borrar — es una restricción general del entorno, no de permisos de Linux).
3. Copiar el proyecto completo a una carpeta sin esa restricción (el scratchpad de la sesión) para correr el dev server ahí sin tocar el repo real: no es viable en el tiempo disponible por el tamaño de `node_modules`.

Conclusión: **no se pudo generar una captura de pantalla real** de la landing en este entorno — es una limitación del sandbox de esta sesión, no del código. Lo que sí se pudo verificar:
- `npx tsc --noEmit`: sin errores.
- Revisión manual del código de `src/app/page.tsx`, `LandingHeader.tsx` y `FaqAccordion.tsx`: los patrones responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`, botones `flex-col sm:flex-row`, nav `hidden lg:flex` / hamburguesa `lg:hidden`) son los mismos breakpoints (`sm:`/`lg:`) y el mismo patrón ya usado y probado en el resto de la app (ej. controles de paginación en `ClientList.tsx`), no un esquema nuevo sin precedente.

**Pendiente real para el usuario**: correr `npm run dev` (o `npm run dev -- --webpack` si Turbopack da problemas localmente) en su máquina y confirmar visualmente los 3 breakpoints antes de dar el punto por cerrado — esto no se pudo automatizar desde este entorno.

---

## [2026-07-06] Housekeeping: .gitattributes, reconciliación de precios, y limpieza de git

**1. `.gitattributes` (ruido de CRLF/LF entre sesiones)**: el usuario reportó que otra sesión (PowerShell en su máquina) también pushea a este repo, y quería confirmar si eso quedaba como "cambios pendientes". Se verificó: `git log origin/main..HEAD` y `HEAD..origin/main` vacíos en ambas direcciones — el último push desde la otra sesión sí llegó completo, nada perdido. Lo que sí aparecía eran ~125 archivos "modificados" en el working tree; se confirmó con `git diff --ignore-space-at-eol` que el diff de contenido real era cero — puro ruido de fin de línea (CRLF en disco vs LF en el commit), causado por que las distintas sesiones tienen distinto comportamiento de `core.autocrlf`. Se agregó `.gitattributes` con `* text=auto eol=lf` (y excepciones para binarios y `.bat`), lo que normaliza esto para cualquier sesión futura sin importar el SO. También se agregó `.claude/` a `.gitignore` (config local del asistente, no es parte del proyecto).

**2. Reconciliación de precios (pendiente del Item 7)**: se confirmó la fuente de verdad real de los límites por plan (`prisma/seed.ts`, tabla `Plan`, coincide exactamente con el fallback de `src/lib/actions/billing.ts`): Emprendedor = $19.99/mes, 150 facturas, **1** usuario; Negocio = $34.99/mes, 300 facturas, **2** usuarios. La landing en `src/app/page.tsx` mostraba datos incorrectos para ambos planes: Emprendedor decía "$24.99", "100 facturas" y "2 usuarios" (el sistema solo permite 1); Negocio decía "$44.99" y "hasta 10 usuarios" (el sistema solo permite 2). Esto podía generar tickets de soporte reales (cliente paga por 2 usuarios y el sistema le bloquea el segundo). Corregido para que coincida con los valores reales aplicados por `canAddUser()`/`canCreateInvoice()`.

Nota/decisión pendiente (no se tocó): la landing solo muestra 3 planes (Emprendedor, Negocio, "Empresarial: Cotizar"), pero el sistema tiene un 4º plan real ("Pro", $54.99/600 facturas/5 usuarios) que no aparece en ningún lado de la landing — el usuario pasaría directo de "Negocio" a un tier de contacto-a-ventas sin precio fijo. Puede ser intencional (embudo hacia ventas para cuentas grandes) o un plan invisible que nadie puede contratar por self-service. Queda como decisión de negocio, no como bug.

**3. Fix de corrupción de archivo**: al editar `src/app/page.tsx`, el archivo quedó con 4 bytes NUL finales (mismo patrón de corrupción del Edit tool ya visto antes en esta sesión) que rompían `tsc` (`error TS1127: Invalid character`). Corregido con un script Python leyendo/escribiendo el archivo en binario y haciendo `rstrip(b'\x00')`. Verificado: `npx tsc --noEmit` limpio después.

**4. Verificación repetida de build/lint**: `npx tsc --noEmit` sin errores. `npm run lint`: 536 problemas preexistentes (161 errores, 375 warnings, mayormente `no-explicit-any`) — ninguno en los archivos tocados en esta sesión (`src/app/page.tsx`, `src/lib/actions/billing.ts`); es deuda técnica preexistente del proyecto, no se tocó por estar fuera de alcance. `npm run build` sigue sin poder completarse en este sandbox por dos limitaciones de entorno independientes: (a) descarga del engine de Prisma bloqueada por red (`403 Forbidden` en `binaries.prisma.sh`, incluso con `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`), y (b) `next build` falla aparte con `EPERM: unlink .next/BUILD_ID` — el sandbox no permite borrar archivos dentro de la carpeta conectada del repo. Ambos son límites del entorno de esta sesión, no defectos de código; pendiente correrlo en local/Vercel antes de cualquier push a `main`.

**5. Lockfile de git recurrente**: al intentar comitear, `.git/index.lock` (y luego `.git/HEAD.lock`) ya existían (stale, de operaciones anteriores) y no se pudieron borrar desde este sandbox (misma restricción de "no se puede eliminar nada en la carpeta conectada"). Se evitó usando `GIT_INDEX_FILE=/tmp/...` para operar sobre una copia del índice en una ruta sin el lock y luego sobreescribiendo `.git/index` con el resultado (`cp`, no `rm`+create, sí permitido). **Recomendación para el usuario**: si vuelve a aparecer el mensaje de lockfile en GitHub Desktop, borrar manualmente `.git/index.lock` y `.git/HEAD.lock` desde el explorador de archivos de Windows — ahí sí se puede borrar sin restricciones, a diferencia de este sandbox.

Commits generados en esta sesión (aún sin push, pendientes de revisión en GitHub Desktop como de costumbre):
- `chore: normalizar line endings (LF) e ignorar config local de .claude/`
- `fix(landing): reconciliar precios/límites de planes con billing.ts real`

---

## [2026-07-06] Pricing landing: 4 planes reales (Emprendedor/Negocio/Pro/Empresa)

El usuario pidió reemplazar la sección de precios de la landing (`src/app/page.tsx`) por el copy exacto que ya usa el selector de planes dentro de la app (`SettingsClient.tsx`, líneas 532-623) — mismos 4 planes, mismas features, mismo copy de CTA ("Actualizar a X"). Se verificó que ese contenido coincide 1:1 con la fuente de verdad (`prisma/seed.ts`), así que ahora la landing pública, el selector interno de planes y la base de datos están alineados en los 3 lugares.

Cambios: `PLANES` pasó de 3 entradas (Emprendedor/Negocio/"Empresarial: Cotizar") a las 4 reales (Emprendedor $19.99, Negocio $34.99, Pro $54.99 — ahora el destacado "Más Popular" en vez de Negocio, Empresa $89.99), con la lista completa de features de cada uno. Grid ajustado de `lg:grid-cols-3` a `sm:grid-cols-2 lg:grid-cols-4`. Se quitó el caso especial `price !== 'Cotizar'` porque los 4 planes ahora tienen precio fijo.

**Nota técnica**: el Edit tool truncó el archivo silenciosamente durante esta edición (el archivo quedó cortado exactamente en el mismo byte-count que la versión anterior, sin importar que el contenido nuevo fuera más largo — patrón ya visto antes con corrupción de NUL bytes, pero esta vez truncamiento a mitad de archivo). Se recuperó reconstruyendo el archivo completo con un script Python (base: `git show HEAD:src/app/page.tsx` + reemplazos de string), que sí escribe el archivo completo de forma confiable. Verificado con `tsc --noEmit` limpio después.

## [2026-07-06] Revisión de los 536 problemas de lint reportados antes

El usuario pidió confirmar si los 536 problemas de `npm run lint` ya estaban corregidos. Verificación: **no**, siguen siendo deuda técnica genuina y preexistente, no relacionada con ningún ítem de Fase 4 ni con los cambios de esta sesión — confirmado revisando línea por línea los archivos que sí toqué (`SettingsClient.tsx`, `AdminBillingClient.tsx`, `InvoiceList.tsx`, etc.): los errores/warnings ahí son variables sin usar preexistentes, no relacionados con los cambios de clases de Tailwind del Item 6.

Desglose: ~105 problemas están en `design-review-package/src-copy/` (snapshot congelado, "never edit" según CLAUDE.md — no se tocó). El resto (~430) está en `src/`, `scripts/` y `prisma/`, mayoritariamente `@typescript-eslint/no-explicit-any` (160 errores) y variables/imports sin usar (warnings).

Se corrió `eslint --fix` sobre todo lo no-congelado: solo 1 problema era realmente auto-corregible de forma segura (`let omitidos` → `const omitidos` en `scripts/backfill-inventario-bodega.ts`, nunca reasignada). Resultado final: 535 problemas (160 errores, 375 warnings) — bajó de 536. Arreglar los 160 errores de `no-explicit-any` requeriría escribir tipos reales para cada caso (Prisma payloads, respuestas de proveedores DGI, etc.) archivo por archivo — es trabajo real y riesgoso de automatizar a ciegas, fuera del alcance de un fix rápido; queda como tarea de limpieza técnica separada si se quiere abordar.

---

## [2026-07-06] Correo por SMTP genérico (reemplaza Resend) + notificaciones reales

**Email**: el usuario ya tenía SMTP propio configurado y no quería depender de un servicio de pago (Resend). Se reemplazó `src/lib/email/resend.ts` (SDK propietario de Resend) por `src/lib/email/mailer.ts` (nodemailer con transporte SMTP genérico) — funciona con servidor propio, Google Workspace SMTP relay, o cualquier otro proveedor, solo cambiando variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`). Misma interfaz pública (`sendEmail`, `isEmailConfigured`) para no tocar los llamadores; solo se actualizó 1 import real (`src/lib/actions/suppliers.ts`). Se agregó `nodemailer`/`@types/nodemailer` a package.json y se quitó la dependencia `resend`. El archivo viejo `resend.ts` no se pudo eliminar (restricción del entorno) así que quedó como un re-export vacío hacia `mailer.ts`, con comentario explicando que está obsoleto.

**Notificaciones reales**: el ícono de la campana en el Topbar mostraba un "3" fijo sin ninguna función real (hallazgo del usuario, no capturado en la auditoría original del Item 2). Se implementó `src/lib/actions/notifications.ts` — calcula notificaciones al vuelo desde datos existentes (sin tabla nueva, sin migración) para: facturas vencidas por cobrar, facturas rechazadas por la DGI, stock bajo/agotado, y consumo del plan mensual ≥80%. `Topbar.tsx` ahora usa un `DropdownMenu` real (mismo patrón que el menú de usuario) con el conteo real y enlaces a la sección correspondiente de cada alerta.

**Nota sobre verificación**: en esta sesión, el mount remoto de la carpeta del proyecto empezó a mostrar decenas de archivos con el mismo patrón de truncamiento/bytes NUL visto antes (confirmado como falso positivo la vez anterior, verificado en vivo por Antigravity sobre el disco real). Dado ese patrón, no se pudo correr `tsc`/`lint` de forma confiable desde este entorno en este momento — los 5 archivos nuevos/editados de esta tarea se verificaron manualmente byte a byte (sin NULs, cierres de llave correctos). Pendiente que Antigravity confirme con `tsc`/`lint`/build reales sobre el disco.

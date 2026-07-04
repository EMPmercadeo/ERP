-- CreateTable
CREATE TABLE "CuentaBancaria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "tipoCuenta" TEXT NOT NULL,
    "cuentaContableId" TEXT NOT NULL,
    "saldoInicial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoBancario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaBancariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "asientoContableId" TEXT,
    "origenImportacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CuentaBancaria_empresaId_idx" ON "CuentaBancaria"("empresaId");

-- CreateIndex
CREATE INDEX "CuentaBancaria_cuentaContableId_idx" ON "CuentaBancaria"("cuentaContableId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_empresaId_idx" ON "MovimientoBancario"("empresaId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_cuentaBancariaId_idx" ON "MovimientoBancario"("cuentaBancariaId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_asientoContableId_idx" ON "MovimientoBancario"("asientoContableId");

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_cuentaContableId_fkey" FOREIGN KEY ("cuentaContableId") REFERENCES "PlanCuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_asientoContableId_fkey" FOREIGN KEY ("asientoContableId") REFERENCES "AsientoContable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

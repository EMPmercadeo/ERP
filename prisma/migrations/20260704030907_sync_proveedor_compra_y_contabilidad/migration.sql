-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "limiteCredito" DECIMAL(65,30),
ADD COLUMN     "nombreContacto" TEXT,
ADD COLUMN     "observaciones" TEXT;

-- CreateTable
CREATE TABLE "PlanCuentas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "naturaleza" TEXT NOT NULL,
    "cuentaPadreId" TEXT,
    "nivel" INTEGER NOT NULL,
    "aceptaMovimiento" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsientoContable" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "origenId" TEXT,
    "totalDebe" DECIMAL(65,30) NOT NULL,
    "totalHaber" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsientoContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsientoContableLinea" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "debe" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "haber" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "descripcion" TEXT,

    CONSTRAINT "AsientoContableLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoContable" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoContable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanCuentas_empresaId_idx" ON "PlanCuentas"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCuentas_empresaId_codigo_key" ON "PlanCuentas"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "AsientoContable_empresaId_idx" ON "AsientoContable"("empresaId");

-- CreateIndex
CREATE INDEX "AsientoContable_fecha_idx" ON "AsientoContable"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "AsientoContable_empresaId_numero_key" ON "AsientoContable"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "AsientoContableLinea_asientoId_idx" ON "AsientoContableLinea"("asientoId");

-- CreateIndex
CREATE INDEX "AsientoContableLinea_cuentaId_idx" ON "AsientoContableLinea"("cuentaId");

-- CreateIndex
CREATE INDEX "PeriodoContable_empresaId_idx" ON "PeriodoContable"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoContable_empresaId_anio_mes_key" ON "PeriodoContable"("empresaId", "anio", "mes");

-- CreateIndex
CREATE INDEX "Compra_empresaId_fechaVencimiento_idx" ON "Compra"("empresaId", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_empresaId_proveedorId_numeroFactura_key" ON "Compra"("empresaId", "proveedorId", "numeroFactura");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_estado_idx" ON "Proveedor"("empresaId", "estado");

-- AddForeignKey
ALTER TABLE "PlanCuentas" ADD CONSTRAINT "PlanCuentas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCuentas" ADD CONSTRAINT "PlanCuentas_cuentaPadreId_fkey" FOREIGN KEY ("cuentaPadreId") REFERENCES "PlanCuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsientoContable" ADD CONSTRAINT "AsientoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsientoContable" ADD CONSTRAINT "AsientoContable_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsientoContableLinea" ADD CONSTRAINT "AsientoContableLinea_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoContable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsientoContableLinea" ADD CONSTRAINT "AsientoContableLinea_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "PlanCuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoContable" ADD CONSTRAINT "PeriodoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "AlbaranVenta" ADD COLUMN     "cotizacionId" TEXT,
ADD COLUMN     "direccionEntrega" TEXT,
ADD COLUMN     "fechaEstimadaEntrega" TIMESTAMP(3),
ADD COLUMN     "fechaRealEntrega" TIMESTAMP(3),
ADD COLUMN     "nombreContacto" TEXT,
ADD COLUMN     "notasCliente" TEXT,
ADD COLUMN     "notasInternas" TEXT,
ADD COLUMN     "responsableId" TEXT,
ADD COLUMN     "telefonoContacto" TEXT;

-- AlterTable
ALTER TABLE "AlbaranVentaItem" ADD COLUMN     "cantidadPedida" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "cantidadPendiente" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AlbaranEstadoHistorial" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "albaranId" TEXT NOT NULL,
    "estadoAnterior" TEXT NOT NULL,
    "estadoNuevo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,

    CONSTRAINT "AlbaranEstadoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "referenciaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlbaranEstadoHistorial_empresaId_idx" ON "AlbaranEstadoHistorial"("empresaId");

-- CreateIndex
CREATE INDEX "AlbaranEstadoHistorial_albaranId_idx" ON "AlbaranEstadoHistorial"("albaranId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_idx" ON "MovimientoInventario"("empresaId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_productoId_idx" ON "MovimientoInventario"("productoId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_fecha_idx" ON "MovimientoInventario"("fecha");

-- CreateIndex
CREATE INDEX "AlbaranVenta_cotizacionId_idx" ON "AlbaranVenta"("cotizacionId");

-- CreateIndex
CREATE INDEX "AlbaranVenta_responsableId_idx" ON "AlbaranVenta"("responsableId");

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranEstadoHistorial" ADD CONSTRAINT "AlbaranEstadoHistorial_albaranId_fkey" FOREIGN KEY ("albaranId") REFERENCES "AlbaranVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranEstadoHistorial" ADD CONSTRAINT "AlbaranEstadoHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranEstadoHistorial" ADD CONSTRAINT "AlbaranEstadoHistorial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Habilitar Row Level Security (RLS) para las nuevas tablas
ALTER TABLE "AlbaranEstadoHistorial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimientoInventario" ENABLE ROW LEVEL SECURITY;

-- Crear políticas explícitas de denegación para silenciar advertencias de Supabase
CREATE POLICY "Deny client access" ON "AlbaranEstadoHistorial" FOR ALL USING (false);
CREATE POLICY "Deny client access" ON "MovimientoInventario" FOR ALL USING (false);

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "controlaLotes" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LoteProducto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "bodegaId" TEXT NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "cantidadRecibida" INTEGER NOT NULL,
    "cantidadDisponible" INTEGER NOT NULL,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoteProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoteProducto_empresaId_idx" ON "LoteProducto"("empresaId");

-- CreateIndex
CREATE INDEX "LoteProducto_productoId_idx" ON "LoteProducto"("productoId");

-- CreateIndex
CREATE INDEX "LoteProducto_bodegaId_idx" ON "LoteProducto"("bodegaId");

-- CreateIndex
CREATE INDEX "LoteProducto_compraId_idx" ON "LoteProducto"("compraId");

-- AddForeignKey
ALTER TABLE "LoteProducto" ADD CONSTRAINT "LoteProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteProducto" ADD CONSTRAINT "LoteProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteProducto" ADD CONSTRAINT "LoteProducto_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteProducto" ADD CONSTRAINT "LoteProducto_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

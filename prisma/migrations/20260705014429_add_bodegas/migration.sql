-- CreateTable
CREATE TABLE "Bodega" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioBodega" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "bodegaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventarioBodega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bodega_empresaId_idx" ON "Bodega"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bodega_sucursalId_codigo_key" ON "Bodega"("sucursalId", "codigo");

-- CreateIndex
CREATE INDEX "InventarioBodega_empresaId_idx" ON "InventarioBodega"("empresaId");

-- CreateIndex
CREATE INDEX "InventarioBodega_productoId_idx" ON "InventarioBodega"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioBodega_bodegaId_productoId_key" ON "InventarioBodega"("bodegaId", "productoId");

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioBodega" ADD CONSTRAINT "InventarioBodega_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioBodega" ADD CONSTRAINT "InventarioBodega_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioBodega" ADD CONSTRAINT "InventarioBodega_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

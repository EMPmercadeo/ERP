-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "esKit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductoKit" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "ProductoKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoKitComponente" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoKitId" TEXT NOT NULL,
    "productoComponenteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ProductoKitComponente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductoKit_productoId_key" ON "ProductoKit"("productoId");

-- CreateIndex
CREATE INDEX "ProductoKit_empresaId_idx" ON "ProductoKit"("empresaId");

-- CreateIndex
CREATE INDEX "ProductoKitComponente_empresaId_idx" ON "ProductoKitComponente"("empresaId");

-- CreateIndex
CREATE INDEX "ProductoKitComponente_productoComponenteId_idx" ON "ProductoKitComponente"("productoComponenteId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoKitComponente_productoKitId_productoComponenteId_key" ON "ProductoKitComponente"("productoKitId", "productoComponenteId");

-- AddForeignKey
ALTER TABLE "ProductoKit" ADD CONSTRAINT "ProductoKit_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoKit" ADD CONSTRAINT "ProductoKit_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoKitComponente" ADD CONSTRAINT "ProductoKitComponente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoKitComponente" ADD CONSTRAINT "ProductoKitComponente_productoKitId_fkey" FOREIGN KEY ("productoKitId") REFERENCES "ProductoKit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoKitComponente" ADD CONSTRAINT "ProductoKitComponente_productoComponenteId_fkey" FOREIGN KEY ("productoComponenteId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TransferenciaBodega" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bodegaOrigenId" TEXT NOT NULL,
    "bodegaDestinoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'en_transito',
    "notas" TEXT,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecepcion" TIMESTAMP(3),
    "creadorId" TEXT NOT NULL,
    "receptorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferenciaBodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaBodegaItem" (
    "id" TEXT NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "TransferenciaBodegaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferenciaBodega_empresaId_idx" ON "TransferenciaBodega"("empresaId");

-- CreateIndex
CREATE INDEX "TransferenciaBodega_bodegaOrigenId_idx" ON "TransferenciaBodega"("bodegaOrigenId");

-- CreateIndex
CREATE INDEX "TransferenciaBodega_bodegaDestinoId_idx" ON "TransferenciaBodega"("bodegaDestinoId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaBodega_empresaId_numero_key" ON "TransferenciaBodega"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "TransferenciaBodegaItem_transferenciaId_idx" ON "TransferenciaBodegaItem"("transferenciaId");

-- CreateIndex
CREATE INDEX "TransferenciaBodegaItem_productoId_idx" ON "TransferenciaBodegaItem"("productoId");

-- AddForeignKey
ALTER TABLE "TransferenciaBodega" ADD CONSTRAINT "TransferenciaBodega_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodega" ADD CONSTRAINT "TransferenciaBodega_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodega" ADD CONSTRAINT "TransferenciaBodega_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodega" ADD CONSTRAINT "TransferenciaBodega_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodega" ADD CONSTRAINT "TransferenciaBodega_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodegaItem" ADD CONSTRAINT "TransferenciaBodegaItem_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "TransferenciaBodega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaBodegaItem" ADD CONSTRAINT "TransferenciaBodegaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row Level Security: mismo patron "deny all" aplicado a todas las tablas del proyecto (ver
-- prisma/migrations/20260705130000_enable_rls_completo) -- bloquea acceso directo via
-- PostgREST/Supabase API (roles anon/authenticated). No afecta a Prisma, que se conecta como
-- dueno de la tabla via DATABASE_URL y no esta sujeto a RLS.
ALTER TABLE "TransferenciaBodega" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "TransferenciaBodega" FOR ALL USING (false);
ALTER TABLE "TransferenciaBodegaItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "TransferenciaBodegaItem" FOR ALL USING (false);

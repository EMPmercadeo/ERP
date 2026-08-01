-- INSUMOS, RECETAS Y REABASTECIMIENTO
--
-- Dos capas separadas a propósito (ver el comentario largo en schema.prisma):
--   ProveedorInsumo -> cómo se COMPRA el insumo (presentación del proveedor y su
--                      conversión a la unidad base con la que el ERP lleva el stock).
--   Receta/RecetaInsumo -> cómo se CONSUME el insumo (qué gasta un lote y cuántas
--                      unidades rinde). El rendimiento por unidad se deriva, no se guarda.

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "esElaborado" BOOLEAN NOT NULL DEFAULT false,
                       ADD COLUMN     "esInsumo" BOOLEAN NOT NULL DEFAULT false,
                       ADD COLUMN     "diasCoberturaObjetivo" INTEGER;

-- CreateTable
CREATE TABLE "ProveedorInsumo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "codigoProveedor" TEXT,
    "presentacion" TEXT NOT NULL,
    "unidadesPorPresentacion" DECIMAL(65,30) NOT NULL,
    "precioPresentacion" DECIMAL(65,30) NOT NULL,
    "diasEntrega" INTEGER NOT NULL DEFAULT 0,
    "pedidoMinimo" INTEGER NOT NULL DEFAULT 1,
    "esPreferido" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoPrecio" DECIMAL(65,30),
    "ultimaCompraFecha" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProveedorInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "rendimiento" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "descuentaAutomatico" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaInsumo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "merma" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "opcional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecetaInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProveedorInsumo_empresaId_idx" ON "ProveedorInsumo"("empresaId");
CREATE INDEX "ProveedorInsumo_empresaId_productoId_idx" ON "ProveedorInsumo"("empresaId", "productoId");
CREATE INDEX "ProveedorInsumo_productoId_esPreferido_idx" ON "ProveedorInsumo"("productoId", "esPreferido");
CREATE UNIQUE INDEX "ProveedorInsumo_proveedorId_productoId_presentacion_key" ON "ProveedorInsumo"("proveedorId", "productoId", "presentacion");

-- CreateIndex
CREATE UNIQUE INDEX "Receta_productoId_key" ON "Receta"("productoId");
CREATE INDEX "Receta_empresaId_idx" ON "Receta"("empresaId");

-- CreateIndex
CREATE INDEX "RecetaInsumo_empresaId_idx" ON "RecetaInsumo"("empresaId");
CREATE INDEX "RecetaInsumo_insumoId_idx" ON "RecetaInsumo"("insumoId");
CREATE UNIQUE INDEX "RecetaInsumo_recetaId_insumoId_key" ON "RecetaInsumo"("recetaId", "insumoId");

-- AddForeignKey
ALTER TABLE "ProveedorInsumo" ADD CONSTRAINT "ProveedorInsumo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProveedorInsumo" ADD CONSTRAINT "ProveedorInsumo_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProveedorInsumo" ADD CONSTRAINT "ProveedorInsumo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaInsumo" ADD CONSTRAINT "RecetaInsumo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecetaInsumo" ADD CONSTRAINT "RecetaInsumo_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Restrict a propósito: no se puede borrar un producto que todavía es insumo de una
-- receta activa, porque dejaría la receta silenciosamente incompleta y las alertas de
-- reabastecimiento mentirían.
ALTER TABLE "RecetaInsumo" ADD CONSTRAINT "RecetaInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row Level Security: mismo patrón "deny all" aplicado a todas las tablas del proyecto
-- (ver prisma/migrations/20260705130000_enable_rls_completo). La app accede vía Prisma
-- con la conexión de servicio que hace bypass de RLS; esta política solo bloquea
-- cualquier acceso directo con claves de cliente (anon/authenticated de Supabase).
ALTER TABLE "ProveedorInsumo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ProveedorInsumo" FOR ALL USING (false);
ALTER TABLE "Receta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Receta" FOR ALL USING (false);
ALTER TABLE "RecetaInsumo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "RecetaInsumo" FOR ALL USING (false);

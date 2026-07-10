-- ============================================================================
-- Sistema de permisos por rol + descuentos preaprobados (producto/categoría/cliente)
-- + autorización de admin/gerente por PIN para descuentos fuera del tope normal.
-- Todo son columnas nuevas con DEFAULT/nullable y una tabla nueva ("Categoria"):
-- no se pierde ni se altera ningún dato existente.
-- ============================================================================

-- AlterTable: Usuario
ALTER TABLE "Usuario" ADD COLUMN     "pinAutorizacion" TEXT,
ADD COLUMN     "descuentoMaximoPermitido" DECIMAL(65,30);

-- AlterTable: Empresa
ALTER TABLE "Empresa" ADD COLUMN     "descuentoMaximoSinAutorizacion" DECIMAL(65,30) NOT NULL DEFAULT 10;

-- AlterTable: Cliente
ALTER TABLE "Cliente" ADD COLUMN     "descuentoEspecial" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable: Producto
ALTER TABLE "Producto" ADD COLUMN     "descuentoPorcentaje" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "categoriaId" TEXT;

-- CreateTable: Categoria
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descuentoPorcentaje" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_empresaId_nombre_key" ON "Categoria"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row Level Security (mismo patrón "deny all" que el resto de las tablas: Prisma conecta
-- como owner de la tabla y no se ve afectado; esto solo bloquea acceso directo vía la API
-- REST/PostgREST de Supabase con roles anon/authenticated).
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Categoria" FOR ALL USING (false);

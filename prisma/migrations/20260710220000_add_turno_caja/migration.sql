-- CreateTable
CREATE TABLE "TurnoCaja" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoInicial" DECIMAL(65,30) NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "montoContadoCierre" DECIMAL(65,30),
    "montoEsperadoCierre" DECIMAL(65,30),
    "diferencia" DECIMAL(65,30),
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TurnoCaja_empresaId_estado_idx" ON "TurnoCaja"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "TurnoCaja_usuarioId_estado_idx" ON "TurnoCaja"("usuarioId", "estado");

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN "turnoCajaId" TEXT;

-- CreateIndex
CREATE INDEX "Venta_turnoCajaId_idx" ON "Venta"("turnoCajaId");

-- AddForeignKey
ALTER TABLE "TurnoCaja" ADD CONSTRAINT "TurnoCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoCaja" ADD CONSTRAINT "TurnoCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_turnoCajaId_fkey" FOREIGN KEY ("turnoCajaId") REFERENCES "TurnoCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row Level Security: mismo patron "deny all" aplicado a todas las tablas del proyecto (ver
-- prisma/migrations/20260705130000_enable_rls_completo) -- bloquea acceso directo via
-- PostgREST/Supabase API (roles anon/authenticated). No afecta a Prisma, que se conecta como
-- dueno de la tabla via DATABASE_URL y no esta sujeto a RLS.
ALTER TABLE "TurnoCaja" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "TurnoCaja" FOR ALL USING (false);

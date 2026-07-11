-- AlterTable
-- Credenciales de Yappy Comercial por empresa (multi-tenant). yappySecretKey se guarda
-- cifrada con AES-256-GCM (src/lib/utils/crypto.ts), nunca en texto plano.
ALTER TABLE "Empresa"
  ADD COLUMN "yappyEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "yappyMerchantId" TEXT,
  ADD COLUMN "yappySecretKey" TEXT,
  ADD COLUMN "yappyAmbiente" TEXT NOT NULL DEFAULT 'pruebas',
  ADD COLUMN "yappyDomain" TEXT;

-- CreateTable
CREATE TABLE "YappyOrden" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "ventaId" TEXT,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoAt" TIMESTAMP(3),

    CONSTRAINT "YappyOrden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YappyOrden_empresaId_estado_idx" ON "YappyOrden"("empresaId", "estado");

-- AddForeignKey
ALTER TABLE "YappyOrden" ADD CONSTRAINT "YappyOrden_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row Level Security: mismo patron "deny all" aplicado a todas las tablas del proyecto (ver
-- prisma/migrations/20260705130000_enable_rls_completo).
ALTER TABLE "YappyOrden" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "YappyOrden" FOR ALL USING (false);

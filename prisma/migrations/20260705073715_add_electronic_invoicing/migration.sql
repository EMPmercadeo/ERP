-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "protocoloAutorizacion" TEXT,
ADD COLUMN     "fechaAutorizacionDGI" TIMESTAMP(3),
ADD COLUMN     "qrContent" TEXT,
ADD COLUMN     "xmlFirmado" TEXT,
ADD COLUMN     "motivoAnulacionDGI" TEXT,
ADD COLUMN     "fechaAnulacionDGI" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_cufe_key" ON "Factura"("cufe");

-- CreateTable
CREATE TABLE "ConfiguracionFacturacionElectronica" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "ambiente" INTEGER NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authTipo" TEXT NOT NULL,
    "credencialCifrada" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionFacturacionElectronica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaPACLog" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "codigoResultado" TEXT,
    "mensajeResultado" TEXT,
    "exitoso" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaPACLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionFacturacionElectronica_empresaId_key" ON "ConfiguracionFacturacionElectronica"("empresaId");

-- CreateIndex
CREATE INDEX "FacturaPACLog_empresaId_idx" ON "FacturaPACLog"("empresaId");

-- CreateIndex
CREATE INDEX "FacturaPACLog_facturaId_idx" ON "FacturaPACLog"("facturaId");

-- AddForeignKey
ALTER TABLE "ConfiguracionFacturacionElectronica" ADD CONSTRAINT "ConfiguracionFacturacionElectronica_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaPACLog" ADD CONSTRAINT "FacturaPACLog_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaPACLog" ADD CONSTRAINT "FacturaPACLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

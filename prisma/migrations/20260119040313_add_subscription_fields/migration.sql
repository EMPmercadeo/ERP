/*
  Warnings:

  - Added the required column `empresaId` to the `Caja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Pago` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validaHasta" DATETIME NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "totalDescuento" DECIMAL NOT NULL DEFAULT 0,
    "totalItbms" DECIMAL NOT NULL,
    "totalNeto" DECIMAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "facturaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cotizacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotizacionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL NOT NULL,
    "precioUnitario" DECIMAL NOT NULL,
    "descuento" DECIMAL NOT NULL DEFAULT 0,
    "codigoTasaItbms" TEXT NOT NULL,
    "montoItbms" DECIMAL NOT NULL,
    "montoTotal" DECIMAL NOT NULL,
    CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CotizacionItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Caja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Caja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Caja" ("activa", "codigo", "createdAt", "id", "nombre", "sucursalId", "updatedAt") SELECT "activa", "codigo", "createdAt", "id", "nombre", "sucursalId", "updatedAt" FROM "Caja";
DROP TABLE "Caja";
ALTER TABLE "new_Caja" RENAME TO "Caja";
CREATE INDEX "Caja_empresaId_idx" ON "Caja"("empresaId");
CREATE UNIQUE INDEX "Caja_sucursalId_codigo_key" ON "Caja"("sucursalId", "codigo");
CREATE TABLE "new_Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruc" TEXT NOT NULL,
    "dv" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "ambienteDgi" TEXT NOT NULL DEFAULT '1',
    "certificadoDgi" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'free',
    "fiscalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Empresa" ("ambienteDgi", "certificadoDgi", "createdAt", "direccion", "dv", "email", "id", "logo", "nombreComercial", "razonSocial", "ruc", "telefono", "updatedAt") SELECT "ambienteDgi", "certificadoDgi", "createdAt", "direccion", "dv", "email", "id", "logo", "nombreComercial", "razonSocial", "ruc", "telefono", "updatedAt" FROM "Empresa";
DROP TABLE "Empresa";
ALTER TABLE "new_Empresa" RENAME TO "Empresa";
CREATE UNIQUE INDEX "Empresa_ruc_key" ON "Empresa"("ruc");
CREATE INDEX "Empresa_createdAt_idx" ON "Empresa"("createdAt");
CREATE TABLE "new_Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaPago" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "montoAplicado" DECIMAL NOT NULL,
    "montoCredito" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("clienteId", "createdAt", "facturaId", "fechaPago", "id", "metodoPago", "monto", "montoAplicado", "montoCredito", "referencia", "usuarioId") SELECT "clienteId", "createdAt", "facturaId", "fechaPago", "id", "metodoPago", "monto", "montoAplicado", "montoCredito", "referencia", "usuarioId" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
CREATE INDEX "Pago_empresaId_idx" ON "Pago"("empresaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_key" ON "Cotizacion"("numero");

-- CreateIndex
CREATE INDEX "Cotizacion_empresaId_fechaEmision_idx" ON "Cotizacion"("empresaId", "fechaEmision");

-- CreateIndex
CREATE INDEX "Cotizacion_clienteId_idx" ON "Cotizacion"("clienteId");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_idx" ON "Cliente"("empresaId");

-- CreateIndex
CREATE INDEX "Factura_empresaId_idx" ON "Factura"("empresaId");

-- CreateIndex
CREATE INDEX "Producto_empresaId_idx" ON "Producto"("empresaId");

-- CreateIndex
CREATE INDEX "Sucursal_empresaId_idx" ON "Sucursal"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

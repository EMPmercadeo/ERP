-- CreateTable
CREATE TABLE "Empresa" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sucursal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sucursalId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Secuencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Secuencia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secuencia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secuencia_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'vendedor',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "googleId" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "tipoRuc" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "dv" TEXT,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "limiteCredito" DECIMAL NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL NOT NULL DEFAULT 0,
    "saldoAFavor" DECIMAL NOT NULL DEFAULT 0,
    "condicionPago" TEXT NOT NULL DEFAULT 'Contado',
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "descripcion" TEXT NOT NULL,
    "costoUnitario" DECIMAL NOT NULL,
    "precioVenta" DECIMAL NOT NULL,
    "codigoTasaItbms" TEXT NOT NULL DEFAULT '00',
    "unidadMedida" TEXT NOT NULL DEFAULT 'UND',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroSecuencial" INTEGER NOT NULL,
    "numeroCompleto" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "totalDescuento" DECIMAL NOT NULL DEFAULT 0,
    "totalItbms" DECIMAL NOT NULL,
    "totalNeto" DECIMAL NOT NULL,
    "totalPagado" DECIMAL NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL NOT NULL,
    "estadoDgi" TEXT NOT NULL DEFAULT 'borrador',
    "cufe" TEXT,
    "qrUrl" TEXT,
    "xmlContent" TEXT,
    "fechaAceptacion" DATETIME,
    "errorDgi" TEXT,
    "facturaOrigenId" TEXT,
    "motivoAnulacion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_facturaOrigenId_fkey" FOREIGN KEY ("facturaOrigenId") REFERENCES "Factura" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacturaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL NOT NULL,
    "precioUnitario" DECIMAL NOT NULL,
    "costoUnitario" DECIMAL NOT NULL,
    "descuento" DECIMAL NOT NULL DEFAULT 0,
    "codigoTasaItbms" TEXT NOT NULL,
    "montoItbms" DECIMAL NOT NULL,
    "montoTotal" DECIMAL NOT NULL,
    CONSTRAINT "FacturaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "datosAntes" JSONB,
    "datosDespues" JSONB,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_ruc_key" ON "Empresa"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_empresaId_codigo_key" ON "Sucursal"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Caja_sucursalId_codigo_key" ON "Caja"("sucursalId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Secuencia_empresaId_sucursalId_cajaId_tipoDocumento_key" ON "Secuencia"("empresaId", "sucursalId", "cajaId", "tipoDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_ruc_key" ON "Cliente"("empresaId", "ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_codigoInterno_key" ON "Producto"("empresaId", "codigoInterno");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numeroCompleto_key" ON "Factura"("numeroCompleto");

-- CreateIndex
CREATE INDEX "Factura_empresaId_fechaEmision_idx" ON "Factura"("empresaId", "fechaEmision");

-- CreateIndex
CREATE INDEX "Factura_clienteId_idx" ON "Factura"("clienteId");

-- CreateIndex
CREATE INDEX "Factura_estadoDgi_idx" ON "Factura"("estadoDgi");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt");

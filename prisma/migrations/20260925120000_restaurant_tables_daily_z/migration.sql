ALTER TABLE "Empresa" ADD COLUMN "horaCierreNegocio" TEXT NOT NULL DEFAULT '22:00';

CREATE TABLE "MesaRestaurante" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MesaRestaurante_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MesaRestaurante_empresaId_nombre_key" ON "MesaRestaurante"("empresaId", "nombre");
CREATE INDEX "MesaRestaurante_empresaId_idx" ON "MesaRestaurante"("empresaId");

CREATE TABLE "SesionMesa" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "mesaId" TEXT NOT NULL,
  "saloneroId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'normal',
  "estado" TEXT NOT NULL DEFAULT 'abierta',
  "items" JSONB NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 0,
  "abiertaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cerradaAt" TIMESTAMP(3),
  "ventaId" TEXT,
  CONSTRAINT "SesionMesa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SesionMesa_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "MesaRestaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SesionMesa_saloneroId_fkey" FOREIGN KEY ("saloneroId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SesionMesa_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SesionMesa_ventaId_key" ON "SesionMesa"("ventaId");
CREATE UNIQUE INDEX "SesionMesa_mesa_abierta_key" ON "SesionMesa"("mesaId") WHERE "estado" = 'abierta';
CREATE INDEX "SesionMesa_empresaId_estado_abiertaAt_idx" ON "SesionMesa"("empresaId", "estado", "abiertaAt");
CREATE INDEX "SesionMesa_mesaId_estado_idx" ON "SesionMesa"("mesaId", "estado");

CREATE TABLE "CierreZDiario" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "fecha" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "resumen" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CierreZDiario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CierreZDiario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CierreZDiario_empresaId_fecha_key" ON "CierreZDiario"("empresaId", "fecha");

CREATE TABLE "AlertaOperativa" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "clave" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "enviadaAt" TIMESTAMP(3),
  "resueltaAt" TIMESTAMP(3),
  CONSTRAINT "AlertaOperativa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AlertaOperativa_empresaId_clave_key" ON "AlertaOperativa"("empresaId", "clave");
CREATE INDEX "AlertaOperativa_empresaId_createdAt_idx" ON "AlertaOperativa"("empresaId", "createdAt");

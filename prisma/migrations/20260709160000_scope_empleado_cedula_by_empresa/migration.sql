-- ============================================================================
-- Esta migración reemplaza el intento anterior (que solo intentaba alterar la
-- tabla "Empleado" asumiendo que ya existía en producción). Al investigar el
-- error P3018 se descubrió que 18 modelos completos del schema.prisma NUNCA
-- tuvieron su CREATE TABLE en el historial de migraciones — probablemente se
-- aplicaron a algún entorno con `prisma db push` en vez de `prisma migrate`,
-- y esos cambios nunca llegaron a producción. Esta migración crea esas 18
-- tablas desde cero, exactamente como las describe schema.prisma hoy
-- (incluyendo Empleado con `cedula` ya único por empresa desde el origen,
-- sin necesidad de un ALTER TABLE posterior).
--
-- Tablas creadas: ConfiguracionPAC, ConfiguracionSMTP, LogAuditoria,
-- BaseConocimientoLaboral, PlantillaCorreo, Cuenta, PagoCuenta,
-- FacturaEmitida, MovimientoCuota, TicketSoporte, RespuestaTicket,
-- CorreoEnviado, ConfiguracionWoo, Venta, Empleado, Ausencia,
-- MovimientoVacaciones, ActaDisciplinaria.
-- ============================================================================

-- CreateTable
CREATE TABLE "ConfiguracionPAC" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL DEFAULT 'TEST',
    "credenciales" TEXT NOT NULL,
    "esRespaldo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionPAC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionSMTP" (
    "id" TEXT NOT NULL,
    "servidor" TEXT NOT NULL,
    "puerto" INTEGER NOT NULL DEFAULT 587,
    "usuario" TEXT NOT NULL,
    "passwordCifrado" TEXT NOT NULL,
    "remitente" TEXT NOT NULL DEFAULT 'noreply@erppanama.com',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSMTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "objetivoId" TEXT,
    "detalles" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseConocimientoLaboral" (
    "id" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaseConocimientoLaboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaCorreo" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlantillaCorreo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "planId" TEXT,
    "saldoFacturas" INTEGER NOT NULL DEFAULT 0,
    "ultimoAcceso" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCuenta" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "planId" TEXT,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "referencia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaEmitida" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "cufe" TEXT,
    "cliente" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "itbms" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADA',
    "motivoRech" TEXT,
    "xmlUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaEmitida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuota" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "saldoAnte" INTEGER NOT NULL,
    "saldoPost" INTEGER NOT NULL,
    "nota" TEXT,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketSoporte" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "prioridad" TEXT NOT NULL DEFAULT 'NORMAL',
    "asignadoA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketSoporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorreoEnviado" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "plantillaId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADO',
    "abierto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorreoEnviado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionWoo" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "urlTienda" TEXT NOT NULL,
    "consumerKey" TEXT NOT NULL,
    "consumerSec" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSync" TIMESTAMP(3),

    CONSTRAINT "ConfiguracionWoo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaId" TEXT,
    "cufe" TEXT,
    "tipoDoc" TEXT NOT NULL,
    "clienteRuc" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "itbms" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'LOCAL',
    "contingencia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaId" TEXT,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "salarioBase" DECIMAL(65,30) NOT NULL,
    "tipoContrato" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaSalida" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ausencia" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "dias" INTEGER NOT NULL,
    "justificada" BOOLEAN NOT NULL DEFAULT true,
    "documentoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "aprobadaPor" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ausencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoVacaciones" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dias" DECIMAL(65,30) NOT NULL,
    "saldoPosterior" DECIMAL(65,30) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoVacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActaDisciplinaria" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "falta" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaHecho" TIMESTAMP(3) NOT NULL,
    "evidenciaUrl" TEXT,
    "emitidaPor" TEXT NOT NULL,
    "acuseEmpleado" BOOLEAN NOT NULL DEFAULT false,
    "fechaAcuse" TIMESTAMP(3),
    "reincidenciaDe" TEXT,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActaDisciplinaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaCorreo_clave_key" ON "PlantillaCorreo"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_ruc_key" ON "Cuenta"("ruc");
CREATE UNIQUE INDEX "Cuenta_correo_key" ON "Cuenta"("correo");
CREATE INDEX "Cuenta_correo_idx" ON "Cuenta"("correo");
CREATE INDEX "Cuenta_ruc_idx" ON "Cuenta"("ruc");
CREATE INDEX "Cuenta_estado_eliminadoEn_idx" ON "Cuenta"("estado", "eliminadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "PagoCuenta_referencia_key" ON "PagoCuenta"("referencia");
CREATE INDEX "PagoCuenta_cuentaId_createdAt_idx" ON "PagoCuenta"("cuentaId", "createdAt");
CREATE INDEX "PagoCuenta_estado_createdAt_idx" ON "PagoCuenta"("estado", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaEmitida_cufe_key" ON "FacturaEmitida"("cufe");
CREATE INDEX "FacturaEmitida_cuentaId_createdAt_idx" ON "FacturaEmitida"("cuentaId", "createdAt");
CREATE INDEX "FacturaEmitida_estado_createdAt_idx" ON "FacturaEmitida"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoCuota_cuentaId_createdAt_idx" ON "MovimientoCuota"("cuentaId", "createdAt");
CREATE INDEX "MovimientoCuota_tipo_createdAt_idx" ON "MovimientoCuota"("tipo", "createdAt");

-- CreateIndex
CREATE INDEX "TicketSoporte_cuentaId_createdAt_idx" ON "TicketSoporte"("cuentaId", "createdAt");
CREATE INDEX "TicketSoporte_estado_prioridad_createdAt_idx" ON "TicketSoporte"("estado", "prioridad", "createdAt");

-- CreateIndex
CREATE INDEX "RespuestaTicket_ticketId_createdAt_idx" ON "RespuestaTicket"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "CorreoEnviado_cuentaId_createdAt_idx" ON "CorreoEnviado"("cuentaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionWoo_cuentaId_key" ON "ConfiguracionWoo"("cuentaId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_cufe_key" ON "Venta"("cufe");
CREATE INDEX "Venta_empresaId_createdAt_idx" ON "Venta"("empresaId", "createdAt");
CREATE INDEX "Venta_cuentaId_createdAt_idx" ON "Venta"("cuentaId", "createdAt");
CREATE INDEX "Venta_estado_createdAt_idx" ON "Venta"("estado", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_empresaId_cedula_key" ON "Empleado"("empresaId", "cedula");
CREATE INDEX "Empleado_empresaId_idx" ON "Empleado"("empresaId");
CREATE INDEX "Empleado_cuentaId_idx" ON "Empleado"("cuentaId");

-- CreateIndex
CREATE INDEX "Ausencia_empleadoId_desde_idx" ON "Ausencia"("empleadoId", "desde");

-- CreateIndex
CREATE INDEX "MovimientoVacaciones_empleadoId_createdAt_idx" ON "MovimientoVacaciones"("empleadoId", "createdAt");

-- CreateIndex
CREATE INDEX "ActaDisciplinaria_empleadoId_fechaHecho_idx" ON "ActaDisciplinaria"("empleadoId", "fechaHecho");

-- CreateIndex
CREATE INDEX "LogAuditoria_adminId_createdAt_idx" ON "LogAuditoria"("adminId", "createdAt");
CREATE INDEX "LogAuditoria_accion_createdAt_idx" ON "LogAuditoria"("accion", "createdAt");
CREATE INDEX "LogAuditoria_objetivo_objetivoId_idx" ON "LogAuditoria"("objetivo", "objetivoId");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuenta" ADD CONSTRAINT "PagoCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagoCuenta" ADD CONSTRAINT "PagoCuenta_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaEmitida" ADD CONSTRAINT "FacturaEmitida_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuota" ADD CONSTRAINT "MovimientoCuota_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporte" ADD CONSTRAINT "TicketSoporte_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaTicket" ADD CONSTRAINT "RespuestaTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionWoo" ADD CONSTRAINT "ConfiguracionWoo_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ausencia" ADD CONSTRAINT "Ausencia_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoVacaciones" ADD CONSTRAINT "MovimientoVacaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActaDisciplinaria" ADD CONSTRAINT "ActaDisciplinaria_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: mismo patrón "deny all" aplicado al resto del proyecto (RLS no afecta al dueño de
-- la tabla / al rol con el que se conecta Prisma vía DATABASE_URL, solo bloquea acceso
-- directo vía PostgREST/Supabase API con anon/authenticated).
ALTER TABLE "ConfiguracionPAC" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ConfiguracionPAC" FOR ALL USING (false);
ALTER TABLE "ConfiguracionSMTP" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ConfiguracionSMTP" FOR ALL USING (false);
ALTER TABLE "LogAuditoria" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "LogAuditoria" FOR ALL USING (false);
ALTER TABLE "BaseConocimientoLaboral" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "BaseConocimientoLaboral" FOR ALL USING (false);
ALTER TABLE "PlantillaCorreo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "PlantillaCorreo" FOR ALL USING (false);
ALTER TABLE "Cuenta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Cuenta" FOR ALL USING (false);
ALTER TABLE "PagoCuenta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "PagoCuenta" FOR ALL USING (false);
ALTER TABLE "FacturaEmitida" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "FacturaEmitida" FOR ALL USING (false);
ALTER TABLE "MovimientoCuota" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "MovimientoCuota" FOR ALL USING (false);
ALTER TABLE "TicketSoporte" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "TicketSoporte" FOR ALL USING (false);
ALTER TABLE "RespuestaTicket" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "RespuestaTicket" FOR ALL USING (false);
ALTER TABLE "CorreoEnviado" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "CorreoEnviado" FOR ALL USING (false);
ALTER TABLE "ConfiguracionWoo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ConfiguracionWoo" FOR ALL USING (false);
ALTER TABLE "Venta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Venta" FOR ALL USING (false);
ALTER TABLE "Empleado" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Empleado" FOR ALL USING (false);
ALTER TABLE "Ausencia" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Ausencia" FOR ALL USING (false);
ALTER TABLE "MovimientoVacaciones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "MovimientoVacaciones" FOR ALL USING (false);
ALTER TABLE "ActaDisciplinaria" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ActaDisciplinaria" FOR ALL USING (false);

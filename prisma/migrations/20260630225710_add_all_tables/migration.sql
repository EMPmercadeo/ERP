-- DropIndex
DROP INDEX "Factura_empresaId_idx";

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "webhookToken" TEXT,
ADD COLUMN     "webhookUrl" TEXT,
ADD COLUMN     "whatsappPhone" TEXT,
ADD COLUMN     "whatsappToken" TEXT;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "imagenUrl" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceMonthly" DECIMAL(65,30) NOT NULL,
    "includedDocuments" INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "featuresJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentUsage" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "includedLimit" INTEGER NOT NULL,
    "usedDocuments" INTEGER NOT NULL DEFAULT 0,
    "extraDocumentsPurchased" INTEGER NOT NULL DEFAULT 0,
    "remainingDocuments" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosIntegration" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "apiSecretEncrypted" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "syncProductsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncSalesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncInventoryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSyncLog" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "posIntegrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "storagePath" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipoRuc" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "dv" TEXT,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "saldoPendiente" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "condicionPago" TEXT NOT NULL DEFAULT 'Contado',
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "totalDescuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalItbms" DECIMAL(65,30) NOT NULL,
    "totalNeto" DECIMAL(65,30) NOT NULL,
    "saldoPendiente" DECIMAL(65,30) NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraItem" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "costoUnitario" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codigoTasaItbms" TEXT NOT NULL DEFAULT '00',
    "montoItbms" DECIMAL(65,30) NOT NULL,
    "montoTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CompraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoProveedor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "montoAplicado" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoVenta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "totalDescuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalItbms" DECIMAL(65,30) NOT NULL,
    "totalNeto" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "cotizacionId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoVentaItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codigoTasaItbms" TEXT NOT NULL,
    "montoItbms" DECIMAL(65,30) NOT NULL,
    "montoTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PedidoVentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbaranVenta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "totalDescuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalItbms" DECIMAL(65,30) NOT NULL,
    "totalNeto" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "pedidoId" TEXT,
    "facturaId" TEXT,
    "firmaClienteUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbaranVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbaranVentaItem" (
    "id" TEXT NOT NULL,
    "albaranId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codigoTasaItbms" TEXT NOT NULL,
    "montoItbms" DECIMAL(65,30) NOT NULL,
    "montoTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "AlbaranVentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_empresaId_key" ON "Subscription"("empresaId");

-- CreateIndex
CREATE INDEX "DocumentUsage_empresaId_idx" ON "DocumentUsage"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUsage_empresaId_month_year_key" ON "DocumentUsage"("empresaId", "month", "year");

-- CreateIndex
CREATE INDEX "PosIntegration_empresaId_idx" ON "PosIntegration"("empresaId");

-- CreateIndex
CREATE INDEX "PosSyncLog_empresaId_idx" ON "PosSyncLog"("empresaId");

-- CreateIndex
CREATE INDEX "ProductImage_productoId_idx" ON "ProductImage"("productoId");

-- CreateIndex
CREATE INDEX "ProductImage_empresaId_idx" ON "ProductImage"("empresaId");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_idx" ON "Proveedor"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresaId_ruc_key" ON "Proveedor"("empresaId", "ruc");

-- CreateIndex
CREATE INDEX "Compra_empresaId_fechaEmision_idx" ON "Compra"("empresaId", "fechaEmision");

-- CreateIndex
CREATE INDEX "Compra_proveedorId_idx" ON "Compra"("proveedorId");

-- CreateIndex
CREATE INDEX "Compra_estadoPago_idx" ON "Compra"("estadoPago");

-- CreateIndex
CREATE INDEX "CompraItem_compraId_idx" ON "CompraItem"("compraId");

-- CreateIndex
CREATE INDEX "CompraItem_productoId_idx" ON "CompraItem"("productoId");

-- CreateIndex
CREATE INDEX "PagoProveedor_empresaId_idx" ON "PagoProveedor"("empresaId");

-- CreateIndex
CREATE INDEX "PagoProveedor_compraId_idx" ON "PagoProveedor"("compraId");

-- CreateIndex
CREATE INDEX "PagoProveedor_proveedorId_idx" ON "PagoProveedor"("proveedorId");

-- CreateIndex
CREATE INDEX "PagoProveedor_fechaPago_idx" ON "PagoProveedor"("fechaPago");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoVenta_numero_key" ON "PedidoVenta"("numero");

-- CreateIndex
CREATE INDEX "PedidoVenta_empresaId_fechaEmision_idx" ON "PedidoVenta"("empresaId", "fechaEmision");

-- CreateIndex
CREATE INDEX "PedidoVenta_clienteId_idx" ON "PedidoVenta"("clienteId");

-- CreateIndex
CREATE INDEX "PedidoVentaItem_pedidoId_idx" ON "PedidoVentaItem"("pedidoId");

-- CreateIndex
CREATE INDEX "PedidoVentaItem_productoId_idx" ON "PedidoVentaItem"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbaranVenta_numero_key" ON "AlbaranVenta"("numero");

-- CreateIndex
CREATE INDEX "AlbaranVenta_empresaId_fechaEmision_idx" ON "AlbaranVenta"("empresaId", "fechaEmision");

-- CreateIndex
CREATE INDEX "AlbaranVenta_clienteId_idx" ON "AlbaranVenta"("clienteId");

-- CreateIndex
CREATE INDEX "AlbaranVenta_estado_idx" ON "AlbaranVenta"("estado");

-- CreateIndex
CREATE INDEX "AlbaranVentaItem_albaranId_idx" ON "AlbaranVentaItem"("albaranId");

-- CreateIndex
CREATE INDEX "AlbaranVentaItem_productoId_idx" ON "AlbaranVentaItem"("productoId");

-- CreateIndex
CREATE INDEX "CotizacionItem_cotizacionId_idx" ON "CotizacionItem"("cotizacionId");

-- CreateIndex
CREATE INDEX "CotizacionItem_productoId_idx" ON "CotizacionItem"("productoId");

-- CreateIndex
CREATE INDEX "Factura_empresaId_tipoDocumento_idx" ON "Factura"("empresaId", "tipoDocumento");

-- CreateIndex
CREATE INDEX "Factura_creadorId_idx" ON "Factura"("creadorId");

-- CreateIndex
CREATE INDEX "FacturaItem_facturaId_idx" ON "FacturaItem"("facturaId");

-- CreateIndex
CREATE INDEX "FacturaItem_productoId_idx" ON "FacturaItem"("productoId");

-- CreateIndex
CREATE INDEX "Pago_facturaId_idx" ON "Pago"("facturaId");

-- CreateIndex
CREATE INDEX "Pago_clienteId_idx" ON "Pago"("clienteId");

-- CreateIndex
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUsage" ADD CONSTRAINT "DocumentUsage_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosIntegration" ADD CONSTRAINT "PosIntegration_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSyncLog" ADD CONSTRAINT "PosSyncLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSyncLog" ADD CONSTRAINT "PosSyncLog_posIntegrationId_fkey" FOREIGN KEY ("posIntegrationId") REFERENCES "PosIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVentaItem" ADD CONSTRAINT "PedidoVentaItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVentaItem" ADD CONSTRAINT "PedidoVentaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVenta" ADD CONSTRAINT "AlbaranVenta_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVentaItem" ADD CONSTRAINT "AlbaranVentaItem_albaranId_fkey" FOREIGN KEY ("albaranId") REFERENCES "AlbaranVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbaranVentaItem" ADD CONSTRAINT "AlbaranVentaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Habilitar Row Level Security (RLS) para evitar accesos directos no autorizados en Supabase
ALTER TABLE "PedidoVentaItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompraItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PagoProveedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PedidoVenta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlbaranVenta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proveedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Compra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlbaranVentaItem" ENABLE ROW LEVEL SECURITY;

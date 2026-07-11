-- AlterTable
-- Numero de referencia/autorizacion del datafono o de Yappy, capturado manualmente por el
-- cajero (no hay integracion real con un procesador de pagos -- ver
-- src/lib/pos/hardwareEscPos.ts y la validacion en /api/pos/ventas que lo exige para
-- TARJETA/YAPPY).
ALTER TABLE "Venta" ADD COLUMN "referenciaPago" TEXT;

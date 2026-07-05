-- Cierra el gap de RLS en las 8 tablas de compras/proveedores que nunca tuvieron
-- ENABLE ROW LEVEL SECURITY ni política en producción (GRUPO B: ninguna tenía política previa).
ALTER TABLE "AlbaranVenta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "AlbaranVenta" FOR ALL USING (false);
ALTER TABLE "AlbaranVentaItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "AlbaranVentaItem" FOR ALL USING (false);
ALTER TABLE "Compra" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Compra" FOR ALL USING (false);
ALTER TABLE "CompraItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "CompraItem" FOR ALL USING (false);
ALTER TABLE "PagoProveedor" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "PagoProveedor" FOR ALL USING (false);
ALTER TABLE "PedidoVenta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "PedidoVenta" FOR ALL USING (false);
ALTER TABLE "PedidoVentaItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "PedidoVentaItem" FOR ALL USING (false);
ALTER TABLE "Proveedor" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "Proveedor" FOR ALL USING (false);

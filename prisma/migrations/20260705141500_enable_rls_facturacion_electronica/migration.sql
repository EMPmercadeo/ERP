-- Cierra el gap de RLS en las 2 tablas de Fase 5 (Facturacion Electronica / PAC)
-- que llegaron a produccion sin ENABLE ROW LEVEL SECURITY ni politica via el deploy
-- automatico de "prisma migrate deploy" en el build.
ALTER TABLE "ConfiguracionFacturacionElectronica" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "ConfiguracionFacturacionElectronica" FOR ALL USING (false);
ALTER TABLE "FacturaPACLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "FacturaPACLog" FOR ALL USING (false);

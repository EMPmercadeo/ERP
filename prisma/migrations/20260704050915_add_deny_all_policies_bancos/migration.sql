-- Habilitar RLS y crear políticas explícitas de denegación para las tablas nuevas de Bancos,
-- siguiendo el mismo patrón que el resto de las tablas (migración 20260630230000_add_deny_all_policies)
ALTER TABLE "CuentaBancaria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimientoBancario" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny client access" ON "CuentaBancaria" FOR ALL USING (false);
CREATE POLICY "Deny client access" ON "MovimientoBancario" FOR ALL USING (false);

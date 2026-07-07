-- El linter de Supabase reporta "RLS Disabled in Public" para _prisma_migrations
-- (tabla interna que Prisma crea automaticamente para llevar el historial de
-- migraciones; no tiene modelo en schema.prisma). Al vivir en el schema public
-- queda expuesta a PostgREST igual que cualquier otra tabla, asi que se le
-- aplica el mismo patron "deny all" ya usado en el resto del proyecto.
-- Esto NO afecta a `prisma migrate deploy`: RLS no aplica al dueno de la tabla
-- (el rol con el que se conecta Prisma via DATABASE_URL), solo bloquea el
-- acceso via anon/authenticated de PostgREST/Supabase API.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "_prisma_migrations" FOR ALL USING (false);

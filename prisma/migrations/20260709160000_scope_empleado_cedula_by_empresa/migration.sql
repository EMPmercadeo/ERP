-- `cedula` en Empleado era @unique GLOBAL (un solo colaborador con esa cédula en todo el
-- sistema, cruzando empresas). Dos empresas (tenants) distintas deben poder tener cada una
-- un colaborador con la misma cédula sin chocar entre sí. Se reemplaza por unicidad
-- compuesta (empresaId, cedula).
--
-- NOTA: las tablas de RRHH (Empleado, Ausencia, MovimientoVacaciones, ActaDisciplinaria) no
-- aparecen en ningún migration.sql anterior de este repo — se aplicaron a producción por
-- fuera de `prisma migrate` (probablemente `prisma db push` directo). Por eso este script usa
-- IF EXISTS / IF NOT EXISTS: no podemos confirmar el nombre exacto del constraint actual sin
-- acceso directo a la base de datos, y así el script no falla si el nombre difiere del default.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Empleado_cedula_key'
  ) THEN
    ALTER TABLE "Empleado" DROP CONSTRAINT "Empleado_cedula_key";
  END IF;
END $$;

DROP INDEX IF EXISTS "Empleado_cedula_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Empleado_empresaId_cedula_key" ON "Empleado"("empresaId", "cedula");

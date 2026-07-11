-- AlterTable
ALTER TABLE "Empleado"
  ADD COLUMN "departamento" TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN "frecuenciaPago" TEXT NOT NULL DEFAULT 'mensual',
  ADD COLUMN "tasaRiesgo" DOUBLE PRECISION NOT NULL DEFAULT 0.0105;

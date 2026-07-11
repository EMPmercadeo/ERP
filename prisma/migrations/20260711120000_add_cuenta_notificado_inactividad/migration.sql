-- AlterTable
-- Marca de tiempo de la última notificación al cliente por saldo de facturas sin usar
-- (inactividad de 3+ meses). Anti-spam para el recordatorio automático. NULL = nunca
-- notificado. El saldo NUNCA se elimina automáticamente: la baja la hace el superadmin
-- a mano vía /api/admin/cuotas/[cuentaId] (acción 'eliminar_saldo'), que deja rastro en
-- el ledger (MovimientoCuota tipo AJUSTE_MANUAL).
ALTER TABLE "Cuenta"
  ADD COLUMN "notificadoInactividadEn" TIMESTAMP(3);

// Este archivo quedó obsoleto: el envío de correo ahora usa SMTP genérico
// (ver src/lib/email/mailer.ts) en vez del SDK propietario de Resend.
// No se pudo eliminar este archivo por una restricción del entorno de edición,
// así que se deja como re-export vacío por compatibilidad. No importar desde aquí.
export * from './mailer';

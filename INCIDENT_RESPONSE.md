# Protocolo de Respuesta ante Incidentes de Seguridad - ERP Panamá
Este documento detalla el plan de acción, los canales de contacto y los procedimientos técnicos ante cualquier brecha de seguridad o mal funcionamiento crítico en la plataforma.

---

## 1. Identificación y Clasificación de Incidentes
Los incidentes se clasifican según su impacto:

* **Severidad 1 (Crítica):** Fuga de datos de clientes, bypass de inquilino (IDOR generalizado), inyección de código SQL exitosa, caída completa de la base de datos principal, o secuestro de cuentas administrativas.
* **Severidad 2 (Alta):** Falla en la validación de webhooks, mal funcionamiento del rate limiter que cause denegación de servicio, o indisponibilidad persistente de integraciones de pago.
* **Severidad 3 (Media/Baja):** Errores visuales menores en reportes, lentitud aislada en búsquedas de inventario, o fallas en el envío de correos SMTP transaccionales.

---

## 2. Acciones Inmediatas (Contención)

### A. Revocación Masiva de Sesiones (Bypass/Secuestro de Cuentas)
Si se sospecha que una cookie administrativa ha sido robada:
1. Acceda a la consola de Firebase.
2. Inicie un proceso de revocación global para el usuario afectado.
3. El SDK Admin en el backend forzará la expiración del token local en menos de 60 segundos debido a `checkRevoked = true`.

### B. Rotación de Credenciales Comprometidas
Si se expone un secreto del entorno (ej. en GitHub):
1. Vaya al panel de Vercel y reemplace el valor de la variable comprometida.
2. Fuerce un redeploy inmediato del proyecto.
3. Invalide la credencial antigua en el proveedor de origen (Firebase, AWS, PAC o Upstash).

---

## 3. Recuperación de Base de Datos y Backups
En caso de pérdida de datos o corrupción por ataque:
1. Detenga los servidores temporalmente (ponga en modo mantenimiento mediante `vercel.json` o redirección de mantenimiento).
2. Ejecute el script de restauración de PostgreSQL sobre una base limpia.
3. Verifique que no hay rastros de inyección persistente antes de reactivar las conexiones de los usuarios.

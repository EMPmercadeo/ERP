# Matriz de Autorización, Roles y Permisos (RBAC) - ERP Panamá

Este documento contiene la matriz oficial de control de acceso vertical implementado a nivel de servidor.

---

## 1. Roles del Sistema
* **`super_admin`:** Administrador global de la infraestructura. Acceso a paneles de soporte, configuración de PACs y base de datos global.
* **`admin` (Dueño de Empresa):** Control completo de su inquilino, invitación de usuarios y configuraciones locales.
* **`contador`:** Acceso a reportes contables, balance de situación, estado de resultados y diarios.
* **`ventas`:** Acceso exclusivo al POS, facturación rápida y gestión de cobros.
* **`rrhh`:** Gestión de empleados, justificación de ausencias y devengo de vacaciones.

---

## 2. Matriz de Roles y Permisos en Servidor

| Permiso | `super_admin` | `admin` | `contador` | `ventas` | `rrhh` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`users.manage`** | Sí | Sí | No | No | No |
| **`settings.manage`** | Sí | Sí | No | No | No |
| **`invoices.create`** | Sí | Sí | No | Sí | No |
| **`invoices.cancel`** | Sí | Sí | No | No | No |
| **`payments.register`** | Sí | Sí | Sí | Sí | No |
| **`reports.export`** | Sí | Sí | Sí | No | No |
| **`rrhh.manage`** | Sí | Sí | No | No | Sí |

---

## 3. Funciones de Validación Reutilizables
Para proteger cualquier Server Action o endpoint:
```typescript
import { getTenantContext } from '@/lib/auth/context';

export async function checkPermission(requiredRole: string[]) {
    const context = await getTenantContext();
    if (!requiredRole.includes(context.role)) {
        throw new Error("Acceso denegado: Rol insuficiente.");
    }
}
```
Las validaciones son evaluadas estrictamente en el entorno seguro del servidor.

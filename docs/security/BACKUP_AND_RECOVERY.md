# Políticas de Copias de Seguridad y Recuperación - ERP Panamá

Este documento contiene las directrices operativas para salvaguardar y restaurar la base de datos de producción y los archivos de almacenamiento de los clientes.

---

## 1. Plan de Backups (RPO y RTO)
* **Objetivo de Punto de Recuperación (RPO):** Máximo 1 hora (backups continuos de transacciones).
* **Objetivo de Tiempo de Recuperación (RTO):** Menos de 4 horas para incidentes mayores.

---

## 2. Copias de Seguridad de PostgreSQL
Las copias se automatizan mediante herramientas nativas del proveedor cloud (Supabase / Neon) o mediante un script cron que ejecuta `pg_dump`:

### Comando de Respaldo
```bash
pg_dump -U erp_user -h host -d erp_panama -F c -b -v -f /backups/db/erp_panama_$(date +%F).dump
```

### Comando de Restauración
```bash
pg_restore -U erp_user -h host -d erp_panama -v /backups/db/erp_panama_YYYY-MM-DD.dump
```

---

## 3. Almacenamiento y Cifrado
* **Cifrado en Reposo:** Los archivos `.dump` se cifran utilizando algoritmos estándar (AES-256) antes de ser almacenados en buckets de retención de AWS S3 o almacenamiento frío Glacier.
* **Política de Retención:** Los dumps se conservan durante 30 días en caliente, y se archivan mensualmente durante 1 año.

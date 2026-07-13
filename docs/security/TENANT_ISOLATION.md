# Aislamiento Multi-inquilino (Tenant Isolation) - ERP Panamá
Este documento detalla los mecanismos de aislamiento aplicados para garantizar que ninguna empresa pueda acceder a la información de otra (prevención de IDOR).

---

## 1. Regla de Oro en Consultas Prisma
Nunca se debe buscar un recurso únicamente por su `id` e inspeccionar el `empresaId` después de la consulta. La condición de búsqueda debe incluir el filtro de empresa de forma nativa e inmediata.

### 🚫 Patrón Vulnerable (IDOR)
```typescript
const producto = await prisma.producto.findUnique({
  where: { id }
});
if (producto.empresaId !== context.empresaId) {
  throw new Error("No autorizado");
}
```

### ✅ Patrón Seguro (Hardened)
```typescript
const producto = await prisma.producto.findFirst({
  where: {
    id,
    empresaId: context.empresaId
  }
});
if (!producto) {
  throw new NotFoundOrUnauthorizedError();
}
```

---

## 2. Relaciones y Escrituras Anidadas (Nested Writes)
Al crear entidades que se asocian a otras (por ejemplo, registrar una venta con clientes, productos y bodegas), se debe verificar que todos los IDs relacionados pertenezcan a la misma `empresaId` del inquilino autenticado.

```typescript
const clienteValido = await prisma.cliente.findFirst({
  where: { id: clienteId, empresaId: context.empresaId }
});
if (!clienteValido) throw new Error("Cliente inválido para esta empresa");
```

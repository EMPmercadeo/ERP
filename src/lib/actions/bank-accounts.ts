'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CuentaBancariaSchema } from '@/lib/validations';
import { getTenantContext } from '@/lib/auth/context';

export async function getCuentasContablesBanco() {
    const { empresaId } = await getTenantContext();

    const cuentas = await prisma.planCuentas.findMany({
        where: {
            empresaId,
            codigo: { startsWith: '1.1.01' },
            aceptaMovimiento: true,
        },
        orderBy: { codigo: 'asc' },
        select: { id: true, codigo: true, nombre: true },
    });

    return cuentas;
}

export async function createBankAccount(prevState: unknown, formData: FormData) {
    const rawData = {
        nombre: formData.get('nombre'),
        banco: formData.get('banco'),
        numeroCuenta: formData.get('numeroCuenta'),
        tipoCuenta: formData.get('tipoCuenta'),
        cuentaContableId: formData.get('cuentaContableId'),
        saldoInicial: formData.get('saldoInicial') ? Number(formData.get('saldoInicial')) : 0,
    };

    const validatedFields = CuentaBancariaSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos requeridos.',
        };
    }

    const { data } = validatedFields;
    const { empresaId, role } = await getTenantContext();

    if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
        return { message: 'Acceso denegado. Permisos insuficientes.' };
    }

    const cuentaContable = await prisma.planCuentas.findFirst({
        where: { id: data.cuentaContableId, empresaId, codigo: { startsWith: '1.1.01' } },
    });
    if (!cuentaContable) {
        return { message: 'La cuenta contable seleccionada no es válida.' };
    }

    try {
        await prisma.cuentaBancaria.create({
            data: {
                empresaId,
                nombre: data.nombre,
                banco: data.banco,
                numeroCuenta: data.numeroCuenta,
                tipoCuenta: data.tipoCuenta,
                cuentaContableId: data.cuentaContableId,
                saldoInicial: data.saldoInicial,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos al crear la cuenta bancaria.' };
    }

    revalidatePath('/bank-accounts');
    redirect('/bank-accounts');
}

export async function updateBankAccount(id: string, data: {
    nombre: string;
    banco: string;
    numeroCuenta: string;
    tipoCuenta: string;
    cuentaContableId: string;
    saldoInicial: number;
}) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }
        const existing = await prisma.cuentaBancaria.findFirst({ where: { id, empresaId } });
        if (!existing) {
            return { success: false, error: 'Cuenta bancaria no encontrada o acceso denegado.' };
        }

        const cuentaContable = await prisma.planCuentas.findFirst({
            where: { id: data.cuentaContableId, empresaId, codigo: { startsWith: '1.1.01' } },
        });
        if (!cuentaContable) {
            return { success: false, error: 'La cuenta contable seleccionada no es válida.' };
        }

        const updated = await prisma.cuentaBancaria.update({
            where: { id },
            data: {
                nombre: data.nombre,
                banco: data.banco,
                numeroCuenta: data.numeroCuenta,
                tipoCuenta: data.tipoCuenta,
                cuentaContableId: data.cuentaContableId,
                saldoInicial: data.saldoInicial,
            },
        });

        revalidatePath('/bank-accounts');
        revalidatePath(`/bank-accounts/${id}`);

        return {
            success: true,
            data: {
                id: updated.id,
                nombre: updated.nombre,
                banco: updated.banco,
                numeroCuenta: updated.numeroCuenta,
                tipoCuenta: updated.tipoCuenta,
                cuentaContableId: updated.cuentaContableId,
                saldoInicial: Number(updated.saldoInicial),
                activa: updated.activa,
            },
        };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al actualizar la cuenta bancaria.' };
    }
}

export async function toggleBankAccountStatus(id: string, activa: boolean) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }
        const existing = await prisma.cuentaBancaria.findFirst({ where: { id, empresaId } });
        if (!existing) {
            return { success: false, error: 'Cuenta bancaria no encontrada o acceso denegado.' };
        }

        await prisma.cuentaBancaria.update({ where: { id }, data: { activa } });

        revalidatePath('/bank-accounts');
        return { success: true, message: activa ? 'Cuenta reactivada.' : 'Cuenta desactivada.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al cambiar el estado de la cuenta bancaria.' };
    }
}

export async function deleteBankAccount(id: string) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }
        const existing = await prisma.cuentaBancaria.findFirst({ where: { id, empresaId } });
        if (!existing) {
            return { success: false, error: 'Cuenta bancaria no encontrada o acceso denegado.' };
        }

        const movimientos = await prisma.movimientoBancario.count({ where: { cuentaBancariaId: id, empresaId } });
        if (movimientos > 0) {
            await prisma.cuentaBancaria.update({ where: { id }, data: { activa: false } });
            revalidatePath('/bank-accounts');
            return { success: true, deactivated: true, message: 'Cuenta desactivada (tiene movimientos asociados).' };
        }

        await prisma.cuentaBancaria.delete({ where: { id } });
        revalidatePath('/bank-accounts');
        return { success: true, deactivated: false, message: 'Cuenta bancaria eliminada correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, error: 'Error al eliminar la cuenta bancaria.' };
    }
}

export async function getBankAccounts() {
    try {
        const { empresaId } = await getTenantContext();

        const cuentas = await prisma.cuentaBancaria.findMany({
            where: { empresaId },
            orderBy: { createdAt: 'asc' },
            include: {
                cuentaContable: { select: { codigo: true, nombre: true } },
                _count: { select: { movimientos: true } },
            },
        });

        const formatted = cuentas.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            banco: c.banco,
            numeroCuenta: c.numeroCuenta,
            tipoCuenta: c.tipoCuenta,
            cuentaContableId: c.cuentaContableId,
            cuentaContableCodigo: c.cuentaContable.codigo,
            cuentaContableNombre: c.cuentaContable.nombre,
            saldoInicial: Number(c.saldoInicial),
            activa: c.activa,
            totalMovimientos: c._count.movimientos,
        }));

        return { success: true, cuentas: formatted };
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        return { success: false, cuentas: [] };
    }
}

export async function importMovimientosBancarios(
    cuentaBancariaId: string,
    fileName: string,
    rows: Record<string, string>[]
) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }

        const cuenta = await prisma.cuentaBancaria.findFirst({
            where: { id: cuentaBancariaId, empresaId },
        });
        if (!cuenta) {
            return { success: false, error: 'Cuenta bancaria no encontrada o acceso denegado.' };
        }

        let createdCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Fila en el archivo excluyendo encabezado
            try {
                const fechaStr = row.fecha?.toString().trim();
                const descripcion = row.descripcion?.toString().trim();
                const montoStr = row.monto?.toString().trim();

                if (!fechaStr) {
                    errors.push(`Fila ${rowNum}: La fecha es requerida.`);
                    continue;
                }
                const fecha = new Date(fechaStr);
                if (isNaN(fecha.getTime())) {
                    errors.push(`Fila ${rowNum}: Fecha inválida (${fechaStr}).`);
                    continue;
                }

                if (!descripcion) {
                    errors.push(`Fila ${rowNum}: La descripción es requerida.`);
                    continue;
                }

                const monto = parseFloat(montoStr || '');
                if (isNaN(monto) || monto === 0) {
                    errors.push(`Fila ${rowNum}: Monto inválido (${montoStr}).`);
                    continue;
                }

                await prisma.movimientoBancario.create({
                    data: {
                        empresaId,
                        cuentaBancariaId,
                        fecha,
                        descripcion,
                        monto: Math.abs(monto),
                        tipo: monto > 0 ? 'DEPOSITO' : 'RETIRO',
                        conciliado: false,
                        origenImportacion: fileName,
                    },
                });

                createdCount++;
            } catch (err) {
                console.error(`Error importing row ${rowNum}:`, err);
                errors.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'Error desconocido al insertar.'}`);
            }
        }

        revalidatePath(`/bank-accounts/${cuentaBancariaId}`);
        return { success: errors.length === 0 || createdCount > 0, count: createdCount, errors };
    } catch (error) {
        console.error('Import failed', error);
        return { success: false, error: 'Error al procesar la importación de movimientos.' };
    }
}

export async function getBankAccountDetail(id: string) {
    try {
        const { empresaId } = await getTenantContext();

        const cuenta = await prisma.cuentaBancaria.findFirst({
            where: { id, empresaId },
            include: { cuentaContable: { select: { codigo: true, nombre: true } } },
        });
        if (!cuenta) {
            return { success: false as const, error: 'Cuenta bancaria no encontrada.' };
        }

        const movimientos = await prisma.movimientoBancario.findMany({
            where: { cuentaBancariaId: id, empresaId },
            orderBy: { fecha: 'desc' },
        });

        return {
            success: true as const,
            cuenta: {
                id: cuenta.id,
                nombre: cuenta.nombre,
                banco: cuenta.banco,
                numeroCuenta: cuenta.numeroCuenta,
                tipoCuenta: cuenta.tipoCuenta,
                cuentaContableId: cuenta.cuentaContableId,
                cuentaContableCodigo: cuenta.cuentaContable.codigo,
                cuentaContableNombre: cuenta.cuentaContable.nombre,
                saldoInicial: Number(cuenta.saldoInicial),
                activa: cuenta.activa,
            },
            movimientos: movimientos.map((m) => ({
                id: m.id,
                fecha: m.fecha.toISOString(),
                descripcion: m.descripcion,
                monto: Number(m.monto),
                tipo: m.tipo,
                referencia: m.referencia,
                conciliado: m.conciliado,
                asientoContableId: m.asientoContableId,
                origenImportacion: m.origenImportacion,
            })),
        };
    } catch (error) {
        console.error('Error fetching bank account detail:', error);
        return { success: false as const, error: 'Error al cargar el detalle de la cuenta bancaria.' };
    }
}

export async function getReconciliationData(cuentaBancariaId: string) {
    try {
        const { empresaId } = await getTenantContext();

        const cuenta = await prisma.cuentaBancaria.findFirst({
            where: { id: cuentaBancariaId, empresaId },
            include: { cuentaContable: { select: { codigo: true, nombre: true } } },
        });
        if (!cuenta) {
            return { success: false as const, error: 'Cuenta bancaria no encontrada.' };
        }

        const movimientos = await prisma.movimientoBancario.findMany({
            where: { cuentaBancariaId, empresaId, conciliado: false },
            orderBy: { fecha: 'asc' },
        });

        // Líneas de la cuenta contable vinculada, cuyo AsientoContable padre
        // NO tenga ya un MovimientoBancario conciliado apuntando a él.
        const lineas = await prisma.asientoContableLinea.findMany({
            where: {
                cuentaId: cuenta.cuentaContableId,
                asiento: {
                    empresaId,
                    movimientosBancarios: { none: { conciliado: true } },
                },
            },
            include: { asiento: true },
            orderBy: { asiento: { fecha: 'asc' } },
        });

        return {
            success: true as const,
            cuenta: {
                id: cuenta.id,
                nombre: cuenta.nombre,
                cuentaContableCodigo: cuenta.cuentaContable.codigo,
                cuentaContableNombre: cuenta.cuentaContable.nombre,
            },
            movimientos: movimientos.map((m) => ({
                id: m.id,
                fecha: m.fecha.toISOString(),
                descripcion: m.descripcion,
                monto: Number(m.monto),
                tipo: m.tipo,
                referencia: m.referencia,
                origenImportacion: m.origenImportacion,
            })),
            lineas: lineas.map((l) => ({
                id: l.id,
                asientoContableId: l.asientoId,
                asientoNumero: l.asiento.numero,
                fecha: l.asiento.fecha.toISOString(),
                concepto: l.asiento.concepto,
                origen: l.asiento.origen,
                debe: Number(l.debe),
                haber: Number(l.haber),
                descripcion: l.descripcion,
            })),
        };
    } catch (error) {
        console.error('Error fetching reconciliation data:', error);
        return { success: false as const, error: 'Error al cargar los datos de conciliación.' };
    }
}

export async function reconciliarMovimiento(
    cuentaBancariaId: string,
    movimientoBancarioId: string,
    asientoContableId: string
) {
    try {
        const { empresaId, role } = await getTenantContext();
        if (role !== 'admin' && role !== 'gerente' && role !== 'contador') {
            return { success: false, error: 'Acceso denegado. Permisos insuficientes.' };
        }

        const cuenta = await prisma.cuentaBancaria.findFirst({
            where: { id: cuentaBancariaId, empresaId },
        });
        if (!cuenta) {
            return { success: false, error: 'Cuenta bancaria no encontrada o acceso denegado.' };
        }

        const movimiento = await prisma.movimientoBancario.findFirst({
            where: { id: movimientoBancarioId, empresaId, cuentaBancariaId },
        });
        if (!movimiento) {
            return { success: false, error: 'Movimiento bancario no encontrado.' };
        }
        if (movimiento.conciliado) {
            return { success: false, error: 'Este movimiento ya fue conciliado.' };
        }

        const asiento = await prisma.asientoContable.findFirst({
            where: { id: asientoContableId, empresaId },
            include: {
                lineas: { where: { cuentaId: cuenta.cuentaContableId } },
                movimientosBancarios: { where: { conciliado: true } },
            },
        });
        if (!asiento) {
            return { success: false, error: 'Asiento contable no encontrado.' };
        }
        if (asiento.lineas.length === 0) {
            return { success: false, error: 'El asiento seleccionado no afecta la cuenta contable de esta cuenta bancaria.' };
        }
        if (asiento.movimientosBancarios.length > 0) {
            return { success: false, error: 'Este asiento ya fue conciliado con otro movimiento bancario.' };
        }

        await prisma.movimientoBancario.update({
            where: { id: movimientoBancarioId },
            data: { conciliado: true, asientoContableId },
        });

        revalidatePath(`/bank-accounts/${cuentaBancariaId}`);
        revalidatePath(`/bank-accounts/${cuentaBancariaId}/reconcile`);

        return { success: true, message: 'Movimiento conciliado correctamente.' };
    } catch (error) {
        console.error('Error reconciling movement:', error);
        return { success: false, error: 'Error al conciliar el movimiento.' };
    }
}

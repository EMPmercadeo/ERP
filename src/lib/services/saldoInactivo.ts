import { prisma } from '@/lib/db';
import { enviarCorreoSuperadmin } from '@/lib/correo';

/**
 * Saldo de facturas inactivo
 * ---------------------------
 * El saldo de facturas electrónicas (Cuenta.saldoFacturas) es prepago y acumulable: el
 * cliente puede pagar durante varios meses y no consumirlo. NO expira ni se elimina solo.
 *
 * Este servicio solo DETECTA cuentas con saldo > 0 que llevan `mesesInactividad` meses sin
 * consumir (sin ningún MovimientoCuota tipo DEBITO_EMISION en ese periodo) para poder
 * avisarles por correo y ayudarles a usarlo. La eliminación del saldo, si se decide, la hace
 * el superadmin manualmente (ver /api/admin/cuotas/[cuentaId], acción 'eliminar_saldo');
 * aquí nunca se toca el saldo.
 */

export const MESES_INACTIVIDAD_DEFECTO = 3;
// No re-notificar al mismo cliente dentro de esta ventana (anti-spam).
export const DIAS_ENTRE_NOTIFICACIONES = 30;

export interface CuentaSaldoInactivo {
    id: string;
    nombre: string;
    empresa: string;
    ruc: string;
    correo: string;
    saldoFacturas: number;
    ultimoConsumo: Date | null;
    diasSinConsumir: number;
    notificadoInactividadEn: Date | null;
}

function diasEntre(desde: Date, hasta: Date): number {
    return Math.floor((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Devuelve las cuentas ACTIVAS (no soft-deleted) con saldo de facturas > 0 que no han
 * consumido ninguna factura electrónica en los últimos `mesesInactividad` meses.
 */
export async function getCuentasSaldoInactivo(
    mesesInactividad: number = MESES_INACTIVIDAD_DEFECTO
): Promise<CuentaSaldoInactivo[]> {
    const ahora = new Date();
    const corte = new Date(ahora);
    corte.setMonth(corte.getMonth() - mesesInactividad);

    const cuentas = await prisma.cuenta.findMany({
        where: {
            saldoFacturas: { gt: 0 },
            estado: 'ACTIVA',
            eliminadoEn: null,
        },
        select: {
            id: true,
            nombre: true,
            empresa: true,
            ruc: true,
            correo: true,
            saldoFacturas: true,
            createdAt: true,
            notificadoInactividadEn: true,
        },
    });

    if (cuentas.length === 0) return [];

    // Último consumo (DEBITO_EMISION) por cuenta, en una sola consulta agregada.
    const ultimosConsumos = await prisma.movimientoCuota.groupBy({
        by: ['cuentaId'],
        where: {
            tipo: 'DEBITO_EMISION',
            cuentaId: { in: cuentas.map((c) => c.id) },
        },
        _max: { createdAt: true },
    });
    const mapaConsumo = new Map<string, Date | null>(
        ultimosConsumos.map((u) => [u.cuentaId, u._max.createdAt ?? null])
    );

    const inactivas: CuentaSaldoInactivo[] = [];
    for (const c of cuentas) {
        const ultimoConsumo = mapaConsumo.get(c.id) ?? null;
        // Si nunca consumió, la referencia es la fecha de creación de la cuenta.
        const referencia = ultimoConsumo ?? c.createdAt;
        if (referencia < corte) {
            inactivas.push({
                id: c.id,
                nombre: c.nombre,
                empresa: c.empresa,
                ruc: c.ruc,
                correo: c.correo,
                saldoFacturas: c.saldoFacturas,
                ultimoConsumo,
                diasSinConsumir: diasEntre(referencia, ahora),
                notificadoInactividadEn: c.notificadoInactividadEn ?? null,
            });
        }
    }

    // Mayor inactividad primero.
    inactivas.sort((a, b) => b.diasSinConsumir - a.diasSinConsumir);
    return inactivas;
}

function plantillaClienteHtml(c: CuentaSaldoInactivo, meses: number): string {
    const ultimo = c.ultimoConsumo
        ? c.ultimoConsumo.toLocaleDateString('es-PA')
        : 'sin registros de uso';
    return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
      <h2 style="color:#073674;">Tienes saldo de facturas electrónicas sin usar</h2>
      <p>Hola ${c.nombre || c.empresa},</p>
      <p>
        Notamos que tu cuenta tiene <strong>${c.saldoFacturas} factura(s) electrónica(s)</strong>
        de saldo disponible y no registra consumo desde hace más de ${meses} meses
        (último uso: ${ultimo}).
      </p>
      <p>
        Tu saldo es prepago y acumulable, así que sigue disponible para cuando lo necesites.
        Queríamos avisarte para ayudarte a aprovecharlo. Si tienes dudas sobre cómo emitir tus
        documentos o necesitas apoyo, respóndenos a este correo y con gusto te ayudamos.
      </p>
      <p style="color:#6b7280;font-size:13px;">
        Este es un recordatorio informativo de ERP Panamá. No se ha realizado ningún cambio en tu saldo.
      </p>
    </div>`;
}

function plantillaAdminHtml(cuentas: CuentaSaldoInactivo[], meses: number): string {
    const filas = cuentas
        .map(
            (c) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${c.empresa} (${c.ruc})</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${c.saldoFacturas}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${c.diasSinConsumir} días</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${c.correo}</td>
      </tr>`
        )
        .join('');
    return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1f2937;">
      <h2 style="color:#073674;">Cuentas con saldo de facturas inactivo (${meses}+ meses)</h2>
      <p>${cuentas.length} cuenta(s) con saldo prepago sin consumir. Revísalas en el panel para decidir si contactar o dar de baja el saldo (la baja es manual):</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:6px 10px;text-align:left;">Empresa</th>
            <th style="padding:6px 10px;text-align:right;">Saldo</th>
            <th style="padding:6px 10px;text-align:right;">Sin usar</th>
            <th style="padding:6px 10px;text-align:left;">Correo</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">
        Panel: /admin/cuotas-inactivas — ERP Panamá.
      </p>
    </div>`;
}

export interface ResultadoNotificacion {
    totalInactivas: number;
    clientesNotificados: number;
    clientesOmitidosPorVentana: number;
    adminNotificado: boolean;
    detalle: { cuentaId: string; empresa: string; enviado: boolean; motivo?: string }[];
}

/**
 * Detecta cuentas inactivas y notifica: un correo a cada cliente (respetando la ventana
 * anti-spam) y un correo resumen al superadmin. Nunca modifica el saldo.
 */
export async function notificarCuentasSaldoInactivo(options?: {
    mesesInactividad?: number;
    forzarReenvio?: boolean;
}): Promise<ResultadoNotificacion> {
    const meses = options?.mesesInactividad ?? MESES_INACTIVIDAD_DEFECTO;
    const forzar = options?.forzarReenvio ?? false;
    const ahora = new Date();

    const inactivas = await getCuentasSaldoInactivo(meses);
    const detalle: ResultadoNotificacion['detalle'] = [];
    let clientesNotificados = 0;
    let clientesOmitidosPorVentana = 0;

    for (const c of inactivas) {
        // Anti-spam: no reenviar dentro de la ventana salvo que se fuerce.
        if (!forzar && c.notificadoInactividadEn) {
            const dias = diasEntre(c.notificadoInactividadEn, ahora);
            if (dias < DIAS_ENTRE_NOTIFICACIONES) {
                clientesOmitidosPorVentana++;
                detalle.push({ cuentaId: c.id, empresa: c.empresa, enviado: false, motivo: 'ventana anti-spam' });
                continue;
            }
        }

        if (!c.correo) {
            detalle.push({ cuentaId: c.id, empresa: c.empresa, enviado: false, motivo: 'cuenta sin correo' });
            continue;
        }

        const res = await enviarCorreoSuperadmin({
            cuentaId: c.id,
            destinatario: c.correo,
            asunto: 'Tienes saldo de facturas electrónicas sin usar',
            cuerpoLibre: plantillaClienteHtml(c, meses),
        });

        if (res.success) {
            clientesNotificados++;
            await prisma.cuenta.update({
                where: { id: c.id },
                data: { notificadoInactividadEn: ahora },
            });
            detalle.push({ cuentaId: c.id, empresa: c.empresa, enviado: true });
        } else {
            detalle.push({ cuentaId: c.id, empresa: c.empresa, enviado: false, motivo: res.message });
        }
    }

    // Resumen al superadmin (correos de los usuarios super_admin activos + SUPERADMIN_EMAIL).
    let adminNotificado = false;
    if (inactivas.length > 0) {
        const superadmins = await prisma.usuario.findMany({
            where: { rol: 'super_admin', activo: true, email: { not: '' } },
            select: { email: true },
        });
        const destinos = new Set<string>();
        for (const s of superadmins) if (s.email) destinos.add(s.email);
        if (process.env.SUPERADMIN_EMAIL) destinos.add(process.env.SUPERADMIN_EMAIL);

        for (const email of destinos) {
            const res = await enviarCorreoSuperadmin({
                destinatario: email,
                asunto: `[Admin] ${inactivas.length} cuenta(s) con saldo de facturas inactivo`,
                cuerpoLibre: plantillaAdminHtml(inactivas, meses),
            });
            if (res.success) adminNotificado = true;
        }
    }

    return {
        totalInactivas: inactivas.length,
        clientesNotificados,
        clientesOmitidosPorVentana,
        adminNotificado,
        detalle,
    };
}

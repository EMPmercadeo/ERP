'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { getTenantContext } from '../auth/context';
import { getPACProviderForEmpresa } from '../facturacion-electronica/factory';
import { mapFacturaToDTO } from '../facturacion-electronica/mappers';
import { humanizePacError } from '../facturacion-electronica/pac-errors';
import { encrypt } from '../utils/crypto';
import type { PACEmisionResponse, PACAnulacionResponse, PACTransaction } from '../facturacion-electronica/pac-provider.interface';
import { revalidatePath } from 'next/cache';

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Mismo kill-switch que src/lib/actions/invoices.ts. Se repite la comprobación AQUÍ ADENTRO
// (y no solo en los call-sites de invoices.ts) para que sea imposible invocar un PAC real por
// cualquier otra vía — incluyendo la API externa api/v1 — sin que este interruptor esté
// explícitamente encendido en el entorno de producción. Defensa en profundidad: un solo lugar
// que de verdad decide si se permite hablar con un PAC.
const PAC_INTEGRATION_ENABLED = process.env.PAC_INTEGRATION_ENABLED === 'true';

export async function timbrarFacturaDGI(facturaId: string) {
  try {
    if (!PAC_INTEGRATION_ENABLED) {
      return { success: false, message: 'La integración con el PAC todavía no está habilitada en este entorno.' };
    }

    const { empresaId } = await getTenantContext();

    // 1. Cargar factura con todas las relaciones necesarias
    const factura = await prisma.factura.findFirst({
      where: { id: facturaId, empresaId },
      include: {
        cliente: true,
        empresa: true,
        sucursal: true,
        items: true,
        facturaOrigen: true
      }
    });

    if (!factura) {
      return { success: false, message: 'Factura no encontrada o acceso denegado.' };
    }

    // 2. Obtener el proveedor PAC
    const pacProvider = await getPACProviderForEmpresa(empresaId);
    if (!pacProvider) {
      return { success: false, message: 'Facturación electrónica no está activa para esta empresa.' };
    }

    // 3. Mapear al DTO
    const dto = mapFacturaToDTO({
      factura,
      cliente: factura.cliente,
      empresa: factura.empresa,
      sucursal: factura.sucursal,
      items: factura.items
    });

    // 4. Llamar al PAC y capturar logs
    let response: PACEmisionResponse;
    try {
      response = await pacProvider.emitirFactura(dto);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : undefined;
      response = {
        exitoso: false,
        codigoResultado: 'ERR-HTTP',
        mensajeResultado: err?.message || 'Error de conexión HTTP con el PAC.',
        error: err?.stack || err?.message || String(e)
      };
    }

    // 5. Guardar en logs
    await prisma.facturaPACLog.create({
      data: {
        facturaId,
        empresaId,
        tipoOperacion: 'emision',
        requestPayload: dto as unknown as Prisma.InputJsonValue,
        responsePayload: response as unknown as Prisma.InputJsonValue,
        codigoResultado: response.codigoResultado || null,
        mensajeResultado: response.mensajeResultado || null,
        exitoso: response.exitoso
      }
    });

    // 6. Actualizar factura
    // IMPORTANTE: estadoDgi usa el vocabulario en español ya establecido en toda la app
    // (ver DgiStatus en src/components/ui/status-badge.tsx: aceptada/pendiente/rechazada/
    // procesando/anulada/borrador). No introducir valores en inglés aquí — StatusBadge no
    // los reconocería y las facturas mostrarían un badge en blanco/roto en toda la UI.
    if (response.exitoso) {
      await prisma.factura.update({
        where: { id: facturaId },
        data: {
          estadoDgi: 'aceptada',
          cufe: response.cufe,
          protocoloAutorizacion: response.protocoloAutorizacion,
          fechaAutorizacionDGI: response.fechaAutorizacion,
          qrContent: response.qrContent,
          xmlFirmado: response.xmlFirmado,
          errorDgi: null
        }
      });
      revalidatePath('/invoices');
      return { success: true, message: 'Factura autorizada exitosamente por la DGI.', cufe: response.cufe };
    } else {
      await prisma.factura.update({
        where: { id: facturaId },
        data: {
          estadoDgi: 'rechazada',
          errorDgi: response.mensajeResultado || response.error || 'Rechazado por el PAC.'
        }
      });
      revalidatePath('/invoices');
      return { success: false, message: humanizePacError(response.codigoResultado, response.mensajeResultado || response.error) };
    }
  } catch (error: unknown) {
    console.error('Error in timbrarFacturaDGI:', error);
    return { success: false, message: getErrorMessage(error) || 'Error interno del servidor al procesar DGI.' };
  }
}

export async function anularFacturaDGI(facturaId: string, motivo: string) {
  try {
    if (!PAC_INTEGRATION_ENABLED) {
      return { success: false, message: 'La integración con el PAC todavía no está habilitada en este entorno.' };
    }

    const { empresaId } = await getTenantContext();

    if (!motivo || motivo.trim().length < 5) {
      return { success: false, message: 'El motivo de anulación debe tener al menos 5 caracteres.' };
    }

    // 1. Cargar factura
    const factura = await prisma.factura.findFirst({
      where: { id: facturaId, empresaId }
    });

    if (!factura) {
      return { success: false, message: 'Factura no encontrada o acceso denegado.' };
    }

    if (!factura.cufe) {
      return { success: false, message: 'Esta factura no ha sido timbrada en la DGI y no se puede anular.' };
    }

    // 2. Obtener el proveedor PAC
    const pacProvider = await getPACProviderForEmpresa(empresaId);
    if (!pacProvider) {
      return { success: false, message: 'Facturación electrónica no está activa para esta empresa.' };
    }

    // 3. Llamar al PAC y capturar logs
    let response: PACAnulacionResponse;
    try {
      response = await pacProvider.anularFactura(factura.cufe, motivo);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : undefined;
      response = {
        exitoso: false,
        codigoResultado: 'ERR-HTTP',
        mensajeResultado: err?.message || 'Error de conexión HTTP con el PAC.',
        error: err?.stack || err?.message || String(e)
      };
    }

    // 4. Guardar en logs
    await prisma.facturaPACLog.create({
      data: {
        facturaId,
        empresaId,
        tipoOperacion: 'anulacion',
        requestPayload: { cufe: factura.cufe, motivo } as unknown as Prisma.InputJsonValue,
        responsePayload: response as unknown as Prisma.InputJsonValue,
        codigoResultado: response.codigoResultado || null,
        mensajeResultado: response.mensajeResultado || null,
        exitoso: response.exitoso
      }
    });

    // 5. Actualizar factura
    if (response.exitoso) {
      await prisma.factura.update({
        where: { id: facturaId },
        data: {
          estadoDgi: 'anulada',
          saldoPendiente: 0,
          motivoAnulacionDGI: motivo,
          fechaAnulacionDGI: response.fechaAnulacion || new Date()
        }
      });
      revalidatePath('/invoices');
      return { success: true, message: 'Factura anulada con éxito en la DGI.' };
    } else {
      return { success: false, message: humanizePacError(response.codigoResultado, response.mensajeResultado || response.error) };
    }
  } catch (error: unknown) {
    console.error('Error in anularFacturaDGI:', error);
    return { success: false, message: getErrorMessage(error) || 'Error interno al anular factura.' };
  }
}

export async function consultarTransaccionDGI(facturaId: string) {
  try {
    const { empresaId } = await getTenantContext();

    const factura = await prisma.factura.findFirst({
      where: { id: facturaId, empresaId }
    });

    if (!factura || !factura.cufe) {
      return { success: false, message: 'Factura no encontrada o sin CUFE.' };
    }

    const pacProvider = await getPACProviderForEmpresa(empresaId);
    if (!pacProvider) {
      return { success: false, message: 'Facturación electrónica no está activa.' };
    }

    let response: PACTransaction;
    try {
      response = await pacProvider.consultarTransaccion(factura.cufe);

      // Update if authorized (response.estado usa el vocabulario del contrato PACTransaction
      // en inglés — es el estado que reporta el PAC externo. Al guardar en Factura.estadoDgi
      // se traduce al vocabulario en español que ya usa toda la UI).
      if (response.estado === 'authorized') {
        await prisma.factura.update({
          where: { id: facturaId },
          data: {
            estadoDgi: 'aceptada',
            protocoloAutorizacion: response.protocoloAutorizacion,
            fechaAutorizacionDGI: response.fechaAutorizacion || new Date()
          }
        });
        revalidatePath('/invoices');
      }
      return { success: true, message: `Estado actual: ${response.estado}`, data: response };
    } catch (e: unknown) {
      return { success: false, message: getErrorMessage(e) };
    }
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function obtenerLogsPAC(facturaId: string) {
  try {
    const { empresaId } = await getTenantContext();
    return await prisma.facturaPACLog.findMany({
      where: { facturaId, empresaId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error in obtenerLogsPAC:', error);
    return [];
  }
}

export async function guardarConfiguracionFE(data: {
  proveedor: string;
  ambiente: number;
  baseUrl: string;
  authTipo: string;
  credencial: string;
  activo: boolean;
}) {
  try {
    const { empresaId } = await getTenantContext();

    const credencialCifrada = data.credencial ? encrypt(data.credencial) : '';

    const config = await prisma.configuracionFacturacionElectronica.upsert({
      where: { empresaId },
      create: {
        empresaId,
        proveedor: data.proveedor,
        ambiente: data.ambiente,
        baseUrl: data.baseUrl,
        authTipo: data.authTipo,
        credencialCifrada,
        activo: data.activo
      },
      update: {
        proveedor: data.proveedor,
        ambiente: data.ambiente,
        baseUrl: data.baseUrl,
        authTipo: data.authTipo,
        credencialCifrada: data.credencial ? credencialCifrada : undefined,
        activo: data.activo
      }
    });

    // Update Empresa settings
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        fiscalEnabled: data.activo,
        ambienteDgi: String(data.ambiente)
      }
    });

    revalidatePath('/settings');
    return { success: true, config };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function obtenerConfiguracionFE() {
  try {
    const { empresaId } = await getTenantContext();
    const config = await prisma.configuracionFacturacionElectronica.findUnique({
      where: { empresaId }
    });
    return config;
  } catch (error) {
    console.error('Error in obtenerConfiguracionFE:', error);
    return null;
  }
}

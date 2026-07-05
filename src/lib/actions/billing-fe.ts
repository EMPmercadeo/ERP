'use server';

import { prisma } from '../db';
import { getTenantContext } from '../auth/context';
import { getPACProviderForEmpresa } from '../facturacion-electronica/factory';
import { mapFacturaToDTO } from '../facturacion-electronica/mappers';
import { revalidatePath } from 'next/cache';

export async function timbrarFacturaDGI(facturaId: string) {
  try {
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
    let response;
    try {
      response = await pacProvider.emitirFactura(dto);
    } catch (e: any) {
      response = {
        exitoso: false,
        codigoResultado: 'ERR-HTTP',
        mensajeResultado: e.message || 'Error de conexión HTTP con el PAC.',
        error: e.stack || e.message
      };
    }

    // 5. Guardar en logs
    await prisma.facturaPACLog.create({
      data: {
        facturaId,
        empresaId,
        tipoOperacion: 'emision',
        requestPayload: dto as any,
        responsePayload: response as any,
        codigoResultado: response.codigoResultado || null,
        mensajeResultado: response.mensajeResultado || null,
        exitoso: response.exitoso
      }
    });

    // 6. Actualizar factura
    if (response.exitoso) {
      await prisma.factura.update({
        where: { id: facturaId },
        data: {
          estadoDgi: 'authorized',
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
          estadoDgi: 'error',
          errorDgi: response.mensajeResultado || response.error || 'Rechazado por el PAC.'
        }
      });
      revalidatePath('/invoices');
      return { success: false, message: `Error al timbrar factura: ${response.mensajeResultado || response.error}` };
    }
  } catch (error: any) {
    console.error('Error in timbrarFacturaDGI:', error);
    return { success: false, message: error.message || 'Error interno del servidor al procesar DGI.' };
  }
}

export async function anularFacturaDGI(facturaId: string, motivo: string) {
  try {
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
    let response;
    try {
      response = await pacProvider.anularFactura(factura.cufe, motivo);
    } catch (e: any) {
      response = {
        exitoso: false,
        codigoResultado: 'ERR-HTTP',
        mensajeResultado: e.message || 'Error de conexión HTTP con el PAC.',
        error: e.stack || e.message
      };
    }

    // 4. Guardar en logs
    await prisma.facturaPACLog.create({
      data: {
        facturaId,
        empresaId,
        tipoOperacion: 'anulacion',
        requestPayload: { cufe: factura.cufe, motivo } as any,
        responsePayload: response as any,
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
          estadoDgi: 'canceled',
          motivoAnulacionDGI: motivo,
          fechaAnulacionDGI: response.fechaAnulacion || new Date()
        }
      });
      revalidatePath('/invoices');
      return { success: true, message: 'Factura anulada con éxito en la DGI.' };
    } else {
      return { success: false, message: `Error al anular factura: ${response.mensajeResultado || response.error}` };
    }
  } catch (error: any) {
    console.error('Error in anularFacturaDGI:', error);
    return { success: false, message: error.message || 'Error interno al anular factura.' };
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

    let response;
    try {
      response = await pacProvider.consultarTransaccion(factura.cufe);
      
      // Update if authorized
      if (response.estado === 'authorized') {
        await prisma.factura.update({
          where: { id: facturaId },
          data: {
            estadoDgi: 'authorized',
            protocoloAutorizacion: response.protocoloAutorizacion,
            fechaAutorizacionDGI: response.fechaAutorizacion || new Date()
          }
        });
        revalidatePath('/invoices');
      }
      return { success: true, message: `Estado actual: ${response.estado}`, data: response };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
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
    const { encrypt } = require('../utils/crypto');

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
  } catch (error: any) {
    return { success: false, message: error.message };
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

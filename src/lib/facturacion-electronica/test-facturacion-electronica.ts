// Este script de prueba manual (npx tsx) necesita el kill-switch encendido para poder
// ejercitar timbrarFacturaDGI/anularFacturaDGI de verdad — debe fijarse ANTES de que se
// cargue src/lib/actions/billing-fe.ts (que lo lee una sola vez al importarse).
process.env.PAC_INTEGRATION_ENABLED = 'true';

// Intercept next/navigation and auth/context modules
import Module from 'module';
import type { Prisma } from '@prisma/client';

declare global {
  var mockUserId: string | undefined;
  var mockEmpresaId: string | undefined;
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: Module, request: string, ...rest: unknown[]) {
  if (request.includes('auth/context')) {
    return {
      getTenantContext: async () => {
        return {
          userId: global.mockUserId,
          empresaId: global.mockEmpresaId,
          role: 'admin'
        };
      }
    };
  }
  if (request === 'next/cache') {
    return {
      revalidatePath: () => {}
    };
  }
  if (request === 'next/navigation') {
    return {
      redirect: (url: string) => {
        console.log(`[Redirect Mock] Redirecting to: ${url}`);
      }
    };
  }
  return originalRequire.apply(this, [request, ...rest] as Parameters<typeof originalRequire>);
} as NodeJS.Require;

import { prisma } from '../db';
import { crearPlanCuentasParaEmpresa } from '../contabilidad/planCuentasDefault';
import { mapFacturaToDTO } from './mappers';
import {
  guardarConfiguracionFE,
  timbrarFacturaDGI,
  anularFacturaDGI,
  obtenerLogsPAC
} from '../actions/billing-fe';
import { createInvoice } from '../actions/invoices';

async function testFacturacionElectronica() {
  console.log('--- INICIANDO INTEGRATION TEST: FACTURACIÓN ELECTRÓNICA PAC ---');
  const suffix = Date.now().toString();

  let createdEmpresaId: string | null = null;
  let createdClienteId: string | null = null;
  let createdProductoId: string | null = null;

  try {
    // 1. Creación de Empresa
    console.log('1. Creando Empresa...');
    const empresa = await prisma.empresa.create({
      data: {
        ruc: `PE-FE-${suffix}`,
        dv: '09',
        razonSocial: `EMPRESA FISCAL TEST ${suffix}`,
        direccion: 'Calle Ficticia, Panamá',
        planType: 'pro', // Plan PRO para poder usar ambiente producción/fe
        subscriptionStatus: 'active',
        fiscalEnabled: true
      }
    });
    createdEmpresaId = empresa.id;
    global.mockEmpresaId = empresa.id;

    // Generar plan de cuentas minimo para asientos
    console.log('   Generando plan de cuentas...');
    await crearPlanCuentasParaEmpresa(prisma as unknown as Prisma.TransactionClient, empresa.id);

    // 2. Creando Usuario
    console.log('2. Creando Usuario...');
    const user = await prisma.usuario.create({
      data: {
        empresaId: empresa.id,
        email: `test-fe-user-${suffix}@example.com`,
        nombre: 'Admin Fiscal',
        rol: 'admin',
        passwordHash: 'mock-hash'
      }
    });
    global.mockUserId = user.id;

    // 3. Creando Sucursal, Caja y Bodega
    console.log('3. Creando Sucursal, Caja y Bodega...');
    const sucursal = await prisma.sucursal.create({
      data: {
        empresaId: empresa.id,
        codigo: '001',
        nombre: 'Casa Matriz',
        direccion: 'Calle Ficticia, Panamá',
        activa: true
      }
    });

    await prisma.caja.create({
      data: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        codigo: '01',
        nombre: 'Caja Principal',
        activa: true
      }
    });

    const bodega = await prisma.bodega.create({
      data: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        codigo: 'BOD01',
        nombre: 'Bodega Central',
        activa: true
      }
    });

    // 4. Creando Cliente y Producto
    console.log('4. Creando Cliente y Producto...');
    const cliente = await prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        tipoRuc: 'RUC_NATURAL',
        ruc: `8-NT-${suffix}`,
        dv: '12',
        razonSocial: 'Juan Perez',
        direccion: 'Panamá Oeste'
      }
    });
    createdClienteId = cliente.id;

    const producto = await prisma.producto.create({
      data: {
        empresaId: empresa.id,
        codigoInterno: `PROD-FE-${suffix}`,
        descripcion: 'Televisor Smart',
        unidadMedida: 'UND',
        precioVenta: 500,
        costoUnitario: 300,
        stockActual: 10
      }
    });
    createdProductoId = producto.id;

    // 5. Probar guardar configuración de Facturación Electrónica (Fase 10)
    console.log('5. Guardando configuración de Facturación Electrónica...');
    const configRes = await guardarConfiguracionFE({
      proveedor: 'GENERICO',
      ambiente: 2, // pruebas
      baseUrl: 'https://api.generico-pac.com',
      authTipo: 'API_KEY',
      credencial: 'my-pac-api-key',
      activo: true
    });

    if (!configRes.success) {
      throw new Error(`Fallo al guardar la configuración FE: ${configRes.message}`);
    }
    console.log('   Configuración FE guardada con éxito.');

    // 6. Probar mapFacturaToDTO (Fase 5)
    console.log('6. Probando mapFacturaToDTO (mapeador puro)...');
    const mockFactura = {
      condicionPago: 'contado',
      fechaEmision: new Date()
    };
    const mockItems = [
      {
        productoId: producto.id,
        descripcion: producto.descripcion,
        cantidad: 2,
        precioUnitario: 500,
        descuento: 50,
        codigoTasaItbms: '01' // 7%
      }
    ];

    const dto = mapFacturaToDTO({
      factura: mockFactura,
      cliente,
      empresa,
      sucursal,
      items: mockItems
    });

    console.log('   Mappeo DTO generado:', JSON.stringify(dto, null, 2));

    // Validar cálculos del DTO
    if (dto.iAmb !== 2) throw new Error('iAmb incorrecto.');
    if (dto.gEmis.ruc !== empresa.ruc) throw new Error('RUC Emisor incorrecto.');
    if (dto.gDatRec.ruc !== cliente.ruc) throw new Error('RUC Receptor incorrecto.');
    if (dto.gItem[0].cantidad !== 2) throw new Error('Cantidad ítem incorrecta.');
    if (dto.gTot.dTotNeto !== 900) throw new Error(`dTotNeto esperado: 900, obtenido: ${dto.gTot.dTotNeto}`);
    if (dto.gTot.dTotITBMS !== 63) throw new Error(`dTotITBMS esperado: 63, obtenido: ${dto.gTot.dTotITBMS}`);
    if (dto.gTot.dVTot !== 963) throw new Error(`dVTot esperado: 963, obtenido: ${dto.gTot.dVTot}`);

    console.log('   Mapeador puro validado exitosamente.');

    // 7. Crear Factura y Timbrar (Fase 3 & 6)
    console.log('7. Creando factura a través de createInvoice action...');
    const formData = new FormData();
    formData.append('clienteId', cliente.id);
    formData.append('condicionPago', 'contado');
    formData.append('metodoPago', 'efectivo');
    formData.append('bodegaId', bodega.id);
    formData.append('items', JSON.stringify([
      {
        productoId: producto.id,
        descripcion: producto.descripcion,
        cantidad: 2,
        precioUnitario: 500,
        descuento: 0,
        codigoTasaItbms: '01'
      }
    ]));

    // Interceptamos la llamada para ver si crea la factura
    await createInvoice({}, formData);
    console.log('   createInvoice completado.');

    // Recuperar la factura creada para validar
    const dbInvoice = await prisma.factura.findFirst({
      where: { empresaId: empresa.id, clienteId: cliente.id },
      include: { pacLogs: true }
    });

    if (!dbInvoice) {
      throw new Error('No se encontró la factura creada en la base de datos.');
    }

    console.log(`   Factura creada con ID: ${dbInvoice.id}, Estado DGI Inicial: ${dbInvoice.estadoDgi}`);

    // Dado que timbrarFacturaDGI se ejecuta en background (asíncrono), la llamamos síncronamente aquí para probarla y asegurar su comportamiento
    console.log('8. Ejecutando timbrarFacturaDGI de forma síncrona para pruebas...');
    const timbradoResult = await timbrarFacturaDGI(dbInvoice.id);
    if (!timbradoResult.success) {
      throw new Error(`Error en timbrado: ${timbradoResult.message}`);
    }

    // Volver a cargar la factura para verificar metadatos actualizados por el PAC
    const dbInvoiceAutorizada = await prisma.factura.findUnique({
      where: { id: dbInvoice.id }
    });

    if (!dbInvoiceAutorizada) throw new Error('No se encontró la factura.');

    console.log('   Factura Autorizada metadatos:', {
      estadoDgi: dbInvoiceAutorizada.estadoDgi,
      cufe: dbInvoiceAutorizada.cufe,
      protocoloAutorizacion: dbInvoiceAutorizada.protocoloAutorizacion,
      fechaAutorizacionDGI: dbInvoiceAutorizada.fechaAutorizacionDGI,
      qrContent: dbInvoiceAutorizada.qrContent
    });

    if (dbInvoiceAutorizada.estadoDgi !== 'aceptada') {
      throw new Error(`Estado DGI esperado 'aceptada', obtenido: ${dbInvoiceAutorizada.estadoDgi}`);
    }
    if (!dbInvoiceAutorizada.cufe || !dbInvoiceAutorizada.cufe.startsWith('FACT-PAN-')) {
      throw new Error(`CUFE no válido: ${dbInvoiceAutorizada.cufe}`);
    }

    // 9. Verificar creación de logs de auditoría (Fase 3)
    console.log('9. Verificando FacturaPACLog...');
    const logs = await obtenerLogsPAC(dbInvoice.id);
    console.log(`   Cantidad de logs para factura: ${logs.length}`);
    if (logs.length === 0) {
      throw new Error('No se crearon registros de log de auditoría PAC.');
    }
    console.log('   Log de auditoría verificado:', {
      tipoOperacion: logs[0].tipoOperacion,
      exitoso: logs[0].exitoso,
      codigoResultado: logs[0].codigoResultado,
      mensajeResultado: logs[0].mensajeResultado
    });

    // 10. Probar anulación (Fase 6)
    console.log('10. Probando anulación en la DGI...');
    const anulacionRes = await anularFacturaDGI(dbInvoice.id, 'Error en el cliente de facturación.');
    if (!anulacionRes.success) {
      throw new Error(`Error al anular la factura: ${anulacionRes.message}`);
    }

    const dbInvoiceAnulada = await prisma.factura.findUnique({
      where: { id: dbInvoice.id }
    });

    if (!dbInvoiceAnulada || dbInvoiceAnulada.estadoDgi !== 'anulada') {
      throw new Error(`Estado DGI esperado 'anulada' tras anulación, obtenido: ${dbInvoiceAnulada?.estadoDgi}`);
    }
    console.log('   Factura anulada con éxito en la base de datos:', {
      estadoDgi: dbInvoiceAnulada.estadoDgi,
      motivoAnulacionDGI: dbInvoiceAnulada.motivoAnulacionDGI,
      fechaAnulacionDGI: dbInvoiceAnulada.fechaAnulacionDGI
    });

    console.log('--- TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON EXITOSAMENTE ---');

  } catch (error) {
    console.error('!!! ERROR EN LA PRUEBA DE INTEGRACIÓN FE !!!', error);
    process.exit(1);
  } finally {
    // 11. Limpieza de datos
    console.log('11. Limpiando base de datos de registros temporales...');
    if (createdProductoId) await prisma.producto.deleteMany({ where: { id: createdProductoId } });
    if (createdClienteId) await prisma.cliente.deleteMany({ where: { id: createdClienteId } });
    if (createdEmpresaId) {
      await prisma.facturaPACLog.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.pago.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.asientoContableLinea.deleteMany({ where: { asiento: { empresaId: createdEmpresaId } } }).catch(() => {});
      await prisma.asientoContable.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.planCuentas.deleteMany({ where: { empresaId: createdEmpresaId } }).catch(() => {});
      await prisma.factura.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.configuracionFacturacionElectronica.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.bodega.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.caja.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.sucursal.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.usuario.deleteMany({ where: { empresaId: createdEmpresaId } });
      await prisma.empresa.delete({ where: { id: createdEmpresaId } });
    }
    console.log('   Limpieza completada.');
    process.exit(0);
  }
}

testFacturacionElectronica();

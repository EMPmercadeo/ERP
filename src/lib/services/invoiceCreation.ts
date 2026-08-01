import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resolverBodegaId, moverInventarioBodega } from '@/lib/actions/bodegas';
import { canCreateInvoice, incrementDocumentUsage } from '@/lib/actions/billing';
import { generarAsientoFactura, generarAsientoCobro, generarAsientoCostoVenta } from '@/lib/contabilidad/asientos';
import { obtenerTopeDescuentoSinAutorizacion, verificarPinAutorizacion } from '@/lib/services/discountAuth';
import { cargarRecetas, explotarReceta, RecetaCiclicaError, type MapaRecetas } from '@/lib/services/recetas';

interface ProductoConCosto {
    id: string;
    esKit: boolean;
    costoUnitario?: Prisma.Decimal | number | string | null;
    kitInfo?: {
        activo: boolean;
        componentes: {
            cantidad: number;
            productoComponente: ProductoConCosto;
        }[];
    } | null;
}

const DOC_TYPE_FE = 'FE';

export class FacturaCreationError extends Error {}

interface ItemFacturaInput {
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigoTasaItbms: string;
    descuento?: number;
}

export interface CrearFacturaCompletaParams {
    empresaId: string;
    userId: string;
    clienteId: string;
    condicionPago: string;
    metodoPago?: string;
    bodegaId?: string | null;
    items: ItemFacturaInput[];
    // Autorización de admin/gerente (PIN) para descuentos por encima del tope de la empresa
    // o del usuario. Mismo mecanismo que ya se usa en el POS (src/app/api/pos/ventas) — se
    // reutiliza aquí porque `crearFacturaCompleta` es la única fuente de verdad para crear
    // facturas, tanto desde la UI interna como desde la API externa (api/v1/invoices), y
    // antes NINGUNA de esas dos vías validaba el tope de descuento ni pedía autorización.
    autorizacion?: { adminEmail: string; pin: string };
}

export async function getEmpresaDefaults(empresaId: string) {
    const company = await prisma.empresa.findUnique({
        where: { id: empresaId },
        include: {
            sucursales: {
                include: {
                    cajas: true
                }
            }
        }
    });

    if (!company || !company.sucursales[0] || !company.sucursales[0].cajas[0]) {
        throw new FacturaCreationError('Configuración de empresa/sucursal/caja incompleta');
    }

    return {
        empresa: company,
        sucursal: company.sucursales[0],
        caja: company.sucursales[0].cajas[0]
    };
}

export async function getNextSequence(empresaId: string, sucursalId: string, cajaId: string) {
    // Numeración atómica: `upsert` + `increment` se compila a un UPDATE ... SET
    // ultimoNumero = ultimoNumero + 1 (a nivel de fila en Postgres), eliminando la
    // condición de carrera del patrón previo lee-en-JS-luego-escribe, que bajo carga
    // concurrente (dos cajas emitiendo al mismo tiempo) generaba folios DUPLICADOS.
    const sequence = await prisma.secuencia.upsert({
        where: {
            empresaId_sucursalId_cajaId_tipoDocumento: {
                empresaId,
                sucursalId,
                cajaId,
                tipoDocumento: DOC_TYPE_FE
            }
        },
        create: {
            empresaId,
            sucursalId,
            cajaId,
            tipoDocumento: DOC_TYPE_FE,
            ultimoNumero: 1
        },
        update: {
            ultimoNumero: { increment: 1 }
        }
    });

    return sequence.ultimoNumero;
}

function calcularTasaItbms(codigoTasaItbms: string): number {
    return codigoTasaItbms === '01' ? 0.07 :
        codigoTasaItbms === '02' ? 0.10 :
            codigoTasaItbms === '03' ? 0.15 : 0;
}

function getProductoCosto(prod: ProductoConCosto): number {
    if (prod.esKit && prod.kitInfo && prod.kitInfo.activo) {
        let totalCosto = 0;
        for (const comp of prod.kitInfo.componentes) {
            totalCosto += getProductoCosto(comp.productoComponente) * comp.cantidad;
        }
        return totalCosto;
    }
    return Number(prod.costoUnitario || 0);
}

/**
 * Crea una factura completa (numeración vía Secuencia, asientos contables, descuento de stock
 * con soporte de kits/lotes, y consumo de cuota mensual). Fuente única de verdad usada tanto por
 * los flujos internos (UI, POS) como por la API externa — no duplicar esta lógica en otro lugar.
 */
export async function crearFacturaCompleta(params: CrearFacturaCompletaParams) {
    const { empresaId, userId, clienteId, condicionPago, items } = params;
    const metodoPago = params.metodoPago || 'efectivo';

    if (!items || items.length === 0) {
        throw new FacturaCreationError('La factura debe contener al menos un ítem.');
    }

    const { empresa, sucursal, caja } = await getEmpresaDefaults(empresaId);

    const client = await prisma.cliente.findFirst({
        where: { id: clienteId, empresaId }
    });
    if (!client) {
        throw new FacturaCreationError('El cliente seleccionado no pertenece a tu empresa o no existe.');
    }

    const productIds = Array.from(new Set(items.map((item) => item.productoId)));
    const products = await prisma.producto.findMany({
        where: { id: { in: productIds }, empresaId },
        include: {
            kitInfo: {
                include: {
                    componentes: {
                        include: {
                            productoComponente: true
                        }
                    }
                }
            }
        }
    });
    if (products.length !== productIds.length) {
        throw new FacturaCreationError('Uno o más productos seleccionados no pertenecen a tu empresa o no existen.');
    }

    const hasRemainingDocs = await canCreateInvoice(empresaId);
    if (!hasRemainingDocs) {
        throw new FacturaCreationError('Has alcanzado el límite mensual de documentos electrónicos de tu plan. Compra un bloque adicional o actualiza tu plan.');
    }

    // Tope de descuento y autorización de admin/gerente — mismo esquema que el POS.
    // Se mide el % de descuento de cada ítem contra su propio monto bruto (un descuento
    // grande en un ítem barato no debe diluirse promediando entre ítems caros).
    let maxDescuentoPorcentaje = 0;
    for (const item of items) {
        const montoBrutoItem = item.cantidad * item.precioUnitario;
        if (montoBrutoItem > 0 && item.descuento) {
            const pct = (item.descuento / montoBrutoItem) * 100;
            if (pct > maxDescuentoPorcentaje) maxDescuentoPorcentaje = pct;
        }
    }

    let autorizadoPor: { id: string; nombre: string } | null = null;
    if (maxDescuentoPorcentaje > 0) {
        const tope = await obtenerTopeDescuentoSinAutorizacion(empresaId, userId);
        if (maxDescuentoPorcentaje > tope) {
            if (!params.autorizacion) {
                throw new FacturaCreationError(`El descuento aplicado (${maxDescuentoPorcentaje.toFixed(1)}%) excede tu límite de ${tope}% sin autorización. Se requiere el correo y PIN de un administrador o gerente.`);
            }
            const admin = await verificarPinAutorizacion(empresaId, params.autorizacion.adminEmail, params.autorizacion.pin);
            if (!admin) {
                throw new FacturaCreationError('PIN de autorización inválido, o el usuario indicado no tiene permiso para autorizar descuentos.');
            }
            autorizadoPor = { id: admin.id, nombre: admin.nombre };
        }
    }

    const isFiscal = empresa.fiscalEnabled && empresa.planType !== 'free';
    const tipoDoc = isFiscal ? 'FE' : 'REC';
    const prefix = isFiscal ? 'FE' : 'REC';

    const numeroSecuencial = await getNextSequence(empresa.id, sucursal.id, caja.id);
    const numeroCompleto = isFiscal
        ? `${prefix}-001-001-01-${String(numeroSecuencial).padStart(8, '0')}`
        : `${prefix}-${String(numeroSecuencial).padStart(8, '0')}`;

    const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    const totalDescuento = items.reduce((sum, item) => sum + (item.descuento || 0), 0);
    const totalItbms = items.reduce((sum, item) => {
        const tasa = calcularTasaItbms(item.codigoTasaItbms);
        const montoBruto = item.cantidad * item.precioUnitario;
        const montoNeto = Math.max(0, montoBruto - (item.descuento || 0));
        return sum + (montoNeto * tasa);
    }, 0);
    const totalNeto = subtotal - totalDescuento + totalItbms;

    const mapaUnidad = new Map(products.map((p) => [p.id, p.unidadMedida]));
    const mapaCosto = new Map(products.map((p) => [p.id, getProductoCosto(p)]));
    const mapaProductDetails = new Map(products.map((p) => [p.id, p]));

    let ventasMercancias = 0;
    let ventasServicios = 0;
    let costoVentaTotal = 0;
    for (const item of items) {
        const unidad = mapaUnidad.get(item.productoId);
        const montoBrutoItem = item.cantidad * item.precioUnitario;
        if (unidad === 'SRV' || unidad === 'HRS') {
            ventasServicios += montoBrutoItem;
        } else {
            ventasMercancias += montoBrutoItem;
            costoVentaTotal += (mapaCosto.get(item.productoId) ?? 0) * item.cantidad;
        }
    }

    const invoice = await prisma.$transaction(async (tx) => {
        const nuevaFactura = await tx.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId,
                creadorId: userId,
                tipoDocumento: tipoDoc,
                numeroSecuencial,
                numeroCompleto,
                subtotal,
                totalDescuento,
                totalItbms,
                totalNeto,
                saldoPendiente: condicionPago === 'contado' ? 0 : totalNeto,
                totalPagado: condicionPago === 'contado' ? totalNeto : 0,
                estadoDgi: isFiscal ? 'pendiente' : 'local',
                items: {
                    create: items.map((item) => {
                        const tasa = calcularTasaItbms(item.codigoTasaItbms);
                        const desc = item.descuento || 0;
                        const montoBruto = item.cantidad * item.precioUnitario;
                        const montoNeto = Math.max(0, montoBruto - desc);
                        const montoItbms = montoNeto * tasa;
                        return {
                            productoId: item.productoId,
                            descripcion: item.descripcion,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            costoUnitario: mapaCosto.get(item.productoId) ?? 0,
                            descuento: desc,
                            codigoTasaItbms: item.codigoTasaItbms,
                            montoItbms,
                            montoTotal: montoNeto + montoItbms
                        };
                    })
                }
            },
            include: { items: true }
        });

        await generarAsientoFactura(tx, {
            empresaId: empresa.id,
            facturaId: nuevaFactura.id,
            numeroCompleto: nuevaFactura.numeroCompleto,
            fecha: nuevaFactura.fechaEmision,
            usuarioId: userId,
            subtotal,
            totalDescuento,
            totalItbms,
            totalNeto,
            ventasMercancias,
            ventasServicios
        });

        await generarAsientoCostoVenta(tx, {
            empresaId: empresa.id,
            facturaId: nuevaFactura.id,
            numeroCompleto: nuevaFactura.numeroCompleto,
            fecha: nuevaFactura.fechaEmision,
            usuarioId: userId,
            costoTotal: costoVentaTotal
        });

        const bodegaId = await resolverBodegaId(tx, empresa.id, params.bodegaId ?? null);

        // Grafo de recetas de la empresa. Se carga una sola vez por factura: un producto
        // elaborado (una pizza) no descuenta su propio stock, descuenta los insumos que
        // consume, bajando por todas las recetas intermedias hasta la materia prima.
        const recetas: MapaRecetas = await cargarRecetas(empresa.id, tx);

        const descontarStock = async (
            prodId: string,
            cantidad: number,
            esKit: boolean,
            kitInfo: ProductoConCosto['kitInfo']
        ): Promise<void> => {
            // La receta manda sobre todo lo demás: si el producto se fabrica, lo que sale
            // del inventario son sus insumos, nunca él mismo.
            const receta = recetas.get(prodId);
            if (receta && receta.descuentaAutomatico && receta.insumos.length > 0) {
                let consumo;
                try {
                    consumo = explotarReceta(prodId, cantidad, recetas);
                } catch (error) {
                    if (!(error instanceof RecetaCiclicaError)) throw error;
                    // Con una receta circular no se puede saber qué descontar. Se deja pasar
                    // la venta (el cliente ya está en el mostrador) y se registra el problema.
                    console.error(`Receta circular al facturar el producto ${prodId}:`, error.message);
                    return;
                }

                for (const [insumoId, cantidadExacta] of consumo) {
                    // Se redondea una sola vez sobre el consumo total de la línea, no por
                    // unidad, para no arrastrar el error de redondeo en cada pizza.
                    const cantidadInsumo = Math.round(cantidadExacta);
                    if (cantidadInsumo <= 0) continue;
                    await descontarStock(insumoId, cantidadInsumo, false, null);
                    await tx.movimientoInventario.create({
                        data: {
                            empresaId: empresa.id,
                            productoId: insumoId,
                            tipo: 'salida',
                            cantidad: cantidadInsumo,
                            concepto: 'consumo_receta',
                            referenciaId: nuevaFactura.id
                        }
                    });
                }
                return;
            }

            if (esKit && kitInfo && kitInfo.activo) {
                for (const comp of kitInfo.componentes) {
                    const compProd = comp.productoComponente;
                    const totalQty = comp.cantidad * cantidad;
                    await descontarStock(compProd.id, totalQty, compProd.esKit, compProd.kitInfo);
                }
                return;
            }

            const prod = await tx.producto.findFirst({
                where: { id: prodId },
                select: { controlaLotes: true, unidadMedida: true }
            });

            // Los servicios (unidadMedida "SRV") no llevan inventario: no se descuenta stock,
            // no se mueve bodega ni se toca control de lotes.
            if (prod?.unidadMedida === 'SRV') {
                return;
            }

            await tx.producto.update({
                where: { id: prodId },
                data: { stockActual: { decrement: Math.round(cantidad) } }
            });
            await moverInventarioBodega(tx, {
                empresaId: empresa.id,
                bodegaId,
                productoId: prodId,
                delta: -Math.round(cantidad)
            });

            if (prod?.controlaLotes) {
                let cantidadPorDescontar = Math.round(cantidad);
                const lotes = await tx.loteProducto.findMany({
                    where: {
                        empresaId: empresa.id,
                        productoId: prodId,
                        bodegaId,
                        cantidadDisponible: { gt: 0 }
                    },
                    orderBy: [
                        { fechaVencimiento: 'asc' },
                        { createdAt: 'asc' }
                    ]
                });

                for (const lote of lotes) {
                    if (cantidadPorDescontar <= 0) break;
                    const cantidadDescontarDeEsteLote = Math.min(lote.cantidadDisponible, cantidadPorDescontar);
                    await tx.loteProducto.update({
                        where: { id: lote.id },
                        data: { cantidadDisponible: { decrement: cantidadDescontarDeEsteLote } }
                    });
                    cantidadPorDescontar -= cantidadDescontarDeEsteLote;
                }

                if (cantidadPorDescontar > 0) {
                    if (lotes.length > 0) {
                        await tx.loteProducto.update({
                            where: { id: lotes[lotes.length - 1].id },
                            data: { cantidadDisponible: { decrement: cantidadPorDescontar } }
                        });
                    } else {
                        await tx.loteProducto.create({
                            data: {
                                empresaId: empresa.id,
                                productoId: prodId,
                                bodegaId,
                                numeroLote: 'LOTE-SISTEMA',
                                fechaVencimiento: null,
                                cantidadRecibida: 0,
                                cantidadDisponible: -cantidadPorDescontar
                            }
                        });
                    }
                }
            }
        };

        for (const item of items) {
            const unidad = mapaUnidad.get(item.productoId);
            if (unidad !== 'SRV' && unidad !== 'HRS') {
                const prodDetails = mapaProductDetails.get(item.productoId);
                if (prodDetails) {
                    await descontarStock(item.productoId, item.cantidad, prodDetails.esKit, prodDetails.kitInfo);
                }
            }
        }

        if (condicionPago === 'contado') {
            const nuevoPago = await tx.pago.create({
                data: {
                    empresaId: empresa.id,
                    facturaId: nuevaFactura.id,
                    clienteId,
                    usuarioId: userId,
                    monto: totalNeto,
                    metodoPago,
                    montoAplicado: totalNeto
                }
            });

            await generarAsientoCobro(tx, {
                empresaId: empresa.id,
                pagoId: nuevoPago.id,
                numeroFactura: nuevaFactura.numeroCompleto,
                fecha: nuevaFactura.fechaEmision,
                usuarioId: userId,
                monto: totalNeto,
                metodoPago
            });
        }

        return nuevaFactura;
    });

    await incrementDocumentUsage(empresaId);

    if (autorizadoPor) {
        await prisma.auditoria.create({
            data: {
                usuarioId: userId,
                entidad: 'Factura',
                entidadId: invoice.id,
                accion: 'editar',
                datosDespues: {
                    accionEspecial: 'AUTORIZAR_DESCUENTO_FACTURA',
                    numeroCompleto: invoice.numeroCompleto,
                    descuentoPorcentaje: Number(maxDescuentoPorcentaje.toFixed(2)),
                    autorizadoPorId: autorizadoPor.id,
                    autorizadoPorNombre: autorizadoPor.nombre
                }
            }
        });
    }

    return invoice;
}

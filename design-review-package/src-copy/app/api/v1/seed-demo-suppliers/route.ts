import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getTenantContext } from '@/lib/auth/context';

const RUBROS = [
    { rubro: 'Tecnología e Informática', prefijos: ['Tecno', 'Informatica', 'Soluciones Digitales', 'Sistemas e Innovación', 'Redes y Servidores', 'MicroSistemas'], productos: ['Computadoras y servidores', 'Licencias de software', 'Soporte TI y redes'] },
    { rubro: 'Ferretería y Construcción', prefijos: ['Ferretería', 'Materiales y Acero', 'Constructora e Insumos', 'Herramientas', 'Distribuidora de Tubos', 'Cemento e Infraestructura'], productos: ['Herramientas industriales', 'Materiales eléctricos', 'Tuberías y plomería'] },
    { rubro: 'Papelería e Insumos de Oficina', prefijos: ['Papelería', 'Suministros de Oficina', 'Impresiones y Tintas', 'Comercializadora de Papel', 'OfiInsumos', 'Papelera'], productos: ['Resmas de papel y bolígrafos', 'Tóner e impresoras', 'Archivadores y sobres'] },
    { rubro: 'Logística y Transporte', prefijos: ['Logística', 'Transporte y Carga', 'Envíos Express', 'Fletes y Bodegas', 'Carga Internacional', 'Aduanas y Fletes'], productos: ['Servicios de flete local', 'Almacenamiento en bodega', 'Despacho aduanal'] },
    { rubro: 'Limpieza e Mantenimiento', prefijos: ['Servicios de Limpieza', 'Mantenimiento General', 'Suministros de Higiene', 'Químicos y Desinfectantes', 'EcoLimpieza', 'Sanidad'], productos: ['Productos desinfectantes', 'Servicio de mantenimiento', 'Insumos sanitarios'] },
    { rubro: 'Mobiliario y Equipamiento', prefijos: ['Muebles y Escritorios', 'Mobiliario Corporativo', 'Diseño de Interiores', 'Ergonómica', 'Equipos de Oficina'], productos: ['Sillas ergonómicas', 'Escritorios modulares', 'Estanterías metálicas'] },
    { rubro: 'Consultoría y Servicios Profesionales', prefijos: ['Consultores Asociados', 'Asesoría Contable y Fiscal', 'Auditoría Integral', 'Legal & Tax', 'Servicios Gerenciales'], productos: ['Auditoría anual externa', 'Asesoría fiscal', 'Estudio de mercado'] },
    { rubro: 'Alimentos y Catering Corporativo', prefijos: ['Alimentos y Bebidas', 'Catering Corporativo', 'Café y Suministros', 'Distribuidora de Alimentos', 'Gourmet Express'], productos: ['Insumos para cafetería', 'Servicio de catering almuerzos', 'Agua embotellada y café'] },
    { rubro: 'Seguridad y Vigilancia', prefijos: ['Seguridad Electrónica', 'Cámaras y Monitoreo', 'Vigilancia Privada', 'Control de Accesos', 'Sistemas Anti-Incendio'], productos: ['Mantenimiento de CCTV', 'Extintores y señalización', 'Servicio de vigilancia'] },
    { rubro: 'Publicidad e Imprenta', prefijos: ['Impresiones Gráficas', 'Agencia de Publicidad', 'Material Promocional', 'Rotulación y Banners', 'Estudio Creativo'], productos: ['Uniformes bordados', 'Tarjetas y catálogos', 'Banners promocionales'] }
];

const SUFIJOS = ['S.A.', 'Inc.', 'y Cía. S.A.', 'Panamá S.A.', 'del Istmo S.A.', 'del Pacífico S.A.', 'Internacional S.A.', 'Global S.A.', 'Group S.A.', 'S. de R.L.'];

const NOMBRES_CONTACTO = [
    'Carlos Rodríguez', 'Ana Morales', 'Roberto Gómez', 'Mariana López', 'Fernando Martínez',
    'Giselle Sánchez', 'Luis Castillo', 'Elena Navarro', 'Jorge Mendoza', 'Patricia Herrera',
    'Gabriel Vargas', 'Sofía Rojas', 'Ricardo Benítez', 'Claudia Salazar', 'Andrés Jiménez',
    'Lucía Paredes', 'Diego Fernández', 'Camila Osorio', 'Mateo Ramírez', 'Valentina Cruz'
];

const CONDICIONES_PAGO = ['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 60 días'];

const ESTADOS = ['activo', 'activo', 'activo', 'activo', 'activo', 'activo', 'activo', 'inactivo', 'archivado'];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
    return seedHandler();
}

export async function GET() {
    return seedHandler();
}

async function seedHandler() {
    try {
        const { empresaId, userId } = await getTenantContext();

        const countExistentes = await prisma.proveedor.count({ where: { empresaId } });
        if (countExistentes >= 100) {
            return NextResponse.json({
                success: true,
                message: `La empresa ya cuenta con ${countExistentes} proveedores registrados.`,
                count: countExistentes
            });
        }

        let creadosCount = 0;
        let comprasCount = 0;
        let pagosCount = 0;

        for (let i = 1; i <= 150; i++) {
            const rubroObj = getRandomItem(RUBROS);
            const prefijo = getRandomItem(rubroObj.prefijos);
            const sufijo = getRandomItem(SUFIJOS);
            const razonSocial = `${prefijo} ${getRandomInt(10, 999)} ${sufijo}`;
            const nombreComercial = Math.random() > 0.3 ? `${prefijo} Panamá` : null;
            const nombreContacto = getRandomItem(NOMBRES_CONTACTO);

            const tipoRuc = Math.random() > 0.15 ? 'J' : Math.random() > 0.5 ? 'N' : 'E';
            const ruc = tipoRuc === 'J' 
                ? `${getRandomInt(100000, 9999999)}-${getRandomInt(1, 9)}-${getRandomInt(2010, 2025)}`
                : tipoRuc === 'N'
                ? `${getRandomInt(1, 10)}-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`
                : `E-${getRandomInt(1, 10)}-${getRandomInt(100000, 999999)}`;
            const dv = `${getRandomInt(10, 99)}`;

            const email = `ventas@${prefijo.toLowerCase().replace(/[^a-z]/g, '')}${getRandomInt(1, 99)}.com.pa`;
            const telefono = `${getRandomInt(200, 399)}-${getRandomInt(1000, 9999)}`;
            const direccion = `Calle ${getRandomInt(1, 75)}, Vía España / Obarrio, Edificio ${prefijo}, Piso ${getRandomInt(1, 15)}, Ciudad de Panamá`;
            const condicionPago = getRandomItem(CONDICIONES_PAGO);
            const estado = getRandomItem(ESTADOS);
            const limiteCredito = new Prisma.Decimal(getRandomItem([1500, 3000, 5000, 10000, 20000, 50000]));
            const observaciones = `Proveedor del rubro de ${rubroObj.rubro}. Especializados en ${getRandomItem(rubroObj.productos)}.`;

            const proveedor = await prisma.proveedor.create({
                data: {
                    empresaId,
                    tipoRuc,
                    ruc,
                    dv,
                    razonSocial,
                    nombreComercial,
                    nombreContacto,
                    direccion,
                    email,
                    telefono,
                    condicionPago,
                    estado,
                    limiteCredito,
                    observaciones,
                    saldoPendiente: new Prisma.Decimal(0)
                }
            });

            creadosCount++;

            if (proveedor.estado === 'activo' && Math.random() < 0.45) {
                const numFacturas = getRandomInt(1, 4);
                let saldoAcumuladoProveedor = 0;

                for (let f = 1; f <= numFacturas; f++) {
                    const subtotal = getRandomInt(150, 4500);
                    const impuesto = Number((subtotal * 0.07).toFixed(2));
                    const totalNeto = subtotal + impuesto;

                    const rndEstado = Math.random();
                    let estadoPago = 'pendiente';
                    let montoPagado = 0;

                    const diasEmision = getRandomInt(5, 90);
                    const fechaEmision = new Date();
                    fechaEmision.setDate(fechaEmision.getDate() - diasEmision);

                    const fechaVencimiento = new Date(fechaEmision);
                    const diasCredito = condicionPago.includes('15') ? 15 : condicionPago.includes('30') ? 30 : condicionPago.includes('60') ? 60 : 0;
                    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);

                    if (rndEstado < 0.40) {
                        estadoPago = 'pagada';
                        montoPagado = totalNeto;
                    } else if (rndEstado < 0.55) {
                        estadoPago = 'parcial';
                        montoPagado = Number((totalNeto * 0.5).toFixed(2));
                    } else if (rndEstado < 0.70) {
                        fechaEmision.setDate(new Date().getDate() - 45);
                        fechaVencimiento.setDate(new Date().getDate() - 15);
                        estadoPago = 'pendiente';
                        montoPagado = 0;
                    } else {
                        estadoPago = 'pendiente';
                        montoPagado = 0;
                    }

                    const saldoFactura = Number((totalNeto - montoPagado).toFixed(2));
                    saldoAcumuladoProveedor += saldoFactura;

                    const compra = await prisma.compra.create({
                        data: {
                            empresaId,
                            proveedorId: proveedor.id,
                            creadorId: userId,
                            numeroFactura: `F-${getRandomInt(100, 999)}-${getRandomInt(10000, 99999)}`,
                            fechaEmision,
                            fechaVencimiento,
                            subtotal: new Prisma.Decimal(subtotal),
                            totalItbms: new Prisma.Decimal(impuesto),
                            totalNeto: new Prisma.Decimal(totalNeto),
                            saldoPendiente: new Prisma.Decimal(saldoFactura),
                            estadoPago
                        }
                    });
                    comprasCount++;

                    if (montoPagado > 0) {
                        const fechaPago = new Date(fechaEmision);
                        fechaPago.setDate(fechaPago.getDate() + getRandomInt(1, Math.max(1, diasCredito - 2)));

                        await prisma.pagoProveedor.create({
                            data: {
                                empresaId,
                                proveedorId: proveedor.id,
                                compraId: compra.id,
                                usuarioId: userId,
                                fechaPago: fechaPago > new Date() ? new Date() : fechaPago,
                                monto: new Prisma.Decimal(montoPagado),
                                montoAplicado: new Prisma.Decimal(montoPagado),
                                metodoPago: getRandomItem(['ACH / Transferencia', 'Cheque', 'Tarjeta de Crédito Corporativa']),
                                referencia: `REF-${getRandomInt(100000, 999999)}`
                            }
                        });
                        pagosCount++;
                    }
                }

                if (saldoAcumuladoProveedor > 0) {
                    await prisma.proveedor.update({
                        where: { id: proveedor.id },
                        data: { saldoPendiente: new Prisma.Decimal(saldoAcumuladoProveedor.toFixed(2)) }
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Generados exitosamente ${creadosCount} proveedores con ${comprasCount} facturas y ${pagosCount} pagos.`,
            creadosCount
        });
    } catch (error: any) {
        console.error('Error al poblar proveedores demo:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Error en el servidor' }, { status: 500 });
    }
}

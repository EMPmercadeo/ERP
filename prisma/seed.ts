import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions for generating realistic Panamanian data
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number): Prisma.Decimal =>
    new Prisma.Decimal((Math.random() * (max - min) + min).toFixed(2));

const nombresPersonas = [
    'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Lucía', 'Miguel', 'Carmen',
    'Roberto', 'Elena', 'José', 'Patricia', 'Luis', 'Rosa', 'Fernando', 'Laura',
    'Antonio', 'Marta', 'Ricardo', 'Isabel', 'Jorge', 'Diana', 'Alejandro', 'Sofía',
    'Eduardo', 'Valentina', 'Rafael', 'Gabriela', 'Daniel', 'Claudia'
];

const apellidos = [
    'González', 'Rodríguez', 'Martínez', 'López', 'García', 'Pérez', 'Sánchez',
    'Hernández', 'Torres', 'Flores', 'Rivera', 'Morales', 'Gómez', 'Díaz', 'Vargas',
    'Castillo', 'Jiménez', 'Romero', 'Mendoza', 'Ruiz', 'Ortiz', 'Gutiérrez',
    'Navarro', 'Delgado', 'Ramos', 'Medina', 'Cruz', 'Vásquez', 'Castro', 'Cordero'
];

const nombresEmpresas = [
    'Constructora', 'Comercializadora', 'Importadora', 'Distribuidora', 'Servicios',
    'Soluciones', 'Tecnología', 'Industrial', 'Agrícola', 'Inmobiliaria',
    'Transporte', 'Logística', 'Consultores', 'Inversiones', 'Grupo'
];

const sufijosEmpresas = ['S.A.', 'Corp.', 'Inc.', 'S.R.L.', 'y Asociados'];

const direccionesCalles = [
    'Calle 50', 'Vía España', 'Calle Uruguay', 'Avenida Balboa', 'Vía Argentina',
    'Calle Primera', 'Avenida Central', 'Vía Brasil', 'Calle Ricardo Arias',
    'Avenida Samuel Lewis', 'Vía Porras', 'Calle Aquilino de la Guardia',
    'Marbella', 'Punta Pacífica', 'Costa del Este', 'San Francisco', 'Obarrio'
];

const productosElectronicos = [
    'Laptop HP 15"', 'Monitor Samsung 24"', 'Teclado Logitech', 'Mouse Inalámbrico',
    'Impresora Canon', 'Disco Duro 1TB', 'USB 32GB', 'Auriculares Sony',
    'Cámara Web HD', 'Router WiFi', 'Cable HDMI 2m', 'Cargador Universal',
    'Tablet Android 10"', 'SSD 500GB', 'Memoria RAM 16GB', 'UPS 1200VA'
];

const productosOficina = [
    'Papel Bond Resma', 'Bolígrafos Caja x12', 'Grapadora', 'Clips Caja x100',
    'Carpetas Manila x25', 'Folder Tamaño Carta', 'Marcadores Set', 'Cinta Adhesiva',
    'Tijeras Oficina', 'Regla 30cm', 'Borrador', 'Lápices HB x12',
    'Archivador A4', 'Post-it Pack', 'Sobres Manila x50', 'Calculadora Científica'
];

const productosMuebles = [
    'Escritorio Ejecutivo', 'Silla Ergonómica', 'Mesa de Reuniones', 'Archivador 4 Gavetas',
    'Estante Metálico', 'Silla Visitante', 'Mesa de Centro', 'Sofá Sala Espera',
    'Librero 5 Niveles', 'Pizarra Blanca', 'Panel Divisor', 'Perchero'
];

const metodoPago = ['efectivo', 'transferencia', 'tarjeta', 'cheque'];
const estadosDgi = ['pendiente', 'aceptada', 'borrador', 'rechazada', 'error', 'anulada'];
const condicionesPago = ['Contado', 'Crédito 15', 'Crédito 30', 'Crédito 45', 'Crédito 60'];
const tasasItbms = ['00', '01', '02'];

const generateRuc = (tipo: '01' | '02'): { ruc: string; dv: string } => {
    if (tipo === '01') {
        const provincia = randomInt(1, 13).toString().padStart(1, '0');
        const tomo = randomInt(1, 999).toString().padStart(1, '0');
        const asiento = randomInt(1, 99999).toString().padStart(1, '0');
        return { ruc: `${provincia}-${tomo}-${asiento}`, dv: randomInt(10, 99).toString() };
    } else {
        const numero = randomInt(1000, 999999).toString();
        return { ruc: numero, dv: randomInt(10, 99).toString() };
    }
};

async function main() {
    console.log('🗑️  Limpiando base de datos...');

    // Clean up in order
    await prisma.cotizacionItem.deleteMany().catch(() => { });
    await prisma.cotizacion.deleteMany().catch(() => { });
    await prisma.auditoria.deleteMany();
    await prisma.pago.deleteMany();
    await prisma.facturaItem.deleteMany();
    await prisma.factura.deleteMany();
    await prisma.secuencia.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.caja.deleteMany();
    await prisma.sucursal.deleteMany();
    await prisma.empresa.deleteMany();

    console.log('✅ Base de datos limpiada');
    console.log('🌱 Creando datos de muestra...\n');

    // 1. Create Empresa
    console.log('📊 Creando empresa...');
    const empresa = await prisma.empresa.create({
        data: {
            ruc: '155700123456',
            dv: '45',
            razonSocial: 'ERP Panamá Solutions S.A.',
            nombreComercial: 'ERP Panamá',
            direccion: 'Torre Global Bank, Piso 15, Calle 50, Ciudad de Panamá',
            telefono: '+507 300-0000',
            email: 'info@erp-panama.com',
            ambienteDgi: '1',
        },
    });

    // 2. Create 150 Sucursales with Cajas
    console.log('🏢 Creando 150 sucursales con cajas...');
    const sucursales = [];
    const cajas = [];

    for (let i = 1; i <= 150; i++) {
        const sucursal = await prisma.sucursal.create({
            data: {
                empresaId: empresa.id,
                codigo: i.toString().padStart(3, '0'),
                nombre: `Sucursal ${randomItem(direccionesCalles)} #${i}`,
                direccion: `${randomItem(direccionesCalles)} Local ${randomInt(1, 100)}, Panamá`,
                activa: Math.random() > 0.1,
            },
        });
        sucursales.push(sucursal);

        const numCajas = randomInt(1, 3);
        for (let j = 1; j <= numCajas; j++) {
            const caja = await prisma.caja.create({
                data: {
                    empresaId: empresa.id,
                    sucursalId: sucursal.id,
                    codigo: j.toString().padStart(2, '0'),
                    nombre: `Caja ${j}`,
                    activa: Math.random() > 0.05,
                },
            });
            cajas.push(caja);
        }
    }

    // 3. Create Secuencias
    console.log('🔢 Creando secuencias...');
    for (const caja of cajas) {
        const sucursal = sucursales.find(s => s.id === caja.sucursalId)!;
        for (const tipo of ['FE', 'NC', 'ND']) {
            await prisma.secuencia.create({
                data: {
                    empresaId: empresa.id,
                    sucursalId: sucursal.id,
                    cajaId: caja.id,
                    tipoDocumento: tipo,
                    ultimoNumero: 0,
                },
            });
        }
    }

    // 4. Create 150 Usuarios
    console.log('👥 Creando 150 usuarios...');
    const usuarios = [];
    const roles = ['super_admin', 'admin', 'vendedor', 'contador'];

    for (let i = 1; i <= 150; i++) {
        const isSuperAdmin = i === 1;

        let nombre, apellido, email, rol;

        if (isSuperAdmin) {
            nombre = 'Super';
            apellido = 'Admin';
            email = 'admin@erp-panama.com';
            rol = 'super_admin';
        } else {
            nombre = randomItem(nombresPersonas);
            apellido = randomItem(apellidos);
            email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@erp-panama.com`;
            rol = randomItem(roles);
        }

        const usuario = await prisma.usuario.create({
            data: {
                empresaId: empresa.id,
                email: email,
                passwordHash: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // 'password' (bcrypt)
                nombre: `${nombre} ${apellido}`,
                rol: rol,
                activo: true,
            },
        });
        usuarios.push(usuario);
    }

    // 5. Create 150 Clientes
    console.log('👤 Creando 150 clientes...');
    const clientes = [];

    for (let i = 1; i <= 150; i++) {
        const tipoRuc = Math.random() > 0.4 ? '01' : '02';
        const { ruc, dv } = generateRuc(tipoRuc as '01' | '02');

        let razonSocial: string;
        if (tipoRuc === '01') {
            razonSocial = `${randomItem(nombresPersonas)} ${randomItem(apellidos)} ${randomItem(apellidos)}`;
        } else {
            razonSocial = `${randomItem(nombresEmpresas)} ${randomItem(apellidos)} ${randomItem(sufijosEmpresas)}`;
        }

        const cliente = await prisma.cliente.create({
            data: {
                empresaId: empresa.id,
                tipoRuc,
                ruc: `${ruc}-${i}`,
                dv,
                razonSocial,
                nombreComercial: tipoRuc === '02' ? `${randomItem(apellidos)} ${randomItem(sufijosEmpresas)}` : null,
                direccion: `${randomItem(direccionesCalles)} #${randomInt(1, 500)}, Panamá`,
                email: `cliente${i}@${razonSocial.split(' ')[0].toLowerCase()}.com`,
                telefono: `+507 ${randomInt(200, 399)}-${randomInt(1000, 9999)}`,
                limiteCredito: randomDecimal(1000, 50000),
                saldoPendiente: randomDecimal(0, 5000),
                saldoAFavor: randomDecimal(0, 500),
                condicionPago: randomItem(condicionesPago),
                estado: Math.random() > 0.9 ? 'moroso' : 'activo',
            },
        });
        clientes.push(cliente);
    }

    // 6. Create 150 Productos
    console.log('📦 Creando 150 productos...');
    const productos = [];
    const allProducts = [...productosElectronicos, ...productosOficina, ...productosMuebles];

    for (let i = 1; i <= 150; i++) {
        const baseProduct = allProducts[i % allProducts.length];
        const costo = randomDecimal(10, 500);
        const margen = 1 + Math.random() * 0.5;

        const producto = await prisma.producto.create({
            data: {
                empresaId: empresa.id,
                codigoInterno: `PROD-${i.toString().padStart(5, '0')}`,
                codigoBarras: `770${randomInt(100000000, 999999999)}`,
                descripcion: `${baseProduct} - Modelo ${String.fromCharCode(65 + (i % 26))}${i}`,
                costoUnitario: costo,
                precioVenta: new Prisma.Decimal((parseFloat(costo.toString()) * margen).toFixed(2)),
                codigoTasaItbms: randomItem(tasasItbms),
                unidadMedida: randomItem(['UND', 'PAR', 'CAJA', 'KG', 'LT']),
                activo: Math.random() > 0.05,
                stockActual: randomInt(0, 500),
                stockMinimo: randomInt(5, 50),
            },
        });
        productos.push(producto);
    }

    // 7. Create 150 Facturas with Items
    console.log('🧾 Creando 150 facturas con items...');
    const facturas = [];
    const firstCaja = cajas[0];
    const firstSucursal = sucursales[0];

    for (let i = 1; i <= 150; i++) {
        const cliente = randomItem(clientes);
        const creador = randomItem(usuarios);
        const caja = cajas[i % cajas.length] || firstCaja;
        const sucursal = sucursales.find(s => s.id === caja.sucursalId) || firstSucursal;

        const numItems = randomInt(1, 5);
        let subtotal = new Prisma.Decimal(0);
        let totalItbms = new Prisma.Decimal(0);

        const fechaEmision = new Date();
        fechaEmision.setDate(fechaEmision.getDate() - randomInt(0, 365));

        const factura = await prisma.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: creador.id,
                tipoDocumento: 'FE',
                numeroSecuencial: i,
                numeroCompleto: `${sucursal.codigo}-${caja.codigo}-FE-${i.toString().padStart(8, '0')}`,
                fechaEmision,
                fechaVencimiento: new Date(fechaEmision.getTime() + 30 * 24 * 60 * 60 * 1000),
                subtotal: new Prisma.Decimal(0),
                totalDescuento: new Prisma.Decimal(0),
                totalItbms: new Prisma.Decimal(0),
                totalNeto: new Prisma.Decimal(0),
                totalPagado: new Prisma.Decimal(0),
                saldoPendiente: new Prisma.Decimal(0),
                estadoDgi: randomItem(estadosDgi),
                cufe: Math.random() > 0.5 ? `CUFE-${randomInt(100000000, 999999999)}` : null,
            },
        });

        // Create items for this invoice
        for (let j = 0; j < numItems; j++) {
            const producto = productos[(i + j) % productos.length];
            const cantidad = new Prisma.Decimal(randomInt(1, 10));
            const precioUnit = producto.precioVenta;
            const costoUnit = producto.costoUnitario;
            const descuento = new Prisma.Decimal(randomInt(0, 10));

            const tasaItbms = producto.codigoTasaItbms === '01' ? 0.07 :
                producto.codigoTasaItbms === '02' ? 0.10 : 0;

            const montoBase = parseFloat(cantidad.toString()) * parseFloat(precioUnit.toString()) - parseFloat(descuento.toString());
            const itbms = new Prisma.Decimal((montoBase * tasaItbms).toFixed(2));
            const montoTotal = new Prisma.Decimal((montoBase + parseFloat(itbms.toString())).toFixed(2));

            await prisma.facturaItem.create({
                data: {
                    facturaId: factura.id,
                    productoId: producto.id,
                    descripcion: producto.descripcion,
                    cantidad,
                    precioUnitario: precioUnit,
                    costoUnitario: costoUnit,
                    descuento,
                    codigoTasaItbms: producto.codigoTasaItbms,
                    montoItbms: itbms,
                    montoTotal,
                },
            });

            subtotal = new Prisma.Decimal((parseFloat(subtotal.toString()) + montoBase).toFixed(2));
            totalItbms = new Prisma.Decimal((parseFloat(totalItbms.toString()) + parseFloat(itbms.toString())).toFixed(2));
        }

        const totalNeto = new Prisma.Decimal((parseFloat(subtotal.toString()) + parseFloat(totalItbms.toString())).toFixed(2));
        const totalPagado = Math.random() > 0.3 ? totalNeto : randomDecimal(0, parseFloat(totalNeto.toString()));
        const saldoPendiente = new Prisma.Decimal((parseFloat(totalNeto.toString()) - parseFloat(totalPagado.toString())).toFixed(2));

        await prisma.factura.update({
            where: { id: factura.id },
            data: { subtotal, totalItbms, totalNeto, totalPagado, saldoPendiente },
        });

        facturas.push({ ...factura, subtotal, totalNeto });
    }

    // 8. Create 150 Pagos
    console.log('💰 Creando 150 pagos...');
    for (let i = 0; i < 150; i++) {
        const factura = facturas[i];
        const cliente = clientes.find(c => c.id === factura.clienteId)!;
        const usuario = randomItem(usuarios);

        const monto = randomDecimal(50, 5000);

        await prisma.pago.create({
            data: {
                empresaId: empresa.id,
                facturaId: factura.id,
                clienteId: cliente.id,
                usuarioId: usuario.id,
                fechaPago: new Date(factura.fechaEmision.getTime() + randomInt(0, 30) * 24 * 60 * 60 * 1000),
                monto,
                metodoPago: randomItem(metodoPago),
                referencia: Math.random() > 0.5 ? `REF-${randomInt(10000, 99999)}` : null,
                montoAplicado: monto,
                montoCredito: new Prisma.Decimal(0),
            },
        });
    }

    // 9. Create 150 Auditorías
    console.log('📝 Creando 150 registros de auditoría...');
    const entidades = ['Factura', 'Cliente', 'Producto', 'Usuario'];
    const acciones = ['crear', 'editar', 'eliminar'];

    for (let i = 1; i <= 150; i++) {
        const usuario = randomItem(usuarios);
        const entidad = randomItem(entidades);

        await prisma.auditoria.create({
            data: {
                usuarioId: usuario.id,
                entidad,
                entidadId: `id-${randomInt(1, 150)}`,
                accion: randomItem(acciones),
                ip: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
                datosAntes: { ejemplo: 'valor anterior' },
                datosDespues: { ejemplo: 'valor nuevo' },
                createdAt: new Date(Date.now() - randomInt(0, 365) * 24 * 60 * 60 * 1000),
            },
        });
    }

    // 10. Create 150 Cotizaciones
    console.log('📄 Creando 150 cotizaciones...');
    const cotizaciones = [];

    for (let i = 1; i <= 150; i++) {
        const cliente = randomItem(clientes);
        const creador = randomItem(usuarios);
        const caja = cajas[i % cajas.length] || firstCaja;
        const sucursal = sucursales.find(s => s.id === caja.sucursalId) || firstSucursal;

        const numItems = randomInt(1, 5);
        let subtotal = new Prisma.Decimal(0);
        let totalItbms = new Prisma.Decimal(0);

        const fechaEmision = new Date();
        fechaEmision.setDate(fechaEmision.getDate() - randomInt(0, 60)); // Recent quotes

        const cotizacion = await prisma.cotizacion.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: creador.id,
                numero: `QT-${i.toString().padStart(5, '0')}`,
                fechaEmision,
                validaHasta: new Date(fechaEmision.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days validity
                subtotal: new Prisma.Decimal(0),
                totalDescuento: new Prisma.Decimal(0),
                totalItbms: new Prisma.Decimal(0),
                totalNeto: new Prisma.Decimal(0),
                estado: randomItem(['borrador', 'enviada', 'aceptada', 'rechazada']),
            },
        });

        // Create items for this quote
        for (let j = 0; j < numItems; j++) {
            const producto = productos[(i + j) % productos.length];
            const cantidad = new Prisma.Decimal(randomInt(1, 10));
            const precioUnit = producto.precioVenta;
            const descuento = new Prisma.Decimal(randomInt(0, 5));

            const tasaItbms = producto.codigoTasaItbms === '01' ? 0.07 :
                producto.codigoTasaItbms === '02' ? 0.10 : 0;

            const montoBase = parseFloat(cantidad.toString()) * parseFloat(precioUnit.toString()) - parseFloat(descuento.toString());
            const itbms = new Prisma.Decimal((montoBase * tasaItbms).toFixed(2));
            const montoTotal = new Prisma.Decimal((montoBase + parseFloat(itbms.toString())).toFixed(2));

            await prisma.cotizacionItem.create({
                data: {
                    cotizacionId: cotizacion.id,
                    productoId: producto.id,
                    descripcion: producto.descripcion,
                    cantidad,
                    precioUnitario: precioUnit,
                    descuento,
                    codigoTasaItbms: producto.codigoTasaItbms,
                    montoItbms: itbms,
                    montoTotal,
                },
            });

            subtotal = new Prisma.Decimal((parseFloat(subtotal.toString()) + montoBase).toFixed(2));
            totalItbms = new Prisma.Decimal((parseFloat(totalItbms.toString()) + parseFloat(itbms.toString())).toFixed(2));
        }

        const totalNeto = new Prisma.Decimal((parseFloat(subtotal.toString()) + parseFloat(totalItbms.toString())).toFixed(2));

        await prisma.cotizacion.update({
            where: { id: cotizacion.id },
            data: { subtotal, totalItbms, totalNeto },
        });

        cotizaciones.push(cotizacion);
    }

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - 1 Empresa`);
    console.log(`   - 150 Sucursales`);
    console.log(`   - ${cajas.length} Cajas`);
    console.log(`   - ${cajas.length * 3} Secuencias`);
    console.log(`   - 150 Usuarios`);
    console.log(`   - 150 Clientes`);
    console.log(`   - 150 Productos`);
    console.log(`   - 150 Facturas con items`);
    console.log(`   - 150 Pagos`);
    console.log(`   - 150 Auditorías`);
    console.log(`   - 150 Cotizaciones`);
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

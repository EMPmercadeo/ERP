import { z } from 'zod';

export const ClientSchema = z.object({
    id: z.string().optional(),
    tipoRuc: z.string().min(2, { message: "Selecciona un tipo de RUC" }),
    ruc: z.string().min(5, { message: "El RUC es requerido" }),
    dv: z.string().max(2).optional(),
    razonSocial: z.string().min(2, { message: "La razón social es requerida" }),
    email: z.string().email().optional().or(z.literal('')),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
    limiteCredito: z.string().optional(), // We'll parse to float
    diasCredito: z.string().optional(), // We'll parse to int
});

export const ProductSchema = z.object({
    id: z.string().optional(),
    codigoInterno: z.string().min(1, { message: "El código interno es requerido" }),
    codigoBarras: z.string().optional().or(z.literal('')),
    descripcion: z.string().min(1, { message: "La descripción es requerida" }),
    descripcionLarga: z.string().optional().or(z.literal('')),
    imagenUrl: z.string().optional().or(z.literal('')),
    unidadMedida: z.enum(["UND", "HRS", "KG", "LT", "MT", "CJ", "SRV"], {
        message: "Selecciona una unidad de medida válida"
    }).default("UND"),
    costoUnitario: z.string().optional().refine(val => !val || parseFloat(val) >= 0, {
        message: "El costo unitario no puede ser negativo"
    }),
    precioVenta: z.string().min(1, { message: "El precio de venta es requerido" }).refine(val => parseFloat(val) >= 0, {
        message: "El precio de venta no puede ser negativo"
    }),
    codigoTasaItbms: z.enum(["00", "01", "02", "03"], {
        message: "Selecciona una tasa ITBMS válida"
    }),
    stockActual: z.string().optional(), // Parse to int
    stockMinimo: z.string().optional(), // Parse to int
    activo: z.boolean().default(true),
});

export const InvoiceItemSchema = z.object({
    productoId: z.string(),
    descripcion: z.string(),
    cantidad: z.number().min(0.0001),
    precioUnitario: z.number().min(0),
    codigoTasaItbms: z.string(),
    descuento: z.number().default(0),
});

export const InvoiceSchema = z.object({
    clienteId: z.string().min(1, { message: "Selecciona un cliente" }),
    condicionPago: z.string(),
    observaciones: z.string().optional(),
    items: z.array(InvoiceItemSchema).min(1, { message: "Agrega al menos un ítem" }),
});

export const SupplierSchema = z.object({
    id: z.string().optional(),
    tipoRuc: z.string().min(1, { message: "Selecciona un tipo de RUC" }),
    ruc: z.string().min(3, { message: "El RUC es requerido" }),
    dv: z.string().max(2).optional(),
    razonSocial: z.string().min(2, { message: "La razón social es requerida" }),
    nombreComercial: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    telefono: z.string().optional().or(z.literal('')),
    direccion: z.string().optional().or(z.literal('')),
    condicionPago: z.string().default("Contado"),
});

export const PurchaseItemSchema = z.object({
    productoId: z.string().optional(),
    descripcion: z.string().min(1, { message: "Descripción requerida" }),
    cantidad: z.number().min(0.0001, { message: "Cantidad mayor a 0" }),
    costoUnitario: z.number().min(0, { message: "Costo no puede ser negativo" }),
    codigoTasaItbms: z.string().default("00"),
    descuento: z.number().default(0),
});

export const PurchaseSchema = z.object({
    proveedorId: z.string().min(1, { message: "Selecciona un proveedor" }),
    numeroFactura: z.string().min(1, { message: "El número de factura del proveedor es requerido" }),
    fechaEmision: z.string().min(1, { message: "Fecha de emisión requerida" }),
    fechaVencimiento: z.string().min(1, { message: "Fecha de vencimiento requerida" }),
    observaciones: z.string().optional(),
    items: z.array(PurchaseItemSchema).min(1, { message: "Agrega al menos un ítem o gasto" }),
});

export const SupplierPaymentSchema = z.object({
    proveedorId: z.string().min(1, { message: "Selecciona un proveedor" }),
    compraId: z.string().min(1, { message: "Selecciona una compra" }),
    monto: z.number().min(0.01, { message: "El monto debe ser mayor a 0" }),
    metodoPago: z.string().min(1, { message: "Selecciona método de pago" }),
    referencia: z.string().optional(),
});

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
    descripcion: z.string().min(1, { message: "La descripción es requerida" }),
    descripcionLarga: z.string().optional(),
    unidadMedida: z.string().default("UND"),
    costoUnitario: z.string().optional(), // Can be empty string if not set
    precioVenta: z.string().min(1, { message: "El precio es requerido" }), // Parse to float
    codigoTasaItbms: z.string().min(2, { message: "Selecciona una tasa" }),
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

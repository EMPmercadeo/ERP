'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    FileText,
    AlertCircle,
    ShieldCheck,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { createCreditNote } from '@/lib/actions/credit-notes';
import type { ClientOption, ProductOption } from '@/components/invoices/InvoiceForm';

export interface AvailableInvoice {
    id: string;
    numeroCompleto: string;
    fechaEmision: Date;
    subtotal: number;
    totalDescuento: number;
    totalItbms: number;
    totalNeto: number;
    cufe: string | null;
    cliente: {
        id: string;
        razonSocial: string;
        ruc: string;
    };
    items: {
        id: string;
        productoId: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        descuento: number;
        codigoTasaItbms: string;
        montoItbms: number;
        montoTotal: number;
    }[];
}

interface RefundItem {
    id: string;
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    codigoTasaItbms: string;
}

const MOTIVOS_DGI = [
    '01 - Anulación total de la operación',
    '02 - Devolución parcial o total de bienes',
    '03 - Descuento, rebaja o bonificación posterior',
    '04 - Corrección de precio o error en facturación',
    '05 - Otros motivos fiscales'
];

function formatCurrency(val: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(val);
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl shadow-md flex items-center gap-2"
        >
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando Nota de Crédito...
                </>
            ) : (
                <>
                    <Save className="h-4 w-4" />
                    Emitir Nota de Crédito Fiscal
                </>
            )}
        </Button>
    );
}

export function CreditNoteForm({
    invoices,
    clients,
    products
}: {
    invoices: AvailableInvoice[];
    clients: ClientOption[];
    products: ProductOption[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, formAction] = useFormState(createCreditNote, { success: true, message: '' });

    const [mode, setMode] = useState<'select' | 'manual'>(invoices.length > 0 ? 'select' : 'manual');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [cufeReferencia, setCufeReferencia] = useState<string>('');
    const [motivoDgi, setMotivoDgi] = useState<string>(MOTIVOS_DGI[0]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [items, setItems] = useState<RefundItem[]>([]);

    const handleSelectInvoice = (id: string) => {
        setSelectedInvoiceId(id);
        const inv = invoices.find((i) => i.id === id);
        if (inv) {
            setSelectedClientId(inv.cliente.id);
            const loadedItems = inv.items.map((it) => ({
                id: Math.random().toString(),
                productoId: it.productoId,
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                descuento: it.descuento,
                codigoTasaItbms: it.codigoTasaItbms
            }));
            setItems(loadedItems);
        }
    };

    // Si venimos desde "Facturas" con una factura ya elegida (?facturaId=...),
    // preseleccionarla automáticamente en vez de obligar a buscarla de nuevo.
    useEffect(() => {
        const preselect = searchParams.get('facturaId');
        if (preselect && invoices.some((i) => i.id === preselect)) {
            handleSelectInvoice(preselect);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, invoices]);

    const filteredInvoices = useMemo(() => {
        if (!searchTerm) return invoices;
        const lower = searchTerm.toLowerCase();
        return invoices.filter(
            (inv) =>
                inv.numeroCompleto.toLowerCase().includes(lower) ||
                inv.cliente.razonSocial.toLowerCase().includes(lower) ||
                inv.cliente.ruc.toLowerCase().includes(lower)
        );
    }, [invoices, searchTerm]);

    const selectedInvoice = useMemo(() => {
        return invoices.find((i) => i.id === selectedInvoiceId);
    }, [invoices, selectedInvoiceId]);

    // Agregar ítem manual
    const handleAddItem = (prodId?: string) => {
        if (prodId) {
            const prod = products.find((p) => p.id === prodId);
            if (prod) {
                setItems((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(),
                        productoId: prod.id,
                        descripcion: prod.descripcion,
                        cantidad: 1,
                        precioUnitario: prod.precio,
                        descuento: 0,
                        codigoTasaItbms: prod.itbms || '01'
                    }
                ]);
                return;
            }
        }
        setItems((prev) => [
            ...prev,
            {
                id: Math.random().toString(),
                productoId: '',
                descripcion: 'Ítem de devolución',
                cantidad: 1,
                precioUnitario: 0,
                descuento: 0,
                codigoTasaItbms: '01'
            }
        ]);
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleUpdateItem = (id: string, field: keyof RefundItem, val: string | number) => {
        setItems((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;
                return { ...it, [field]: val };
            })
        );
    };

    // Cálculos dinámicos
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, it) => sum + (Number(it.cantidad) * Number(it.precioUnitario)), 0);
        const descuento = items.reduce((sum, it) => sum + Number(it.descuento || 0), 0);
        const itbms = items.reduce((sum, it) => {
            const tasa = it.codigoTasaItbms === '01' ? 0.07 : it.codigoTasaItbms === '02' ? 0.10 : it.codigoTasaItbms === '03' ? 0.15 : 0;
            const bruto = Number(it.cantidad) * Number(it.precioUnitario);
            const neto = Math.max(0, bruto - Number(it.descuento || 0));
            return sum + (neto * tasa);
        }, 0);
        const neto = subtotal - descuento + itbms;
        return { subtotal, descuento, itbms, neto };
    }, [items]);

    return (
        <form action={formAction} className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Hidden Inputs para Server Action */}
            <input type="hidden" name="facturaOrigenId" value={mode === 'select' ? selectedInvoiceId : ''} />
            <input type="hidden" name="cufeReferencia" value={mode === 'manual' ? cufeReferencia : ''} />
            <input type="hidden" name="motivoDgi" value={motivoDgi} />
            <input type="hidden" name="clienteId" value={selectedClientId} />
            <input type="hidden" name="items" value={JSON.stringify(items)} />

            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href="/invoices" className="hover:text-gray-900 flex items-center gap-1 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Facturación
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Nota de Crédito</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
                        <FileText className="h-7 w-7 text-red-600" />
                        Emisión de Nota de Crédito Fiscal (DGI)
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Genera devoluciones, descuentos posteriores o anulaciones fiscales cumpliendo la normativa de Panamá.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/invoices')}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </div>

            {state && !state.success && state.message && (
                <Alert variant="error" className="bg-red-50 border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">No se pudo emitir la Nota de Crédito</h4>
                        <p className="text-xs mt-0.5">{state.message}</p>
                    </div>
                </Alert>
            )}

            {/* Selección de Modo y Factura Origen */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold text-gray-900">
                                1. Documento de Referencia DGI
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                Selecciona una factura emitida por el sistema o ingresa el CUFE manualmente si es de una vigencia anterior.
                            </CardDescription>
                        </div>
                        <div className="flex bg-gray-200/70 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    mode === 'select'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Factura del Sistema
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    mode === 'manual'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Ingreso Manual (CUFE)
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {mode === 'select' ? (
                        <div className="space-y-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por número, cliente o RUC..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 rounded-xl border-gray-200 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                                {filteredInvoices.length === 0 ? (
                                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">No se encontraron facturas elegibles.</p>
                                        <p className="text-xs text-gray-400 mt-1">Intenta cambiar el criterio de búsqueda o usa el modo manual.</p>
                                    </div>
                                ) : (
                                    filteredInvoices.map((inv) => {
                                        const isSelected = selectedInvoiceId === inv.id;
                                        return (
                                            <div
                                                key={inv.id}
                                                onClick={() => handleSelectInvoice(inv.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                                    isSelected
                                                        ? 'border-red-500 bg-red-50/30 ring-2 ring-red-500/20 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-gray-900 block truncate">
                                                            {inv.numeroCompleto}
                                                        </span>
                                                        <span className="text-xs text-gray-500 block truncate">
                                                            {inv.cliente.razonSocial}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] font-semibold bg-gray-50 shrink-0">
                                                        {new Date(inv.fechaEmision).toLocaleDateString()}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-end border-t border-gray-100 pt-2 mt-1">
                                                    <span className="text-[11px] text-gray-400">
                                                        {inv.items.length} {inv.items.length === 1 ? 'ítem' : 'ítems'}
                                                    </span>
                                                    <span className="text-sm font-extrabold text-gray-900">
                                                        {formatCurrency(inv.totalNeto)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {selectedInvoice && (
                                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>
                                            Factura seleccionada: <strong className="font-bold">{selectedInvoice.numeroCompleto}</strong> (Cliente: {selectedInvoice.cliente.razonSocial})
                                        </span>
                                    </div>
                                    {selectedInvoice.cufe && (
                                        <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-[10px] text-blue-800 truncate max-w-[200px]" title={selectedInvoice.cufe}>
                                            CUFE: {selectedInvoice.cufe.slice(0, 16)}...
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">
                                    CUFE de Referencia (66 caracteres hex) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="Ej: fe0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01"
                                    value={cufeReferencia}
                                    onChange={(e) => setCufeReferencia(e.target.value)}
                                    maxLength={66}
                                    className="font-mono text-xs h-11 rounded-xl border-gray-200"
                                />
                                <span className="text-[11px] text-gray-400">
                                    Longitud actual: {cufeReferencia.length}/66 caracteres
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">
                                    Cliente Afectado <span className="text-red-500">*</span>
                                </label>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm">
                                        <SelectValue placeholder="Seleccione un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={c.id} className="text-sm">
                                                {c.razonSocial} ({c.ruc})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Motivo Fiscal DGI */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">
                        2. Motivo Fiscal (Normativa DGI)
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                        Especifica la razón fiscal para la emisión de este documento de crédito.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="max-w-xl space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                            Tipo de Nota de Crédito <span className="text-red-500">*</span>
                        </label>
                        <Select value={motivoDgi} onValueChange={setMotivoDgi}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MOTIVOS_DGI.map((m) => (
                                    <SelectItem key={m} value={m} className="text-sm font-medium">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Ítems a Devolver / Anular */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-gray-900">
                            3. Ítems Afectados y Devolución de ITBMS
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Ajusta las cantidades o precios a reembolsar. El ITBMS se recalcula automáticamente por ítem.
                        </CardDescription>
                    </div>
                    {mode === 'manual' && (
                        <div className="flex gap-2">
                            <Select onValueChange={(val) => handleAddItem(val)}>
                                <SelectTrigger className="w-[200px] h-9 rounded-lg text-xs font-semibold">
                                    <SelectValue placeholder="+ Agregar Producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="text-xs">
                                            {p.descripcion} ({formatCurrency(p.precio)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddItem()}
                                className="h-9 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" /> Libre
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs text-gray-500 font-bold uppercase">
                            <TableRow>
                                <TableHead className="pl-6 w-[30%]">Descripción / Producto</TableHead>
                                <TableHead className="text-right w-[12%]">Cantidad</TableHead>
                                <TableHead className="text-right w-[15%]">Precio Unit.</TableHead>
                                <TableHead className="text-right w-[12%]">Descuento</TableHead>
                                <TableHead className="text-center w-[15%]">Tasa ITBMS</TableHead>
                                <TableHead className="text-right w-[12%]">ITBMS Dev.</TableHead>
                                <TableHead className="text-right pr-6 w-[14%]">Total Línea</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 text-sm">
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                                        No hay ítems en la nota de crédito. Selecciona una factura o agrega ítems manualmente.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const tasa = item.codigoTasaItbms === '01' ? 0.07 : item.codigoTasaItbms === '02' ? 0.10 : item.codigoTasaItbms === '03' ? 0.15 : 0;
                                    const bruto = Number(item.cantidad) * Number(item.precioUnitario);
                                    const neto = Math.max(0, bruto - Number(item.descuento || 0));
                                    const itbmsLinea = neto * tasa;
                                    const totalLinea = neto + itbmsLinea;

                                    return (
                                        <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <Input
                                                    value={item.descripcion}
                                                    onChange={(e) => handleUpdateItem(item.id, 'descripcion', e.target.value)}
                                                    className="h-9 text-xs font-medium rounded-lg border-gray-200"
                                                    placeholder="Descripción del ítem"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="any"
                                                    value={item.cantidad}
                                                    onChange={(e) => handleUpdateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                                    className="h-9 text-xs font-semibold text-right rounded-lg border-gray-200 w-24 ml-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.precioUnitario}
                                                    onChange={(e) => handleUpdateItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                    className="h-9 text-xs font-semibold text-right rounded-lg border-gray-200 w-28 ml-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.descuento}
                                                    onChange={(e) => handleUpdateItem(item.id, 'descuento', parseFloat(e.target.value) || 0)}
                                                    className="h-9 text-xs text-right rounded-lg border-gray-200 w-24 ml-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Select
                                                    value={item.codigoTasaItbms}
                                                    onValueChange={(val) => handleUpdateItem(item.id, 'codigoTasaItbms', val)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs font-semibold rounded-lg border-gray-200 mx-auto w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="00" className="text-xs">0% (Exento)</SelectItem>
                                                        <SelectItem value="01" className="text-xs">7% (Standard)</SelectItem>
                                                        <SelectItem value="02" className="text-xs">10% (Alcohol/Hotel)</SelectItem>
                                                        <SelectItem value="03" className="text-xs">15% (Tabaco)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-blue-600 text-xs">
                                                {formatCurrency(itbmsLinea)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 font-extrabold text-gray-900 text-xs">
                                                {formatCurrency(totalLinea)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Resumen Fiscal */}
            <div className="flex justify-end">
                <Card className="w-full sm:w-96 rounded-2xl border-gray-100 shadow-md bg-white overflow-hidden">
                    <CardHeader className="bg-gray-900 text-white p-4">
                        <CardTitle className="text-sm font-bold flex items-center justify-between">
                            <span>Resumen de Devolución</span>
                            <Badge className="bg-red-500 text-white text-[10px] uppercase font-bold border-none">
                                Fiscal DGI
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Subtotal Bruto a Devolver:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        {totals.descuento > 0 && (
                            <div className="flex justify-between text-xs text-red-600">
                                <span>Descuento Aplicado:</span>
                                <span className="font-semibold">-{formatCurrency(totals.descuento)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-blue-600 font-semibold pt-1 border-t border-gray-100">
                            <span>Devolución ITBMS (Impuesto):</span>
                            <span>{formatCurrency(totals.itbms)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t-2 border-gray-900 text-base font-extrabold text-gray-900">
                            <span>Total Nota de Crédito:</span>
                            <span className="text-xl text-red-600">{formatCurrency(totals.neto)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}

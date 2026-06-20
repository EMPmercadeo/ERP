'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createProduct } from '@/lib/actions/products';
import { useState, useActionState } from 'react';

const initialState = {
    message: '',
    errors: {},
};

export default function NewProductPage() {
    const router = useRouter();
    const [state, formAction] = useActionState(createProduct, initialState);

    // Controlled state for calculations and selects
    const [codigoTasaItbms, setCodigoTasaItbms] = useState('01');
    const [unidadMedida, setUnidadMedida] = useState('UND');
    const [costoUnitario, setCostoUnitario] = useState('');
    const [precioVenta, setPrecioVenta] = useState('');

    const margen = precioVenta && costoUnitario && parseFloat(precioVenta) > 0
        ? (((parseFloat(precioVenta) - parseFloat(costoUnitario)) / parseFloat(precioVenta)) * 100).toFixed(1)
        : '0.0';

    return (
        <>
            <Topbar title="Nuevo Producto" />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Back link */}
                    <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver a Productos
                    </Link>

                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Registrar Nuevo Producto</h2>
                        <p className="text-muted-foreground">
                            Agrega un producto o servicio al catálogo
                        </p>
                    </div>

                    {state?.message && (
                        <Alert variant="error">{state.message}</Alert>
                    )}

                    {/* Form */}
                    <form action={formAction}>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Información General */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información General</CardTitle>
                                    <CardDescription>Datos básicos del producto o servicio</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Código Interno (SKU)
                                        </label>
                                        <Input
                                            name="codigoInterno"
                                            placeholder="PROD-001"
                                            required
                                            className={state?.errors?.codigoInterno ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.codigoInterno && <p className="text-xs text-destructive mt-1">{state.errors.codigoInterno[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Descripción Corta
                                        </label>
                                        <Input
                                            name="descripcion"
                                            placeholder="Nombre del producto"
                                            required
                                            className={state?.errors?.descripcion ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.descripcion && <p className="text-xs text-destructive mt-1">{state.errors.descripcion[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Descripción Detallada (opcional)
                                        </label>
                                        <Textarea
                                            name="descripcionLarga"
                                            placeholder="Descripción completa para facturas..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Unidad de Medida
                                        </label>
                                        <Select name="unidadMedida" value={unidadMedida} onValueChange={setUnidadMedida}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UND">Unidad (UND)</SelectItem>
                                                <SelectItem value="HRS">Hora (HRS)</SelectItem>
                                                <SelectItem value="KG">Kilogramo (KG)</SelectItem>
                                                <SelectItem value="LT">Litro (LT)</SelectItem>
                                                <SelectItem value="MT">Metro (MT)</SelectItem>
                                                <SelectItem value="CJ">Caja (CJ)</SelectItem>
                                                <SelectItem value="SRV">Servicio (SRV)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Precios e Impuestos */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Precios e Impuestos</CardTitle>
                                    <CardDescription>Configuración de precios y ITBMS</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Costo Unitario (USD)
                                        </label>
                                        <Input
                                            name="costoUnitario"
                                            type="number"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            value={costoUnitario}
                                            onChange={(e) => setCostoUnitario(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Precio de Venta (USD)
                                        </label>
                                        <Input
                                            name="precioVenta"
                                            type="number"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            value={precioVenta}
                                            onChange={(e) => setPrecioVenta(e.target.value)}
                                            required
                                            className={state?.errors?.precioVenta ? 'border-red-500' : ''}
                                        />
                                        {parseFloat(precioVenta) > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Margen: <span className={`font-medium ${parseFloat(margen) > 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{margen}%</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Tasa ITBMS
                                        </label>
                                        <Select name="codigoTasaItbms" value={codigoTasaItbms} onValueChange={setCodigoTasaItbms}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="00">Exento (0%)</SelectItem>
                                                <SelectItem value="01">ITBMS 7%</SelectItem>
                                                <SelectItem value="02">ITBMS 10%</SelectItem>
                                                <SelectItem value="03">ITBMS 15%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Stock Actual
                                            </label>
                                            <Input
                                                name="stockActual"
                                                type="number"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Stock Mínimo
                                            </label>
                                            <Input
                                                name="stockMinimo"
                                                type="number"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Submit buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </ContentContainer>
        </>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                </>
            ) : (
                <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Producto
                </>
            )}
        </Button>
    );
}

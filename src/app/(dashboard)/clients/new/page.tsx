'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/actions/clients';
import { useState } from 'react';

const initialState = {
    message: '',
    errors: {},
};

export default function NewClientPage() {
    const router = useRouter();
    const [state, formAction] = useFormState(createClient, initialState);
    const [tipoRuc, setTipoRuc] = useState('02');
    const [diasCredito, setDiasCredito] = useState('30');

    return (
        <>
            <Topbar title="Nuevo Cliente" />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Back link */}
                    <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver a Clientes
                    </Link>

                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Registrar Nuevo Cliente</h2>
                        <p className="text-muted-foreground">
                            Ingresa los datos del cliente para agregarlo al sistema
                        </p>
                    </div>

                    {state?.message && (
                        <Alert variant="error">{state.message}</Alert>
                    )}

                    {/* Form */}
                    <form action={formAction}>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Datos Fiscales */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Datos Fiscales</CardTitle>
                                    <CardDescription>Información requerida para facturación</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Tipo de RUC
                                        </label>
                                        <Select name="tipoRuc" value={tipoRuc} onValueChange={setTipoRuc}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="01">01 - Persona Natural</SelectItem>
                                                <SelectItem value="02">02 - Persona Jurídica</SelectItem>
                                                <SelectItem value="03">03 - Gobierno</SelectItem>
                                                <SelectItem value="04">04 - Extranjero</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                RUC
                                            </label>
                                            <Input
                                                name="ruc"
                                                placeholder={tipoRuc === '01' ? '8-123-4567' : '155-123-456789'}
                                                required
                                                className={state?.errors?.ruc ? 'border-red-500' : ''}
                                            />
                                            {state?.errors?.ruc && <p className="text-xs text-destructive mt-1">{state.errors.ruc[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                DV
                                            </label>
                                            <Input
                                                name="dv"
                                                placeholder="12"
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Razón Social / Nombre
                                        </label>
                                        <Input
                                            name="razonSocial"
                                            placeholder="Nombre completo o razón social"
                                            required
                                            className={state?.errors?.razonSocial ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.razonSocial && <p className="text-xs text-destructive mt-1">{state.errors.razonSocial[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Dirección
                                        </label>
                                        <Input
                                            name="direccion"
                                            placeholder="Calle, Ciudad, Provincia"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Datos de Contacto y Crédito */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contacto y Crédito</CardTitle>
                                    <CardDescription>Información de contacto y condiciones comerciales</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Correo Electrónico
                                        </label>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="cliente@empresa.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Teléfono
                                        </label>
                                        <Input
                                            name="telefono"
                                            placeholder="+507 6123-4567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Límite de Crédito (USD)
                                        </label>
                                        <Input
                                            name="limiteCredito"
                                            type="number"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Días de Crédito
                                        </label>
                                        <Select name="diasCredito" value={diasCredito} onValueChange={setDiasCredito}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Contado</SelectItem>
                                                <SelectItem value="15">15 días</SelectItem>
                                                <SelectItem value="30">30 días</SelectItem>
                                                <SelectItem value="45">45 días</SelectItem>
                                                <SelectItem value="60">60 días</SelectItem>
                                                <SelectItem value="90">90 días</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                    Guardar Cliente
                </>
            )}
        </Button>
    );
}

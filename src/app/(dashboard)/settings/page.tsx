'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Building2,
    Key,
    Upload,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'dgi' | 'users'>('dgi');

    // DGI Form state
    const [razonSocial, setRazonSocial] = useState('');
    const [ruc, setRuc] = useState('');
    const [dv, setDv] = useState('');
    const [direccion, setDireccion] = useState('');
    const [usuarioPac, setUsuarioPac] = useState('');
    const [passwordPac, setPasswordPac] = useState('');
    const [certificado, setCertificado] = useState<File | null>(null);
    const [estadoConexion, setEstadoConexion] = useState<'conectado' | 'desconectado' | 'probando'>('desconectado');
    const [isSaving, setIsSaving] = useState(false);

    const handleTestConnection = async () => {
        setEstadoConexion('probando');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        // For demo, randomly succeed or fail
        setEstadoConexion(Math.random() > 0.5 ? 'conectado' : 'desconectado');
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert('Borrador guardado');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCertificado(file);
        }
    };

    return (
        <>
            <Topbar title="Configuración" />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                        <p className="text-muted-foreground">
                            Administra la configuración de tu empresa y la integración con la DGI
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setActiveTab('dgi')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dgi'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Integración DGI
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Gestión de Usuarios
                            </div>
                        </button>
                    </div>

                    {/* DGI Configuration Tab */}
                    {activeTab === 'dgi' && (
                        <div className="space-y-6">
                            {/* Info Banner */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <SettingsIcon className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-primary">Configuración de Facturación Electrónica</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Configure sus credenciales PAC y certificado digital para habilitar el timbrado de facturas.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Section 1: Datos del Contribuyente */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            1. Datos del Contribuyente
                                        </CardTitle>
                                        <CardDescription>
                                            Información fiscal de tu empresa
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Razón Social
                                            </label>
                                            <Input
                                                placeholder="Mi Empresa, S.A."
                                                value={razonSocial}
                                                onChange={(e) => setRazonSocial(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    RUC
                                                </label>
                                                <Input
                                                    placeholder="155-123-456789"
                                                    value={ruc}
                                                    onChange={(e) => setRuc(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    DV
                                                </label>
                                                <Input
                                                    placeholder="12"
                                                    value={dv}
                                                    onChange={(e) => setDv(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Dirección de Sucursal
                                            </label>
                                            <Input
                                                placeholder="Calle Principal, Ciudad de Panamá"
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Section 2: Credenciales del PAC */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Key className="h-5 w-5 text-primary" />
                                            2. Credenciales del PAC
                                        </CardTitle>
                                        <CardDescription>
                                            Credenciales para comunicarse con la DGI
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Certificate Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Certificado Digital (.p12)
                                            </label>
                                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {certificado ? certificado.name : 'Arrastra o selecciona tu certificado'}
                                                </p>
                                                <Button variant="outline" size="sm" asChild>
                                                    <label className="cursor-pointer">
                                                        Seleccionar Archivo
                                                        <input
                                                            type="file"
                                                            accept=".p12,.pfx"
                                                            className="hidden"
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Usuario PAC
                                            </label>
                                            <Input
                                                placeholder="usuario@pac.com"
                                                value={usuarioPac}
                                                onChange={(e) => setUsuarioPac(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Contraseña PAC
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordPac}
                                                onChange={(e) => setPasswordPac(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Connection Status & Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-muted-foreground">Estado de Conexión:</span>
                                            {estadoConexion === 'conectado' && (
                                                <Badge className="bg-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                    Conectado
                                                </Badge>
                                            )}
                                            {estadoConexion === 'desconectado' && (
                                                <Badge variant="secondary" className="bg-gray-500 text-white">
                                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                                    Desconectado
                                                </Badge>
                                            )}
                                            {estadoConexion === 'probando' && (
                                                <Badge variant="secondary">
                                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                    Probando...
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    'Guardar Borrador'
                                                )}
                                            </Button>
                                            <Button
                                                onClick={handleTestConnection}
                                                disabled={estadoConexion === 'probando'}
                                            >
                                                <Key className="h-4 w-4 mr-2" />
                                                Probar Conexión DGI
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestión de Usuarios</CardTitle>
                                <CardDescription>
                                    Próximamente: Administra los usuarios y permisos de tu empresa
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Esta funcionalidad estará disponible próximamente.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ContentContainer>
        </>
    );
}

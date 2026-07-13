'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Activity, Plus, Trash2, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PacConfig {
  id: string;
  proveedor: string;
  ambiente: 'TEST' | 'PRODUCCION';
  esRespaldo: boolean;
  activo: boolean;
  credencialesMasked: string;
}

export default function SuperadminPACPage() {
  const [pacs, setPacs] = useState<PacConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form para nuevo PAC
  const [proveedor, setProveedor] = useState('');
  const [ambiente, setAmbiente] = useState<'TEST' | 'PRODUCCION'>('TEST');
  const [credenciales, setCredenciales] = useState('');
  const [esRespaldo, setEsRespaldo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarPACs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pac');
      const data = await res.json();
      setPacs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar configuración PAC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPACs();
  }, []);

  const handleProbarConexion = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/admin/pac/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Conexión OK (${data.latenciaMs}ms): ${data.mensaje}`);
      } else {
        toast.error(`Fallo (${data.latenciaMs || 0}ms): ${data.mensaje || 'Error de PAC'}`);
      }
    } catch {
      toast.error('Error de red al probar conexión PAC');
    } finally {
      setTestingId(null);
    }
  };

  const handleTogglePrimario = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pac/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makePrimary: true })
      });
      if (res.ok) {
        toast.success('¡PAC Primario conmutado con 1 clic!');
        cargarPACs();
      } else {
        toast.error('No se pudo conmutar el PAC primario');
      }
    } catch {
      toast.error('Error en conmutación');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta configuración PAC?')) return;
    try {
      const res = await fetch(`/api/admin/pac/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('PAC eliminado');
        cargarPACs();
      } else {
        toast.error('No se pudo eliminar el proveedor');
      }
    } catch {
      toast.error('Error al eliminar PAC');
    }
  };

  const handleGuardarPAC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor.trim() || !credenciales.trim()) {
      toast.error('Proveedor y credenciales son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch('/api/admin/pac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor,
          ambiente,
          credenciales,
          esRespaldo,
          activo: true
        })
      });
      if (res.ok) {
        toast.success('Proveedor PAC registrado de forma segura y cifrada.');
        setProveedor('');
        setCredenciales('');
        setEsRespaldo(false);
        cargarPACs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Fallo al guardar PAC');
      }
    } catch {
      toast.error('Error guardando configuración');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ContentContainer className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            PAC & Conectividad DGI (Plataforma)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proveedor de Autorización Certificada primario y de respaldo a nivel de toda la plataforma
          </p>
        </div>
        <Button variant="outline" onClick={cargarPACs}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Lista
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-info-bg border border-info/30 rounded-lg p-3">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <span>
          Esto es distinto del certificado DGI que cada empresa carga en su propia <strong>Configuración → Facturación Electrónica</strong>.
          Aquí se define el proveedor PAC de respaldo que usa la plataforma completa si el proveedor de una empresa falla o no tiene uno propio configurado.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda / Centro: Lista PACs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Proveedores PAC Configurados ({pacs.length})
          </h3>

          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground pt-12">Verificando conexiones y servidores PAC...</CardContent></Card>
          ) : pacs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground pt-12">No hay proveedores PAC configurados. Registra el primario a la derecha.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {pacs.map((p) => (
                <Card
                  key={p.id}
                  className={cn(!p.esRespaldo && 'border-primary shadow-sm')}
                >
                  <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold">{p.proveedor}</span>
                        <Badge variant={p.ambiente === 'PRODUCCION' ? 'warning' : 'info'} className="font-mono">
                          {p.ambiente}
                        </Badge>
                        {!p.esRespaldo ? (
                          <Badge>★ PAC PRIMARIO (ACTIVO)</Badge>
                        ) : (
                          <Badge variant="neutral">Respaldo / Secundario</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-4 pt-1 flex-wrap">
                        <span>Credenciales: <strong className="text-foreground">{p.credencialesMasked}</strong> (cifradas en servidor)</span>
                        <span>Estado: <strong className={p.activo ? 'text-success' : 'text-danger'}>{p.activo ? 'Operativo' : 'Inactivo'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProbarConexion(p.id)}
                        disabled={testingId === p.id}
                      >
                        <Activity className={`h-3.5 w-3.5 ${testingId === p.id ? 'animate-spin' : ''}`} />
                        {testingId === p.id ? 'Midiendo Latencia...' : 'Probar Conexión'}
                      </Button>

                      {p.esRespaldo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePrimario(p.id)}
                          className="text-success border-success/30 hover:bg-success-bg"
                          title="Volver PAC Primario con 1 clic"
                        >
                          Conmutar como Primario
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEliminar(p.id)}
                        className="text-danger border-danger/30 hover:bg-danger-bg"
                        title="Eliminar PAC"
                        aria-label="Eliminar PAC"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Agregar PAC */}
        <Card className="h-fit">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              Registrar Nuevo Servidor PAC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleGuardarPAC} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-muted-foreground">Nombre del Proveedor</label>
                <Input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Ej. The Factory HKA / PAC Panamá"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-muted-foreground">Ambiente de Operación</label>
                <select
                  value={ambiente}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAmbiente(e.target.value as 'TEST' | 'PRODUCCION')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                >
                  <option value="TEST">Pruebas / Simulación (TEST)</option>
                  <option value="PRODUCCION">Certificación Real (PRODUCCIÓN)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-muted-foreground">Credenciales / Token CIF o Certificado Digital</label>
                <textarea
                  value={credenciales}
                  onChange={(e) => setCredenciales(e.target.value)}
                  rows={3}
                  placeholder="Pegar cadena de autenticación o clave privada API del PAC..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Se encriptará con AES-256-GCM en la base de datos.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="esRespaldoChk"
                  checked={esRespaldo}
                  onChange={(e) => setEsRespaldo(e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="esRespaldoChk" className="text-xs text-muted-foreground">
                  Registrar como PAC de Respaldo (Secundario)
                </label>
              </div>

              <Button type="submit" disabled={guardando} className="w-full">
                {guardando ? 'Guardando...' : 'Guardar y Encriptar Credenciales'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ContentContainer>
  );
}

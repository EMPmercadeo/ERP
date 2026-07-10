'use client';

import React, { useState, useEffect } from 'react';
import { Send, Mail, CheckCircle2, XCircle, FileText, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CorreoLog {
  id: string;
  destinatario: string;
  asunto: string;
  estado: string;
  abierto: boolean;
  createdAt: string;
}

interface PlantillaCorreo {
  id: string;
  clave: string;
  asunto: string;
  cuerpo: string;
}

export default function SuperadminCorreosPage() {
  const [correos, setCorreos] = useState<CorreoLog[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaCorreo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'historial' | 'enviar' | 'plantillas'>('historial');

  // Form states para envío masivo/individual
  const [tipoDestino, setTipoDestino] = useState<'todos' | 'plan' | 'individual'>('individual');
  const [correoDestino, setCorreoDestino] = useState('');
  const [planDestino, setPlanDestino] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Form states para nueva plantilla
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoAsunto, setNuevoAsunto] = useState('');
  const [nuevoCuerpo, setNuevoCuerpo] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resC, resP] = await Promise.all([
        fetch('/api/admin/correos').then(r => r.json()),
        fetch('/api/admin/correos/plantillas').then(r => r.json())
      ]);
      setCorreos(resC?.items || []);
      setPlantillas(Array.isArray(resP) ? resP : []);
    } catch (error) {
      console.error('Error al cargar datos de correos:', error);
      toast.error('No se pudieron cargar los correos o plantillas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !cuerpoHtml.trim()) {
      toast.error('Por favor completa el asunto y el contenido HTML del correo.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/admin/correos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioTipo: tipoDestino,
          correoIndividual: tipoDestino === 'individual' ? correoDestino : undefined,
          planId: tipoDestino === 'plan' ? planDestino : undefined,
          asunto,
          cuerpoHtml
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Correos enviados exitosamente');
        setAsunto('');
        setCuerpoHtml('');
        setCorreoDestino('');
        cargarDatos();
        setActiveTab('historial');
      } else {
        toast.error(data.error || 'Fallo en el envío masivo');
      }
    } catch {
      toast.error('Error de conexión con el servidor de correo');
    } finally {
      setEnviando(false);
    }
  };

  const handleCrearPlantilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClave.trim() || !nuevoAsunto.trim() || !nuevoCuerpo.trim()) {
      toast.error('Completa todos los campos para la plantilla.');
      return;
    }
    try {
      const res = await fetch('/api/admin/correos/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: nuevaClave.toUpperCase(),
          asunto: nuevoAsunto,
          cuerpo: nuevoCuerpo,
          activa: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Plantilla creada correctamente.');
        setNuevaClave('');
        setNuevoAsunto('');
        setNuevoCuerpo('');
        cargarDatos();
      } else {
        toast.error(data.error || 'No se pudo guardar la plantilla');
      }
    } catch {
      toast.error('Error al guardar plantilla.');
    }
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'historial', label: `Historial de Correos (${correos.length})` },
    { key: 'enviar', label: 'Enviar Comunicado / Campaña' },
    { key: 'plantillas', label: `Plantillas (${plantillas.length})` }
  ];

  return (
    <ContentContainer className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Centro de Comunicaciones & Correos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envíos SMTP transaccionales, plantillas dinámicas y comunicados masivos
          </p>
        </div>
        <Button variant="outline" onClick={cargarDatos}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Registro
        </Button>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Pestaña 1: Historial */}
      {activeTab === 'historial' && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Cargando bitácora de correos...</div>
            ) : correos.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Todavía no hay correos registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="py-3 px-4">Destinatario</th>
                      <th className="py-3 px-4">Asunto</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Apertura</th>
                      <th className="py-3 px-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {correos.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50 transition">
                        <td className="py-3 px-4 font-mono text-foreground">{c.destinatario}</td>
                        <td className="py-3 px-4 font-medium">{c.asunto}</td>
                        <td className="py-3 px-4">
                          {c.estado === 'ENVIADO' ? (
                            <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" /> Enviado</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="h-3.5 w-3.5" /> Fallido</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {c.abierto ? <span className="text-warning font-medium">Abierto</span> : 'No abierto'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(c.createdAt).toLocaleString('es-PA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contenido Pestaña 2: Enviar */}
      {activeTab === 'enviar' && (
        <Card className="max-w-3xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5 text-primary" />
              Redactar Nuevo Comunicado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleEnviar} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Tipo de Destinatario
                  </label>
                  <select
                    value={tipoDestino}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoDestino(e.target.value as 'todos' | 'plan' | 'individual')}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                  >
                    <option value="individual">Individual (Una cuenta o correo)</option>
                    <option value="plan">Por Plan (Filtrar por nivel de suscripción)</option>
                    <option value="todos">Todos los Clientes Activos (Campaña General)</option>
                  </select>
                </div>

                {tipoDestino === 'individual' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Correo Electrónico Destino
                    </label>
                    <Input
                      type="email"
                      value={correoDestino}
                      onChange={(e) => setCorreoDestino(e.target.value)}
                      placeholder="empresa@panama.com"
                      required
                    />
                  </div>
                )}

                {tipoDestino === 'plan' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground">
                      ID o Slug del Plan
                    </label>
                    <Input
                      type="text"
                      value={planDestino}
                      onChange={(e) => setPlanDestino(e.target.value)}
                      placeholder="pro / enterprise / id"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Asunto del Correo
                </label>
                <Input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Importante: Actualización normativa DGI 2026..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Contenido HTML o Texto Libre (Soporta variables &#123;&#123;nombre&#125;&#125; y &#123;&#123;empresa&#125;&#125;)
                </label>
                <textarea
                  value={cuerpoHtml}
                  onChange={(e) => setCuerpoHtml(e.target.value)}
                  rows={7}
                  placeholder="<p>Estimado/a {{nombre}}, queremos informarle sobre...</p>"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={enviando} className="w-full md:w-auto">
                  <Send className="h-4 w-4" />
                  {enviando ? 'Enviando y Registrando...' : 'Confirmar y Enviar Correo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contenido Pestaña 3: Plantillas */}
      {activeTab === 'plantillas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Plantillas Activas ({plantillas.length})
            </h3>

            {plantillas.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-8">
                  No hay plantillas personalizadas. Las plantillas del sistema se generan automáticamente según demanda.
                </CardContent>
              </Card>
            ) : (
              plantillas.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="info" className="font-mono">{p.clave}</Badge>
                      <span className="text-xs text-muted-foreground">ID: {p.id}</span>
                    </div>
                    <h4 className="font-semibold text-base">{p.asunto}</h4>
                    <div className="bg-muted/50 p-3 rounded border text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto">
                      {p.cuerpo}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className="h-fit">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4 text-primary" />
                Crear Nueva Plantilla
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCrearPlantilla} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Clave de Plantilla (Única)</label>
                  <Input
                    type="text"
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                    placeholder="EJ. SALDO_BAJO"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Asunto por Defecto</label>
                  <Input
                    type="text"
                    value={nuevoAsunto}
                    onChange={(e) => setNuevoAsunto(e.target.value)}
                    placeholder="¡Atención! Tu saldo está por agotarse"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Cuerpo HTML</label>
                  <textarea
                    value={nuevoCuerpo}
                    onChange={(e) => setNuevoCuerpo(e.target.value)}
                    rows={5}
                    placeholder="<p>Hola {{nombre}}, tu saldo actual es {{saldo}}.</p>"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="sm">
                  Guardar Plantilla
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}

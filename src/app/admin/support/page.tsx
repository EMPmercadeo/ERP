'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Filter, Send, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const selectClass = 'h-8 rounded-md border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none';

export default function SuperadminSoportePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [filtroPrioridad, setFiltroPrioridad] = useState('all');

  // Modal / Detalle de ticket seleccionado
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mensajeRespuesta, setMensajeRespuesta] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/soporte', window.location.origin);
      if (filtroEstado !== 'all') url.searchParams.set('estado', filtroEstado);
      if (filtroPrioridad !== 'all') url.searchParams.set('prioridad', filtroPrioridad);

      const res = await fetch(url.toString());
      const data = await res.json();
      setTickets(data?.items || []);
    } catch (error) {
      toast.error('Error al cargar tickets de soporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, [filtroEstado, filtroPrioridad]);

  const abrirDetalle = async (id: string) => {
    setLoadingDetalle(true);
    try {
      const res = await fetch(`/api/admin/soporte/${id}`);
      const data = await res.json();
      setSelectedTicket(data);
      setNuevoEstado(data.estado);
    } catch (error) {
      toast.error('No se pudo abrir el detalle del ticket');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !mensajeRespuesta.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const res = await fetch(`/api/admin/soporte/${selectedTicket.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: mensajeRespuesta,
          cambiarEstado: nuevoEstado
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Respuesta enviada y notificada por correo al cliente');
        setMensajeRespuesta('');
        abrirDetalle(selectedTicket.id);
        cargarTickets();
      } else {
        toast.error(data.error || 'Error al enviar respuesta');
      }
    } catch (error) {
      toast.error('Fallo al conectar con el servidor');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const badgePrioridad = (p: string) => {
    if (p === 'URGENTE') return <Badge variant="destructive">{p}</Badge>;
    if (p === 'ALTA') return <Badge variant="warning">{p}</Badge>;
    return <Badge variant="neutral">{p}</Badge>;
  };

  const badgeEstado = (e: string) => {
    if (e === 'ABIERTO') return <Badge variant="destructive">{e}</Badge>;
    if (e === 'EN_PROCESO') return <Badge variant="warning">{e}</Badge>;
    return <Badge variant="success">{e}</Badge>;
  };

  return (
    <ContentContainer className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Mesa de Ayuda & Tickets de Soporte
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atención a solicitudes de empresas con notificación transaccional y traza de resolución
          </p>
        </div>
        <Button variant="outline" onClick={cargarTickets}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar Mesa
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <Filter className="h-4 w-4 text-primary" /> Estado:
          </div>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={selectClass}>
            <option value="all">Todos los Estados</option>
            <option value="ABIERTO">Abiertos</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resueltos</option>
            <option value="CERRADO">Cerrados</option>
          </select>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider ml-2">
            Prioridad:
          </div>
          <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className={selectClass}>
            <option value="all">Todas las Prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="BAJA">Baja</option>
          </select>
        </CardContent>
      </Card>

      {/* Grid Principal: Lista a la izquierda / Detalle a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 max-h-[750px] overflow-y-auto">
          <CardContent className="pt-6 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-xs">Cargando tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">No hay tickets que cumplan los filtros.</div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => abrirDetalle(t.id)}
                  className={cn(
                    'p-4 rounded-xl border transition cursor-pointer',
                    selectedTicket?.id === t.id
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'hover:border-muted-foreground/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      #{t.id.slice(-6).toUpperCase()}
                    </span>
                    {badgePrioridad(t.prioridad)}
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-1">{t.asunto}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.mensaje}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t text-[11px]">
                    <span className="text-primary font-medium truncate max-w-[140px]">
                      {t.cuenta?.empresa || t.cuenta?.nombre || 'Cliente'}
                    </span>
                    {badgeEstado(t.estado)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Panel Derecho: Detalle del ticket y respuestas */}
        <Card className="lg:col-span-2 h-[750px] flex flex-col">
          <CardContent className="pt-6 flex-1 flex flex-col overflow-hidden">
            {!selectedTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm">Selecciona un ticket a la izquierda para ver su historial y responder.</p>
              </div>
            ) : loadingDetalle ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Cargando hilo de conversación...</div>
            ) : (
              <>
                {/* Header de Detalle */}
                <div className="border-b pb-4 mb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-primary">Ticket #{selectedTicket.id.slice(-6).toUpperCase()}</span>
                      <h2 className="text-lg font-bold mt-1">{selectedTicket.asunto}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Enviado por <strong className="text-foreground">{selectedTicket.cuenta?.nombre} ({selectedTicket.cuenta?.empresa})</strong> &bull; Correo: {selectedTicket.cuenta?.correo}
                      </p>
                    </div>
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className={cn(selectClass, 'font-bold')}
                    >
                      <option value="ABIERTO">ABIERTO</option>
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="RESUELTO">RESUELTO</option>
                      <option value="CERRADO">CERRADO</option>
                    </select>
                  </div>
                </div>

                {/* Hilo de Conversación */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {/* Mensaje original del cliente */}
                  <div className="bg-muted/50 p-4 rounded-xl border space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" /> {selectedTicket.cuenta?.nombre || 'Cliente'}
                      </span>
                      <span>{new Date(selectedTicket.createdAt).toLocaleString('es-PA')}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.mensaje}</p>
                  </div>

                  {/* Respuestas registradas */}
                  {selectedTicket.respuestas?.map((r: any) => (
                    <div
                      key={r.id}
                      className={cn(
                        'p-4 rounded-xl border space-y-2',
                        r.autor === 'superadmin' || r.autor === 'SUPERADMIN'
                          ? 'bg-primary/5 border-primary/30 ml-8'
                          : 'bg-muted/50 mr-8'
                      )}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {r.autor === 'superadmin' || r.autor === 'SUPERADMIN' ? 'Soporte Superadmin' : r.autor}
                        </span>
                        <span>{new Date(r.createdAt).toLocaleString('es-PA')}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{r.mensaje}</p>
                    </div>
                  ))}
                </div>

                {/* Formulario de Respuesta Rápida */}
                <form onSubmit={handleResponder} className="mt-4 pt-4 border-t shrink-0 space-y-3">
                  <textarea
                    value={mensajeRespuesta}
                    onChange={(e) => setMensajeRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta aquí. Se notificará de inmediato al correo del cliente..."
                    rows={3}
                    className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                    required
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Al responder, el estado cambiará a: <strong className="text-primary">{nuevoEstado}</strong>
                    </span>
                    <Button type="submit" disabled={enviandoRespuesta} size="sm">
                      <Send className="h-3.5 w-3.5" />
                      {enviandoRespuesta ? 'Enviando...' : 'Responder y Notificar por Correo'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ContentContainer>
  );
}

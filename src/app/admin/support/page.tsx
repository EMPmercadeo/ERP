'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Filter, Send, User, RefreshCw, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00f0ff] flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-[#00f0ff]" />
            Mesa de Ayuda & Tickets de Soporte (Superadmin)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Atención integral a solicitudes de empresas con notificación transaccional y traza de resolución
          </p>
        </div>
        <button
          onClick={cargarTickets}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#00f0ff]' : ''}`} />
          Refrescar Mesa
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-4 bg-[#111827]/80 p-4 rounded-xl border border-[#1e293b]">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <Filter className="h-4 w-4 text-[#00f0ff]" /> Filtros de Estado:
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00f0ff]"
        >
          <option value="all">Todos los Estados</option>
          <option value="ABIERTO">Abiertos</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="RESUELTO">Resueltos</option>
          <option value="CERRADO">Cerrados</option>
        </select>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider ml-4">
          Prioridad:
        </div>
        <select
          value={filtroPrioridad}
          onChange={(e) => setFiltroPrioridad(e.target.value)}
          className="bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#00f0ff]"
        >
          <option value="all">Todas las Prioridades</option>
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="NORMAL">Normal</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>

      {/* Grid Principal: Lista a la izquierda / Detalle a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#111827]/80 border border-[#1e293b] rounded-xl p-4 space-y-3 max-h-[750px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Cargando tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No hay tickets que cumplan los filtros.</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => abrirDetalle(t.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedTicket?.id === t.id
                    ? 'bg-[#1e293b] border-[#00f0ff] shadow-md'
                    : 'bg-[#0b111e]/60 border-[#1e293b] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{t.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.prioridad === 'URGENTE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    t.prioridad === 'ALTA' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {t.prioridad}
                  </span>
                </div>
                <h4 className="font-semibold text-white text-sm line-clamp-1">{t.asunto}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.mensaje}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e293b]/60 text-[11px]">
                  <span className="text-[#00f0ff] font-medium truncate max-w-[140px]">
                    {t.cuenta?.empresa || t.cuenta?.nombre || 'Cliente'}
                  </span>
                  <span className={`font-semibold ${
                    t.estado === 'ABIERTO' ? 'text-rose-400' :
                    t.estado === 'EN_PROCESO' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Derecho: Detalle del ticket y respuestas */}
        <div className="lg:col-span-2 bg-[#111827]/80 border border-[#1e293b] rounded-xl p-6 flex flex-col h-[750px]">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <MessageSquare className="h-12 w-12 text-slate-600" />
              <p className="text-sm">Selecciona un ticket a la izquierda para ver su historial y responder.</p>
            </div>
          ) : loadingDetalle ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Cargando hilo de conversación...</div>
          ) : (
            <>
              {/* Header de Detalle */}
              <div className="border-b border-[#1e293b] pb-4 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-[#00f0ff]">Ticket #{selectedTicket.id.slice(-6).toUpperCase()}</span>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedTicket.asunto}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enviado por <strong className="text-slate-200">{selectedTicket.cuenta?.nombre} ({selectedTicket.cuenta?.empresa})</strong> &bull; Correo: {selectedTicket.cuenta?.correo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="bg-[#0b111e] border border-[#1e293b] rounded px-2.5 py-1 text-xs text-white font-bold"
                    >
                      <option value="ABIERTO">ABIERTO</option>
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="RESUELTO">RESUELTO</option>
                      <option value="CERRADO">CERRADO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hilo de Conversación */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {/* Mensaje original del cliente */}
                <div className="bg-[#0b111e] p-4 rounded-xl border border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#00f0ff]" /> {selectedTicket.cuenta?.nombre || 'Cliente'}
                    </span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString('es-PA')}</span>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{selectedTicket.mensaje}</p>
                </div>

                {/* Respuestas registradas */}
                {selectedTicket.respuestas?.map((r: any) => (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border space-y-2 ${
                      r.autor === 'superadmin' || r.autor === 'SUPERADMIN'
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40 ml-8'
                        : 'bg-[#1e293b]/60 border-[#1e293b] mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-[#00f0ff] flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[#00f0ff]" />
                        {r.autor === 'superadmin' || r.autor === 'SUPERADMIN' ? 'Soporte Superadmin' : r.autor}
                      </span>
                      <span>{new Date(r.createdAt).toLocaleString('es-PA')}</span>
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">{r.mensaje}</p>
                  </div>
                ))}
              </div>

              {/* Formulario de Respuesta Rápida */}
              <form onSubmit={handleResponder} className="mt-4 pt-4 border-t border-[#1e293b] shrink-0 space-y-3">
                <textarea
                  value={mensajeRespuesta}
                  onChange={(e) => setMensajeRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta aquí. Se notificará de inmediato al correo del cliente..."
                  rows={3}
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  required
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Al responder, el estado cambiará a: <strong className="text-[#00f0ff]">{nuevoEstado}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={enviandoRespuesta}
                    className="px-5 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#0b111e] font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {enviandoRespuesta ? 'Enviando...' : 'Responder y Notificar por Correo'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
